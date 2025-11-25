import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/src/utils/session";
import { upsertUser } from "@/src/domain/users";
import { upsertCandidate } from "@/src/domain/candidates";
import { upsertHyperconnector } from "@/src/domain/hyperconnectors";
import { findUserByLinkedInOrEmail } from "@/src/domain/users";
import { supabase } from "@/src/db/supabaseClient";

/**
 * POST /api/auth/complete-profile
 * Completa el perfil del usuario con empresa y cargo actual
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "No hay sesión activa" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentCompany, currentJobTitle } = body;

    if (!currentCompany || !currentJobTitle) {
      return NextResponse.json(
        { error: "Empresa y cargo son requeridos" },
        { status: 400 }
      );
    }

    console.log("💾 Completando perfil para usuario:", session.userId, "email:", session.email);

    // 1. Buscar el usuario existente (por userId de la sesión o por email como fallback)
    let existingUser = null;
    
    if (session.userId) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.userId)
        .maybeSingle();
      existingUser = data;
    }
    
    // Fallback: buscar por email si no se encontró por userId
    if (!existingUser) {
      existingUser = await findUserByLinkedInOrEmail(undefined, session.email);
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 2. Actualizar USER
    const updatedUser = await upsertUser({
      email: existingUser.email,
      current_job_title: currentJobTitle.trim(),
      current_company: currentCompany.trim(),
    });

    console.log("✅ User actualizado:", updatedUser.id);

    // 3. Buscar candidate existente por email
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id, user_id")
      .eq("email", session.email)
      .maybeSingle();

    let candidateId: string | null = null;

    if (existingCandidate) {
      // Si existe, actualizarlo y asociar user_id si no lo tiene
      console.log("✅ Candidate existente encontrado:", existingCandidate.id);
      const updatedCandidate = await upsertCandidate({
        user_id: updatedUser.id, // Asegurar que tenga user_id correcto
        email: session.email,
        current_company: currentCompany.trim(),
        current_job_title: currentJobTitle.trim(),
      });
      candidateId = updatedCandidate.id;
      console.log("✅ Candidate actualizado con user_id:", candidateId);
    } else {
      // Si no existe, crearlo
      console.log("📝 Creando nuevo candidate...");
      const newCandidate = await upsertCandidate({
        user_id: updatedUser.id,
        email: session.email,
        full_name: session.fullName,
        current_company: currentCompany.trim(),
        current_job_title: currentJobTitle.trim(),
      });
      candidateId = newCandidate.id;
      console.log("✅ Nuevo candidate creado:", candidateId);
    }

    // 4. Si es hyperconnector, buscar y actualizar/crear hyperconnector
    if (session.role === "hyperconnector") {
      const { data: existingHyperconnector } = await supabase
        .from("hyperconnectors")
        .select("id, user_id, candidate_id")
        .eq("email", session.email)
        .maybeSingle();

      if (existingHyperconnector) {
        // Actualizar existente
        console.log("✅ Hyperconnector existente encontrado:", existingHyperconnector.id);
        await upsertHyperconnector({
          user_id: updatedUser.id, // Asegurar user_id correcto
          candidate_id: candidateId, // Asegurar candidate_id correcto
          email: session.email,
          current_company: currentCompany.trim(),
          current_job_title: currentJobTitle.trim(),
        });
        console.log("✅ Hyperconnector actualizado");
      } else {
        // Crear nuevo
        console.log("📝 Creando nuevo hyperconnector...");
        await upsertHyperconnector({
          user_id: updatedUser.id,
          candidate_id: candidateId,
          email: session.email,
          full_name: session.fullName,
          current_company: currentCompany.trim(),
          current_job_title: currentJobTitle.trim(),
        });
        console.log("✅ Nuevo hyperconnector creado");
      }
    }

    return NextResponse.json({
      success: true,
      message: "Perfil completado exitosamente",
    });
  } catch (error: any) {
    console.error("❌ Error completando perfil:", error);
    return NextResponse.json(
      {
        error: "Error al completar el perfil",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

