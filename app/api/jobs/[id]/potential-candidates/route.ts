import { NextRequest, NextResponse } from "next/server";
import { getPotentialCandidatesForJob } from "@/src/domain/potentialCandidates";
import { getJobById } from "@/src/domain/jobs";

/**
 * GET /api/jobs/[id]/potential-candidates
 * Obtiene todos los candidatos potenciales para un job con match >= 40%
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

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

    return NextResponse.json({
      job: {
        id: job.id,
        job_title: job.job_title,
        company_name: job.company_name,
        description: job.description,
      },
      candidates,
      count: candidates.length,
    });
  } catch (error: any) {
    console.error("❌ Error en GET /api/jobs/[id]/potential-candidates:", error);
    return NextResponse.json(
      {
        error: "Error al obtener candidatos potenciales",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

