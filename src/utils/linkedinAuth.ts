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

function getLinkedInRedirectUri(): string {
  // Si está configurado explícitamente, usarlo
  if (process.env.LINKEDIN_REDIRECT_URI) {
    return process.env.LINKEDIN_REDIRECT_URI;
  }
  
  // Si estamos en Vercel, construir la URL automáticamente
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/auth/linkedin/callback`;
  
  console.log(`🔗 LinkedIn Redirect URI: ${redirectUri}`);
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

/**
 * Genera la URL de autorización de LinkedIn
 */
export function getLinkedInAuthUrl(state: string, role: string): string {
  const clientId = getLinkedInClientId();
  const redirectUri = getLinkedInRedirectUri();

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
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const clientId = getLinkedInClientId();
  const clientSecret = getLinkedInClientSecret();
  const redirectUri = getLinkedInRedirectUri();

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
    console.log("✅ Profile completo obtenido:", {
      id: profile.id,
      headline: profile.headline,
      vanityName: profile.vanityName,
    });
    
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

