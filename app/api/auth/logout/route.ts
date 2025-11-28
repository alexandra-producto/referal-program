import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/src/utils/session";

/**
 * Helper para construir URLs de redirección usando el dominio del request actual
 * Esto asegura que las redirecciones mantengan el mismo dominio (preview/production)
 */
function buildRedirectUrl(path: string, requestUrl: string): URL {
  try {
    const baseUrl = new URL(requestUrl).origin;
    return new URL(path, baseUrl);
  } catch (error) {
    console.warn("⚠️ Error construyendo URL de redirección, usando localhost:", error);
    return new URL(path, "http://localhost:3000");
  }
}

/**
 * Función compartida para cerrar sesión
 */
async function handleLogout(request: NextRequest) {
  // Eliminar la cookie de sesión local
  await deleteSession();
  
  // Redirigir usando el dominio del request actual (mantiene preview/production)
  return NextResponse.redirect(buildRedirectUrl("/solicitante/login-simulado", request.url));
}

/**
 * GET /api/auth/logout
 * Cierra la sesión del usuario y redirige a la página de login
 */
export async function GET(request: NextRequest) {
  try {
    return await handleLogout(request);
  } catch (error: any) {
    console.error("Error cerrando sesión:", error);
    // Si hay error, al menos redirigir al login usando el dominio del request
    return NextResponse.redirect(buildRedirectUrl("/solicitante/login-simulado", request.url));
  }
}

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario y redirige a la página de login
 */
export async function POST(request: NextRequest) {
  try {
    return await handleLogout(request);
  } catch (error: any) {
    console.error("Error cerrando sesión:", error);
    // Si hay error, al menos redirigir al login usando el dominio del request
    return NextResponse.redirect(buildRedirectUrl("/solicitante/login-simulado", request.url));
  }
}

