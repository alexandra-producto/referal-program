import { supabase } from "../db/supabaseClient";

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
        console.log(`🔄 [JOBS] Módulo de matching cargado, ejecutando matchJobWithAllCandidates...`);
        matchJobWithAllCandidates(data.id)
          .then((matchCount) => {
            // After matching completes, notify hyperconnectors
            console.log(`\n✅ [JOBS] Matching completado: ${matchCount} matches creados`);
            console.log(`🔄 [JOBS] Iniciando notificación de hyperconnectors...`);
            import("../agents/notifyHyperconnectorsForJob")
              .then(({ notifyHyperconnectorsForJob }) => {
                const baseUrl = process.env.APP_URL || "http://localhost:3000";
                console.log(`🔄 [JOBS] Módulo de notificación cargado, ejecutando notifyHyperconnectorsForJob...`);
                notifyHyperconnectorsForJob(data.id, baseUrl)
                  .then((result) => {
                    console.log(`\n✅ [JOBS] Notificación completada: ${result.notified} notificados, ${result.errors} errores`);
                  })
                  .catch((err) => {
                    console.error(`❌ [JOBS] Error notificando hyperconnectors:`, err);
                  });
              })
              .catch((err) => {
                console.error(`❌ [JOBS] Error loading notifyHyperconnectorsForJob module:`, err);
              });
          })
          .catch((err) => {
            console.error(`❌ [JOBS] Error in background matching after job creation:`, err);
          });
      })
      .catch((err) => {
        console.error(`❌ [JOBS] Error loading matching module:`, err);
      });
  }

  return data;
}
