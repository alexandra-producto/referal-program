/**
 * Notifica a los hyperconnectors cuando un nuevo job tiene candidatos matcheados en su red
 * 
 * Flujo:
 * 1. Obtiene todos los job_candidate_matches para el job
 * 2. Para cada candidato matcheado, busca qué hyperconnectors lo tienen en su red
 * 3. Para cada hyperconnector, obtiene todos sus candidatos recomendables para ese job
 * 4. Envía WhatsApp a cada hyperconnector con el link de recomendación
 */

import { supabase } from "../db/supabaseClient";
import { getJobById } from "../domain/jobs";
import { getRecommendableCandidatesForHyperconnector } from "../domain/hyperconnectorCandidates";
import { sendHciWhatsappNotification } from "./sendHciWhatsappNotification";
import { getHyperconnectorById } from "../domain/hyperconnectors";
import { getAppUrl } from "../utils/appUrl";

/**
 * Notifica a todos los hyperconnectors que tienen candidatos matcheados con un job
 */
export async function notifyHyperconnectorsForJob(
  jobId: string,
  baseUrl?: string
): Promise<{ notified: number; errors: number }> {
  console.log(`\n🔔 [NOTIFY] Iniciando notificación de hyperconnectors para job: ${jobId}`);
  
  // Si no se proporciona baseUrl, usar getAppUrl() que detecta VERCEL_URL automáticamente
  const appUrl = baseUrl || getAppUrl();
  console.log(`🔔 [NOTIFY] Usando baseUrl: ${appUrl}`);

  try {
    // 1. Obtener el job para validar que existe
    console.log(`🔔 [NOTIFY] Paso 1: Obteniendo información del job...`);
    const job = await getJobById(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    console.log(`   ✅ Job encontrado: ${job.job_title || job.role_title || "Sin título"}`);
    console.log(`   🏢 Company: ${job.company_name}`);

    // 2. Obtener todos los job_candidate_matches para este job
    console.log(`\n🔔 [NOTIFY] Paso 2: Buscando job_candidate_matches...`);
    const { data: matches, error: matchesError } = await supabase
      .from("job_candidate_matches")
      .select("candidate_id, match_score")
      .eq("job_id", jobId);

    if (matchesError) {
      throw new Error(`Error fetching job_candidate_matches: ${matchesError.message}`);
    }

    if (!matches || matches.length === 0) {
      console.log(`   ℹ️  No hay matches para este job, no se enviarán notificaciones`);
      return { notified: 0, errors: 0 };
    }

    console.log(`   ✅ Encontrados ${matches.length} candidatos matcheados`);
    
    // Filtrar solo matches con score >= 70% (mínimo requerido)
    const MIN_MATCH_SCORE = 70;
    const matchesWithScore = matches.filter((m: any) => (m.match_score || 0) >= MIN_MATCH_SCORE);
    console.log(`   📊 Matches con score >= ${MIN_MATCH_SCORE}%: ${matchesWithScore.length}`);
    
    if (matchesWithScore.length === 0) {
      console.log(`   ℹ️  No hay matches con score >= ${MIN_MATCH_SCORE}%, no se enviarán notificaciones`);
      return { notified: 0, errors: 0 };
    }

    // 3. Obtener todos los candidatos únicos que matchean (solo con score >= 70%)
    const candidateIds = [...new Set(matchesWithScore.map((m: any) => m.candidate_id))];
    console.log(`   👥 Candidatos únicos matcheados: ${candidateIds.length}`);

    // 4. Para cada candidato, buscar qué hyperconnectors lo tienen en su red
    console.log(`\n🔔 [NOTIFY] Paso 3: Buscando hyperconnectors con estos candidatos en su red...`);
    
    // Limitar a los primeros 200 candidatos para evitar problemas de query muy grande
    // Si hay más, procesaremos en batches
    const maxCandidatesPerQuery = 200;
    const candidateBatches = [];
    for (let i = 0; i < candidateIds.length; i += maxCandidatesPerQuery) {
      candidateBatches.push(candidateIds.slice(i, i + maxCandidatesPerQuery));
    }
    
    console.log(`   🔄 Procesando ${candidateBatches.length} batch(es) de candidatos...`);
    
    let allHyperconnectorCandidates: any[] = [];
    for (let batchIdx = 0; batchIdx < candidateBatches.length; batchIdx++) {
      const batch = candidateBatches[batchIdx];
      console.log(`   🔄 Procesando batch ${batchIdx + 1}/${candidateBatches.length} (${batch.length} candidatos)...`);
      
      const { data: hyperconnectorCandidates, error: hciCandidatesError } = await supabase
        .from("hyperconnector_candidates")
        .select("hyperconnector_id, candidate_id")
        .in("candidate_id", batch);

      if (hciCandidatesError) {
        console.error(`   ❌ Error en batch ${batchIdx + 1}: ${hciCandidatesError.message}`);
        throw new Error(`Error fetching hyperconnector_candidates: ${hciCandidatesError.message}`);
      }

      if (hyperconnectorCandidates && hyperconnectorCandidates.length > 0) {
        allHyperconnectorCandidates.push(...hyperconnectorCandidates);
        console.log(`   ✅ Batch ${batchIdx + 1}: ${hyperconnectorCandidates.length} relaciones encontradas`);
      }
    }

    if (allHyperconnectorCandidates.length === 0) {
      console.log(`   ℹ️  No hay hyperconnectors con estos candidatos en su red`);
      return { notified: 0, errors: 0 };
    }

    console.log(`   ✅ Total de relaciones encontradas: ${allHyperconnectorCandidates.length}`);

    // 5. Agrupar por hyperconnector_id para obtener hyperconnectors únicos
    const hyperconnectorIds = [...new Set(
      allHyperconnectorCandidates.map((hc: any) => hc.hyperconnector_id)
    )];
    console.log(`   🔗 Hyperconnectors únicos encontrados: ${hyperconnectorIds.length}`);

    // 6. Para cada hyperconnector, obtener sus candidatos recomendables y enviar WhatsApp
    console.log(`\n🔔 [NOTIFY] Paso 4: Procesando cada hyperconnector...`);
    let notified = 0;
    let errors = 0;

    for (let i = 0; i < hyperconnectorIds.length; i++) {
      const hyperconnectorId = hyperconnectorIds[i];
      console.log(`\n   🔄 [NOTIFY] Procesando hyperconnector ${i + 1}/${hyperconnectorIds.length} (${hyperconnectorId})...`);
      
      try {
        // Obtener información del hyperconnector
        const hyperconnector = await getHyperconnectorById(hyperconnectorId);
        if (!hyperconnector) {
          console.warn(`   ⚠️  Hyperconnector ${hyperconnectorId} no encontrado, saltando...`);
          errors++;
          continue;
        }

        console.log(`   ✅ Hyperconnector encontrado: ${hyperconnector.full_name}`);

        // Obtener teléfono: primero intentar desde hyperconnector, luego desde candidate, luego usar TEST_PHONE_NUMBER
        let phoneNumber = (hyperconnector as any).phone_number;
        
        // Si no tiene teléfono, intentar obtenerlo desde el candidate asociado
        if (!phoneNumber && (hyperconnector as any).candidate_id) {
          console.log(`   🔄 Buscando teléfono en candidate asociado...`);
          const { data: candidate } = await supabase
            .from("candidates")
            .select("phone_number")
            .eq("id", (hyperconnector as any).candidate_id)
            .maybeSingle();
          
          if (candidate && (candidate as any).phone_number) {
            phoneNumber = (candidate as any).phone_number;
            console.log(`   ✅ Teléfono encontrado en candidate: ${phoneNumber}`);
          }
        }
        
        // Si aún no tiene teléfono, usar TEST_PHONE_NUMBER como fallback
        if (!phoneNumber) {
          phoneNumber = process.env.TEST_PHONE_NUMBER;
          if (phoneNumber) {
            console.log(`   ⚠️  No hay teléfono en BD, usando TEST_PHONE_NUMBER: ${phoneNumber}`);
          } else {
            console.warn(`   ❌ ${hyperconnector.full_name} no tiene teléfono y TEST_PHONE_NUMBER no está configurado, saltando...`);
            errors++;
            continue;
          }
        } else {
          console.log(`   📱 Teléfono encontrado: ${phoneNumber}`);
        }

        // Obtener candidatos recomendables para este hyperconnector y job
        console.log(`   🔄 Obteniendo candidatos recomendables...`);
        const recommendableCandidates = await getRecommendableCandidatesForHyperconnector(
          jobId,
          hyperconnectorId
        );

        // Solo enviar si hay candidatos recomendables
        if (recommendableCandidates.length === 0) {
          console.log(`   ⏭️  No hay candidatos recomendables (intersección vacía), saltando...`);
          continue;
        }

        console.log(`   ✅ Candidatos recomendables encontrados: ${recommendableCandidates.length}`);
        recommendableCandidates.forEach((c, idx) => {
          console.log(`      ${idx + 1}. ${c.full_name} (match_score: ${c.match_score || "N/A"})`);
        });

        console.log(`   📤 Enviando WhatsApp a ${hyperconnector.full_name}...`);

        // Obtener información del owner candidate
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

        // Preparar datos para el mensaje
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

        const candidatesData = recommendableCandidates.map(c => ({
          full_name: c.full_name,
          current_company: c.current_company,
          fit_score: c.match_score || null,
          shared_experience: c.shared_experience || null,
        }));

        // Enviar WhatsApp
        const result = await sendHciWhatsappNotification(
          phoneNumber,
          hciData,
          jobData,
          candidatesData,
          appUrl,
          ownerCandidate
        );

        console.log(`      ✅ WhatsApp enviado (SID: ${result.sid})`);
        console.log(`      🔗 Link: ${result.recommendUrl}`);
        notified++;

      } catch (error: any) {
        console.error(`   ❌ Error notificando hyperconnector ${hyperconnectorId}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Notificación completa: ${notified} enviados, ${errors} errores`);
    return { notified, errors };

  } catch (error: any) {
    console.error(`❌ Error en notifyHyperconnectorsForJob:`, error.message);
    throw error;
  }
}

