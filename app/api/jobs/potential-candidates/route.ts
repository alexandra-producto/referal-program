import { NextRequest, NextResponse } from "next/server";
import { getPotentialCandidatesForJob } from "@/src/domain/potentialCandidates";
import { getJobById } from "@/src/domain/jobs";

/**
 * GET /api/jobs/potential-candidates?job_id=xxx
 * Workaround para rutas dinámicas anidadas en Vercel
 * Obtiene todos los candidatos potenciales para un job con match >= 40%
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("job_id");

  if (!jobId) {
    return NextResponse.json(
      { error: "Missing 'job_id' query parameter" },
      { status: 400 }
    );
  }

  try {
    // Verificar que el job existe
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job no encontrado" },
        { status: 404 }
      );
    }

    // Obtener candidatos potenciales
    const candidates = await getPotentialCandidatesForJob(jobId);

    // Obtener información del owner candidate si existe
    let ownerCandidate = null;
    if (job.owner_candidate_id) {
      const { supabase } = await import("@/src/db/supabaseClient");
      const { data: owner } = await supabase
        .from("candidates")
        .select("id, full_name, current_job_title")
        .eq("id", job.owner_candidate_id)
        .maybeSingle();
      ownerCandidate = owner;
    }

    return NextResponse.json({
      job: {
        id: job.id,
        job_title: job.job_title,
        company_name: job.company_name,
        description: job.description,
        owner_role_title: job.owner_role_title,
        owner_candidate_id: job.owner_candidate_id,
      },
      ownerCandidate: ownerCandidate || null,
      candidates,
      count: candidates.length,
    });
  } catch (error: any) {
    console.error("❌ Error en GET /api/jobs/potential-candidates:", error);
    return NextResponse.json(
      {
        error: "Error al obtener candidatos potenciales",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

