import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";
import dotenv from "dotenv";
import { validateRecommendationLink } from "@/src/domain/recommendationLinks";
import { supabase } from "@/src/db/supabaseClient";

// Asegurar que las variables de entorno estén cargadas
if (!process.env.RECOMMENDATION_SECRET) {
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
}

/**
 * GET /api/hyperconnector/token/[token]/jobs
 * Obtiene los jobs donde el hyperconnector tiene candidatos elegibles
 * 
 * Lógica: Solo mostrar jobs donde:
 * - El hyperconnector tiene candidatos relacionados (hyperconnector_candidates)
 * - Y esos candidatos tienen matches con el job (job_candidate_matches)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    console.log("🔍 Validando token para jobs hub:", token.substring(0, 30) + "...");

    // Validar el token
    const linkData = await validateRecommendationLink(token);
    if (!linkData) {
      console.error("❌ Token inválido o expirado");
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const hyperconnectorId = linkData.hyperconnectorId || (linkData as any).hyperconnector_id;
    
    if (!hyperconnectorId) {
      return NextResponse.json(
        { error: "Token inválido: faltan datos" },
        { status: 401 }
      );
    }

    console.log("✅ Token válido - HCI:", hyperconnectorId);

    // Obtener candidatos relacionados con el hyperconnector
    const { data: hyperconnectorCandidates, error: hciCandidatesError } = await supabase
      .from("hyperconnector_candidates")
      .select("candidate_id")
      .eq("hyperconnector_id", hyperconnectorId);

    if (hciCandidatesError) {
      console.error("❌ Error obteniendo candidatos del hyperconnector:", hciCandidatesError);
      return NextResponse.json(
        { error: "Error al obtener candidatos" },
        { status: 500 }
      );
    }

    if (!hyperconnectorCandidates || hyperconnectorCandidates.length === 0) {
      console.log("⚠️ Hyperconnector no tiene candidatos relacionados");
      return NextResponse.json({
        jobs: [],
        message: "No hay candidatos relacionados con este hyperconnector",
      });
    }

    const candidateIds = hyperconnectorCandidates.map((hc: any) => hc.candidate_id);

    // Obtener jobs que tienen matches con estos candidatos
    const { data: jobMatches, error: matchesError } = await supabase
      .from("job_candidate_matches")
      .select("job_id")
      .in("candidate_id", candidateIds);

    if (matchesError) {
      console.error("❌ Error obteniendo matches:", matchesError);
      return NextResponse.json(
        { error: "Error al obtener matches" },
        { status: 500 }
      );
    }

    if (!jobMatches || jobMatches.length === 0) {
      console.log("⚠️ No hay jobs con matches para estos candidatos");
      return NextResponse.json({
        jobs: [],
        message: "No hay jobs disponibles con candidatos elegibles",
      });
    }

    // Obtener job IDs únicos
    const jobIds = [...new Set(jobMatches.map((jm: any) => jm.job_id))];

    // Obtener información completa de los jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .in("id", jobIds);

    if (jobsError) {
      console.error("❌ Error obteniendo jobs:", jobsError);
      return NextResponse.json(
        { error: "Error al obtener jobs" },
        { status: 500 }
      );
    }

    // Para cada job, obtener el número de candidatos elegibles, el mejor match score y el owner candidate
    const jobsWithDetails = await Promise.all(
      (jobs || []).map(async (job: any) => {
        // Obtener matches para este job con los candidatos del hyperconnector
        const { data: jobMatchesForJob } = await supabase
          .from("job_candidate_matches")
          .select("candidate_id, match_score")
          .eq("job_id", job.id)
          .in("candidate_id", candidateIds);

        const eligibleCandidatesCount = jobMatchesForJob?.length || 0;
        const bestMatchScore = jobMatchesForJob && jobMatchesForJob.length > 0
          ? Math.max(...jobMatchesForJob.map((m: any) => m.match_score))
          : null;

        // Obtener información del owner candidate
        let ownerCandidate = null;
        if (job.owner_candidate_id) {
          const { data: ownerData, error: ownerError } = await supabase
            .from("candidates")
            .select("id, full_name, current_company, email")
            .eq("id", job.owner_candidate_id)
            .maybeSingle();
          
          if (!ownerError && ownerData) {
            ownerCandidate = ownerData;
          }
        }

        return {
          ...job,
          eligibleCandidatesCount,
          bestMatchScore,
          ownerCandidate,
        };
      })
    );

    // Ordenar por mejor match score (descendente)
    jobsWithDetails.sort((a, b) => {
      const scoreA = a.bestMatchScore || 0;
      const scoreB = b.bestMatchScore || 0;
      return scoreB - scoreA;
    });

    console.log(`✅ Encontrados ${jobsWithDetails.length} jobs elegibles`);

    // Obtener información del hyperconnector
    const { data: hyperconnector, error: hciError } = await supabase
      .from("hyperconnectors")
      .select("id, full_name")
      .eq("id", hyperconnectorId)
      .maybeSingle();

    return NextResponse.json({
      jobs: jobsWithDetails,
      hyperconnectorId,
      hyperconnector: hyperconnector || null,
    });
  } catch (error: any) {
    console.error("❌ Error en GET /api/hyperconnector/token/[token]/jobs:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

