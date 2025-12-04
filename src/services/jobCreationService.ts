import { getCandidateById } from '../domain/candidates';
import { createJob } from '../domain/jobs';
import { CreateJobRequest, buildRequirementsJson } from '../types/jobCreation';
import { supabase } from '../db/supabaseClient';

/**
 * Obtiene el título actual del candidate desde candidate_experience si está disponible
 */
async function getCandidateCurrentTitle(candidateId: string): Promise<string | null> {
  try {
    // Primero intentar obtener desde candidate_experience
    const { data: experienceData } = await supabase
      .from('candidate_experience')
      .select('title')
      .eq('candidate_id', candidateId)
      .eq('is_current', true)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (experienceData?.title) {
      return experienceData.title;
    }

    return null;
  } catch (error) {
    console.warn('Error fetching candidate experience:', error);
    return null;
  }
}

/**
 * Crea un job desde un candidate logueado o desde un admin
 * 
 * @param candidateId - ID del candidate logueado (puede ser null para admins)
 * @param request - Datos del job desde la UI
 * @returns El job creado
 */
export async function createJobFromCandidate(
  candidateId: string | null,
  request: CreateJobRequest
) {
  let companyName: string;
  let ownerRoleTitle: string | null = null;

  // Si candidateId es null (admin), usar valores del request o por defecto
  if (!candidateId) {
    // Para admins, requerir company_name en el request o usar un valor por defecto
    companyName = (request as any).companyName || 'Product Latam';
    ownerRoleTitle = (request as any).ownerRoleTitle || null;
  } else {
    // 1. Buscar el candidate
    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      throw new Error(`Candidate with id ${candidateId} not found`);
    }

    // 2. Obtener company_name del candidate
    companyName = candidate.current_company || 'Product Latam';
    if (!companyName) {
      throw new Error('Candidate must have a current_company to create a job');
    }

    // 3. Obtener owner_role_title (intentar desde current_job_title o candidate_experience)
    ownerRoleTitle = candidate.current_job_title || null;
    
    if (!ownerRoleTitle) {
      ownerRoleTitle = await getCandidateCurrentTitle(candidateId);
    }
  }

  // 4. Calcular remote_ok según la modalidad
  const remoteOk = request.modality === 'remote' || request.modality === 'hybrid';

  // 5. Construir requirements_json
  const requirementsJson = buildRequirementsJson(request);

  // 6. Crear el objeto job
  const jobData: any = {
    company_name: companyName,
    job_title: request.jobTitle,
    job_level: null, // V1: no se usa
    location: null, // V1: no se usa
    remote_ok: remoteOk,
    description: request.description,
    requirements_json: requirementsJson,
    // Estado inicial del job: aún no tiene recomendaciones
    status: 'open_without_recommendations',
    owner_candidate_id: candidateId, // Puede ser null para admins
    owner_role_title: ownerRoleTitle,
  };

  // Agregar start_date si existe
  if (request.startDate) {
    jobData.start_date = request.startDate;
  }

  // Agregar document_url si existe
  if (request.documentUrl) {
    jobData.document_url = request.documentUrl;
  }

  // 7. Crear el job (con matching automático)
  const job = await createJob(jobData, { triggerMatching: true });

  return job;
}

