/**
 * Script de test para crear un job que tenga match >= 50% con los 3 candidatos creados
 * (Carlos Mendoza, Ana Sofía Ramírez, Diego Herrera)
 * 
 * Usage: npm run test:create-job-preview
 */

import "./config/env";
import { supabase } from "./db/supabaseClient";
import { matchJobCandidate } from "./agents/matchJobCandidate";

// Datos del job diseñado para hacer match con los 3 candidatos
const JOB_DATA = {
  company_name: "Product-LatAm",
  job_title: "Senior Product Manager - Fintech & Payments",
  job_level: "senior",
  location: null,
  remote_ok: true,
  description: "Buscamos un Senior Product Manager con experiencia sólida en productos fintech, pagos digitales y e-commerce. Esta persona liderará el desarrollo de features de pagos, integraciones con sistemas de terceros y optimización de la experiencia de usuario en productos B2B y B2C. Debe tener experiencia trabajando con equipos de ingeniería, data science y diseño en entornos de alto crecimiento.",
  requirements_json: {
    modality: "remote",
    seniority: "senior",
    industries: ["fintech", "payments", "ecommerce"],
    must_have_skills: [
      "product_management",
      "fintech",
      "payments",
      "b2b",
      "integrations",
      "stakeholder_management"
    ],
    nice_to_have_skills: [
      "data_analysis",
      "machine_learning",
      "engineering_background",
      "logistics",
      "marketplace"
    ],
    languages: ["spanish", "english"],
    location_preference: ["Colombia", "Chile", "Brasil", "Argentina", "México"],
    non_negotiables_text: "Mínimo 5 años de experiencia en Product Management, con al menos 3 años en fintech o pagos. Experiencia probada liderando productos de alto impacto, trabajando con equipos cross-funcionales y gestionando stakeholders ejecutivos. Conocimiento sólido de integraciones con sistemas de pago y APIs de terceros.",
    desired_trajectory_text: "Idealmente experiencia en empresas de alto crecimiento como Rappi, Mercado Pago, Nubank, Cornershop, Uber o similares. Preferiblemente personas que hayan trabajado en productos B2B o B2B2C, con experiencia en optimización de conversión y crecimiento. Bonus si tienen experiencia trabajando con data science o equipos de ingeniería en arquitecturas escalables.",
    scenario_text: "Imagina que necesitas lanzar una nueva feature de pagos que debe integrarse con 5 proveedores diferentes en 3 países distintos, con diferentes regulaciones y tiempos de respuesta. Esta persona debe ser capaz de priorizar, coordinar con múltiples equipos internos y externos, y entregar una solución que funcione en producción en menos de 8 semanas.",
    needs_technical_background: false
  },
  status: "open_without_recommendations",
  owner_candidate_id: null, // Admin creando el job
  owner_role_title: "Head of Product",
  start_date: "2025-02-01"
};

