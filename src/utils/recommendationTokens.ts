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
        payload: payload.substring(0, 50) + "..."
      });
      return null;
    }
    
    // Verificar que el token no sea muy viejo (opcional: 30 días)
    const timestamp = parseInt(timestampStr, 10);
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días en ms
    if (Date.now() - timestamp > maxAge) return null;
    
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
  const url = baseUrl || getAppUrl();
  const normalizedUrl = normalizeBaseUrl(url);
  const token = generateRecommendationToken(hyperconnectorId, jobId);
  // Asegurar que no haya doble slash
  const cleanUrl = normalizedUrl.replace(/\/$/, "");
  return `${cleanUrl}/recommend/${token}`;
}

