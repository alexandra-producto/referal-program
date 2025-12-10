import { supabase } from "../db/supabaseClient";
import { getAppUrl } from "../utils/appUrl";
import { getRecommendationsForJob } from "./recommendations";

// Estados permitidos para los jobs
export type JobStatus =
  | "open_without_recommendations"
  | "open_with_recommendations"
  | "recruitment_process"
  | "all_recommendations_rejected"
  | "hired";

// Estados permitidos para las recomendaciones (lo exportamos aquí para reutilizar)
export type RecommendationStatus = "pending" | "in_review" | "rejected" | "contracted";

export async function getJobById(id: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// Para este test: buscar el rol de Vemo por nombre de empresa
export async function getJobByCompanyNameLike(company: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .ilike("company_name", `%${company}%`)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Creates a new job and optionally triggers matching with all candidates
 */
export async function createJob(
  job: any,
  options?: { triggerMatching?: boolean }
) {
  const { data, error } = await supabase
    .from("jobs")
    .insert(job)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Trigger matching if requested (non-blocking)
  if (options?.triggerMatching && data?.id) {
    console.log(`\n🔄 [JOBS] Job creado con ID: ${data.id}`);
    console.log(`🔄 [JOBS] Iniciando matching automático en background...`);
    // Run asynchronously to not block the insert
    import("../agents/matchJobCandidate")
      .then(({ matchJobWithAllCandidates }) => {
        console.log(
          `🔄 [JOBS] Módulo de matching cargado, ejecutando matchJobWithAllCandidates...`
        );
        matchJobWithAllCandidates(data.id)
          .then((matchCount) => {
            // After matching completes, notify hyperconnectors
            console.log(`\n✅ [JOBS] Matching completado: ${matchCount} matches creados`);
            console.log(`🔄 [JOBS] Iniciando notificación de hyperconnectors...`);
            import("../agents/notifyHyperconnectorsForJob")
              .then(({ notifyHyperconnectorsForJob }) => {
                const baseUrl = getAppUrl();
                console.log(
                  `🔄 [JOBS] Módulo de notificación cargado, ejecutando notifyHyperconnectorsForJob...`
                );
                console.log(`🔄 [JOBS] Usando baseUrl: ${baseUrl}`);
                notifyHyperconnectorsForJob(data.id, baseUrl)
                  .then((result) => {
                    console.log(
                      `\n✅ [JOBS] Notificación completada: ${result.notified} WhatsApp, ${result.emailsSent || 0} emails, ${result.errors} errores`
                    );
                  })
                  .catch((err) => {
                    console.error(`❌ [JOBS] Error notificando hyperconnectors:`, err);
                  });
              })
              .catch((err) => {
                console.error(
                  `❌ [JOBS] Error loading notifyHyperconnectorsForJob module:`,
                  err
                );
              });
          })
          .catch((err) => {
            console.error(
              `❌ [JOBS] Error in background matching after job creation:`,
              err
            );
          });
      })
      .catch((err) => {
        console.error(`❌ [JOBS] Error loading matching module:`, err);
      });
  }

  return data;
}

/**
 * Actualiza el status del job basado en el estado agregado de sus recomendaciones.
 */
export async function updateJobStatusFromRecommendations(jobId: string): Promise<void> {
  try {
    // 1. Obtener recomendaciones del job
    const recommendations = await getRecommendationsForJob(jobId);

    let newStatus: JobStatus;

    if (!recommendations || recommendations.length === 0) {
      newStatus = "open_without_recommendations";
    } else if (recommendations.some((rec: any) => rec.status === "contracted")) {
      newStatus = "hired";
    } else if (recommendations.some((rec: any) => rec.status === "in_review")) {
      newStatus = "recruitment_process";
    } else if (recommendations.every((rec: any) => rec.status === "rejected")) {
      newStatus = "all_recommendations_rejected";
    } else {
      // Hay al menos una recomendación (pending u otros), pero ninguna en review,
      // ninguna contratada y no todas rechazadas
      newStatus = "open_with_recommendations";
    }

    // 2. Obtener status actual del job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("status")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) {
      console.error("❌ [updateJobStatusFromRecommendations] Error obteniendo job:", jobError);
      return;
    }

    if (!job) {
      console.warn(
        "⚠️ [updateJobStatusFromRecommendations] Job no encontrado para jobId:",
        jobId
      );
      return;
    }

    if (job.status === newStatus) {
      // Nada que actualizar
      return;
    }

    console.log(
      `🔄 [updateJobStatusFromRecommendations] Actualizando job ${jobId} de '${job.status}' a '${newStatus}'`
    );

    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateError) {
      console.error(
        "❌ [updateJobStatusFromRecommendations] Error actualizando status del job:",
        updateError
      );
    }
  } catch (error) {
    console.error(
      "❌ [updateJobStatusFromRecommendations] Error inesperado actualizando status del job:",
      error
    );
  }
}
