import { NextRequest, NextResponse } from "next/server";
import { generateRecommendationToken } from "../../../../src/utils/recommendationTokens";
import { createRecommendationLink } from "../../../../src/domain/recommendationLinks";

/**
 * POST /api/hyperconnector/generate-token
 * Genera un nuevo token de recomendación para un hyperconnector y job específicos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hyperconnectorId, jobId } = body;

    if (!hyperconnectorId || !jobId) {
      return NextResponse.json(
        { error: "hyperconnectorId y jobId son requeridos" },
        { status: 400 }
      );
    }

    // Generar token
    const token = generateRecommendationToken(hyperconnectorId, jobId);
    
    // Crear registro del link en la BD (opcional, para tracking)
    try {
      await createRecommendationLink(hyperconnectorId, jobId);
    } catch (error) {
      console.warn("⚠️ Could not create recommendation link record:", error);
      // Continuamos aunque falle, el token sigue siendo válido
    }

    return NextResponse.json({
      token,
    });
  } catch (error: any) {
    console.error("Error en POST /api/hyperconnector/generate-token:", error);
    return NextResponse.json(
      {
        error: "Error al generar token",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

