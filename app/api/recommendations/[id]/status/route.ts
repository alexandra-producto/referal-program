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

    // Verificar cookies disponibles
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    console.log("🔍 Cookie 'session' presente:", !!sessionCookie);
    console.log("🔍 Cookie 'session' value length:", sessionCookie?.value?.length || 0);

    // Verificar sesión y rol
    const session = await getSession();
    console.log("🔍 Sesión obtenida:", session ? { 
      role: session.role, 
      userId: session.userId,
      email: session.email 
    } : "null");
    
    if (!session) {
      console.error("❌ No hay sesión - Cookie presente:", !!sessionCookie);
      return NextResponse.json({ 
        error: "No autorizado - Sesión no encontrada",
        details: "No se pudo obtener la sesión del usuario"
      }, { status: 401 });
    }
    
    if (session.role !== "admin" && session.role !== "solicitante") {
      console.error("❌ Rol no autorizado - Rol:", session.role, "Permitidos: admin, solicitante");
      return NextResponse.json({ 
        error: "No autorizado - Rol no permitido",
        details: `Rol '${session.role}' no tiene permisos. Se requiere 'admin' o 'solicitante'`
      }, { status: 403 });
    }

    const body = await request.json();
    const { status, rejection_reason } = body as { status?: RecommendationStatus; rejection_reason?: string };
    console.log("📋 Status recibido:", status);
    console.log("📋 Rejection reason recibido:", rejection_reason);

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

    // Si el status es "rejected", se requiere una razón
    if (status === "rejected" && (!rejection_reason || rejection_reason.trim() === "")) {
      console.error("❌ Rejection reason requerido para status 'rejected'");
      return NextResponse.json(
        {
          error: "Se requiere una razón de rechazo cuando el status es 'rejected'",
          details: "El campo 'rejection_reason' es obligatorio para rechazar una recomendación",
        },
        { status: 400 }
      );
    }

    console.log("💾 Actualizando recomendación...");
    // Actualizar recomendación (status y rejection_reason si aplica)
    const updateData: any = { status };
    if (status === "rejected" && rejection_reason) {
      updateData.rejection_reason = rejection_reason.trim();
    } else if (status !== "rejected") {
      // Si no es rejected, limpiar la razón de rechazo
      updateData.rejection_reason = null;
    }
    
    const updated = await updateRecommendation(id, updateData);

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


