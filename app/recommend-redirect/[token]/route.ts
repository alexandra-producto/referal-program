import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint intermedio que redirige de https:// a http:// para localhost
 * Esto soluciona el problema de WhatsApp que convierte http:// a https:// automáticamente
 * 
 * Uso: https://localhost:3000/recommend-redirect/[token] → redirige a → http://localhost:3000/recommend/[token]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  
  // Redirigir a la ruta correcta con http://
  const redirectUrl = `http://localhost:3000/recommend/${token}`;
  
  return NextResponse.redirect(redirectUrl, 307); // 307 = Temporary Redirect
}

