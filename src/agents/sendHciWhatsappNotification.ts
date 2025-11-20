import { buildHciWhatsappMessage } from "../utils/buildHciWhatsappMessage";
import { sendWhatsApp } from "../utils/sendWhatsApp";
import { generateRecommendationUrl } from "../utils/recommendationTokens";
import { createRecommendationLink } from "../domain/recommendationLinks";

type HciInfo = {
  id: string;
  full_name: string;
};

type JobInfo = {
  id: string;
  company_name: string;
  role_title: string;
  non_negotiables?: string[] | null;
  requirements_json?: any;
};

type CandidateInfo = {
  full_name: string;
  current_company: string | null;
  fit_score?: number | null;
  shared_experience?: string | null;
};

type OwnerInfo = {
  full_name: string;
};

/**
 * Envía una notificación de WhatsApp a un hyperconnector sobre un job
 * y los candidatos que podría recomendar.
 * Genera automáticamente un link autorizado único para este HCI y job.
 *
 * @param hciPhoneNumber - Número de teléfono del hyperconnector (ej: "+573208631577")
 * @param hci - Información del hyperconnector (debe incluir id)
 * @param job - Información del job (debe incluir id)
 * @param candidates - Lista de candidatos recomendables
 * @param baseUrl - URL base de la aplicación (opcional, por defecto usa APP_URL del env)
 * @param owner - Información del owner del job (opcional)
 * @returns Promise con la respuesta de Twilio (incluye el SID del mensaje)
 */
export async function sendHciWhatsappNotification(
  hciPhoneNumber: string,
  hci: HciInfo,
  job: JobInfo,
  candidates: CandidateInfo[],
  baseUrl?: string,
  owner?: OwnerInfo | null
) {
  // Generar link autorizado único para este HCI y job
  const recommendUrl = generateRecommendationUrl(hci.id, job.id, baseUrl);
  
  // Crear registro del link en la BD (opcional, para tracking)
  try {
    await createRecommendationLink(hci.id, job.id);
  } catch (error) {
    console.warn("⚠️ Could not create recommendation link record:", error);
    // Continuamos aunque falle, el link sigue siendo válido
  }

  // Construir el mensaje usando la función existente
  const message = buildHciWhatsappMessage(hci, job, candidates, recommendUrl, owner);

  // Enviar el mensaje por WhatsApp
  const response = await sendWhatsApp(hciPhoneNumber, message);

  return { ...response, recommendUrl };
}

