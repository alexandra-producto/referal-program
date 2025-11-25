import { NextRequest, NextResponse } from 'next/server';
import { validateCreateJobRequest } from '@/src/types/jobCreation';
import { createJobFromCandidate } from '@/src/services/jobCreationService';

/**
 * GET /api/jobs
 * Obtiene los jobs filtrados por owner_candidate_id (opcional)
 * 
 * Query params:
 * - owner_candidate_id: UUID del candidate que creó los jobs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerCandidateId = searchParams.get('owner_candidate_id');

    const { supabase } = await import('@/src/db/supabaseClient');

    let query = supabase.from('jobs').select('*');

    if (ownerCandidateId) {
      query = query.eq('owner_candidate_id', ownerCandidateId);
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.order('created_at', { ascending: false });

    const { data: jobs, error } = await query;

    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return NextResponse.json(
        { error: 'Error fetching jobs', details: error.message },
        { status: 500 }
      );
    }

    // Para cada job, obtener el conteo de recomendaciones
    if (jobs && jobs.length > 0) {
      const jobIds = jobs.map((j: any) => j.id);
      
      const { data: recommendations } = await supabase
        .from('recommendations')
        .select('job_id')
        .in('job_id', jobIds);

      // Contar recomendaciones por job
      const recommendationCounts = new Map<string, number>();
      if (recommendations) {
        recommendations.forEach((r: any) => {
          const count = recommendationCounts.get(r.job_id) || 0;
          recommendationCounts.set(r.job_id, count + 1);
        });
      }

      // Agregar conteo a cada job
      const jobsWithCounts = jobs.map((job: any) => ({
        ...job,
        recommendations_count: recommendationCounts.get(job.id) || 0,
      }));

      return NextResponse.json({ jobs: jobsWithCounts });
    }

    return NextResponse.json({ jobs: [] });
  } catch (error: any) {
    console.error('❌ Error in GET /api/jobs:', error);
    return NextResponse.json(
      {
        error: 'Error fetching jobs',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs
 * Crea un nuevo job desde la UI de "Crear solicitud de rol"
 * 
 * Body esperado:
 * {
 *   jobTitle: string,
 *   description: string,
 *   nonNegotiables: string,
 *   desiredTrajectory: string,
 *   scenario: string,
 *   technicalBackgroundNeeded: boolean,
 *   modality: 'remote' | 'hybrid' | 'onsite',
 *   candidateId: string (ID del candidate logueado)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar el body
    const validation = validateCreateJobRequest(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || 'Invalid request body' },
        { status: 400 }
      );
    }

    // Obtener candidateId del body (puede ser null para admins)
    const candidateId = body.candidateId;
    if (candidateId !== null && (!candidateId || typeof candidateId !== 'string')) {
      return NextResponse.json(
        { error: 'candidateId must be a valid string or null' },
        { status: 400 }
      );
    }

    // Crear el job (si candidateId es null, el servicio debe manejarlo)
    const job = await createJobFromCandidate(candidateId, validation.data);

    return NextResponse.json(
      {
        success: true,
        job,
        message: 'Job created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Error creating job:', error);
    
    // Manejar errores específicos
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error.message?.includes('current_company')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Error creating job',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
