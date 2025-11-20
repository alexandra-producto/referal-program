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
  const value = process.env.LINKEDIN_REDIRECT_URI;
  if (!value) {
    console.error("❌ LINKEDIN_REDIRECT_URI no encontrado en process.env");
    throw new Error("LINKEDIN_REDIRECT_URI no está configurado. Verifica que esté en .env.local");
  }
  return value;
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
 */
export async function getProfile(accessToken: string): Promise<LinkedInProfile | null> {
  try {
    const response = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,vanityName,localizedFirstName,localizedLastName,headline)",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      // Si falla, no es crítico, retornamos null
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn("Error obteniendo perfil adicional de LinkedIn:", error);
    return null;
  }
}

/**
 * Parsea el headline de LinkedIn para extraer current_role y current_company
 */
export function parseHeadline(headline?: string): {
  current_role: string | null;
  current_company: string | null;
} {
  if (!headline) {
    return { current_role: null, current_company: null };
  }

  // Buscar patrón "Role at Company"
  const atMatch = headline.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    return {
      current_role: atMatch[1].trim(),
      current_company: atMatch[2].trim(),
    };
  }

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

