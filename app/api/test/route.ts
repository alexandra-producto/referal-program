import { NextResponse } from 'next/server';

/**
 * GET /api/test
 * Ruta de prueba para verificar que Vercel está construyendo las rutas API correctamente
 */
export async function GET() {
  return NextResponse.json({ ok: true, message: 'API routes are working!' });
}

