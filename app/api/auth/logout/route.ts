import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/src/utils/session";
import { getAppUrl } from "@/src/utils/appUrl";

/**
 * Función compartida para cerrar sesión
 * @param requestUrl - URL opcional de la request para mantener el dominio personalizado
 */
async function handleLogout(requestUrl?: string) {
  // Eliminar la cookie de sesión local
  await deleteSession();
  
  // Redirigir directamente a nuestra página de login
  // Usar el dominio de la request si está disponible (para dominios personalizados)
  const appUrl = getAppUrl(requestUrl);
  return NextResponse.redirect(new URL("/login", appUrl));
}

/**
 * GET /api/auth/logout
 * Cierra la sesión del usuario y redirige a la página de login
 */
export async function GET(request: NextRequest) {
  try {
    return await handleLogout(request.url);
  } catch (error: any) {
    console.error("Error cerrando sesión:", error);
    // Si hay error, al menos redirigir al login
    const appUrl = getAppUrl(request.url);
    return NextResponse.redirect(new URL("/login", appUrl));
  }
}

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario y redirige a la página de login
 */
export async function POST(request: NextRequest) {
  try {
    return await handleLogout(request.url);
  } catch (error: any) {
    console.error("Error cerrando sesión:", error);
    // Si hay error, al menos redirigir al login
    const appUrl = getAppUrl(request.url);
    return NextResponse.redirect(new URL("/login", appUrl));
  }
}

