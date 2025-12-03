import { supabase } from "../db/supabaseClient";

export async function getHyperconnectorByEmail(email: string) {
  const { data, error } = await supabase
    .from("hyperconnectors")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Devuelve los candidatos que:
 *  - Están matcheados con un job (job_candidate_matches)
 *  - Y tienen relación con el hyperconnector (hyperconnector_candidates)
 */
export async function getRecommendableCandidatesForHyperconnector(
  jobId: string,
  hyperconnectorId: string
) {
  // 1) relaciones HCI ↔ candidatos
  // Intentar obtener shared_experience si existe, sino solo candidate_id
  let links: any[] = [];
  let hasSharedExperience = false;

  // Primero intentar con shared_experience
  const { data: linksWithExp, error: expError } = await supabase
    .from("hyperconnector_candidates")
    .select("candidate_id, shared_experience")
    .eq("hyperconnector_id", hyperconnectorId);

  if (!expError && linksWithExp) {
    links = linksWithExp;
    hasSharedExperience = true;
  } else {
    // Si falla, intentar solo con candidate_id
    const { data: simpleLinks, error: simpleError } = await supabase
      .from("hyperconnector_candidates")
      .select("candidate_id")
      .eq("hyperconnector_id", hyperconnectorId);
    
    if (simpleError) throw new Error(simpleError.message);
    if (!simpleLinks || simpleLinks.length === 0) return [];
    
    links = simpleLinks.map(l => ({ candidate_id: l.candidate_id, shared_experience: null }));
  }

  return processCandidates(links, jobId);
}

async function processCandidates(links: any[], jobId: string) {
  const candidateIds = links.map((l) => l.candidate_id);

  // 2) matches job ↔ candidatos (opcional, si la tabla existe)
  let matches: any[] = [];
  try {
    const { data: jobMatches, error: matchesError } = await supabase
      .from("job_candidate_matches")
      .select("candidate_id, match_score")
      .eq("job_id", jobId)
      .in("candidate_id", candidateIds);

    if (!matchesError && jobMatches) {
      matches = jobMatches;
    }
  } catch (error) {
    // Si la tabla no existe, continuar sin matches
    console.warn("⚠️ Tabla job_candidate_matches no encontrada, continuando sin matches");
  }

  const matchByCandidateId = new Map(
    matches.map((m) => [m.candidate_id, m.match_score])
  );

  // 3) info de candidatos (obtener más campos para el diseño)
  const { data: candidates, error: candidatesError } = await supabase
    .from("candidates")
    .select("id, full_name, current_company, current_job_title, country, industry, profile_picture_url")
    .in("id", candidateIds);

  if (candidatesError) throw new Error(candidatesError.message);

  // 4) combinamos todo
  const linkByCandidateId = new Map(
    links.map((l) => [l.candidate_id, l.shared_experience || null])
  );

  // IMPORTANTE: Solo devolver candidatos que están TANTO en hyperconnector_candidates
  // COMO en job_candidate_matches (intersección de ambas tablas)
  // Y que tengan un match_score >= 60% (mínimo requerido)
  const MIN_MATCH_SCORE = 60;
  const filteredCandidates = matches.length > 0
    ? (candidates || []).filter((c) => {
        const score = matchByCandidateId.get(c.id);
        return score !== undefined && score >= MIN_MATCH_SCORE;
      })
    : []; // No devolver candidatos si no hay matches

  return filteredCandidates
    .map((c) => ({
      id: c.id,
      full_name: c.full_name,
      current_company: c.current_company,
      current_job_title: c.current_job_title || null,
      country: c.country || null,
      industry: c.industry || null,
      profile_picture_url: c.profile_picture_url || null,
      match_score: matchByCandidateId.get(c.id) || null,
      shared_experience: linkByCandidateId.get(c.id) || null,
    }))
    .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
}

