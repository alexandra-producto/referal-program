import { NextRequest, NextResponse } from "next/server";
import { validateRecommendationLink, markRecommendationLinkAsUsed } from "@/src/domain/recommendationLinks";
import { createRecommendation } from "@/src/domain/recommendations";

/**
 * POST /api/recommend/[token]/submit
 * Crea una recomendación para uno o más candidatos
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log("📝 POST /api/recommend/[token]/submit - Token:", token.substring(0, 30) + "...");

    // Validar el token
    const linkData = await validateRecommendationLink(token);
    if (!linkData) {
      console.error("❌ Token inválido o expirado");
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    // linkData puede tener hyperconnectorId/jobId directamente o en propiedades diferentes
    const hyperconnectorId = linkData.hyperconnectorId || (linkData as any).hyperconnector_id;
    const jobId = linkData.jobId || (linkData as any).job_id;
    
    if (!hyperconnectorId || !jobId) {
      console.error("❌ Token inválido: faltan datos", { linkData });
      return NextResponse.json(
        { error: "Token inválido: faltan datos" },
        { status: 401 }
      );
    }

    console.log("✅ Token válido - HCI:", hyperconnectorId, "Job:", jobId);

    // Obtener datos del body
    const body = await request.json();
    const { candidateIds, notes, linkedinUrl } = body;

    console.log("📋 Datos recibidos:", {
      candidateIds: candidateIds?.length || 0,
      hasNotes: !!notes,
      hasLinkedInUrl: !!linkedinUrl,
    });

    // Permitir recomendaciones sin candidatos si hay LinkedIn URL (recomendación personalizada)
    if ((!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) && !linkedinUrl) {
      console.warn("⚠️ No hay candidatos ni LinkedIn URL");
      return NextResponse.json(
        { error: "Debes seleccionar al menos un candidato o proporcionar una URL de LinkedIn" },
        { status: 400 }
      );
    }

    // Crear recomendaciones para cada candidato
    const recommendations = [];
    
    if (candidateIds && candidateIds.length > 0) {
      console.log(`📝 Creando ${candidateIds.length} recomendación(es) para candidatos...`);
      try {
        const candidateRecommendations = await Promise.all(
          candidateIds.map(async (candidateId: string) => {
            console.log(`   - Creando recomendación para candidato: ${candidateId}`);
            const payload = {
              hyperconnector_id: hyperconnectorId,
              job_id: jobId,
              candidate_id: candidateId,
              notes: notes || null,
              status: "pending",
              created_at: new Date().toISOString(),
            };
            console.log("   - Payload:", JSON.stringify(payload, null, 2));
            return await createRecommendation(payload);
          })
        );
        recommendations.push(...candidateRecommendations);
        console.log(`✅ ${candidateRecommendations.length} recomendación(es) creada(s) exitosamente`);
      } catch (candidateError: any) {
        console.error("❌ Error creando recomendaciones para candidatos:", candidateError);
        throw candidateError;
      }
    }

    // Si hay LinkedIn URL, crear una recomendación personalizada
    if (linkedinUrl) {
      console.log("📝 Creando recomendación personalizada con LinkedIn URL...");
      try {
        const customPayload: any = {
          hyperconnector_id: hyperconnectorId,
          job_id: jobId,
          candidate_id: null, // null para recomendaciones personalizadas
          notes: notes || null,
          status: "pending",
          created_at: new Date().toISOString(),
        };
        
        // Solo agregar linkedin_url si el campo existe en la tabla
        // Si no existe, incluiremos la URL en notes
        if (linkedinUrl) {
          customPayload.linkedin_url = linkedinUrl;
        }
        
        console.log("   - Payload:", JSON.stringify(customPayload, null, 2));
        const customRecommendation = await createRecommendation(customPayload);
        recommendations.push(customRecommendation);
        console.log("✅ Recomendación personalizada creada exitosamente");
      } catch (customError: any) {
        console.error("❌ Error creando recomendación personalizada:", customError);
        // Si falla por linkedin_url, intentar sin ese campo
        if (customError.message?.includes("linkedin_url") || customError.message?.includes("column")) {
          console.log("⚠️ Intentando sin linkedin_url, incluyendo en notes...");
          const fallbackPayload = {
            hyperconnector_id: hyperconnectorId,
            job_id: jobId,
            candidate_id: null,
            notes: `${notes || ""}\n\nLinkedIn: ${linkedinUrl}`.trim(),
            status: "pending",
            created_at: new Date().toISOString(),
          };
          const customRecommendation = await createRecommendation(fallbackPayload);
          recommendations.push(customRecommendation);
          console.log("✅ Recomendación personalizada creada (sin linkedin_url)");
        } else {
          throw customError;
        }
      }
    }

    // Marcar el link como usado (opcional, puede fallar si la tabla no existe)
    try {
      await markRecommendationLinkAsUsed(token);
      console.log("✅ Link marcado como usado");
    } catch (markError: any) {
      console.warn("⚠️ No se pudo marcar el link como usado:", markError.message);
      // Continuamos aunque falle
    }

    console.log("✅ Recomendación(es) creada(s) exitosamente:", recommendations.length);
    return NextResponse.json({
      success: true,
      recommendations,
      message: `Recomendación${recommendations.length > 1 ? "es" : ""} creada${recommendations.length > 1 ? "s" : ""} exitosamente`,
    });
  } catch (error: any) {
    console.error("❌ Error en POST /api/recommend/[token]/submit:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Error al crear la recomendación",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

