import { getAppUrl } from "./appUrl";

// Funciones helper para obtener variables de entorno (lazy loading)
// Next.js carga .env.local automáticamente, pero verificamos que estén disponibles
function getLinkedInClientId(): string {
  const value = process.env.LINKEDIN_CLIENT_ID;
  if (!value) {
    console.error("❌ LINKEDIN_CLIENT_ID no encontrado en process.env");
    console.error("Variables disponibles:", Object.keys(process.env).filter(k => k.includes("LINKEDIN")));
    throw new Error("LINKEDIN_CLIENT_ID no está configurado. Verifica que esté en .env.local");
  }
  return value;
}

function getLinkedInClientSecret(): string {
  const value = process.env.LINKEDIN_CLIENT_SECRET;
  if (!value) {
    console.error("❌ LINKEDIN_CLIENT_SECRET no encontrado en process.env");
    throw new Error("LINKEDIN_CLIENT_SECRET no está configurado. Verifica que esté en .env.local");
  }
  return value;
}

function getLinkedInRedirectUri(baseUrl?: string): string {
  // PRIORIDAD 1: Si tenemos un baseUrl de la request (dominio personalizado), usarlo
  // Esto asegura que usemos el dominio personalizado incluso si LINKEDIN_REDIRECT_URI está configurado
  if (baseUrl) {
    try {
      // Si baseUrl ya es una URL completa, extraer el origin
      let origin = baseUrl;
      if (baseUrl.includes("://")) {
        const url = new URL(baseUrl);
        origin = url.origin;
      } else {
        // Si no tiene protocolo, agregarlo
        origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
      }
      
      // Si no es localhost ni vercel.app, usar el dominio de la request (dominio personalizado)
      if (!origin.includes("localhost") && !origin.includes("127.0.0.1") && !origin.includes("vercel.app")) {
        const redirectUri = `${origin}/api/auth/linkedin/callback`;
        console.log(`🔗 LinkedIn Redirect URI (desde baseUrl - dominio personalizado): ${redirectUri}`);
        return redirectUri;
      }
    } catch (error) {
      console.warn("⚠️ Error parseando baseUrl en getLinkedInRedirectUri:", error);
    }
  }
  
  // PRIORIDAD 2: Si está configurado explícitamente APP_URL (dominio personalizado), usarlo
  // APP_URL debería ser el dominio personalizado (referrals.product-latam.com)
  if (process.env.APP_URL) {
    const redirectUri = `${process.env.APP_URL}/api/auth/linkedin/callback`;
    console.log(`🔗 LinkedIn Redirect URI (desde APP_URL - dominio personalizado): ${redirectUri}`);
    return redirectUri;
  }
  
  // PRIORIDAD 3: Si está configurado LINKEDIN_REDIRECT_URI, usarlo
  // NOTA: Esta variable puede estar configurada con el dominio personalizado
  if (process.env.LINKEDIN_REDIRECT_URI) {
    console.log(`🔗 LinkedIn Redirect URI (desde LINKEDIN_REDIRECT_URI): ${process.env.LINKEDIN_REDIRECT_URI}`);
    return process.env.LINKEDIN_REDIRECT_URI;
  }
  
  // PRIORIDAD 4: Fallback a getAppUrl() (puede usar VERCEL_URL)
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/auth/linkedin/callback`;
  
  console.log(`🔗 LinkedIn Redirect URI (fallback - puede ser Vercel): ${redirectUri}`);
  return redirectUri;
}

export interface LinkedInUserInfo {
  sub: string; // LinkedIn ID
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface LinkedInProfile {
  id: string;
  vanityName?: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  headline?: string;
}

export interface LinkedInPosition {
  id: number;
  title?: string;
  companyName?: string;
  isCurrent?: boolean;
  timePeriod?: {
    startDate?: {
      year?: number;
      month?: number;
    };
    endDate?: {
      year?: number;
      month?: number;
    };
  };
}

/**
 * Genera la URL de autorización de LinkedIn
 * @param baseUrl - URL base opcional de la request para usar dominio personalizado
 */
export function getLinkedInAuthUrl(state: string, role: string, baseUrl?: string): string {
  const clientId = getLinkedInClientId();
  const redirectUri = getLinkedInRedirectUri(baseUrl);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state: state,
    prompt: "consent", // Forzar que LinkedIn siempre pida autorización
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Intercambia el código de autorización por un access token
 * @param baseUrl - URL base opcional de la request para usar dominio personalizado
 */
export async function exchangeCodeForToken(code: string, baseUrl?: string): Promise<string> {
  const clientId = getLinkedInClientId();
  const clientSecret = getLinkedInClientSecret();
  const redirectUri = getLinkedInRedirectUri(baseUrl);

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error obteniendo token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Obtiene información del usuario desde LinkedIn usando OpenID Connect
 */
export async function getUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error obteniendo userinfo: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Obtiene la posición actual del usuario desde LinkedIn
 * Usa el endpoint de positions para obtener el título y empresa actual
 */
export async function getCurrentPosition(accessToken: string): Promise<{ title: string | null; companyName: string | null }> {
  console.log("🔍 [getCurrentPosition] Iniciando búsqueda de posición actual...");
  try {
    // Intentar obtener posiciones usando el endpoint de positions
    // Nota: Este endpoint puede requerir permisos adicionales
    console.log("🔍 [getCurrentPosition] Llamando a /v2/me?projection=(id,positions~)");
    const response = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,positions~)",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    console.log("🔍 [getCurrentPosition] Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("⚠️ [getCurrentPosition] Error obteniendo posiciones de LinkedIn:", response.status, errorText);
      
      // Intentar con endpoint alternativo sin projection
      try {
        const altResponse = await fetch(
          "https://api.linkedin.com/v2/positions",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          const positions = altData.elements || [];
          const currentPosition = positions.find((pos: any) => pos.isCurrent === true);
          
          if (currentPosition) {
            const title = currentPosition.title || null;
            const companyName = currentPosition.companyName || null;
            console.log("✅ Posición actual encontrada (endpoint alternativo):", { title, companyName });
            return { title, companyName };
          }
        }
      } catch (altError) {
        console.warn("⚠️ Error en endpoint alternativo de posiciones:", altError);
      }
      
      return { title: null, companyName: null };
    }

    const data = await response.json();
    console.log("🔍 [getCurrentPosition] Datos completos recibidos:", JSON.stringify(data, null, 2));
    
    // La estructura puede variar, intentar diferentes formatos
    const positions = data.positions?.elements || data.positions || [];
    console.log("🔍 [getCurrentPosition] Posiciones encontradas:", positions.length);
    console.log("🔍 [getCurrentPosition] Estructura de posiciones:", JSON.stringify(positions, null, 2));

    // Buscar la posición actual (isCurrent: true)
    const currentPosition = positions.find((pos: any) => pos.isCurrent === true || pos.timePeriod?.endDate === null);
    console.log("🔍 [getCurrentPosition] Posición actual encontrada:", currentPosition ? "Sí" : "No");

    if (currentPosition) {
      console.log("🔍 [getCurrentPosition] Estructura de posición actual:", JSON.stringify(currentPosition, null, 2));
      const title = currentPosition.title || currentPosition.localizedTitle || null;
      const companyName = currentPosition.companyName || currentPosition.company?.localizedName || null;
      console.log("✅ [getCurrentPosition] Posición actual extraída:", { title, companyName });
      return { title, companyName };
    }

    console.log("⚠️ [getCurrentPosition] No se encontró posición actual. Posiciones disponibles:", positions.length);
    if (positions.length > 0) {
      console.log("🔍 [getCurrentPosition] Primera posición (para debugging):", JSON.stringify(positions[0], null, 2));
    }
    return { title: null, companyName: null };
  } catch (error) {
    console.warn("❌ Error obteniendo posición actual de LinkedIn:", error);
    return { title: null, companyName: null };
  }
}

/**
 * Obtiene perfil adicional del usuario (headline, vanityName)
 * Usa la API v2 de LinkedIn para obtener información completa del perfil
 */
export async function getProfile(accessToken: string): Promise<LinkedInProfile | null> {
  try {
    // Intentar obtener el perfil con la proyección completa
    const response = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,vanityName,localizedFirstName,localizedLastName,headline)",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("⚠️ Error obteniendo perfil de LinkedIn:", response.status, errorText);
      
      // Intentar obtener solo el headline desde otro endpoint
      try {
        const headlineResponse = await fetch(
          "https://api.linkedin.com/v2/me?projection=(id,headline)",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );
        
        if (headlineResponse.ok) {
          const headlineData = await headlineResponse.json();
          console.log("✅ Headline obtenido desde endpoint alternativo:", headlineData);
          return headlineData;
        }
      } catch (altError) {
        console.warn("⚠️ Error en endpoint alternativo:", altError);
      }
      
      return null;
    }

    const profile = await response.json();
    console.log("✅ Profile completo obtenido (raw):", JSON.stringify(profile, null, 2));
    console.log("✅ Profile resumido:", {
      id: profile.id,
      headline: profile.headline || "NO HEADLINE",
      vanityName: profile.vanityName || "NO VANITYNAME",
      hasHeadline: !!profile.headline,
      hasVanityName: !!profile.vanityName,
      allKeys: Object.keys(profile),
    });
    
    // Si no hay headline, intentar obtenerlo desde otro endpoint
    if (!profile.headline) {
      console.warn("⚠️ Profile sin headline, intentando obtener desde endpoint alternativo...");
      try {
        const headlineOnlyResponse = await fetch(
          "https://api.linkedin.com/v2/me?projection=(id,headline)",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );
        
        if (headlineOnlyResponse.ok) {
          const headlineData = await headlineOnlyResponse.json();
          if (headlineData.headline) {
            console.log("✅ Headline obtenido desde endpoint alternativo:", headlineData.headline);
            profile.headline = headlineData.headline;
          }
        }
      } catch (altError) {
        console.warn("⚠️ Error obteniendo headline desde endpoint alternativo:", altError);
      }
    }
    
    return profile;
  } catch (error) {
    console.warn("❌ Error obteniendo perfil adicional de LinkedIn:", error);
    return null;
  }
}

/**
 * Parsea el headline de LinkedIn para extraer current_role y current_company
 * Maneja múltiples formatos comunes de LinkedIn headlines
 */
export function parseHeadline(headline?: string): {
  current_role: string | null;
  current_company: string | null;
} {
  if (!headline) {
    console.log("⚠️ No headline provided");
    return { current_role: null, current_company: null };
  }

  console.log("📋 Parsing headline:", headline);

  // Patrón 1: "Role at Company" (más común)
  const atMatch = headline.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    const role = atMatch[1].trim();
    const company = atMatch[2].trim();
    console.log("✅ Matched 'at' pattern:", { role, company });
    return { current_role: role, current_company: company };
  }

  // Patrón 2: "Role | Company"
  const pipeMatch = headline.match(/^(.+?)\s*\|\s*(.+)$/);
  if (pipeMatch) {
    const role = pipeMatch[1].trim();
    const company = pipeMatch[2].trim();
    console.log("✅ Matched '|' pattern:", { role, company });
    return { current_role: role, current_company: company };
  }

  // Patrón 3: "Role en Company" (español)
  const enMatch = headline.match(/^(.+?)\s+en\s+(.+)$/i);
  if (enMatch) {
    const role = enMatch[1].trim();
    const company = enMatch[2].trim();
    console.log("✅ Matched 'en' pattern:", { role, company });
    return { current_role: role, current_company: company };
  }

  // Patrón 4: "Role @ Company"
  const atSymbolMatch = headline.match(/^(.+?)\s+@\s+(.+)$/);
  if (atSymbolMatch) {
    const role = atSymbolMatch[1].trim();
    const company = atSymbolMatch[2].trim();
    console.log("✅ Matched '@' pattern:", { role, company });
    return { current_role: role, current_company: company };
  }

  // Si no coincide con ningún patrón, intentar extraer solo el rol (primera parte antes de cualquier separador)
  const firstPart = headline.split(/[|@]|at|en/i)[0]?.trim();
  if (firstPart && firstPart.length > 0) {
    console.log("⚠️ No pattern matched, using first part as role:", firstPart);
    return { current_role: firstPart, current_company: null };
  }

  console.log("⚠️ Could not parse headline");
  return { current_role: null, current_company: null };
}

/**
 * Construye la URL de LinkedIn del usuario
 */
export function buildLinkedInUrl(vanityName?: string): string | null {
  if (!vanityName) {
    return null;
  }
  return `https://www.linkedin.com/in/${vanityName}`;
}

