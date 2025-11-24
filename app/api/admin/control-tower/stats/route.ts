import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/db/supabaseClient";

/**
 * GET /api/admin/control-tower/stats
 * Obtiene las estadísticas para el Control Tower
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Total Candidatos: unique candidate_id de hyperconnector_candidates
    const { data: hyperconnectorCandidates, error: hcError } = await supabase
      .from("hyperconnector_candidates")
      .select("candidate_id");

    if (hcError) {
      console.error("Error obteniendo hyperconnector_candidates:", hcError);
    }

    const uniqueCandidateIds = new Set(
      (hyperconnectorCandidates || []).map((hc: any) => hc.candidate_id)
    );
    const totalCandidates = uniqueCandidateIds.size;

    // 2. Solicitudes Activas: jobs con status diferente a 'Recomendación Contratada' o 'Recomendación Cancelada'
    const { data: activeJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id")
      .not("status", "eq", "Recomendación Contratada")
      .not("status", "eq", "Recomendación Cancelada");

    if (jobsError) {
      console.error("Error obteniendo jobs activos:", jobsError);
    }

    const activeJobsCount = activeJobs?.length || 0;

    // 3. Tasa de Match: promedio de match_score de job_candidate_matches
    const { data: matches, error: matchesError } = await supabase
      .from("job_candidate_matches")
      .select("match_score");

    if (matchesError) {
      console.error("Error obteniendo matches:", matchesError);
    }

    let matchRate = 0;
    if (matches && matches.length > 0) {
      const totalScore = matches.reduce(
        (sum: number, match: any) => sum + (parseFloat(match.match_score) || 0),
        0
      );
      matchRate = totalScore / matches.length;
    }

    return NextResponse.json({
      totalCandidates,
      activeJobs: activeJobsCount,
      matchRate,
    });
  } catch (error: any) {
    console.error("Error en GET /api/admin/control-tower/stats:", error);
    return NextResponse.json(
      {
        error: "Error al obtener estadísticas",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

