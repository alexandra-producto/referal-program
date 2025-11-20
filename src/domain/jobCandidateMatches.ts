import { supabase } from "../db/supabaseClient";

export async function getMatchesForJob(jobId: string) {
  const { data, error } = await supabase
    .from("job_candidate_matches")
    .select("*")
    .eq("job_id", jobId);

  if (error) throw error;
  return data;
}

export async function createOrUpdateJobCandidateMatch(payload: any) {
  // First, try to find existing match
  const { data: existing } = await supabase
    .from("job_candidate_matches")
    .select("id")
    .eq("job_id", payload.job_id)
    .eq("candidate_id", payload.candidate_id)
    .maybeSingle();

  if (existing) {
    // Update existing match
    const { data, error } = await supabase
      .from("job_candidate_matches")
      .update({
        match_score: payload.match_score,
        match_detail: payload.match_detail,
        match_source: payload.match_source || "auto",
        updated_at: payload.updated_at || new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new match
    const { data, error } = await supabase
      .from("job_candidate_matches")
      .insert({
        ...payload,
        created_at: payload.created_at || new Date().toISOString(),
        updated_at: payload.updated_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function deleteJobCandidateMatch(jobId: string, candidateId: string) {
  const { error } = await supabase
    .from("job_candidate_matches")
    .delete()
    .eq("job_id", jobId)
    .eq("candidate_id", candidateId);

  if (error) throw error;
  return true;
}
