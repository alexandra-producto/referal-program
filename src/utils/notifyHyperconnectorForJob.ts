/**
 * Función simplificada para notificar a un hyperconnector específico sobre un job
 * 
 * Esta función:
 * 1. Obtiene los datos del job y del hyperconnector desde la base de datos
 * 2. Construye el HTML del email usando buildHciEmailMessage()
 * 3. Genera la URL de recomendación
 * 4. Llama a sendHciEmailNotification() que usa Resend para enviar el email directamente
 * 
 * @param jobId - ID del job
 * @param hyperconnectorId - ID del hyperconnector
 * @param baseUrl - URL base de la aplicación (opcional)
 * @returns Promise con el resultado del envío
 */

import { getJobById } from "../domain/jobs";
import { getHyperconnectorById } from "../domain/hyperconnectors";
import { getRecommendableCandidatesForHyperconnector } from "../domain/hyperconnectorCandidates";
import { sendHciEmailNotification } from "../agents/sendHciEmailNotification";
import { supabase } from "../db/supabaseClient";
import { getAppUrl } from "./appUrl";

export async function notifyHyperconnectorForJob(
  jobId: string,
  hyperconnectorId: string,
  baseUrl?: string
): Promise<{ success: boolean; messageId?: string; recommendUrl?: string; error?: string }> {
  try {
    console.log(`\n🔔 [NOTIFY] Iniciando notificación para job: ${jobId}, hyperconnector: ${hyperconnectorId}`);

    // 1. Obtener el job
    console.log(`🔔 [NOTIFY] Obteniendo información del job...`);
    const job = await getJobById(jobId);
    if (!job) {
      throw new Error(`Job no encontrado: ${jobId}`);
    }
    console.log(`   ✅ Job encontrado: ${job.job_title || job.role_title || "Sin título"}`);
    console.log(`   🏢 Company: ${job.company_name}`);

    // 2. Obtener el hyperconnector
    console.log(`🔔 [NOTIFY] Obteniendo información del hyperconnector...`);
    const hyperconnector = await getHyperconnectorById(hyperconnectorId);
    if (!hyperconnector) {
      throw new Error(`Hyperconnector no encontrado: ${hyperconnectorId}`);
    }
    console.log(`   ✅ Hyperconnector encontrado: ${hyperconnector.full_name}`);

    // 3. Obtener email del hyperconnector
    let hciEmail = (hyperconnector as any).email;
    
    // Si no tiene email, intentar obtenerlo desde el candidate asociado
    if (!hciEmail && (hyperconnector as any).candidate_id) {
      console.log(`   🔄 Buscando email en candidate asociado...`);
      const { data: candidate } = await supabase
        .from("candidates")
        .select("email")
        .eq("id", (hyperconnector as any).candidate_id)
        .maybeSingle();
      
      if (candidate && (candidate as any).email) {
        hciEmail = (candidate as any).email;
        console.log(`   ✅ Email encontrado en candidate: ${hciEmail}`);
      }
    }
    
    if (!hciEmail) {
      throw new Error(`No se encontró email para el hyperconnector: ${hyperconnector.full_name}`);
    }
    console.log(`   📧 Email: ${hciEmail}`);

    // 4. Obtener candidatos recomendables
    console.log(`🔔 [NOTIFY] Obteniendo candidatos recomendables...`);
    const recommendableCandidates = await getRecommendableCandidatesForHyperconnector(
      jobId,
      hyperconnectorId
    );

    if (recommendableCandidates.length === 0) {
      console.log(`   ⚠️  No hay candidatos recomendables para este job e hyperconnector`);
      return {
        success: false,
        error: "No hay candidatos recomendables para este job e hyperconnector",
      };
    }

    console.log(`   ✅ Candidatos encontrados: ${recommendableCandidates.length}`);
    const top3 = recommendableCandidates.slice(0, 3);
    top3.forEach((c, idx) => {
      console.log(`      ${idx + 1}. ${c.full_name} (${c.match_score || "N/A"}%)`);
    });

    // 5. Obtener owner candidate (opcional)
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

    // 6. Preparar datos
    const hciData = {
      id: hyperconnector.id,
      full_name: hyperconnector.full_name,
      email: hciEmail,
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

    // 7. Obtener baseUrl
    const appUrl = baseUrl || getAppUrl();
    console.log(`🌐 Usando baseUrl: ${appUrl}`);

    // 8. Enviar email
    console.log(`🔔 [NOTIFY] Enviando email...`);
    const result = await sendHciEmailNotification(
      hciEmail,
      hciData,
      jobData,
      candidatesData,
      appUrl,
      ownerCandidate
    );

    console.log(`   ✅ Email enviado exitosamente`);
    console.log(`   📧 Message ID: ${result.messageId || "N/A"}`);
    console.log(`   🔗 Link: ${result.recommendUrl}`);

    return {
      success: true,
      messageId: result.messageId,
      recommendUrl: result.recommendUrl,
    };

  } catch (error: any) {
    console.error(`❌ Error en notifyHyperconnectorForJob:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}




