/**
 * DTO para crear un job desde la UI
 */
export interface CreateJobRequest {
  jobTitle: string;
  description: string;
  nonNegotiables: string;
  desiredTrajectory: string;
  scenario: string;
  technicalBackgroundNeeded: boolean;
  modality: 'remote' | 'hybrid' | 'onsite';
}

/**
 * Estructura del objeto requirements_json que se guarda en la BD
 */
export interface RequirementsJson {
  non_negotiables_text: string;
  desired_trajectory_text: string;
  scenario_text: string;
  needs_technical_background: boolean;
  modality: 'remote' | 'hybrid' | 'onsite';
}

/**
 * Valida el body del request
 */
export function validateCreateJobRequest(body: any): { valid: boolean; error?: string; data?: CreateJobRequest } {
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }

  const { jobTitle, description, nonNegotiables, desiredTrajectory, scenario, technicalBackgroundNeeded, modality } = body;

  // Validar campos requeridos
  if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
    return { valid: false, error: 'jobTitle is required and must be a non-empty string' };
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return { valid: false, error: 'description is required and must be a non-empty string' };
  }

  if (!nonNegotiables || typeof nonNegotiables !== 'string') {
    return { valid: false, error: 'nonNegotiables is required and must be a string' };
  }

  if (!desiredTrajectory || typeof desiredTrajectory !== 'string') {
    return { valid: false, error: 'desiredTrajectory is required and must be a string' };
  }

  if (!scenario || typeof scenario !== 'string') {
    return { valid: false, error: 'scenario is required and must be a string' };
  }

  if (typeof technicalBackgroundNeeded !== 'boolean') {
    return { valid: false, error: 'technicalBackgroundNeeded is required and must be a boolean' };
  }

  if (!modality || !['remote', 'hybrid', 'onsite'].includes(modality)) {
    return { valid: false, error: 'modality is required and must be one of: remote, hybrid, onsite' };
  }

  return {
    valid: true,
    data: {
      jobTitle: jobTitle.trim(),
      description: description.trim(),
      nonNegotiables: nonNegotiables.trim(),
      desiredTrajectory: desiredTrajectory.trim(),
      scenario: scenario.trim(),
      technicalBackgroundNeeded,
      modality,
    },
  };
}

/**
 * Construye el objeto requirements_json a partir del request
 */
export function buildRequirementsJson(request: CreateJobRequest): RequirementsJson {
  return {
    non_negotiables_text: request.nonNegotiables,
    desired_trajectory_text: request.desiredTrajectory,
    scenario_text: request.scenario,
    needs_technical_background: request.technicalBackgroundNeeded,
    modality: request.modality,
  };
}

