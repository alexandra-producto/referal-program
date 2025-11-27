import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/src/utils/session";
import { updateRecommendation } from "@/src/domain/recommendations";
import { updateJobStatusFromRecommendations, RecommendationStatus } from "@/src/domain/jobs";

type Params = { id: string };

const ALLOWED_STATUSES: RecommendationStatus[] = [
  "pending",
  "in_review",
  "rejected",
  "contracted",
];

/**
 * PATCH /api/recommendations/[id]/status
 * Actualiza el status de una recomendación y recalcula el status del job.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    console.log("🔄 PATCH /api/recommendations/[id]/status - ID:", id);

    // Verificar sesión y rol
    const session = await getSession();
    console.log("🔍 Sesión:", session ? { role: session.role, userId: session.userId } : "null");
    
    if (!session || (session.role !== "admin" && session.role !== "solicitante")) {
      console.error("❌ No autorizado - Sesión:", session);
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body as { status?: RecommendationStatus };
    console.log("📋 Status recibido:", status);

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      console.error("❌ Status inválido:", status, "Permitidos:", ALLOWED_STATUSES);
      return NextResponse.json(
        {
          error: `Status inválido: "${status}". Valores permitidos: ${ALLOWED_STATUSES.join(", ")}`,
          received: status,
          allowed: ALLOWED_STATUSES,
        },
        { status: 400 }
      );
    }

    console.log("💾 Actualizando recomendación...");
    // Actualizar recomendación (solo el status, updated_at se maneja automáticamente si existe)
    const updated = await updateRecommendation(id, {
      status,
    });

    if (!updated) {
      console.error("❌ No se pudo actualizar la recomendación");
      return NextResponse.json(
        { error: "No se encontró la recomendación o no se pudo actualizar" },
        { status: 404 }
      );
    }

    console.log("✅ Recomendación actualizada:", updated.id, "Status:", updated.status);

    // Recalcular status del job asociado
    if (updated?.job_id) {
      console.log("🔄 Recalculando status del job:", updated.job_id);
      await updateJobStatusFromRecommendations(updated.job_id);
    }

    return NextResponse.json(
      {
        success: true,
        recommendation: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error en PATCH /api/recommendations/[id]/status:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      {
        error: "Error al actualizar el status de la recomendación",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


