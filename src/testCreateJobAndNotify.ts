/**
 * Script para crear un job y ver todo el flujo de matching y notificación
 */

import "./config/env";
import { supabase } from "./db/supabaseClient";

const JOB_DATA = {
  company_name: "VEMO",
  job_title: "Senior Product Manager – Growth & Experimentation",
  job_level: null,
  location: null,
  remote_ok: true,
  description: "Buscamos un Senior Product Manager con experiencia liderando ciclos de experimentación y growth en productos digitales B2C o B2B2C. Esta persona deberá construir hipótesis claras, ejecutar experimentos end-to-end y trabajar de la mano con ingeniería, data y diseño para acelerar el crecimiento del producto.",
  requirements_json: {
    modality: "remote",
    scenario_text: "Imagina que el equipo de ventas afirma que los leads están cayendo por culpa del producto y el equipo de ingeniería dice que necesitan más tiempo para lanzar mejoras. Esta persona debe saber navegar tensión entre equipos, priorizar con datos, proponer un roadmap realista y entregar en pocas semanas una iteración medible que recupere el funnel. El resultado ideal: al menos +10% en conversión cualificada en 6 semanas.",
    non_negotiables_text: "Experiencia previa liderando pods cross-funcionales, dominio fuerte de analítica de producto, capacidad probada para lanzar experimentos rápidamente, ownership extremo y comunicación impecable con negocio y stakeholders.",
    desired_trajectory_text: "Preferiblemente personas que hayan trabajado en empresas de alto crecimiento, marketplaces, fintechs, SaaS o productos con fuerte enfoque en conversión y optimización. Bonus si han trabajado en empresas con modelos de negocio de suscripción o consumo recurrente.",
    needs_technical_background: false
  },
  status: "open",
  owner_candidate_id: "7e8d23be-00ed-43ae-8726-26163b659fdf",
  owner_role_title: "Head of Product"
};

async function testCreateJobAndNotify() {
  console.log("=".repeat(80));
  console.log("🚀 TEST: Crear Job y Verificar Flujo Completo");
  console.log("=".repeat(80));
  console.log("");

  try {
    // Paso 1: Crear el job directamente en la BD (simulando lo que haría la API)
    console.log("📝 PASO 1: Creando job en la base de datos...");
    console.log(`   Job Title: ${JOB_DATA.job_title}`);
    console.log(`   Company: ${JOB_DATA.company_name}`);
    console.log(`   Owner Candidate ID: ${JOB_DATA.owner_candidate_id}`);
    console.log("");

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        ...JOB_DATA,
        requirements_json: JOB_DATA.requirements_json, // Ya es un objeto
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Error creando job: ${jobError.message}`);
    }

    console.log(`   ✅ Job creado exitosamente!`);
    console.log(`   📋 Job ID: ${job.id}`);
    console.log("");

    // Paso 2: Verificar que el job se creó correctamente
    console.log("🔍 PASO 2: Verificando job creado...");
    const { data: verifyJob } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job.id)
      .single();

    if (!verifyJob) {
      throw new Error("Job no encontrado después de crearlo");
    }

    console.log(`   ✅ Job verificado: ${verifyJob.job_title}`);
    console.log(`   📊 Status: ${verifyJob.status}`);
    console.log(`   🏢 Company: ${verifyJob.company_name}`);
    console.log("");

    // Paso 3: Ejecutar matching manualmente
    console.log("🔄 PASO 3: Ejecutando matching automático...");
    const { matchJobWithAllCandidates } = await import("./agents/matchJobCandidate");
    
    const matchCount = await matchJobWithAllCandidates(job.id);
    console.log(`   ✅ Matching completado: ${matchCount} matches creados`);
    console.log("");

    // Paso 4: Verificar matches creados
    console.log("🔍 PASO 4: Verificando matches creados...");
    const { data: matches, error: matchesError } = await supabase
      .from("job_candidate_matches")
      .select("candidate_id, match_score")
      .eq("job_id", job.id);

    if (matchesError) {
      console.error(`   ❌ Error obteniendo matches: ${matchesError.message}`);
    } else {
      console.log(`   ✅ Total de matches encontrados: ${matches?.length || 0}`);
      if (matches && matches.length > 0) {
        const matchesWithScore = matches.filter((m: any) => m.match_score > 0);
        console.log(`   📊 Matches con score > 0: ${matchesWithScore.length}`);
        if (matchesWithScore.length > 0) {
          const topMatches = matchesWithScore
            .sort((a: any, b: any) => b.match_score - a.match_score)
            .slice(0, 5);
          console.log(`   🏆 Top 5 matches:`);
          topMatches.forEach((m: any, idx: number) => {
            console.log(`      ${idx + 1}. Candidate ${m.candidate_id.substring(0, 8)}... - Score: ${m.match_score}`);
          });
        }
      } else {
        console.log(`   ⚠️  No se encontraron matches para este job`);
      }
    }
    console.log("");

    // Paso 5: Ejecutar notificación
    if (matches && matches.length > 0) {
      console.log("📤 PASO 5: Ejecutando notificación de hyperconnectors...");
      const baseUrl = process.env.APP_URL || "http://localhost:3000";
      const { notifyHyperconnectorsForJob } = await import("./agents/notifyHyperconnectorsForJob");
      
      const result = await notifyHyperconnectorsForJob(job.id, baseUrl);
      
      console.log("");
      console.log("=".repeat(80));
      console.log("📊 RESUMEN FINAL");
      console.log("=".repeat(80));
      console.log(`✅ Job creado: ${job.id}`);
      console.log(`✅ Matches creados: ${matches.length}`);
      console.log(`✅ WhatsApp enviados: ${result.notified}`);
      console.log(`✅ Emails enviados: ${result.emailsSent || 0}`);
      console.log(`❌ Errores: ${result.errors}`);
      console.log("");
    } else {
      console.log("⏭️  PASO 5: Saltando notificación (no hay matches)");
      console.log("");
      console.log("=".repeat(80));
      console.log("📊 RESUMEN FINAL");
      console.log("=".repeat(80));
      console.log(`✅ Job creado: ${job.id}`);
      console.log(`⚠️  Matches creados: 0 (no hay candidatos que matcheen)`);
      console.log(`⏭️  WhatsApp enviados: 0 (no hay matches para notificar)`);
      console.log("");
    }

    console.log("💡 Para ver el job en la interfaz:");
    console.log(`   http://localhost:3000/admin/solicitudes`);
    console.log("");

  } catch (error: any) {
    console.error("");
    console.error("=".repeat(80));
    console.error("❌ ERROR EN EL TEST");
    console.error("=".repeat(80));
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

testCreateJobAndNotify();
