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
  // IMPORTANTE: Obtener también match_source para filtrar por fuente != 'auto'
  let matches: any[] = [];
  try {
    const { data: jobMatches, error: matchesError } = await supabase
      .from("job_candidate_matches")
      .select("candidate_id, match_score, match_source")
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
    matches.map((m) => [m.candidate_id, { score: m.match_score, source: m.match_source }])
  );

  // 3) info de candidatos (obtener más campos para el diseño)
  const { data: candidates, error: candidatesError } = await supabase
    .from("candidates")
    .select("id, full_name, current_company, current_job_title, country, industry, profile_picture_url, linkedin_url")
    .in("id", candidateIds);

  if (candidatesError) throw new Error(candidatesError.message);

  // 4) combinamos todo
  const linkByCandidateId = new Map(
    links.map((l) => [l.candidate_id, l.shared_experience || null])
  );

  // IMPORTANTE: Solo devolver candidatos que están TANTO en hyperconnector_candidates
  // COMO en job_candidate_matches (intersección de ambas tablas)
  // Y que cumplan:
  // - match_score >= 20% (mínimo requerido, más permisivo para mostrar candidatos con relación)
  // - match_source != 'auto' (excluir matches automáticos que no se puntuaron bien)
  // Si un candidato tiene relación con el hyperconnector, es más valioso mostrarlo aunque tenga score bajo
  const MIN_MATCH_SCORE = 20; // Bajado de 60 a 20 para ser más permisivo
  const filteredCandidates = matches.length > 0
    ? (candidates || []).filter((c) => {
        const matchData = matchByCandidateId.get(c.id);
        if (!matchData) return false;
        
        const score = matchData.score;
        const source = matchData.source;
        
        // Filtrar: score >= 20 Y source != 'auto'
        // Si tiene relación con hyperconnector, mostrarlo aunque tenga score bajo
        return score !== undefined && score >= MIN_MATCH_SCORE && source !== 'auto';
      })
    : []; // No devolver candidatos si no hay matches

  return filteredCandidates
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
        match_source: matchData?.source || null,
        shared_experience: linkByCandidateId.get(c.id) || null,
      };
    })
    .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
}

