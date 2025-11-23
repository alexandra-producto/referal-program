import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/src/utils/session";
import { getAppUrl } from "@/src/utils/appUrl";

/**
 * Función compartida para cerrar sesión
 */
async function handleLogout() {
  // Eliminar la cookie de sesión
  await deleteSession();
  
  // Construir URL de logout de LinkedIn
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/solicitante/login-simulado`;
  
  // URL de logout de LinkedIn que redirige de vuelta a nuestra app
  const linkedinLogoutUrl = `https://www.linkedin.com/oauth/v2/logout?redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  // Redirigir a LinkedIn para cerrar sesión allí también
  return NextResponse.redirect(linkedinLogoutUrl);
}

/**
 * GET /api/auth/logout
 * Cierra la sesión del usuario y redirige a LinkedIn para cerrar sesión allí también
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
 * Cierra la sesión del usuario y redirige a LinkedIn para cerrar sesión allí también
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

