import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { getLinkedInAuthUrl } from "@/src/utils/linkedinAuth";

// Next.js carga .env.local automáticamente en rutas API
// Las variables deberían estar disponibles en process.env

const SECRET_KEY = process.env.SESSION_SECRET || process.env.RECOMMENDATION_SECRET || "fallback-secret-key";
const secret = new TextEncoder().encode(SECRET_KEY);

/**
 * GET /api/auth/linkedin
 * Inicia el flujo de OAuth con LinkedIn
 * Query params: role (admin | hyperconnector | solicitante)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");

    if (!role || !["admin", "hyperconnector", "solicitante"].includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido. Debe ser: admin, hyperconnector o solicitante" },
        { status: 400 }
      );
    }

    // Generar state anti-CSRF
    const state = await new SignJWT({ role, timestamp: Date.now() })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("10m") // 10 minutos
      .sign(secret);

    // Guardar state en cookie firmada
    const cookieStore = await cookies();
    // Usar sameSite: "none" y secure: true para que funcione con redirects externos de LinkedIn
    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    cookieStore.set("oauth_state", state, {
      httpOnly: true,
      secure: isProduction, // true en producción/Vercel, false en desarrollo local
      sameSite: isProduction ? "none" : "lax", // "none" requiere secure: true
      maxAge: 600, // 10 minutos
      path: "/",
    });

    // Redirigir a LinkedIn
    // CRÍTICO: LinkedIn usará el redirect_uri que le pasemos para redirigir de vuelta
    // Necesitamos usar el dominio personalizado (referrals.product-latam.com) en lugar de Vercel
    // Extraer el origin de la request para mantener el dominio personalizado
    let baseUrl: string | undefined;
    try {
      if (request.url) {
        const requestUrl = new URL(request.url);
        // Si no es localhost, usar el dominio de la request (puede ser dominio personalizado)
        if (!requestUrl.hostname.includes("localhost") && !requestUrl.hostname.includes("127.0.0.1")) {
          baseUrl = requestUrl.origin;
          console.log("🔗 Usando dominio de la request:", baseUrl);
        }
      }
    } catch (error) {
      console.warn("⚠️ Error parseando request.url:", error);
    }
    
    // Si no tenemos baseUrl de la request, intentar usar APP_URL o VERCEL_URL
    if (!baseUrl) {
      // Priorizar APP_URL si está configurado (debería ser el dominio personalizado)
      if (process.env.APP_URL) {
        baseUrl = process.env.APP_URL;
        console.log("🔗 Usando APP_URL:", baseUrl);
      } else if (process.env.VERCEL_URL) {
        // Fallback a VERCEL_URL solo si no hay APP_URL
        baseUrl = `https://${process.env.VERCEL_URL}`;
        console.log("🔗 Usando VERCEL_URL:", baseUrl);
      }
    }
    
    const authUrl = getLinkedInAuthUrl(state, role, baseUrl);

    console.log("🔗 Iniciando OAuth desde:", baseUrl || "default");
    console.log("🔗 Request URL completa:", request.url);
    console.log("🔗 Request origin:", request.url ? new URL(request.url).origin : "N/A");
    console.log("🔗 Base URL usado para redirect_uri:", baseUrl || "N/A");
    console.log("🔗 LinkedIn Auth URL:", authUrl);

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("Error en /api/auth/linkedin:", error);
    return NextResponse.json(
      { error: "Error al iniciar autenticación con LinkedIn" },
      { status: 500 }
    );
  }
}

