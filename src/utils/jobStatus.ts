/**
 * Utilidades para manejar los estados de jobs
 */

export type JobStatus =
  | "open_without_recommendations"
  | "open_with_recommendations"
  | "recruitment_process"
  | "all_recommendations_rejected"
  | "hired";

export interface JobStatusConfig {
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  dotColor: string;
}

const STATUS_CONFIG: Record<JobStatus, JobStatusConfig> = {
  open_without_recommendations: {
    label: "Esperando recomendaciones",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    textColor: "text-gray-700",
    dotColor: "bg-gray-500",
  },
  open_with_recommendations: {
    label: "Con recomendaciones",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    textColor: "text-blue-700",
    dotColor: "bg-blue-500",
  },
  recruitment_process: {
    label: "Evaluación en curso",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
    textColor: "text-amber-700",
    dotColor: "bg-amber-500",
  },
  all_recommendations_rejected: {
    label: "Recomendaciones rechazadas",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    dotColor: "bg-red-500",
  },
  hired: {
    label: "Match cerrado ✨",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    textColor: "text-green-700",
    dotColor: "bg-green-500",
  },
};

/**
 * Obtiene la configuración completa de un status
 */
export function getJobStatusConfig(status: string): JobStatusConfig {
  const normalizedStatus = status as JobStatus;
  return STATUS_CONFIG[normalizedStatus] || {
    label: status || "Desconocido",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    textColor: "text-gray-700",
    dotColor: "bg-gray-500",
  };
}

/**
 * Obtiene el label de un status
 */
export function getJobStatusLabel(status: string): string {
  return getJobStatusConfig(status).label;
}

/**
 * Obtiene las clases CSS para el chip de status
 */
export function getJobStatusChipClasses(status: string): string {
  const config = getJobStatusConfig(status);
  return `${config.bgColor} ${config.borderColor} ${config.textColor} border`;
}

/**
 * Obtiene el color del dot de status
 */
export function getJobStatusDotColor(status: string): string {
  return getJobStatusConfig(status).dotColor;
}

