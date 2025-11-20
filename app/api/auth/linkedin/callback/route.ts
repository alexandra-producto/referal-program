import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";
import dotenv from "dotenv";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import {
  exchangeCodeForToken,
  getUserInfo,
  getProfile,
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

    if (!storedState || storedState !== state) {
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
    } catch (error: any) {
      console.error("❌ Error obteniendo información del usuario:", error);
      throw new Error(`Error obteniendo información de LinkedIn: ${error.message}`);
    }

    // Parsear datos
    const linkedinId = userInfo.sub;
    const email = userInfo.email || userInfo.name?.toLowerCase().replace(/\s+/g, ".") + "@linkedin.com";
    const fullName = userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim() || "Usuario";
    
    console.log("📋 Datos parseados:", { linkedinId, email, fullName });
    
    const { current_role, current_company } = parseHeadline(profile?.headline);
    const linkedinUrl = buildLinkedInUrl(profile?.vanityName);
    
    // Mapear current_role a current_job_title para la tabla users
    const current_job_title = current_role;
    
    console.log("📋 Headline parseado:", { current_job_title, current_company, linkedinUrl });

    // Procesar según el rol
    if (role === "admin") {
      // Validar whitelist
      if (!isAdminAuthorized(email)) {
        return NextResponse.redirect(
          new URL("/solicitante/login-simulado?error=unauthorized_admin", request.url)
        );
      }

      // Upsert user
      const user = await upsertUser({
        email,
        full_name: fullName,
        role: "admin",
        linkedin_id: linkedinId,
        linkedin_url: linkedinUrl,
        current_job_title,
        current_company,
        auth_provider: "linkedin",
        provider_user_id: linkedinId,
      });

      await updateLastLogin(user.id);

      // Crear sesión
      const sessionToken = await createSession({
        userId: user.id,
        role: "admin",
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
      });

      console.log("💾 Paso 3: Creando/actualizando hyperconnector con user_id...");
      // 3. Crear/actualizar HYPERCONNECTOR con user_id y candidate_id
      const hyperconnector = await upsertHyperconnector({
        user_id: user.id,
        email,
        full_name: fullName,
        candidate_id: candidate.id,
        linkedin_url: linkedinUrl,
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

