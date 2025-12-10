/**
 * Script para reenviar solo el WhatsApp con el link corregido
 * Sin ejecutar matching
 * 
 * Usage: npm run resend:whatsapp <job_id> <hyperconnector_id>
 */

import "./config/env";
import { sendHciWhatsappNotification } from "./agents/sendHciWhatsappNotification";
import { getJobById } from "./domain/jobs";
import { getHyperconnectorById } from "./domain/hyperconnectors";
import { getRecommendableCandidatesForHyperconnector } from "./domain/hyperconnectorCandidates";
import { supabase } from "./db/supabaseClient";

async function resendWhatsappOnly(jobId: string, hyperconnectorId: string) {
  try {
    console.log("=".repeat(80));
    console.log("📤 REENVIAR WHATSAPP (SIN MATCHING)");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📋 Job ID: ${jobId}`);
    console.log(`👤 Hyperconnector ID: ${hyperconnectorId}`);
    console.log("");

    // 1. Obtener job
    console.log("🔍 Obteniendo información del job...");
    const job = await getJobById(jobId);
    if (!job) {
      throw new Error(`Job no encontrado: ${jobId}`);
    }
    console.log(`   ✅ Job: ${job.job_title || job.role_title || "Sin título"}`);
    console.log(`   🏢 Company: ${job.company_name}`);
    console.log("");

    // 2. Obtener hyperconnector
    console.log("🔍 Obteniendo información del hyperconnector...");
    const hyperconnector = await getHyperconnectorById(hyperconnectorId);
    if (!hyperconnector) {
      throw new Error(`Hyperconnector no encontrado: ${hyperconnectorId}`);
    }
    console.log(`   ✅ Hyperconnector: ${hyperconnector.full_name}`);
    console.log("");

    // 3. Obtener teléfono
    let phoneNumber = (hyperconnector as any).phone_number;
    if (!phoneNumber && (hyperconnector as any).candidate_id) {
      console.log("   🔄 Buscando teléfono en candidate asociado...");
      const { data: candidate } = await supabase
        .from("candidates")
        .select("phone_number")
        .eq("id", (hyperconnector as any).candidate_id)
        .maybeSingle();
      
      if (candidate && (candidate as any).phone_number) {
        phoneNumber = (candidate as any).phone_number;
        console.log(`   ✅ Teléfono encontrado: ${phoneNumber}`);
      }
    }
    
    if (!phoneNumber) {
      phoneNumber = process.env.TEST_PHONE_NUMBER;
      if (phoneNumber) {
        console.log(`   ⚠️  Usando TEST_PHONE_NUMBER: ${phoneNumber}`);
      } else {
        throw new Error("No se encontró teléfono para el hyperconnector");
      }
    }
    console.log("");

    // 4. Obtener candidatos recomendables
    console.log("🔍 Obteniendo candidatos recomendables...");
    const recommendableCandidates = await getRecommendableCandidatesForHyperconnector(
      jobId,
      hyperconnectorId
    );

    if (recommendableCandidates.length === 0) {
      throw new Error("No hay candidatos recomendables para este job e hyperconnector");
    }

    console.log(`   ✅ Candidatos encontrados: ${recommendableCandidates.length}`);
    const top3 = recommendableCandidates.slice(0, 3);
    top3.forEach((c, idx) => {
      console.log(`      ${idx + 1}. ${c.full_name} (${c.match_score}%)`);
    });
    console.log("");

    // 5. Obtener owner candidate
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
      }
    }

    // 6. Preparar datos
    const hciData = {
      id: hyperconnector.id,
      full_name: hyperconnector.full_name,
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

    // 7. FORZAR http://localhost:3000 explícitamente
    const baseUrl = "http://localhost:3000";
    console.log(`🌐 Usando baseUrl: ${baseUrl}`);
    console.log("");

    // 8. Enviar WhatsApp
    console.log("📤 Enviando WhatsApp...");
    const result = await sendHciWhatsappNotification(
      phoneNumber,
      hciData,
      jobData,
      candidatesData,
      baseUrl, // Forzar explícitamente
      ownerCandidate
    );

    console.log("");
    console.log("=".repeat(80));
    console.log("✅ WHATSAPP ENVIADO");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📱 SID: ${result.sid}`);
    console.log(`🔗 Link: ${result.recommendUrl}`);
    console.log("");
    console.log("✅ Verifica que el link use http://localhost:3000 (no https://)");
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
if (args.length < 2) {
  console.error("❌ Error: Se requieren 2 argumentos");
  console.error("");
  console.error("Usage: npm run resend:whatsapp <job_id> <hyperconnector_id>");
  console.error("");
  console.error("Ejemplo:");
  console.error("  npm run resend:whatsapp 12cb6910-8019-449e-ae27-b1fb14a8cf6f eccd2f37-c071-4eda-8e4b-24a8d11c369b");
  process.exit(1);
}

const [jobId, hyperconnectorId] = args;
resendWhatsappOnly(jobId, hyperconnectorId);

