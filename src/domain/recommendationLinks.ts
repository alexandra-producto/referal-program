import { supabase } from "../db/supabaseClient";
import { generateRecommendationToken, validateRecommendationToken } from "../utils/recommendationTokens";
import { resolve } from "path";
import dotenv from "dotenv";

// Asegurar que las variables de entorno estén cargadas
if (!process.env.RECOMMENDATION_SECRET) {
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
}

/**
 * Crea un registro de link de recomendación en la base de datos
 * Esto nos permite trackear qué links se han enviado y cuándo
 */
export async function createRecommendationLink(
  hyperconnectorId: string,
  jobId: string
) {
  const token = generateRecommendationToken(hyperconnectorId, jobId);
  
  const { data, error } = await supabase
    .from("recommendation_links")
    .insert({
      hyperconnector_id: hyperconnectorId,
      job_id: jobId,
      token: token,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
    })
    .select()
    .single();

  if (error) {
    // Si la tabla no existe, retornamos solo el token (modo fallback)
    console.warn("⚠️ recommendation_links table might not exist:", error.message);
    return { token };
  }

  return data;
}

/**
 * Valida un token y retorna la información del link
 */
export async function validateRecommendationLink(token: string) {
  // Primero validar el token criptográficamente
  const decoded = validateRecommendationToken(token);
  if (!decoded) return null;

  // Luego verificar en la BD (si la tabla existe)
  const { data, error } = await supabase
    .from("recommendation_links")
    .select("*")
    .eq("token", token)
    .single();

  if (error) {
    // Si la tabla no existe, confiar solo en la validación criptográfica
    console.warn("⚠️ recommendation_links table might not exist:", error.message);
    return decoded;
  }

  if (!data) return null;

  // Verificar que no haya expirado
  if (new Date(data.expires_at) < new Date()) {
    return null;
  }

  return {
    hyperconnectorId: data.hyperconnector_id,
    jobId: data.job_id,
    timestamp: decoded.timestamp,
  };
}

/**
 * Marca un link como usado (opcional, para analytics)
 */
export async function markRecommendationLinkAsUsed(token: string) {
  const { error } = await supabase
    .from("recommendation_links")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  if (error) {
    console.warn("⚠️ Could not mark link as used:", error.message);
  }
}

