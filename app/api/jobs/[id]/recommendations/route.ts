import { NextRequest, NextResponse } from 'next/server';
import { getRecommendationsForJob } from '@/src/domain/recommendations';
import { supabase } from '@/src/db/supabaseClient';

/**
 * GET /api/jobs/[id]/recommendations
 * Obtiene todas las recomendaciones para un job específico
 * Incluye información del candidato recomendado y del hyperconnector que recomendó
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Obtener recomendaciones
    const recommendations = await getRecommendationsForJob(jobId);

    if (!recommendations || recommendations.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Obtener IDs únicos de candidatos e hyperconnectors
    const candidateIds = [...new Set(recommendations.map((r: any) => r.candidate_id).filter(Boolean))];
    const hyperconnectorIds = [...new Set(recommendations.map((r: any) => r.hyperconnector_id).filter(Boolean))];
    
    // Nota: Algunas recomendaciones pueden tener linkedin_url en lugar de candidate_id

    // Obtener información de candidatos
    let candidates: Map<string, any> = new Map();
    if (candidateIds.length > 0) {
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('id, full_name, current_company, current_job_title, email, linkedin_url, profile_picture_url')
        .in('id', candidateIds);

      if (candidatesData) {
        candidatesData.forEach((c: any) => {
          candidates.set(c.id, c);
        });
      }
    }

    // Obtener información de hyperconnectors
    let hyperconnectors: Map<string, any> = new Map();
    if (hyperconnectorIds.length > 0) {
      const { data: hyperconnectorsData } = await supabase
        .from('hyperconnectors')
        .select('id, full_name, email, current_company, current_job_title, linkedin_url, profile_picture_url')
        .in('id', hyperconnectorIds);

      if (hyperconnectorsData) {
        hyperconnectorsData.forEach((h: any) => {
          hyperconnectors.set(h.id, h);
        });
      }
    }

    // Obtener match scores de job_candidate_matches para candidatos recomendados
    const matchScores = new Map<string, number>();
    if (candidateIds.length > 0) {
      const { data: matches } = await supabase
        .from('job_candidate_matches')
        .select('candidate_id, match_score')
        .eq('job_id', jobId)
        .in('candidate_id', candidateIds);

      if (matches) {
        matches.forEach((m: any) => {
          matchScores.set(m.candidate_id, m.match_score);
        });
      }
    }

    // Combinar información
    const recommendationsWithDetails = recommendations.map((rec: any) => {
      const candidate = rec.candidate_id ? candidates.get(rec.candidate_id) : null;
      const hyperconnector = hyperconnectors.get(rec.hyperconnector_id);
      const matchScore = rec.candidate_id ? matchScores.get(rec.candidate_id) : null;

      return {
        ...rec,
        candidate: candidate || null,
        hyperconnector: hyperconnector || null,
        match_score: matchScore || null,
        // Incluir linkedin_url si existe (para recomendaciones personalizadas)
        linkedin_url: rec.linkedin_url || null,
      };
    });

    return NextResponse.json({ recommendations: recommendationsWithDetails });
  } catch (error: any) {
    console.error('❌ Error fetching recommendations:', error);
    return NextResponse.json(
      {
        error: 'Error fetching recommendations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

