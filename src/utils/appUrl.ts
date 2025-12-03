/**
 * Obtiene la URL base de la aplicación
 * Prioriza el dominio de la request (para dominios personalizados), luego APP_URL, luego VERCEL_URL, luego localhost
 * @param requestUrl - URL opcional de la request para extraer el dominio real
 */
export function getAppUrl(requestUrl?: string): string {
  // Si tenemos una request URL, extraer el dominio de ahí (prioridad máxima para dominios personalizados)
  if (requestUrl) {
    try {
      const url = new URL(requestUrl);
      // Si no es localhost, usar el dominio de la request
      if (!url.hostname.includes("localhost") && !url.hostname.includes("127.0.0.1")) {
        return url.origin;
      }
    } catch (error) {
      console.warn("⚠️ Error parseando requestUrl en getAppUrl:", error);
    }
  }

  // Si está configurado explícitamente APP_URL, usarlo (útil para dominios personalizados)
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  // En Vercel, VERCEL_URL está disponible automáticamente
  // Formato: https://your-app.vercel.app
  // NOTA: Esto solo se usa si no hay requestUrl ni APP_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
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

