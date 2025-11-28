import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/db/supabaseClient";
import { validateRecommendationLink } from "@/src/domain/recommendationLinks";

/**
 * GET /api/hyperconnector/get-jobs-by-token?token=xxx
 * Workaround temporal para rutas dinámicas en Vercel
 * Obtiene los jobs usando un token de recomendación
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token requerido (query parameter 'token')" },
      { status: 400 }
    );
  }

  console.log("🔥 [hyperconnector/get-jobs-by-token] handler ejecutado. token:", token.substring(0, 30) + "...");

  try {
    // Validar el token
    const linkData = await validateRecommendationLink(token);
    if (!linkData) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const { jobId, hyperconnectorId } = linkData;

    // Obtener información del hyperconnector
    const { data: hyperconnector, error: hciError } = await supabase
      .from("hyperconnectors")
      .select("id, full_name")
      .eq("id", hyperconnectorId)
      .maybeSingle();

    if (hciError || !hyperconnector) {
      return NextResponse.json(
        { error: "Hyperconnector no encontrado" },
        { status: 404 }
      );
    }

    // Obtener el job específico
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, job_title, company_name, description, owner_role_title, owner_candidate_id, status, created_at")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job no encontrado" },
        { status: 404 }
      );
    }

    // Obtener candidatos elegibles para este hyperconnector y job
    const { data: eligibleCandidates, error: candidatesError } = await supabase
      .from("hyperconnector_candidates")
      .select("candidate_id")
      .eq("hyperconnector_id", hyperconnectorId)
      .eq("job_id", jobId);

    if (candidatesError) {
      console.error("❌ Error obteniendo candidatos elegibles:", candidatesError);
    }

    // Obtener recomendaciones del hyperconnector para este job
    const { data: recommendations, error: recError } = await supabase
      .from("recommendations")
      .select("id, candidate_id")
      .eq("hyperconnector_id", hyperconnectorId)
      .eq("job_id", jobId);

    if (recError) {
      console.error("❌ Error obteniendo recomendaciones:", recError);
    }

    // Obtener match scores
    const candidateIds = (eligibleCandidates || []).map((ec: any) => ec.candidate_id);
    let bestMatchScore: number | null = null;
    if (candidateIds.length > 0) {
      const { data: matches } = await supabase
        .from("job_candidate_matches")
        .select("candidate_id, match_score")
        .eq("job_id", jobId)
        .in("candidate_id", candidateIds);

      if (matches && matches.length > 0) {
        bestMatchScore = Math.max(...matches.map((m: any) => m.match_score));
      }
    }

    // Obtener información del candidato dueño del job
    let ownerCandidate = null;
    if (job.owner_candidate_id) {
      const { data: candidateData } = await supabase
        .from("candidates")
        .select("id, full_name, current_company, email")
        .eq("id", job.owner_candidate_id)
        .maybeSingle();

      if (candidateData) {
        ownerCandidate = candidateData;
      }
    }

    const jobWithDetails = {
      id: job.id,
      company_name: job.company_name,
      job_title: job.job_title,
      description: job.description,
      owner_role: job.owner_role_title || null,
      owner_candidate_id: job.owner_candidate_id,
      eligibleCandidatesCount: (eligibleCandidates || []).length,
      bestMatchScore,
      ownerCandidate,
      myRecommendationsCount: (recommendations || []).length,
      status: job.status,
    };

    return NextResponse.json({
      jobs: [jobWithDetails],
      hyperconnector,
      hyperconnectorId,
    });
  } catch (error: any) {
    console.error("❌ Error en GET /api/hyperconnector/get-jobs-by-token:", error);
    return NextResponse.json(
      {
        error: "Error al obtener jobs",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

