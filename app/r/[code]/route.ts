/**
 * Endpoint público para resolver short links
 * GET /r/:code
 * 
 * Resuelve un código corto y redirige a la URL destino
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveShortLink } from "@/src/utils/shortLinks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Código inválido" },
        { status: 400 }
      );
    }
    
    // Resolver el short link (no marcamos como usado para permitir múltiples clicks)
    const result = await resolveShortLink(code, false);
    
    if (!result) {
      // Link no existe o expiró
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Expirado</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      color: #333;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin: 0 0 16px 0;
      font-size: 24px;
      color: #1a1a1a;
    }
    p {
      margin: 0;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Link Expirado</h1>
    <p>Este link ya no está disponible o ha expirado.</p>
  </div>
</body>
</html>`,
        {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }
    
    // Redirigir a la URL destino
    // Si la URL es relativa, convertirla a absoluta usando el host de la request
    let redirectUrl = result.targetUrl;
    if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
      // URL relativa, construir URL absoluta
      const host = request.headers.get("host") || "localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      redirectUrl = `${protocol}://${host}${redirectUrl.startsWith("/") ? "" : "/"}${redirectUrl}`;
    }
    
    return NextResponse.redirect(redirectUrl, {
      status: 302,
    });
    
  } catch (error: any) {
    console.error("❌ Error resolviendo short link:", error);
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

