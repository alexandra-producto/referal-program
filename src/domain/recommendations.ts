import { supabase } from "../db/supabaseClient";

export async function getRecommendationsForJob(jobId: string) {
  console.log("🔍 [getRecommendationsForJob] Buscando recomendaciones para jobId:", jobId);
  
  const { data, error } = await supabase
    .from("recommendations")
    .select("*")
    .eq("job_id", jobId);

  if (error) {
    console.error("❌ [getRecommendationsForJob] Error obteniendo recomendaciones:", error);
    throw error;
  }
  
  console.log("✅ [getRecommendationsForJob] Recomendaciones encontradas:", data?.length || 0);
  if (data && data.length > 0) {
    console.log("📋 [getRecommendationsForJob] IDs de recomendaciones:", data.map((r: any) => r.id));
  }
  
  return data;
}

export async function createRecommendation(payload: any) {
  const { data, error } = await supabase
    .from("recommendations")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecommendation(id: string, updates: any) {
  const { data, error } = await supabase
    .from("recommendations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecommendation(id: string) {
  const { error } = await supabase.from("recommendations").delete().eq("id", id);
  if (error) throw error;
  return true;
}
