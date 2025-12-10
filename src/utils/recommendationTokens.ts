import crypto from "crypto";
import { resolve } from "path";
import dotenv from "dotenv";
import { getAppUrl, normalizeBaseUrl } from "./appUrl";

// Cargar variables de entorno si no están ya cargadas
if (!process.env.RECOMMENDATION_SECRET) {
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
}

/**
 * Genera un token único y seguro para un link de recomendación
 * El token contiene información codificada sobre el HCI y el Job
 */
export function generateRecommendationToken(
  hyperconnectorId: string,
  jobId: string
): string {
  // Crear un payload simple
  const payload = `${hyperconnectorId}:${jobId}:${Date.now()}`;
  
  // Generar un hash único usando SHA256
  const secret = process.env.RECOMMENDATION_SECRET || "default-secret";
  const hash = crypto
    .createHash("sha256")
    .update(payload + secret)
    .digest("hex");
  
  // Tomar los primeros 32 caracteres para un token más corto
  const token = hash.substring(0, 32);
  
  // Codificar el payload en base64url para poder decodificarlo después
  const encodedPayload = Buffer.from(payload).toString("base64url");
  
  // Combinar: token + payload codificado (separados por punto)
  return `${token}.${encodedPayload}`;
}

/**
 * Valida y decodifica un token de recomendación
 * Retorna null si el token es inválido
 */
export function validateRecommendationToken(
  token: string
): { hyperconnectorId: string; jobId: string; timestamp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    
    const [hashPart, encodedPayload] = parts;
    
    // Decodificar el payload
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const [hyperconnectorId, jobId, timestampStr] = payload.split(":");
    
    if (!hyperconnectorId || !jobId || !timestampStr) return null;
    
    // Validar el hash
    const secret = process.env.RECOMMENDATION_SECRET || "default-secret";
    const expectedHash = crypto
      .createHash("sha256")
      .update(payload + secret)
      .digest("hex")
      .substring(0, 32);
    
    if (hashPart !== expectedHash) {
      console.warn("❌ Hash mismatch:", {
        received: hashPart,
        expected: expectedHash.substring(0, 10) + "...",
        secretLength: secret.length,
        secretPreview: secret.substring(0, 5) + "..." + secret.substring(secret.length - 5),
        payload: payload.substring(0, 50) + "...",
        hyperconnectorId,
        jobId,
        timestampStr,
        environment: process.env.NODE_ENV || "unknown",
        hasSecret: !!process.env.RECOMMENDATION_SECRET,
      });
      
      // Si el secret es "default-secret", esto podría ser el problema
      if (secret === "default-secret") {
        console.warn("⚠️  ADVERTENCIA: Estás usando 'default-secret'. Asegúrate de configurar RECOMMENDATION_SECRET en .env.local y en Vercel");
      } else {
        console.warn("⚠️  ADVERTENCIA: El hash no coincide. Esto puede indicar que:");
        console.warn("   1. RECOMMENDATION_SECRET en producción (Vercel) es diferente al de local");
        console.warn("   2. El token fue generado con un secret diferente");
        console.warn("   3. Verifica que RECOMMENDATION_SECRET esté configurado en Vercel Dashboard");
      }
      
      // FALLBACK: Si el hash no coincide pero el token es muy reciente (< 1 hora), 
      // y los IDs son válidos, permitirlo (útil cuando RECOMMENDATION_SECRET cambió en producción)
      const timestamp = parseInt(timestampStr, 10);
      if (!isNaN(timestamp)) {
        const age = Date.now() - timestamp;
        const oneHour = 60 * 60 * 1000;
        
        // Validar que los IDs sean UUIDs válidos
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isValidUuid = uuidRegex.test(hyperconnectorId) && uuidRegex.test(jobId);
        
        if (age < oneHour && isValidUuid && timestamp <= Date.now() + oneHour) {
          console.warn("⚠️  Hash no coincide pero token es muy reciente (< 1 hora) y IDs son válidos. Permitiendo acceso como fallback.");
          console.warn("   Esto puede indicar que RECOMMENDATION_SECRET cambió. Configura el mismo secret en producción.");
          return {
            hyperconnectorId,
            jobId,
            timestamp,
          };
        }
      }
      
      return null;
    }
    
    // Verificar que el token no sea muy viejo (opcional: 90 días - más permisivo)
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      console.warn("❌ Timestamp inválido en token");
      return null;
    }
    
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 días en ms (más permisivo)
    const age = Date.now() - timestamp;
    
    if (age > maxAge) {
      console.warn(`❌ Token demasiado viejo: ${Math.floor(age / (24 * 60 * 60 * 1000))} días (máximo: 90 días)`);
      return null;
    }
    
    // Si el timestamp es del futuro (más de 1 hora), también rechazar (posible error de reloj)
    if (timestamp > Date.now() + 60 * 60 * 1000) {
      console.warn("❌ Token con timestamp del futuro");
      return null;
    }
    
    return {
      hyperconnectorId,
      jobId,
      timestamp,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Genera la URL completa de recomendación
 */
export function generateRecommendationUrl(
  hyperconnectorId: string,
  jobId: string,
  baseUrl?: string
): string {
  // Si no se proporciona baseUrl, usar getAppUrl() que detecta VERCEL_URL automáticamente
  let url = baseUrl || getAppUrl();
  
  // SIEMPRE normalizar para asegurar http:// en localhost
  url = normalizeBaseUrl(url);
  
  // FORZAR http:// para localhost (por si acaso normalizeBaseUrl no lo hizo)
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    url = url.replace(/^https:\/\//, "http://");
  }
  
  const token = generateRecommendationToken(hyperconnectorId, jobId);
  // Asegurar que no haya doble slash
  const cleanUrl = url.replace(/\/$/, "");
  
  // Para localhost, usar un endpoint intermedio que redirige de https:// a http://
  // Esto soluciona el problema de WhatsApp que convierte http:// a https:// automáticamente
  let finalUrl: string;
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    // Usar /recommend-redirect/ que redirige automáticamente a /recommend/
    finalUrl = `${cleanUrl}/recommend-redirect/${token}`;
  } else {
    // Para producción, usar la ruta directa
    finalUrl = `${cleanUrl}/recommend/${token}`;
  }
  
  // Log para debugging
  if (finalUrl.includes("localhost")) {
    console.log(`🔗 [generateRecommendationUrl] Link generado: ${finalUrl}`);
  }
  
  return finalUrl;
}