async function testCreateJobWithMatching() {
  console.log("=".repeat(80));
  console.log("🚀 TEST: Crear Job y Verificar Matching con 3 Candidatos");
  console.log("=".repeat(80));
  console.log("");

  try {
    // Paso 1: Obtener los IDs de los 3 candidatos
    console.log("📋 PASO 1: Obteniendo IDs de los candidatos...");
    const { data: candidates, error: candidatesError } = await supabase
      .from("candidates")
      .select("id, full_name, email")
      .in("full_name", ["Carlos Mendoza", "Ana Sofía Ramírez", "Diego Herrera"]);

    if (candidatesError) {
      throw new Error(`Error obteniendo candidatos: ${candidatesError.message}`);
    }

    if (!candidates || candidates.length === 0) {
      throw new Error("❌ No se encontraron los candidatos. Asegúrate de haber ejecutado el SQL para crearlos primero.");
    }

    if (candidates.length !== 3) {
      console.warn(`⚠️  Se encontraron ${candidates.length} candidatos en lugar de 3. Continuando con los encontrados...`);
    }

    console.log(`   ✅ Candidatos encontrados: ${candidates.length}`);
    candidates.forEach((c: any) => {
      console.log(`      - ${c.full_name} (${c.email}) - ID: ${c.id}`);
    });
    console.log("");

    // Paso 2: Crear el job
    console.log("📝 PASO 2: Creando job en la base de datos...");
    console.log(`   Job Title: ${JOB_DATA.job_title}`);
    console.log(`   Company: ${JOB_DATA.company_name}`);
    console.log(`   Skills requeridos: ${JOB_DATA.requirements_json.must_have_skills.join(", ")}`);
    console.log("");

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        ...JOB_DATA,
        requirements_json: JOB_DATA.requirements_json,
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

    // Paso 3: Ejecutar matching con cada candidato
    console.log("=".repeat(80));
    console.log("🔄 PASO 3: Ejecutando matching con cada candidato...");
    console.log("=".repeat(80));
    console.log("");

    const matchResults: Array<{
      candidateId: string;
      candidateName: string;
      score: number;
      detail: any;
    }> = [];

    for (const candidate of candidates) {
      console.log(`   🔍 Matching con: ${candidate.full_name} (${candidate.id.substring(0, 8)}...)`);
      
      try {
        const result = await matchJobCandidate(job.id, candidate.id);
        
        console.log(`      ✅ Match Score: ${result.score}%`);
        console.log(`      📊 Componentes:`);
        console.log(`         - Seniority: ${(result.detail.components.seniority * 100).toFixed(1)}%`);
        console.log(`         - Skills: ${(result.detail.components.skills * 100).toFixed(1)}%`);
        console.log(`         - Industry: ${(result.detail.components.industry * 100).toFixed(1)}%`);
        console.log(`         - Location/Language: ${(result.detail.components.location_language * 100).toFixed(1)}%`);
        
        if (result.detail.strong_fit && result.detail.strong_fit.length > 0) {
          console.log(`      ✨ Strong Fit:`);
          result.detail.strong_fit.forEach((fit: string) => {
            console.log(`         - ${fit}`);
          });
        }
        
        if (result.detail.gaps && result.detail.gaps.length > 0) {
          console.log(`      ⚠️  Gaps:`);
          result.detail.gaps.forEach((gap: string) => {
            console.log(`         - ${gap}`);
          });
        }
        
        matchResults.push({
          candidateId: candidate.id,
          candidateName: candidate.full_name,
          score: result.score,
          detail: result.detail,
        });
        
        console.log("");
      } catch (error: any) {
        console.error(`      ❌ Error en matching: ${error.message}`);
        console.log("");
      }
    }

    // Paso 4: Resumen de resultados
    console.log("=".repeat(80));
    console.log("📊 PASO 4: Resumen de Matches");
    console.log("=".repeat(80));
    console.log("");

    const matchesAbove50 = matchResults.filter((m) => m.score >= 50);
    const matchesBelow50 = matchResults.filter((m) => m.score < 50);

    console.log(`   ✅ Matches >= 50%: ${matchesAbove50.length}/${matchResults.length}`);
    matchesAbove50.forEach((m) => {
      console.log(`      - ${m.candidateName}: ${m.score}%`);
    });

    if (matchesBelow50.length > 0) {
      console.log(`   ⚠️  Matches < 50%: ${matchesBelow50.length}/${matchResults.length}`);
      matchesBelow50.forEach((m) => {
        console.log(`      - ${m.candidateName}: ${m.score}%`);
      });
    }

    console.log("");

    // Paso 5: Verificar matches en la base de datos
    console.log("=".repeat(80));
    console.log("🔍 PASO 5: Verificando matches en la base de datos...");
    console.log("=".repeat(80));
    console.log("");

    const { data: dbMatches, error: dbMatchesError } = await supabase
      .from("job_candidate_matches")
      .select(`
        id,
        match_score,
        match_source,
        candidates!inner(id, full_name, email)
      `)
      .eq("job_id", job.id)
      .gte("match_score", 50)
      .order("match_score", { ascending: false });

    if (dbMatchesError) {
      console.error(`   ❌ Error obteniendo matches de BD: ${dbMatchesError.message}`);
    } else {
      console.log(`   ✅ Matches >= 50% encontrados en BD: ${dbMatches?.length || 0}`);
      if (dbMatches && dbMatches.length > 0) {
        dbMatches.forEach((match: any) => {
          const candidate = match.candidates;
          console.log(`      - ${candidate.full_name}: ${match.match_score}% (source: ${match.match_source})`);
        });
      }
    }

    console.log("");

    // Paso 6: Ejecutar notificación de WhatsApp
    console.log("=".repeat(80));
    console.log("📤 PASO 6: Ejecutando notificación de WhatsApp a hyperconnectors...");
    console.log("=".repeat(80));
    console.log("");

        let whatsappResult = { notified: 0, emailsSent: 0, errors: 0 };

    if (matchesAbove50.length > 0) {
      try {
        const baseUrl = process.env.APP_URL || process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : "http://localhost:3000";
        
        console.log(`   🔗 Usando baseUrl: ${baseUrl}`);
        console.log("");

        const { notifyHyperconnectorsForJob } = await import("./agents/notifyHyperconnectorsForJob");
        
        whatsappResult = await notifyHyperconnectorsForJob(job.id, baseUrl);
        
        console.log("");
        console.log(`   ✅ WhatsApp enviados: ${whatsappResult.notified}`);
        console.log(`   ✅ Emails enviados: ${whatsappResult.emailsSent || 0}`);
        console.log(`   ❌ Errores: ${whatsappResult.errors}`);
        console.log("");
      } catch (error: any) {
        console.error(`   ❌ Error ejecutando notificación: ${error.message}`);
        console.log("");
      }
    } else {
      console.log("   ⏭️  Saltando notificación (no hay matches >= 50%)");
      console.log("");
    }

    // Paso 7: Resumen final
    console.log("=".repeat(80));
    console.log("✅ TEST COMPLETADO");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📋 Job ID: ${job.id}`);
    console.log(`📋 Job Title: ${job.job_title}`);
    console.log(`📊 Total matches >= 50%: ${matchesAbove50.length}/${matchResults.length}`);
    console.log(`📱 WhatsApp enviados: ${whatsappResult.notified}`);
    console.log(`❌ Errores en WhatsApp: ${whatsappResult.errors}`);
    console.log("");
    
    if (matchesAbove50.length === matchResults.length) {
      console.log("🎉 ¡Éxito! Todos los candidatos tienen match >= 50%");
    } else if (matchesAbove50.length > 0) {
      console.log("⚠️  Algunos candidatos tienen match < 50%. Revisa los gaps arriba.");
    } else {
      console.log("❌ Ningún candidato tiene match >= 50%. Revisa los requisitos del job.");
    }
    console.log("");

  } catch (error: any) {
    console.error("");
    console.error("=".repeat(80));
    console.error("❌ ERROR EN EL TEST");
    console.error("=".repeat(80));
    console.error("");
    console.error(`Error: ${error.message}`);
    console.error("");
    if (error.stack) {
      console.error("Stack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar el test
testCreateJobWithMatching();

