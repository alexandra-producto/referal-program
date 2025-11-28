import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/db/supabaseClient";

/**
 * GET /api/hyperconnector/get-jobs?id=xxx
 * Workaround temporal para rutas dinámicas en Vercel
 * Obtiene los jobs donde el hyperconnector tiene candidatos elegibles
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hyperconnectorId = searchParams.get("id");

  if (!hyperconnectorId) {
    return NextResponse.json(
      { error: "Hyperconnector ID requerido (query parameter 'id')" },
      { status: 400 }
    );
  }

  console.log("🔥 [hyperconnector/get-jobs] handler ejecutado. hyperconnectorId:", hyperconnectorId);

  try {
    // Obtener información del hyperconnector
    const { data: hyperconnector, error: hciError } = await supabase
      .from("hyperconnectors")
      .select("id, full_name")
      .eq("id", hyperconnectorId)
      .maybeSingle();

    if (hciError) {
      console.error("❌ Error obteniendo hyperconnector:", hciError);
      return NextResponse.json(
        {
          jobs: [],
          hyperconnector: null,
          hyperconnectorId,
          message: "No se pudo obtener el hyperconnector",
        },
        { status: 200 }
      );
    }

    if (!hyperconnector) {
      console.warn("⚠️ Hyperconnector no encontrado en la BD:", hyperconnectorId);
      return NextResponse.json(
        {
          jobs: [],
          hyperconnector: null,
          hyperconnectorId,
          message: "Hyperconnector no encontrado",
        },
        { status: 200 }
      );
    }

    // Obtener todos los jobs (sin filtrar por status)
    const { data: allJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, job_title, company_name, description, owner_role_title, owner_candidate_id, status, created_at")
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.error("❌ Error obteniendo jobs:", jobsError);
      return NextResponse.json(
        {
          error: "Error al obtener jobs",
          details: jobsError.message,
        },
        { status: 500 }
      );
    }

    if (!allJobs || allJobs.length === 0) {
      return NextResponse.json({
        jobs: [],
        hyperconnector,
        hyperconnectorId,
      });
    }

    // Filtrar jobs: excluir solo los que tienen status 'hired' o 'all_recommendations_rejected'
    const activeJobs = allJobs.filter(
      (job: any) => job.status !== "hired" && job.status !== "all_recommendations_rejected"
    );

    // Obtener candidatos elegibles para este hyperconnector
    const { data: eligibleCandidates, error: candidatesError } = await supabase
      .from("hyperconnector_candidates")
      .select("candidate_id, job_id")
      .eq("hyperconnector_id", hyperconnectorId);

    if (candidatesError) {
      console.error("❌ Error obteniendo candidatos elegibles:", candidatesError);
      return NextResponse.json(
        {
          error: "Error al obtener candidatos elegibles",
          details: candidatesError.message,
        },
        { status: 500 }
      );
    }

    // Crear un mapa de job_id -> candidatos elegibles
    const candidatesByJob = new Map<string, string[]>();
    (eligibleCandidates || []).forEach((ec: any) => {
      if (!candidatesByJob.has(ec.job_id)) {
        candidatesByJob.set(ec.job_id, []);
      }
      candidatesByJob.get(ec.job_id)!.push(ec.candidate_id);
    });

    // Obtener recomendaciones del hyperconnector para contar
    const { data: recommendations, error: recError } = await supabase
      .from("recommendations")
      .select("id, job_id, candidate_id")
      .eq("hyperconnector_id", hyperconnectorId);

    if (recError) {
      console.error("❌ Error obteniendo recomendaciones:", recError);
    }

    // Crear un mapa de job_id -> número de recomendaciones del hyperconnector
    const recommendationsByJob = new Map<string, number>();
    (recommendations || []).forEach((rec: any) => {
      const count = recommendationsByJob.get(rec.job_id) || 0;
      recommendationsByJob.set(rec.job_id, count + 1);
    });

    // Obtener match scores para cada job-candidate
    const jobIds = activeJobs.map((j: any) => j.id);
    const candidateIds = [...new Set((eligibleCandidates || []).map((ec: any) => ec.candidate_id))];

    const matchScores = new Map<string, number>();
    if (jobIds.length > 0 && candidateIds.length > 0) {
      const { data: matches } = await supabase
        .from("job_candidate_matches")
        .select("job_id, candidate_id, match_score")
        .in("job_id", jobIds)
        .in("candidate_id", candidateIds);

      if (matches) {
        matches.forEach((m: any) => {
          const key = `${m.job_id}-${m.candidate_id}`;
          matchScores.set(key, m.match_score);
        });
      }
    }

    // Obtener información de los candidatos dueños de los jobs
    const ownerCandidateIds = [...new Set(activeJobs.map((j: any) => j.owner_candidate_id).filter(Boolean))];
    const ownerCandidates = new Map<string, any>();
    if (ownerCandidateIds.length > 0) {
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("id, full_name, current_company, email")
        .in("id", ownerCandidateIds);

      if (candidatesData) {
        candidatesData.forEach((c: any) => {
          ownerCandidates.set(c.id, c);
        });
      }
    }

    // Construir la respuesta
    const jobsWithDetails = activeJobs.map((job: any) => {
      const eligibleCandidatesForJob = candidatesByJob.get(job.id) || [];
      const myRecommendationsCount = recommendationsByJob.get(job.id) || 0;

      // Calcular el mejor match score para este job
      let bestMatchScore: number | null = null;
      eligibleCandidatesForJob.forEach((candidateId: string) => {
        const key = `${job.id}-${candidateId}`;
        const score = matchScores.get(key);
        if (score !== undefined && (bestMatchScore === null || score > bestMatchScore)) {
          bestMatchScore = score;
        }
      });

      return {
        id: job.id,
        company_name: job.company_name,
        job_title: job.job_title,
        description: job.description,
        owner_role: job.owner_role_title || null,
        owner_candidate_id: job.owner_candidate_id,
        eligibleCandidatesCount: eligibleCandidatesForJob.length,
        bestMatchScore,
        ownerCandidate: job.owner_candidate_id ? ownerCandidates.get(job.owner_candidate_id) || null : null,
        myRecommendationsCount,
        status: job.status,
      };
    });

    return NextResponse.json({
      jobs: jobsWithDetails,
      hyperconnector,
      hyperconnectorId,
    });
  } catch (error: any) {
    console.error("❌ Error en GET /api/hyperconnector/get-jobs:", error);
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

