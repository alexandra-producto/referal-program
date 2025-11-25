import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";
import dotenv from "dotenv";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import {
  exchangeCodeForToken,
  getUserInfo,
  getProfile,
  getCurrentPosition,
  parseHeadline,
  buildLinkedInUrl,
} from "@/src/utils/linkedinAuth";
import { upsertUser, updateLastLogin } from "@/src/domain/users";
import { upsertCandidate } from "@/src/domain/candidates";
import { upsertHyperconnector } from "@/src/domain/hyperconnectors";
import { createSession } from "@/src/utils/session";
import { isAdminAuthorized } from "@/src/utils/adminWhitelist";

// Cargar variables de entorno
if (!process.env.SESSION_SECRET) {
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
}

const SECRET_KEY = process.env.SESSION_SECRET || process.env.RECOMMENDATION_SECRET || "fallback-secret-key";
const secret = new TextEncoder().encode(SECRET_KEY);

/**
 * GET /api/auth/linkedin/callback
 * Procesa el callback de LinkedIn OAuth
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Verificar si LinkedIn retornó un error
    if (error) {
      console.error("Error de LinkedIn:", error);
      return NextResponse.redirect(
        new URL("/solicitante/login-simulado?error=linkedin_auth_failed", request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/solicitante/login-simulado?error=missing_params", request.url)
      );
    }

    // Validar state anti-CSRF
    const cookieStore = await cookies();
    const storedState = cookieStore.get("oauth_state")?.value;

    console.log("🔍 Validando state:", {
      hasStoredState: !!storedState,
      hasStateParam: !!state,
      statesMatch: storedState === state,
      storedStateLength: storedState?.length,
      stateParamLength: state?.length,
    });

    if (!storedState || storedState !== state) {
      console.error("❌ State mismatch o cookie no encontrada:", {
        storedState: storedState ? `${storedState.substring(0, 20)}...` : "null",
        stateParam: state ? `${state.substring(0, 20)}...` : "null",
      });
      return NextResponse.redirect(
        new URL("/solicitante/login-simulado?error=invalid_state", request.url)
      );
    }

    // Verificar y decodificar el state para obtener el rol
    let role: string;
    try {
      const { payload } = await jwtVerify(storedState, secret);
      role = (payload as any).role;
    } catch (error) {
      return NextResponse.redirect(
        new URL("/solicitante/login-simulado?error=invalid_state", request.url)
      );
    }

    // Limpiar cookie de state
    cookieStore.delete("oauth_state");

    console.log("🔄 Intercambiando código por token...");
    // Intercambiar código por token
    let accessToken: string;
    try {
      accessToken = await exchangeCodeForToken(code);
      console.log("✅ Token obtenido exitosamente");
      // TEMPORAL: Log del token para testing (eliminar después de obtener el token)
      if (process.env.NODE_ENV === "development") {
        console.log("🔑 ACCESS TOKEN PARA TEST (copiar a .env.local como TEST_LINKEDIN_ACCESS_TOKEN):");
        console.log(accessToken);
      }
    } catch (error: any) {
      console.error("❌ Error intercambiando código por token:", error);
      throw new Error(`Error obteniendo token de LinkedIn: ${error.message}`);
    }

    console.log("🔄 Obteniendo información del usuario...");
    // Obtener información del usuario
    let userInfo: any;
    let profile: any;
    try {
      userInfo = await getUserInfo(accessToken);
      console.log("✅ UserInfo obtenido:", { email: userInfo.email, sub: userInfo.sub });
      
      profile = await getProfile(accessToken);
      console.log("✅ Profile obtenido:", profile ? "Sí" : "No");
      if (profile) {
        console.log("📋 Profile data completo:", JSON.stringify(profile, null, 2));
        console.log("📋 Profile data resumido:", {
          headline: profile.headline || "NO HEADLINE",
          vanityName: profile.vanityName || "NO VANITYNAME",
          firstName: profile.localizedFirstName || "NO FIRSTNAME",
          lastName: profile.localizedLastName || "NO LASTNAME",
          id: profile.id,
        });
      } else {
        console.log("❌ Profile es null - no se pudo obtener");
      }
    } catch (error: any) {
      console.error("❌ Error obteniendo información del usuario:", error);
      throw new Error(`Error obteniendo información de LinkedIn: ${error.message}`);
    }

    // Parsear datos
    const linkedinId = userInfo.sub;
    const email = userInfo.email || userInfo.name?.toLowerCase().replace(/\s+/g, ".") + "@linkedin.com";
    const fullName = userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim() || "Usuario";
    const profilePictureUrl = userInfo.picture || null;
    
    console.log("📋 Datos parseados:", { linkedinId, email, fullName, profilePictureUrl });
    
    // Obtener posición actual directamente de LinkedIn API
    console.log("🔄 Obteniendo posición actual desde LinkedIn API...");
    const { title: positionTitle, companyName: positionCompany } = await getCurrentPosition(accessToken);
    console.log("📋 Resultado de getCurrentPosition:", { positionTitle, positionCompany });
    
    // Si no hay posición actual, intentar parsear del headline como fallback
    let current_job_title = positionTitle;
    let current_company = positionCompany;
    
    if (!current_job_title || !current_company) {
      console.log("⚠️ No se obtuvo posición actual desde positions API, intentando parsear headline como fallback...");
      console.log("📋 Profile headline:", profile?.headline || "NO HEADLINE");
      const { current_role, current_company: headlineCompany } = parseHeadline(profile?.headline);
      console.log("📋 Resultado de parseHeadline:", { current_role, headlineCompany });
      if (!current_job_title && current_role) {
        current_job_title = current_role;
        console.log("✅ Usando current_role del headline como current_job_title");
      }
      if (!current_company && headlineCompany) {
        current_company = headlineCompany;
        console.log("✅ Usando current_company del headline");
      }
    }
    
    const linkedinUrl = buildLinkedInUrl(profile?.vanityName);
    
    console.log("📋 Datos de posición obtenidos:", { 
      fromPositions: { title: positionTitle, companyName: positionCompany },
      final: { current_job_title, current_company },
      linkedinUrl,
      vanityName: profile?.vanityName || "N/A",
      headline: profile?.headline || "N/A"
    });

    // Procesar según el rol
    if (role === "admin") {
      // Validar whitelist
      if (!isAdminAuthorized(email)) {
        return NextResponse.redirect(
          new URL("/solicitante/login-simulado?error=unauthorized_admin", request.url)
        );
      }

      console.log("💾 Paso 1: Creando/actualizando user...");
      console.log("📋 Datos para upsertUser:", {
        email,
        full_name: fullName,
        role: "admin",
        linkedin_id: linkedinId,
        linkedin_url: linkedinUrl,
        current_job_title,
        current_company,
        profile_picture_url: profilePictureUrl,
      });
      // 1. Crear/actualizar USER primero
      const user = await upsertUser({
        email,
        full_name: fullName,
        role: "admin",
        linkedin_id: linkedinId,
        linkedin_url: linkedinUrl,
        current_job_title: current_job_title || null, // Asegurar que sea null si no hay valor
        current_company: current_company || null, // Asegurar que sea null si no hay valor
        profile_picture_url: profilePictureUrl,
        auth_provider: "linkedin",
        provider_user_id: linkedinId,
      });
      console.log("✅ User actualizado:", {
        id: user.id,
        current_job_title: user.current_job_title,
        current_company: user.current_company,
        linkedin_url: user.linkedin_url,
      });

      console.log("💾 Paso 2: Creando/actualizando candidate con user_id...");
      // 2. Crear/actualizar CANDIDATE con user_id (admin también es candidate)
      const candidate = await upsertCandidate({
        user_id: user.id,
        email,
        full_name: fullName,
        current_company: current_company,
        current_job_title: current_job_title,
        linkedin_url: linkedinUrl,
        profile_picture_url: profilePictureUrl,
      });

      await updateLastLogin(user.id);

      // Crear sesión
      const sessionToken = await createSession({
        userId: user.id,
        role: "admin",
        candidateId: candidate.id, // Agregar candidateId para admin también
        email: user.email,
        fullName: user.full_name,
      });

      // Guardar sesión en cookie
      cookieStore.set("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 días
        path: "/",
      });

      return NextResponse.redirect(new URL("/admin/solicitudes", request.url));
    }

    if (role === "solicitante") {
      console.log("💾 Paso 1: Creando/actualizando user...");
      // 1. Crear/actualizar USER primero
      const user = await upsertUser({
        email,
        full_name: fullName,
        role: "solicitante",
        linkedin_id: linkedinId,
        linkedin_url: linkedinUrl,
        current_job_title,
        current_company,
        profile_picture_url: profilePictureUrl,
        auth_provider: "linkedin",
        provider_user_id: linkedinId,
      });

      console.log("💾 Paso 2: Creando/actualizando candidate con user_id...");
      // 2. Crear/actualizar CANDIDATE con user_id
      const candidate = await upsertCandidate({
        user_id: user.id,
        email,
        full_name: fullName,
        current_company: current_company,
        current_job_title: current_job_title,
        linkedin_url: linkedinUrl,
        profile_picture_url: profilePictureUrl,
      });

      await updateLastLogin(user.id);

      // Crear sesión
      const sessionToken = await createSession({
        userId: user.id,
        role: "solicitante",
        candidateId: candidate.id,
        email: user.email,
        fullName: user.full_name,
      });

      // Guardar sesión en cookie
      cookieStore.set("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 días
        path: "/",
      });

      return NextResponse.redirect(new URL("/solicitante/solicitudes", request.url));
    }

    if (role === "hyperconnector") {
      console.log("💾 Paso 1: Creando/actualizando user...");
      // 1. Crear/actualizar USER primero
      const user = await upsertUser({
        email,
        full_name: fullName,
        role: "hyperconnector",
        linkedin_id: linkedinId,
        linkedin_url: linkedinUrl,
        current_job_title,
        current_company,
        profile_picture_url: profilePictureUrl,
        auth_provider: "linkedin",
        provider_user_id: linkedinId,
      });

      console.log("💾 Paso 2: Creando/actualizando candidate con user_id...");
      // 2. Crear/actualizar CANDIDATE con user_id
      const candidate = await upsertCandidate({
        user_id: user.id,
        email,
        full_name: fullName,
        current_company: current_company,
        current_job_title: current_job_title,
        linkedin_url: linkedinUrl,
        profile_picture_url: profilePictureUrl,
      });

      console.log("💾 Paso 3: Creando/actualizando hyperconnector con user_id...");
      // 3. Crear/actualizar HYPERCONNECTOR con user_id y candidate_id
      const hyperconnector = await upsertHyperconnector({
        user_id: user.id,
        email,
        full_name: fullName,
        candidate_id: candidate.id,
        linkedin_url: linkedinUrl,
        current_job_title: current_job_title,
        current_company: current_company,
        profile_picture_url: profilePictureUrl,
      });

      await updateLastLogin(user.id);

      // Crear sesión
      const sessionToken = await createSession({
        userId: user.id,
        role: "hyperconnector",
        candidateId: candidate.id,
        hyperconnectorId: hyperconnector.id,
        email: user.email,
        fullName: user.full_name,
      });

      // Guardar sesión en cookie
      cookieStore.set("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 días
        path: "/",
      });

      return NextResponse.redirect(new URL("/hyperconnector/jobs-home", request.url));
    }

    // Rol no reconocido
    return NextResponse.redirect(
      new URL("/solicitante/login-simulado?error=invalid_role", request.url)
    );
  } catch (error: any) {
    console.error("❌ Error en /api/auth/linkedin/callback:", error);
    console.error("Stack:", error.stack);
    
    // Limpiar cookies de sesión y state en caso de error
    const cookieStore = await cookies();
    cookieStore.delete("oauth_state");
    cookieStore.delete("session");
    
    // Determinar el tipo de error para mostrar mensaje apropiado
    let errorCode = "auth_error";
    if (error.message?.includes("token")) {
      errorCode = "token_error";
    } else if (error.message?.includes("userinfo")) {
      errorCode = "userinfo_error";
    }
    
    return NextResponse.redirect(
      new URL(`/solicitante/login-simulado?error=${errorCode}`, request.url)
    );
  }
}

