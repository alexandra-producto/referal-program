import { supabase } from "../db/supabaseClient";

export async function getRecommendationsForJob(jobId: string) {
  try {
    const { data, error } = await supabase
      .from("recommendations")
      .select("*")
      .eq("job_id", jobId);

    if (error) {
      console.error("❌ [getRecommendationsForJob] Error obteniendo recomendaciones:", {
        jobId,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
    
    // Logging solo si hay datos o si estamos en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log("✅ [getRecommendationsForJob] Recomendaciones encontradas:", data?.length || 0, "para jobId:", jobId);
    }
    
    return data || [];
  } catch (error: any) {
    console.error("❌ [getRecommendationsForJob] Error inesperado:", error);
    throw error;
  }
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
