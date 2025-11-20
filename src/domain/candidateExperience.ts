import { supabase } from "../db/supabaseClient";

export async function getExperienceForCandidate(candidateId: string) {
  const { data, error } = await supabase
    .from("candidate_experience")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function insertExperienceRecords(records: any[]) {
  if (!records.length) return [];
  const { data, error } = await supabase
    .from("candidate_experience")
    .insert(records)
    .select();

  if (error) throw error;
  return data || [];
}

export async function deleteExperienceForCandidate(candidateId: string) {
  const { error } = await supabase
    .from("candidate_experience")
    .delete()
    .eq("candidate_id", candidateId);

  if (error) throw error;
  return true;
}

export async function getAllCandidates() {
  const { data, error } = await supabase.from("candidates").select("*");
  if (error) throw error;
  return data || [];
}

export async function getCandidatesNeedingExperience(limit = 50) {
  const { data, error } = await supabase
    .rpc("candidates_needing_experience", { p_limit: limit }); // si decides usar una función
  if (error) throw error;
  return data || [];
}

