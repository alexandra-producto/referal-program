/**
 * Script para crear un job de prueba y ver TODO el flujo de matching
 * Basado en: 2d9fa5c0-360c-4436-a4e5-8a2ff78a8738
 * Nuevo job: "Product Manager - Mobility & Fleet T2"
 */

import "./config/env";
import { supabase } from "./db/supabaseClient";
import { createJob } from "./domain/jobs";
import { matchJobWithAllCandidates } from "./agents/matchJobCandidate";
import { notifyHyperconnectorsForJob } from "./agents/notifyHyperconnectorsForJob";
import { getAppUrl } from "./utils/appUrl";

// Verificar variables de Twilio antes de ejecutar
function checkTwilioConfig() {
  const hasAccountSid = !!process.env.TWILIO_ACCOUNT_SID;
  const hasAuthToken = !!process.env.TWILIO_AUTH_TOKEN;
  const hasWhatsappFrom = !!process.env.TWILIO_WHATSAPP_FROM;

  if (!hasAccountSid || !hasAuthToken || !hasWhatsappFrom) {
    console.warn("");
    console.warn("⚠️  ADVERTENCIA: Variables de Twilio no configuradas");
    console.warn("   El matching y la creación de jobs funcionarán,");
    console.warn("   pero las notificaciones de WhatsApp fallarán.");
    console.warn("");
    console.warn("   Variables faltantes:");
    if (!hasAccountSid) console.warn("   - TWILIO_ACCOUNT_SID");
    if (!hasAuthToken) console.warn("   - TWILIO_AUTH_TOKEN");
    if (!hasWhatsappFrom) console.warn("   - TWILIO_WHATSAPP_FROM");
    console.warn("");
    console.warn("   Para configurar, agrega estas variables a .env.local");
    console.warn("   o ejecuta: npm run check:env");
    console.warn("");
    return false;
  }

  return true;
}

const JOB_DATA = {
  company_name: "Edenred Mobility Mexico",
  job_title: "Product Manager - Mobility & Fleet T2",
  job_level: "senior",
  location: "Mexico City",
  remote_ok: true,
  description: "Product Manager enfocado en productos de movilidad, administración de flotas y medios de pago (vales/tarjetas). B2B/B2B2C, integración con sistemas corporativos.",
  requirements_json: {
    languages: ["spanish", "english"],
    seniority: "senior",
    industries: ["mobility", "fleet_management", "payments", "fintech"],
    must_have_skills: [
      "product_management",
      "b2b",
      "payment_systems",
      "integrations",
      "stakeholder_management"
    ],
    location_preference: ["Mexico"],
    nice_to_have_skills: ["fleet_cards", "fuel_payments", "logistics"]
  },
  status: "open_without_recommendations",
  owner_candidate_id: "7be8b532-8bad-4137-ac5d-aff00a60a5f7",
  owner_role_title: "CPO",
  document_url: null,
};

