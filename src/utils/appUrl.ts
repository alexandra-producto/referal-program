/**
 * Obtiene la URL base de la aplicación
 * Prioriza VERCEL_URL en producción, luego APP_URL, luego localhost
 */
export function getAppUrl(): string {
  // En Vercel, VERCEL_URL está disponible automáticamente
  // Formato: https://your-app.vercel.app
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Si está configurado explícitamente APP_URL, usarlo
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  // Fallback a localhost para desarrollo local
  return "http://localhost:3000";
}

/**
 * Normaliza la URL base para asegurar que localhost use http://
 */
export function normalizeBaseUrl(url: string): string {
  if (!url) return "http://localhost:3000";
  
  // Si es localhost, forzar http://
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return url.replace(/^https?:\/\//, "http://");
  }
  
  // Para otras URLs, mantener el protocolo original o usar https:// por defecto
  if (!url.match(/^https?:\/\//)) {
    return `https://${url}`;
  }
  
  return url;
}

