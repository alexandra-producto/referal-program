import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../src/db/supabaseClient";

/**
 * GET /api/hyperconnector/by-candidate/[candidateId]
 * Obtiene el hyperconnector asociado a un candidate_id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;

    if (!candidateId) {
      return NextResponse.json(
        { error: "Candidate ID requerido" },
        { status: 400 }
      );
    }

    const { data: hyperconnector, error } = await supabase
      .from("hyperconnectors")
      .select("id, full_name, email, candidate_id")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (error) {
      console.error("❌ Error obteniendo hyperconnector:", error);
      return NextResponse.json(
        { error: "Error al obtener hyperconnector" },
        { status: 500 }
      );
    }

    if (!hyperconnector) {
      return NextResponse.json(
        { error: "No se encontró hyperconnector para este candidate" },
        { status: 404 }
      );
    }

    return NextResponse.json(hyperconnector);
  } catch (error: any) {
    console.error("❌ Error en GET /api/hyperconnector/by-candidate/[candidateId]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

