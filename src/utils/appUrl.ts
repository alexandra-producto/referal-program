/**
 * Obtiene la URL base de la aplicación
 * Prioriza VERCEL_URL en producción, luego APP_URL, luego localhost
 * 
 * NOTA: En preview deployments, VERCEL_URL puede no estar disponible o apuntar a producción.
 * Por eso, siempre se debe usar request.url en buildRedirectUrl para mantener el dominio correcto.
 */
export function getAppUrl(): string {
  // En Vercel, VERCEL_URL está disponible automáticamente
  // Formato: https://your-app.vercel.app o preview-referal-program.vercel.app
  // ⚠️ IMPORTANTE: En preview deployments, esto puede no estar configurado correctamente
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log(`🔗 getAppUrl() usando VERCEL_URL: ${url}`);
    return url;
  }

  // Si está configurado explícitamente APP_URL, usarlo
  if (process.env.APP_URL) {
    console.log(`🔗 getAppUrl() usando APP_URL: ${process.env.APP_URL}`);
    return process.env.APP_URL;
  }

  // Fallback a localhost para desarrollo local
  console.log(`🔗 getAppUrl() usando fallback localhost`);
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

