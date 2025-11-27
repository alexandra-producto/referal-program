import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/db/supabaseClient";

/**
 * GET /api/hyperconnector/id/[id]/jobs
 * Obtiene los jobs donde el hyperconnector tiene candidatos elegibles
 * Versión sin token, para uso con login directo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hyperconnectorId } = await params;

    if (!hyperconnectorId) {
      return NextResponse.json(
        { error: "Hyperconnector ID requerido" },
        { status: 400 }
      );
    }

    console.log("🔍 Obteniendo jobs para hyperconnector:", hyperconnectorId);

    // Obtener información del hyperconnector
    const { data: hyperconnector, error: hciError } = await supabase
      .from("hyperconnectors")
      .select("id, full_name")
      .eq("id", hyperconnectorId)
      .maybeSingle();

    if (hciError) {
      console.error("❌ Error obteniendo hyperconnector:", hciError);
      // No cortamos con 404 para no romper la UI: devolvemos lista vacía
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
      // En lugar de 404 devolvemos 200 con lista vacía para evitar errores en la UI
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
        hyperconnector,
        hyperconnectorId,
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
      console.log("⚠️ No hay matches para estos candidatos");
      return NextResponse.json({
        jobs: [],
        hyperconnector,
        hyperconnectorId,
        message: "No hay jobs con matches para los candidatos relacionados",
      });
    }

    const jobIds = [...new Set(jobMatches.map((jm: any) => jm.job_id))];

    // Obtener detalles de los jobs
    // Mostrar jobs activos (excluir solo los cerrados/cancelados)
    const { data: allJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, company_name, job_title, description, owner_candidate_id, owner_role_title, status")
      .in("id", jobIds);
    
    if (jobsError) {
      console.error("❌ Error obteniendo jobs:", jobsError);
      return NextResponse.json(
        { error: "Error al obtener jobs" },
        { status: 500 }
      );
    }
    
    // Filtrar jobs activos (excluir contratados - hired y rechazados)
    const jobs = (allJobs || []).filter(
      (job: any) => job.status !== "hired" && job.status !== "all_recommendations_rejected"
    );

    // Para cada job, obtener el mejor match score y contar candidatos elegibles
    const jobsWithDetails = await Promise.all(
      (jobs || []).map(async (job: any) => {
        // Obtener matches para este job con candidatos del hyperconnector
        const { data: matches } = await supabase
          .from("job_candidate_matches")
          .select("match_score, candidate_id")
          .eq("job_id", job.id)
          .in("candidate_id", candidateIds);

        const matchScores = (matches || []).map((m: any) => m.match_score || 0);
        const bestMatchScore = matchScores.length > 0 ? Math.max(...matchScores) : null;
        const eligibleCandidatesCount = matches?.length || 0;

        // Obtener información del owner candidate
        let ownerCandidate = null;
        if (job.owner_candidate_id) {
          const { data: owner } = await supabase
            .from("candidates")
            .select("id, full_name, current_company, email")
            .eq("id", job.owner_candidate_id)
            .maybeSingle();
          ownerCandidate = owner;
        }

        // Obtener conteo de recomendaciones del hyperconnector para este job
        const { data: myRecommendations } = await supabase
          .from("recommendations")
          .select("id")
          .eq("job_id", job.id)
          .eq("hyperconnector_id", hyperconnectorId);

        const myRecommendationsCount = myRecommendations?.length || 0;

        return {
          id: job.id,
          company_name: job.company_name,
          job_title: job.job_title,
          role_title: job.job_title,
          description: job.description,
          owner_role: job.owner_role_title,
          owner_candidate_id: job.owner_candidate_id,
          eligibleCandidatesCount,
          bestMatchScore,
          ownerCandidate,
          myRecommendationsCount,
        };
      })
    );

    console.log(`✅ Encontrados ${jobsWithDetails.length} jobs elegibles`);

    return NextResponse.json({
      jobs: jobsWithDetails,
      hyperconnector,
      hyperconnectorId,
    });
  } catch (error: any) {
    console.error("❌ Error en GET /api/hyperconnector/id/[id]/jobs:", error);
    console.error("❌ Stack trace:", error.stack);
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        message: error.message || "Error desconocido al obtener jobs",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

