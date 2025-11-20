import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/utils/session";

/**
 * GET /api/auth/session
 * Obtiene la sesión actual del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  } catch (error: any) {
    console.error("Error obteniendo sesión:", error);
    return NextResponse.json(
      { authenticated: false, error: "Error al obtener sesión" },
      { status: 500 }
    );
  }
}