async function createTestJobWithFullLogs() {
  console.log("=".repeat(80));
  console.log("🚀 TEST: Crear Job y Ver Flujo Completo de Matching");
  console.log("=".repeat(80));
  console.log("");

  // Verificar configuración de Twilio
  const twilioConfigured = checkTwilioConfig();

  try {
    // Paso 1: Crear el job usando createJob (igual que la API)
    console.log("📝 PASO 1: Creando job usando createJob()...");
    console.log(`   Job Title: ${JOB_DATA.job_title}`);
    console.log(`   Company: ${JOB_DATA.company_name}`);
    console.log(`   Owner Candidate ID: ${JOB_DATA.owner_candidate_id}`);
    console.log("");

    // Crear el job SIN triggerMatching para controlarlo manualmente
    const job = await createJob(JOB_DATA, { triggerMatching: false });

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

    // Paso 3: Obtener candidatos que tienen relación con hyperconnectors
    console.log("=".repeat(80));
    console.log("🔍 PASO 3: Obteniendo candidatos relacionados con hyperconnectors...");
    console.log("=".repeat(80));
    console.log("");

    // Obtener todos los candidatos únicos que tienen relación con algún hyperconnector
    const { data: hyperconnectorCandidates, error: hciCandidatesError } = await supabase
      .from("hyperconnector_candidates")
      .select("candidate_id")
      .not("candidate_id", "is", null);

    if (hciCandidatesError) {
      throw new Error(`Error obteniendo candidatos de hyperconnectors: ${hciCandidatesError.message}`);
    }

    if (!hyperconnectorCandidates || hyperconnectorCandidates.length === 0) {
      console.log("   ⚠️  No hay candidatos relacionados con hyperconnectors");
      console.log("   ⏭️  Saltando matching (no hay candidatos para evaluar)");
      console.log("");
      return;
    }

    // Obtener candidatos únicos
    const uniqueCandidateIds = [...new Set(hyperconnectorCandidates.map((hc: any) => hc.candidate_id))];
    console.log(`   ✅ Candidatos únicos con relación a hyperconnectors: ${uniqueCandidateIds.length}`);
    console.log("");

    // Paso 4: Ejecutar matching SOLO con estos candidatos
    console.log("=".repeat(80));
    console.log("🔄 PASO 4: Ejecutando matching solo con candidatos relacionados...");
    console.log("=".repeat(80));
    console.log("");

    // Importar la función de matching individual
    const { matchJobCandidate } = await import("./agents/matchJobCandidate");

    let matchCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let matchesWithScore: Array<{ candidateId: string; score: number }> = [];

    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < uniqueCandidateIds.length; i += batchSize) {
      const batch = uniqueCandidateIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (candidateId: string) => {
          try {
            const result = await matchJobCandidate(job.id, candidateId);
            successCount++;
            if (result.score > 0) {
              matchesWithScore.push({ candidateId, score: result.score });
              console.log(`   ✅ [MATCHING] Match encontrado: candidate ${candidateId.substring(0, 8)}... → score: ${result.score}`);
            }
          } catch (error: any) {
            console.error(
              `   ❌ [MATCHING] Error matching job ${job.id} with candidate ${candidateId}:`,
              error.message
            );
            errorCount++;
          }
        })
      );

      console.log(`📋 [MATCHING] Procesados ${Math.min(i + batchSize, uniqueCandidateIds.length)}/${uniqueCandidateIds.length} candidatos`);
    }

    matchCount = successCount;
    
    console.log("");
    console.log(`   ✅ Matching completado: ${matchCount} matches procesados`);
    console.log("");

    // Paso 5: Verificar matches creados
    console.log("=".repeat(80));
    console.log("🔍 PASO 5: Verificando matches creados...");
    console.log("=".repeat(80));
    console.log("");

    console.log(`\n✅ [MATCHING] Matching completo:`);
    console.log(`   - Total procesados: ${successCount + errorCount}`);
    console.log(`   - Exitosos: ${successCount}`);
    console.log(`   - Errores: ${errorCount}`);
    console.log(`   - Matches con score > 0: ${matchesWithScore.length}`);
    if (matchesWithScore.length > 0) {
      console.log(`   - Scores: ${matchesWithScore.map(m => `${m.score}`).join(", ")}`);
    }
    console.log("");

    const { data: matches, error: matchesError } = await supabase
      .from("job_candidate_matches")
      .select("candidate_id, match_score, match_source")
      .eq("job_id", job.id)
      .order("match_score", { ascending: false });

    if (matchesError) {
      console.error(`   ❌ Error obteniendo matches: ${matchesError.message}`);
    } else {
      console.log(`   ✅ Total de matches encontrados: ${matches?.length || 0}`);
      
      if (matches && matches.length > 0) {
        const matchesWithScore = matches.filter((m: any) => m.match_score > 0);
        const matchesAbove60 = matches.filter((m: any) => m.match_score >= 60);
        
        console.log(`   📊 Matches con score > 0: ${matchesWithScore.length}`);
        console.log(`   📊 Matches con score >= 60%: ${matchesAbove60.length}`);
        
        if (matchesWithScore.length > 0) {
          const topMatches = matchesWithScore.slice(0, 10);
          console.log(`   🏆 Top 10 matches:`);
          topMatches.forEach((m: any, idx: number) => {
            console.log(`      ${idx + 1}. Candidate ${m.candidate_id.substring(0, 8)}... - Score: ${m.match_score}% (${m.match_source || 'N/A'})`);
          });
        }
      } else {
        console.log(`   ⚠️  No se encontraron matches para este job`);
      }
    }
    console.log("");

    // Paso 6: Ejecutar notificación SOLO si hay matches >= 60%
    if (matches && matches.length > 0) {
      const matchesAbove60 = matches.filter((m: any) => m.match_score >= 60);
      
      if (matchesAbove60.length > 0) {
        console.log("=".repeat(80));
        console.log("📤 PASO 5: Ejecutando notificación de hyperconnectors...");
        console.log("=".repeat(80));
        console.log("");

        if (!twilioConfigured) {
          console.log("=".repeat(80));
          console.log("⏭️  PASO 6: Saltando notificación (Twilio no configurado)");
          console.log("=".repeat(80));
          console.log(`   ⚠️  No se pueden enviar WhatsApp sin credenciales de Twilio`);
          console.log(`   📊 Matches encontrados: ${matches.length}, ${matchesAbove60.length} >= 60%`);
          console.log("");
          console.log("=".repeat(80));
          console.log("📊 RESUMEN FINAL");
          console.log("=".repeat(80));
          console.log(`✅ Job creado: ${job.id}`);
          console.log(`✅ Matches totales: ${matches.length}`);
          console.log(`✅ Matches >= 60%: ${matchesAbove60.length}`);
          console.log(`⏭️  WhatsApp enviados: 0 (Twilio no configurado)`);
          console.log("");
          return;
        }

        const baseUrl = getAppUrl();
        console.log(`   🔗 Usando baseUrl: ${baseUrl}`);
        console.log("");

        const result = await notifyHyperconnectorsForJob(job.id, baseUrl);
        
        console.log("");
        console.log("=".repeat(80));
        console.log("📊 RESUMEN FINAL");
        console.log("=".repeat(80));
        console.log(`✅ Job creado: ${job.id}`);
        console.log(`✅ Matches totales: ${matches.length}`);
        console.log(`✅ Matches >= 60%: ${matchesAbove60.length}`);
        console.log(`✅ WhatsApp enviados: ${result.notified}`);
        console.log(`❌ Errores en notificaciones: ${result.errors}`);
        console.log("");
      } else {
        console.log("=".repeat(80));
        console.log("⏭️  PASO 5: Saltando notificación");
        console.log("=".repeat(80));
        console.log(`   ⚠️  No hay matches con score >= 60% (mínimo requerido)`);
        console.log(`   📊 Matches encontrados: ${matches.length}, pero ninguno >= 60%`);
        console.log("");
        console.log("=".repeat(80));
        console.log("📊 RESUMEN FINAL");
        console.log("=".repeat(80));
        console.log(`✅ Job creado: ${job.id}`);
        console.log(`⚠️  Matches creados: ${matches.length} (ninguno >= 60%)`);
        console.log(`⏭️  WhatsApp enviados: 0 (no hay matches elegibles)`);
        console.log("");
      }
    } else {
      console.log("=".repeat(80));
      console.log("⏭️  PASO 5: Saltando notificación");
      console.log("=".repeat(80));
      console.log(`   ⚠️  No se encontraron matches para este job`);
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
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar
createTestJobWithFullLogs();

