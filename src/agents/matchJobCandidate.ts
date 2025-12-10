/**
 * Service to match a job with a candidate and upsert the result
 */

import { getJobById } from "../domain/jobs";
import { getCandidateById } from "../domain/candidates";
import { getExperienceForCandidate } from "../domain/candidateExperience";
import { createOrUpdateJobCandidateMatch } from "../domain/jobCandidateMatches";
import { computeJobCandidateMatch, Job, Candidate, CandidateExperience } from "./computeJobCandidateMatch";
import { calculateAIMatch } from "./aiMatchingAgent";

/**
 * Matches a job with a candidate and saves the result to job_candidate_matches
 * Usa el nuevo servicio AI (OpenAI GPT-4o) para calcular matches
 */
export async function matchJobCandidate(
  jobId: string,
  candidateId: string,
  options?: { useAI?: boolean }
): Promise<{ score: number; detail: any }> {
  // Por defecto usar AI, pero permitir fallback al sistema antiguo
  const useAI = options?.useAI !== false;

  if (useAI) {
    try {
      // Usar el nuevo servicio AI
      const matchResult = await calculateAIMatch(jobId, candidateId);

      // Upsert to database (ya se guarda en el script Python, pero lo hacemos aquí también por seguridad)
      await createOrUpdateJobCandidateMatch({
        job_id: jobId,
        candidate_id: candidateId,
        match_score: matchResult.score,
        match_detail: matchResult.detail,
        match_source: "openai-gpt4o",
        updated_at: new Date().toISOString(),
      });

      return {
        score: matchResult.score,
        detail: matchResult.detail,
      };
    } catch (error: any) {
      console.error(`⚠️  Error en AI matching, usando fallback:`, error.message);
      // Mostrar más detalles del error para debugging
      if (error.stack) {
        console.error(`   Stack trace: ${error.stack.substring(0, 300)}...`);
      }
      // Fallback al sistema antiguo si falla el AI
      console.warn(`   ⚠️  Usando sistema 'auto' como fallback para Job ${jobId} ↔ Candidate ${candidateId}`);
    }
  }

  // Sistema antiguo (fallback)
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    throw new Error(`Candidate not found: ${candidateId}`);
  }

  const experiences = await getExperienceForCandidate(candidateId);

  // Compute match
  const matchResult = computeJobCandidateMatch(
    job as Job,
    candidate as Candidate,
    experiences as CandidateExperience[]
  );

  // Upsert to database
  await createOrUpdateJobCandidateMatch({
    job_id: jobId,
    candidate_id: candidateId,
    match_score: matchResult.score,
    match_detail: matchResult.detail,
    match_source: "auto",
    updated_at: new Date().toISOString(),
  });

  return {
    score: matchResult.score,
    detail: matchResult.detail,
  };
}

/**
 * Matches a job with all existing candidates
 */
export async function matchJobWithAllCandidates(jobId: string): Promise<number> {
  const { supabase } = await import("../db/supabaseClient");
  
  // Get all candidates
  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("id");

  if (error) {
    throw new Error(`Error fetching candidates: ${error.message}`);
  }

  if (!candidates || candidates.length === 0) {
    console.log(`📋 [MATCHING] No candidates found to match`);
    return 0;
  }

  console.log(`\n📋 [MATCHING] Iniciando matching para job ${jobId}`);
  console.log(`📋 [MATCHING] Total de candidatos a evaluar: ${candidates.length}`);

  let successCount = 0;
  let errorCount = 0;
  let matchesWithScore: Array<{ candidateId: string; score: number }> = [];

  // Process in smaller batches with delays to avoid rate limits
  const batchSize = 2; // Reducido para evitar rate limits
  const delayBetweenMatches = 500; // 500ms entre matches
  const delayBetweenBatches = 2000; // 2 segundos entre batches
  
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    
    // Procesar secuencialmente con delays para evitar rate limits
    for (let j = 0; j < batch.length; j++) {
      const candidate = batch[j];
      try {
        const result = await matchJobCandidate(jobId, candidate.id, { useAI: true });
        successCount++;
        if (result.score > 0) {
          matchesWithScore.push({ candidateId: candidate.id, score: result.score });
          console.log(`   ✅ [MATCHING] Match encontrado: candidate ${candidate.id} → score: ${result.score}`);
        }
        
        // Delay entre matches (excepto el último del batch)
        if (j < batch.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenMatches));
        }
      } catch (error: any) {
        console.error(
          `   ❌ [MATCHING] Error matching job ${jobId} with candidate ${candidate.id}:`,
          error.message
        );
        errorCount++;
        
        // Si es un error de rate limit, esperar más tiempo
        if (error.message.includes("429") || error.message.includes("rate limit")) {
          console.warn(`   ⏳ Rate limit detectado, esperando 5 segundos...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    // Delay entre batches (excepto el último)
    if (i + batchSize < candidates.length) {
      console.log(`   ⏳ Esperando ${delayBetweenBatches / 1000}s antes del siguiente batch...`);
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }

    console.log(`📋 [MATCHING] Procesados ${Math.min(i + batchSize, candidates.length)}/${candidates.length} candidatos`);
  }

  console.log(`\n✅ [MATCHING] Matching completo:`);
  console.log(`   - Total procesados: ${successCount + errorCount}`);
  console.log(`   - Exitosos: ${successCount}`);
  console.log(`   - Errores: ${errorCount}`);
  console.log(`   - Matches con score > 0: ${matchesWithScore.length}`);
  if (matchesWithScore.length > 0) {
    console.log(`   - Scores: ${matchesWithScore.map(m => `${m.score}`).join(", ")}`);
  }
  
  return successCount;
}

/**
 * Matches a candidate with all existing jobs
 */
export async function matchCandidateWithAllJobs(candidateId: string): Promise<number> {
  const { supabase } = await import("../db/supabaseClient");
  
  // Get all jobs
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id");

  if (error) {
    throw new Error(`Error fetching jobs: ${error.message}`);
  }

  if (!jobs || jobs.length === 0) {
    console.log("No jobs found to match");
    return 0;
  }

  console.log(`Matching candidate ${candidateId} with ${jobs.length} jobs...`);

  let successCount = 0;
  let errorCount = 0;

  // Process in batches
  const batchSize = 10;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (job) => {
        try {
          await matchJobCandidate(job.id, candidateId);
          successCount++;
        } catch (error: any) {
          console.error(
            `Error matching candidate ${candidateId} with job ${job.id}:`,
            error.message
          );
          errorCount++;
        }
      })
    );

    console.log(`Processed ${Math.min(i + batchSize, jobs.length)}/${jobs.length} jobs`);
  }

  console.log(`✅ Matching complete: ${successCount} successful, ${errorCount} errors`);
  return successCount;
}

