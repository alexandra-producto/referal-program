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
  console.log("🔍 [validateRecommendationLink] Validando token...");
  console.log("   RECOMMENDATION_SECRET configurado:", !!process.env.RECOMMENDATION_SECRET);
  console.log("   RECOMMENDATION_SECRET length:", process.env.RECOMMENDATION_SECRET?.length || 0);
  
  // Primero validar el token criptográficamente
  const decoded = validateRecommendationToken(token);
  if (!decoded) {
    console.warn("❌ [validateRecommendationLink] Token criptográficamente inválido");
    console.warn("   Esto puede indicar que RECOMMENDATION_SECRET no coincide o el token está corrupto");
    return null;
  }
  
  console.log("✅ [validateRecommendationLink] Token criptográficamente válido:", {
    hyperconnectorId: decoded.hyperconnectorId,
    jobId: decoded.jobId,
    timestamp: decoded.timestamp,
  });

  // Luego verificar en la BD (si la tabla existe)
  const { data, error } = await supabase
    .from("recommendation_links")
    .select("*")
    .eq("token", token)
    .single();

  if (error) {
    // Si la tabla no existe o hay error, confiar solo en la validación criptográfica
    // Esto permite que los tokens funcionen incluso si no están en la BD
    console.warn("⚠️ recommendation_links table might not exist or error:", error.message);
    console.log("✅ Usando validación criptográfica únicamente");
    return {
      hyperconnectorId: decoded.hyperconnectorId,
      jobId: decoded.jobId,
      timestamp: decoded.timestamp,
    };
  }

  if (!data) {
    // No se encontró en BD, pero el token es criptográficamente válido
    // Permitir que funcione (modo fallback)
    console.warn("⚠️ Token no encontrado en BD, pero es criptográficamente válido. Usando validación criptográfica.");
    return {
      hyperconnectorId: decoded.hyperconnectorId,
      jobId: decoded.jobId,
      timestamp: decoded.timestamp,
    };
  }

  // Verificar que no haya expirado (pero ser más permisivo)
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    console.warn("⚠️ Token expirado en BD, pero verificando validez criptográfica...");
    // Aún así, si el token es criptográficamente válido y no es muy viejo (90 días), permitirlo
    // Esto es más permisivo para casos donde la BD tiene fechas incorrectas o se regeneraron links
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 días (más permisivo)
    const age = Date.now() - decoded.timestamp;
    
    if (age > maxAge) {
      console.error(`❌ Token demasiado viejo: ${Math.floor(age / (24 * 60 * 60 * 1000))} días (máximo: 90 días)`);
      return null;
    }
    
    // Token expirado en BD pero válido criptográficamente y no muy viejo
    console.log(`✅ Token expirado en BD pero válido criptográficamente (${Math.floor(age / (24 * 60 * 60 * 1000))} días), permitiendo acceso`);
    return {
      hyperconnectorId: decoded.hyperconnectorId,
      jobId: decoded.jobId,
      timestamp: decoded.timestamp,
    };
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

