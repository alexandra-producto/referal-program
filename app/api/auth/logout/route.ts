import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/src/utils/session";

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario
 */
export async function POST(request: NextRequest) {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error cerrando sesión:", error);
    return NextResponse.json(
      { error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}

