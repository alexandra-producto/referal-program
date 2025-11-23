import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/src/utils/session";
import { getAppUrl } from "@/src/utils/appUrl";

/**
 * Función compartida para cerrar sesión
 */
async function handleLogout() {
  // Eliminar la cookie de sesión local
  await deleteSession();
  
  // Redirigir directamente a nuestra página de login
  const appUrl = getAppUrl();
  return NextResponse.redirect(new URL("/solicitante/login-simulado", appUrl));
}

/**
 * GET /api/auth/logout
 * Cierra la sesión del usuario y redirige a la página de login
 */
export async function GET(request: NextRequest) {
  try {
    return await handleLogout();
  } catch (error: any) {
    console.error("Error cerrando sesión:", error);
    // Si hay error, al menos redirigir al login
    const appUrl = getAppUrl();
    return NextResponse.redirect(new URL("/solicitante/login-simulado", appUrl));
  }
}

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario y redirige a la página de login
 */
export async function POST(request: NextRequest) {
  try {
    return await handleLogout();
  } catch (error: any) {
    console.error("Error cerrando sesión:", error);
    // Si hay error, al menos redirigir al login
    const appUrl = getAppUrl();
    return NextResponse.redirect(new URL("/solicitante/login-simulado", appUrl));
  }
}

