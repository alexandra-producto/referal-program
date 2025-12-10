import { supabase } from "../db/supabaseClient";

export interface PotentialCandidate {
  id: string;
  full_name: string;
  current_company: string | null;
  current_job_title: string | null;
  country: string | null;
  industry: string | null;
  profile_picture_url: string | null;
  linkedin_url: string | null;
  match_score: number | null;
  match_detail: any | null;
  has_recommendation: boolean;
}

/**
 * Obtiene todos los candidatos potenciales para un job con match >= 40%
 * No filtra por hyperconnector, muestra todos los candidatos que matchean
 */
export async function getPotentialCandidatesForJob(
  jobId: string
): Promise<PotentialCandidate[]> {
  // 1) Obtener todos los matches para este job con score >= 40%
  const MIN_MATCH_SCORE = 40;
  
  const { data: matches, error: matchesError } = await supabase
    .from("job_candidate_matches")
    .select("candidate_id, match_score, match_source, match_detail")
    .eq("job_id", jobId)
    .gte("match_score", MIN_MATCH_SCORE)
    .neq("match_source", "auto"); // Excluir matches automáticos

  if (matchesError) {
    console.error("Error obteniendo matches:", matchesError);
    throw new Error(matchesError.message);
  }

  if (!matches || matches.length === 0) {
    return [];
  }

  const candidateIds = matches.map((m) => m.candidate_id);
  const matchByCandidateId = new Map(
    matches.map((m) => [
      m.candidate_id,
      {
        score: m.match_score,
        source: m.match_source,
        detail: m.match_detail,
      },
    ])
  );

  // 2) Obtener información de los candidatos
  const { data: candidates, error: candidatesError } = await supabase
    .from("candidates")
    .select(
      "id, full_name, current_company, current_job_title, country, industry, profile_picture_url, linkedin_url"
    )
    .in("id", candidateIds);

  if (candidatesError) {
    throw new Error(candidatesError.message);
  }

  // 3) Verificar qué candidatos tienen recomendaciones para este job
  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("candidate_id")
    .eq("job_id", jobId)
    .in("candidate_id", candidateIds)
    .not("candidate_id", "is", null);

  const candidatesWithRecommendations = new Set(
    (recommendations || []).map((r: any) => r.candidate_id)
  );

  // 4) Combinar toda la información
  return (candidates || [])
    .map((c) => {
      const matchData = matchByCandidateId.get(c.id);
      return {
        id: c.id,
        full_name: c.full_name,
        current_company: c.current_company,
        current_job_title: c.current_job_title || null,
        country: c.country || null,
        industry: c.industry || null,
        profile_picture_url: c.profile_picture_url || null,
        linkedin_url: c.linkedin_url || null,
        match_score: matchData?.score || null,
        match_detail: matchData?.detail || null,
        has_recommendation: candidatesWithRecommendations.has(c.id),
      };
    })
    .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
}

/**
 * Obtiene el conteo de candidatos potenciales para un job (match >= 40%)
 */
export async function getPotentialCandidatesCount(jobId: string): Promise<number> {
  const MIN_MATCH_SCORE = 40;
  
  const { count, error } = await supabase
    .from("job_candidate_matches")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId)
    .gte("match_score", MIN_MATCH_SCORE)
    .neq("match_source", "auto");

  if (error) {
    console.error("Error obteniendo conteo de matches:", error);
    return 0;
  }

  return count || 0;
}

