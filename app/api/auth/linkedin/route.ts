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
    cookieStore.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutos
      path: "/",
    });

    // Redirigir a LinkedIn
    const authUrl = getLinkedInAuthUrl(state, role);

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("Error en /api/auth/linkedin:", error);
    return NextResponse.json(
      { error: "Error al iniciar autenticación con LinkedIn" },
      { status: 500 }
    );
  }
}

