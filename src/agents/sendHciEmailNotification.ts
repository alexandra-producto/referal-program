import { buildHciEmailMessage } from "../utils/buildHciEmailMessage";
import { sendEmail } from "../utils/emailClient";
import { generateRecommendationUrl } from "../utils/recommendationTokens";
import { getAppUrl } from "../utils/appUrl";

type HciInfo = {
  id: string;
  full_name: string;
  email?: string | null;
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
 * Envía una notificación de email a un hyperconnector sobre un job
 * y los candidatos que podría recomendar.
 * Genera automáticamente un link autorizado único para este HCI y job.
 *
 * @param hciEmail - Email del hyperconnector
 * @param hci - Información del hyperconnector (debe incluir id)
 * @param job - Información del job (debe incluir id)
 * @param candidates - Lista de candidatos recomendables
 * @param baseUrl - URL base de la aplicación (opcional, por defecto usa APP_URL del env)
 * @param owner - Información del owner del job (opcional)
 * @returns Promise con el resultado del envío (incluye el messageId del email)
 */
export async function sendHciEmailNotification(
  hciEmail: string,
  hci: HciInfo,
  job: JobInfo,
  candidates: CandidateInfo[],
  baseUrl?: string,
  owner?: OwnerInfo | null
) {
  // Validar que haya email
  if (!hciEmail || !hciEmail.trim()) {
    throw new Error("Email del hyperconnector es requerido");
  }

  // Generar link autorizado único para este HCI y job
  const recommendUrl = generateRecommendationUrl(hci.id, job.id, baseUrl);
  
  // Obtener baseUrl para la imagen del header
  const appUrl = baseUrl || getAppUrl();

  // Construir el mensaje HTML usando la función existente
  const { subject, html } = buildHciEmailMessage(
    hci,
    job,
    candidates,
    recommendUrl,
    owner,
    appUrl
  );

  // Enviar el email directamente usando Resend
  const response = await sendEmail({
    to: hciEmail.trim(),
    subject,
    html,
  });

  if (!response.success) {
    throw new Error(response.error || "Error al enviar email");
  }

  return { messageId: response.messageId, recommendUrl };
}

