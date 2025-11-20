import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/db/supabaseClient';

/**
 * GET /api/jobs/all
 * Obtiene todos los jobs con información del owner candidate y conteo de recomendaciones
 * Para uso del Admin
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener todos los jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError);
      return NextResponse.json(
        { error: 'Error fetching jobs', details: jobsError.message },
        { status: 500 }
      );
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ jobs: [] });
    }

    // Obtener IDs de jobs y owner candidates
    const jobIds = jobs.map((j: any) => j.id);
    const ownerCandidateIds = jobs
      .map((j: any) => j.owner_candidate_id)
      .filter((id: string | null) => id !== null);

    // Obtener información de los owner candidates
    let ownerCandidates: Map<string, any> = new Map();
    if (ownerCandidateIds.length > 0) {
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, full_name, current_company, current_job_title')
        .in('id', ownerCandidateIds);

      if (!candidatesError && candidates) {
        candidates.forEach((c: any) => {
          ownerCandidates.set(c.id, c);
        });
      }
    }

    // Obtener conteo de recomendaciones por job
    const { data: recommendations } = await supabase
      .from('recommendations')
      .select('job_id')
      .in('job_id', jobIds);

    // Contar recomendaciones
    const recommendationCounts = new Map<string, number>();
    if (recommendations) {
      recommendations.forEach((r: any) => {
        const count = recommendationCounts.get(r.job_id) || 0;
        recommendationCounts.set(r.job_id, count + 1);
      });
    }

    // Combinar toda la información
    // El status viene directamente de la tabla jobs
    const jobsWithDetails = jobs.map((job: any) => {
      const ownerCandidate = ownerCandidates.get(job.owner_candidate_id);
      const recommendationsCount = recommendationCounts.get(job.id) || 0;

      return {
        ...job,
        ownerCandidate: ownerCandidate || null,
        recommendations_count: recommendationsCount,
        // El status viene directamente de jobs.status
        // Valores posibles: "Esperando Recomendaciones", "Recomendaciones Recibidas", 
        // "En Proceso Reclutamiento", "Recomendaciones Rechazadas", "Recomendación Contratada"
      };
    });

    return NextResponse.json({ jobs: jobsWithDetails });
  } catch (error: any) {
    console.error('❌ Error in GET /api/jobs/all:', error);
    return NextResponse.json(
      {
        error: 'Error fetching jobs',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

