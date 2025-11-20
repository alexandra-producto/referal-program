import { supabase } from "../db/supabaseClient";

export async function getAllCandidates() {
  const { data, error } = await supabase.from("candidates").select("*");
  if (error) throw error;
  return data;
}

export async function getCandidateById(id: string) {
  const { data, error } = await supabase.from("candidates").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Creates a new candidate and optionally triggers matching with all jobs
 */
export async function createCandidate(
  candidate: any,
  options?: { triggerMatching?: boolean }
) {
  const { data, error } = await supabase
    .from("candidates")
    .insert(candidate)
    .select()
    .single();
  
  if (error) throw error;

  // Trigger matching if requested (non-blocking)
  if (options?.triggerMatching && data?.id) {
    // Run asynchronously to not block the insert
    import("../agents/matchJobCandidate")
      .then(({ matchCandidateWithAllJobs }) => {
        matchCandidateWithAllJobs(data.id).catch((err) => {
          console.error("Error in background matching after candidate creation:", err);
        });
      })
      .catch((err) => {
        console.error("Error loading matching module:", err);
      });
  }

  // Trigger relationship sync (non-blocking)
  if (data?.id) {
    import("../agents/syncHyperconnectorRelationships")
      .then(({ syncHyperconnectorCandidateRelationshipsForCandidate }) => {
        syncHyperconnectorCandidateRelationshipsForCandidate(data.id).catch((err) => {
          console.error("Error in background relationship sync after candidate creation:", err);
        });
      })
      .catch((err) => {
        console.error("Error loading relationship sync module:", err);
      });
  }

  return data;
}

export async function updateCandidate(id: string, updates: any) {
  const { data, error } = await supabase.from("candidates").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCandidate(id: string) {
  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * Upsert: crea o actualiza un candidate por user_id, email o linkedin_id
 */
export async function upsertCandidate(candidateData: {
  user_id?: string;
  email?: string;
  full_name?: string;
  current_company?: string | null;
  current_job_title?: string | null;
  linkedin_url?: string | null;
}): Promise<any> {
  // Buscar candidate existente
  let existing = null;

  // Prioridad 1: Buscar por user_id (más confiable)
  if (candidateData.user_id) {
    const { data } = await supabase
      .from("candidates")
      .select("*")
      .eq("user_id", candidateData.user_id)
      .maybeSingle();
    existing = data;
  }

  // Prioridad 2: Buscar por email si no se encontró por user_id
  if (!existing && candidateData.email) {
    const { data } = await supabase
      .from("candidates")
      .select("*")
      .eq("email", candidateData.email)
      .maybeSingle();
    existing = data;
  }

  if (existing) {
    // Actualizar
    const { data, error } = await supabase
      .from("candidates")
      .update({
        ...candidateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Crear nuevo
    return await createCandidate(candidateData, { triggerMatching: true });
  }
}

