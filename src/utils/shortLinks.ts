/**
 * Sistema de Short Links para emails
 * Genera links cortos que redirigen a URLs largas con tokens
 */

import { supabase } from "../db/supabaseClient";
import crypto from "crypto";

const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

interface CreateShortLinkOptions {
  targetUrl: string;
  ttlSeconds?: number; // Time to live en segundos (default: 90 días)
  metadata?: Record<string, any>;
}

interface ShortLinkResult {
  code: string;
  shortUrl: string;
  expiresAt: Date;
}

/**
 * Genera un código aleatorio corto en base62
 */
function generateShortCode(length: number = 12): string {
  const bytes = crypto.randomBytes(length);
  let code = "";
  
  for (let i = 0; i < length; i++) {
    code += BASE62_CHARS[bytes[i] % BASE62_CHARS.length];
  }
  
  return code;
}

/**
 * Crea un short link y lo guarda en la base de datos
 * 
 * @param options - Opciones para crear el short link
 * @returns Promise con el código y la URL corta
 */
export async function createShortLink(
  options: CreateShortLinkOptions
): Promise<ShortLinkResult> {
  const { targetUrl, ttlSeconds = 90 * 24 * 60 * 60, metadata } = options;
  
  // Generar código único (intentar hasta 5 veces si hay colisión)
  let code: string;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    code = generateShortCode(12);
    
    // Verificar que no exista
    const { data: existing } = await supabase
      .from("short_links")
      .select("code")
      .eq("code", code)
      .maybeSingle();
    
    if (!existing) {
      break; // Código único encontrado
    }
    
    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error("No se pudo generar un código único después de varios intentos");
    }
  }
  
  if (!code!) {
    throw new Error("Error generando código único");
  }
  
  // Calcular fecha de expiración
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  
  // Guardar en la base de datos
  const { data, error } = await supabase
    .from("short_links")
    .insert({
      code,
      target_url: targetUrl,
      expires_at: expiresAt.toISOString(),
      metadata: metadata || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error("❌ Error creando short link:", error);
    throw new Error(`Error creando short link: ${error.message}`);
  }
  
  // Construir URL corta usando PUBLIC_APP_URL
  // Prioridad: PUBLIC_APP_URL > NEXT_PUBLIC_APP_URL > VERCEL_URL > APP_URL
  let publicAppUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  
  // Si no está configurado, intentar usar VERCEL_URL o APP_URL como fallback
  if (!publicAppUrl) {
    if (process.env.VERCEL_URL) {
      publicAppUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.APP_URL) {
      publicAppUrl = process.env.APP_URL;
    } else {
      // En desarrollo, usar localhost
      publicAppUrl = "http://localhost:3000";
    }
  }
  
  const shortUrl = `${publicAppUrl.replace(/\/$/, "")}/r/${code}`;
  
  console.log(`🔗 [createShortLink] Short link creado: ${shortUrl} -> ${targetUrl}`);
  
  return {
    code: data.code,
    shortUrl,
    expiresAt,
  };
}

/**
 * Resuelve un código corto y retorna la URL destino
 * Opcionalmente marca el link como usado
 * 
 * @param code - Código corto a resolver
 * @param markAsUsed - Si true, marca el link como usado (single-use)
 * @returns Promise con la URL destino o null si no existe/expirado
 */
export async function resolveShortLink(
  code: string,
  markAsUsed: boolean = false
): Promise<{ targetUrl: string; metadata?: any } | null> {
  // Buscar el link
  const { data, error } = await supabase
    .from("short_links")
    .select("target_url, expires_at, used_at, metadata")
    .eq("code", code)
    .maybeSingle();
  
  if (error) {
    console.error("❌ Error resolviendo short link:", error);
    return null;
  }
  
  if (!data) {
    console.log(`❌ Short link no encontrado: ${code}`);
    return null;
  }
  
  // Verificar expiración
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    console.log(`❌ Short link expirado: ${code} (expiró: ${expiresAt.toISOString()})`);
    return null;
  }
  
  // Verificar si ya fue usado (si queremos single-use)
  if (markAsUsed && data.used_at) {
    console.log(`❌ Short link ya fue usado: ${code}`);
    return null;
  }
  
  // Marcar como usado si se solicita
  if (markAsUsed && !data.used_at) {
    await supabase
      .from("short_links")
      .update({ used_at: new Date().toISOString() })
      .eq("code", code);
  }
  
  return {
    targetUrl: data.target_url,
    metadata: data.metadata,
  };
}

/**
 * Genera un short link para una URL de recomendación
 * Esta función es específica para emails
 */
export async function createShortRecommendationLink(
  hyperconnectorId: string,
  jobId: string,
  baseUrl?: string
): Promise<string> {
  // Primero generar la URL larga normal
  const { generateRecommendationUrl } = await import("./recommendationTokens");
  const longUrl = generateRecommendationUrl(hyperconnectorId, jobId, baseUrl);
  
  // Crear short link con metadata
  const { shortUrl } = await createShortLink({
    targetUrl: longUrl,
    ttlSeconds: 90 * 24 * 60 * 60, // 90 días
    metadata: {
      hyperconnector_id: hyperconnectorId,
      job_id: jobId,
      type: "recommendation",
    },
  });
  
  return shortUrl;
}

