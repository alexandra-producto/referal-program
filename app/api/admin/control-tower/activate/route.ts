import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/db/supabaseClient";
import { calculateAIMatch } from "@/src/agents/aiMatchingAgent";
import { createOrUpdateJobCandidateMatch } from "@/src/domain/jobCandidateMatches";

/**
 * POST /api/admin/control-tower/activate
 * Activa el Agent Recruiter para hacer matching de todos los jobs y candidatos sin match
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [CONTROL TOWER] Activando Agent Recruiter...");

    // 1. Obtener todos los jobs activos
    const { data: activeJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id")
      .not("status", "eq", "Recomendación Contratada")
      .not("status", "eq", "Recomendación Cancelada");

    if (jobsError) {
      throw new Error(`Error obteniendo jobs: ${jobsError.message}`);
    }

    if (!activeJobs || activeJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay jobs activos para procesar",
        processed: 0,
      });
    }

    // 2. Obtener todos los candidatos únicos de hyperconnector_candidates
    const { data: hyperconnectorCandidates, error: hcError } = await supabase
      .from("hyperconnector_candidates")
      .select("candidate_id");

    if (hcError) {
      throw new Error(`Error obteniendo candidatos: ${hcError.message}`);
    }

    const uniqueCandidateIds = [
      ...new Set(
        (hyperconnectorCandidates || []).map((hc: any) => hc.candidate_id)
      ),
    ];

    if (uniqueCandidateIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay candidatos para procesar",
        processed: 0,
      });
    }

    console.log(
      `📋 [CONTROL TOWER] Procesando ${activeJobs.length} jobs con ${uniqueCandidateIds.length} candidatos...`
    );

    // 3. Para cada job, obtener los candidatos que NO tienen match aún
    let totalProcessed = 0;
    let totalErrors = 0;

    // Procesar en batches para no sobrecargar
    const batchSize = 5; // Procesar 5 jobs a la vez

    for (let i = 0; i < activeJobs.length; i += batchSize) {
      const jobBatch = activeJobs.slice(i, i + batchSize);

      await Promise.all(
        jobBatch.map(async (job: any) => {
          try {
            // Obtener matches existentes para este job
            const { data: existingMatches } = await supabase
              .from("job_candidate_matches")
              .select("candidate_id")
              .eq("job_id", job.id);

            const matchedCandidateIds = new Set(
              (existingMatches || []).map((m: any) => m.candidate_id)
            );

            // Filtrar candidatos sin match
            const candidatesToMatch = uniqueCandidateIds.filter(
              (candidateId) => !matchedCandidateIds.has(candidateId)
            );

            console.log(
              `   📊 Job ${job.id}: ${candidatesToMatch.length} candidatos sin match`
            );

            // Procesar cada candidato sin match
            for (const candidateId of candidatesToMatch) {
              try {
                // Calcular match usando AI
                const matchResult = await calculateAIMatch(job.id, candidateId);

                // Guardar en base de datos
                await createOrUpdateJobCandidateMatch({
                  job_id: job.id,
                  candidate_id: candidateId,
                  match_score: matchResult.score,
                  match_detail: matchResult.detail,
                  match_source: "openai-gpt4o",
                  updated_at: new Date().toISOString(),
                });

                totalProcessed++;
                console.log(
                  `   ✅ Match creado: Job ${job.id} ↔ Candidate ${candidateId} (Score: ${matchResult.score})`
                );

                // Pequeño delay para no sobrecargar OpenAI API
                await new Promise((resolve) => setTimeout(resolve, 100));
              } catch (error: any) {
                console.error(
                  `   ❌ Error matching job ${job.id} con candidate ${candidateId}:`,
                  error.message
                );
                totalErrors++;
              }
            }
          } catch (error: any) {
            console.error(`   ❌ Error procesando job ${job.id}:`, error.message);
            totalErrors++;
          }
        })
      );

      console.log(
        `📊 [CONTROL TOWER] Procesados ${Math.min(i + batchSize, activeJobs.length)}/${activeJobs.length} jobs`
      );
    }

    console.log(
      `✅ [CONTROL TOWER] Agent Recruiter completado: ${totalProcessed} matches procesados, ${totalErrors} errores`
    );

    return NextResponse.json({
      success: true,
      message: "Agent Recruiter completado",
      processed: totalProcessed,
      errors: totalErrors,
    });
  } catch (error: any) {
    console.error("❌ [CONTROL TOWER] Error activando agente:", error);
    return NextResponse.json(
      {
        error: "Error al activar el agente",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

