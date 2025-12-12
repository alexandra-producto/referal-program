/**
 * Script temporal para enviar email a una dirección específica
 * 
 * Usage: npm run test:email-to-address <job_id> <hyperconnector_id> <email>
 * Ejemplo: npm run test:email-to-address bfa31bea-667d-4ff1-bfaa-9fb6ee83ba7f 0586a594-bce5-4fd4-ae39-8667665076a1 alexa00rivera@gmail.com
 */

import "./config/env";
import { getJobById } from "./domain/jobs";
import { getHyperconnectorById } from "./domain/hyperconnectors";
import { getRecommendableCandidatesForHyperconnector } from "./domain/hyperconnectorCandidates";
import { sendHciEmailNotification } from "./agents/sendHciEmailNotification";
import { supabase } from "./db/supabaseClient";
import { getAppUrl } from "./utils/appUrl";

async function testEmailToSpecificAddress(jobId: string, hyperconnectorId: string, targetEmail: string) {
  try {
    console.log("=".repeat(80));
    console.log("📧 PRUEBA DE EMAIL A DIRECCIÓN ESPECÍFICA");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📋 Job ID: ${jobId}`);
    console.log(`👤 Hyperconnector ID: ${hyperconnectorId}`);
    console.log(`📧 Email destino: ${targetEmail}`);
    console.log("");

    // Verificar variables de entorno
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no está configurada en .env.local");
    }
    console.log("✅ RESEND_API_KEY encontrada");
    console.log("");

    // 1. Obtener el job
    console.log("🔔 Obteniendo información del job...");
    const job = await getJobById(jobId);
    if (!job) {
      throw new Error(`Job no encontrado: ${jobId}`);
    }
    console.log(`   ✅ Job encontrado: ${job.job_title || job.role_title || "Sin título"}`);
    console.log(`   🏢 Company: ${job.company_name}`);

    // 2. Obtener el hyperconnector
    console.log("🔔 Obteniendo información del hyperconnector...");
    const hyperconnector = await getHyperconnectorById(hyperconnectorId);
    if (!hyperconnector) {
      throw new Error(`Hyperconnector no encontrado: ${hyperconnectorId}`);
    }
    console.log(`   ✅ Hyperconnector encontrado: ${hyperconnector.full_name}`);

    // 3. Obtener candidatos recomendables
    console.log("🔔 Obteniendo candidatos recomendables...");
    const recommendableCandidates = await getRecommendableCandidatesForHyperconnector(
      jobId,
      hyperconnectorId
    );

    if (recommendableCandidates.length === 0) {
      console.log(`   ⚠️  No hay candidatos recomendables para este job e hyperconnector`);
      throw new Error("No hay candidatos recomendables para este job e hyperconnector");
    }

    console.log(`   ✅ Candidatos encontrados: ${recommendableCandidates.length}`);
    const top3 = recommendableCandidates.slice(0, 3);
    top3.forEach((c, idx) => {
      console.log(`      ${idx + 1}. ${c.full_name} (${c.match_score || "N/A"}%)`);
    });

    // 4. Obtener owner candidate (opcional)
    let ownerCandidate = null;
    if (job.owner_candidate_id) {
      const { data: ownerData, error: ownerError } = await supabase
        .from("candidates")
        .select("id, full_name")
        .eq("id", job.owner_candidate_id)
        .maybeSingle();
      
      if (!ownerError && ownerData) {
        ownerCandidate = {
          full_name: ownerData.full_name,
        };
        console.log(`   👤 Owner: ${ownerCandidate.full_name}`);
      }
    }

    // 5. Preparar datos
    const hciData = {
      id: hyperconnector.id,
      full_name: hyperconnector.full_name,
      email: targetEmail, // Usar el email especificado
    };

    const jobData = {
      id: job.id,
      company_name: job.company_name || "Empresa",
      role_title: job.job_title || job.role_title || "Posición",
      non_negotiables: job.non_negotiables || null,
      requirements_json: job.requirements_json || null,
    };

    const candidatesData = top3.map(c => ({
      full_name: c.full_name,
      current_company: c.current_company,
      fit_score: c.match_score || null,
      shared_experience: c.shared_experience || null,
    }));

    // 6. Obtener baseUrl
    const appUrl = getAppUrl();
    console.log(`🌐 Usando baseUrl: ${appUrl}`);
    console.log("");

    // 7. Enviar email a la dirección especificada
    console.log(`🔔 Enviando email a ${targetEmail}...`);
    const result = await sendHciEmailNotification(
      targetEmail, // Usar el email especificado en lugar del del hyperconnector
      hciData,
      jobData,
      candidatesData,
      appUrl,
      ownerCandidate
    );

    console.log("");
    console.log("=".repeat(80));
    console.log("✅ EMAIL ENVIADO EXITOSAMENTE");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📧 Message ID: ${result.messageId || "N/A"}`);
    console.log(`🔗 Link de Recomendación: ${result.recommendUrl}`);
    console.log("");
    console.log(`✅ Email enviado a: ${targetEmail}`);
    console.log("✅ Verifica tu bandeja de entrada (y spam) para ver el email");
    console.log("");

  } catch (error: any) {
    console.error("");
    console.error("=".repeat(80));
    console.error("❌ ERROR");
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

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error("❌ Error: Se requieren 3 argumentos");
  console.error("");
  console.error("Usage: npm run test:email-to-address <job_id> <hyperconnector_id> <email>");
  console.error("");
  console.error("Ejemplo:");
  console.error("  npm run test:email-to-address bfa31bea-667d-4ff1-bfaa-9fb6ee83ba7f 0586a594-bce5-4fd4-ae39-8667665076a1 alexa00rivera@gmail.com");
  process.exit(1);
}

const [jobId, hyperconnectorId, targetEmail] = args;
testEmailToSpecificAddress(jobId, hyperconnectorId, targetEmail);

