import { buildHciEmailMessage } from "../utils/buildHciEmailMessage";
import { sendFlodeskEmail } from "../utils/flodeskClient";
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

  // Enviar el email por Flodesk
  // Flodesk usa workflows, así que pasamos los datos como campos personalizados
  // NOTA: Flodesk limita los custom fields a 256 caracteres y solo tenemos 5 campos disponibles
  // Combinamos variables relacionadas en formato legible para facilitar su uso en el template
  
  // Combinar información del job en formato legible: "Product Manager en Vemo"
  const jobInfo = `${job.role_title} en ${job.company_name}`;
  
  // Combinar información de candidatos en formato legible
  // Limitar la lista a ~220 caracteres para no exceder el límite de 256
  const candidatesNames = candidates.map(c => c.full_name).join(', ');
  const truncatedNames = candidatesNames.length > 220 
    ? candidatesNames.substring(0, 217) + '...' 
    : candidatesNames;
  const candidatesInfo = `${candidates.length} persona(s): ${truncatedNames}`;
  
  const response = await sendFlodeskEmail({
    to: hciEmail.trim(),
    subject,
    htmlBody: html, // Se mantiene para referencia, pero no se envía como custom field
    customFields: {
      // Campo 1: Primer nombre del hyperconnector
      first_name: hci.full_name.split(' ')[0],
      
      // Campo 2: Información del job (formato legible: "Product Manager en Vemo")
      job_info: jobInfo,
      
      // Campo 3: Información de candidatos (formato legible: "3 persona(s): Juan Pérez, María García, ...")
      candidates_info: candidatesInfo,
      
      // Campo 4: URL de recomendación
      recommend_url: recommendUrl,
      
      // Campo 5: Nombre completo del solicitante (opcional, puede usarse para personalización adicional)
      full_name_solicitante: hci.full_name,
    },
  });

  if (!response.success) {
    throw new Error(response.error || "Error al enviar email");
  }

  return { messageId: response.subscriberId, recommendUrl };
}

