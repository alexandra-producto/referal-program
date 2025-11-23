import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/src/utils/session";
import { getAppUrl } from "@/src/utils/appUrl";

/**
 * Función compartida para cerrar sesión
 */
async function handleLogout() {
  // Eliminar la cookie de sesión local primero
  await deleteSession();
  
  // Construir URL de logout de LinkedIn que cierra la sesión y redirige a nuestra página
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/solicitante/login-simulado`;
  
  // Usar el endpoint de logout de LinkedIn con session_redirect
  // Esto cierra la sesión de LinkedIn y luego redirige a nuestra app
  const linkedinLogoutUrl = `https://www.linkedin.com/uas/logout?session_redirect=${encodeURIComponent(redirectUri)}`;
  
  // Redirigir a LinkedIn para cerrar sesión allí también
  // Cuando el usuario vuelva, LinkedIn le pedirá autorización nuevamente
  return NextResponse.redirect(linkedinLogoutUrl);
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

