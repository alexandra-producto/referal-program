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
import { upsertUser, updateLastLogin, findUserByLinkedInOrEmail } from "@/src/domain/users";
import { upsertCandidate } from "@/src/domain/candidates";
import { upsertHyperconnector } from "@/src/domain/hyperconnectors";
import { createSession } from "@/src/utils/session";
import { isAdminAuthorized } from "@/src/utils/adminWhitelist";
import { supabase } from "@/src/db/supabaseClient";
import { getAppUrl } from "@/src/utils/appUrl";

// Cargar variables de entorno
if (!process.env.SESSION_SECRET) {
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
}

const SECRET_KEY = process.env.SESSION_SECRET || process.env.RECOMMENDATION_SECRET || "fallback-secret-key";
const secret = new TextEncoder().encode(SECRET_KEY);

/**
 * Helper para construir URLs de redirección de forma segura
 * PRIORIZA siempre la URL del request actual para mantener el mismo dominio (preview/production)
 */
function buildRedirectUrl(path: string, requestUrl?: string): URL {
  try {
    // PRIORIDAD 1: Usar la URL del request actual (siempre tiene el dominio correcto)
    if (requestUrl) {
      const baseUrl = new URL(requestUrl).origin;
      const finalUrl = new URL(path, baseUrl);
      console.log(`🔗 [buildRedirectUrl] Request URL recibida: ${requestUrl}`);
      console.log(`🔗 [buildRedirectUrl] Base URL extraída: ${baseUrl}`);
      console.log(`🔗 [buildRedirectUrl] URL final construida: ${finalUrl.toString()}`);
      return finalUrl;
    }
    
    // PRIORIDAD 2: Intentar obtener del request actual si está disponible en el contexto
    // (Esto es un fallback, pero debería llegar siempre requestUrl)
    
    // PRIORIDAD 3: Usar getAppUrl como último recurso
    const appUrl = getAppUrl();
    const finalUrl = new URL(path, appUrl);
    console.log(`⚠️ [buildRedirectUrl] No se proporcionó requestUrl, usando getAppUrl: ${appUrl}`);
    console.log(`🔗 [buildRedirectUrl] URL final construida: ${finalUrl.toString()}`);
    return finalUrl;
  } catch (error) {
    // Si todo falla, usar localhost
    console.warn("⚠️ Error construyendo URL de redirección, usando localhost:", error);
    return new URL(path, "http://localhost:3000");
  }
}

/**
 * GET /api/auth/linkedin/callback
 * Procesa el callback de LinkedIn OAuth
 */
export async function GET(request: NextRequest) {
  try {
    // Log del request URL para debugging
    const requestOrigin = new URL(request.url).origin;
    console.log(`🔍 [CALLBACK] Request URL: ${request.url}`);
    console.log(`🔍 [CALLBACK] Request Origin: ${requestOrigin}`);
    console.log(`🔍 [CALLBACK] VERCEL_URL env: ${process.env.VERCEL_URL || 'NO DEFINIDO'}`);
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Verificar si LinkedIn retornó un error
    if (error) {
      console.error("Error de LinkedIn:", error);
      return NextResponse.redirect(
        buildRedirectUrl("/solicitante/login-simulado?error=linkedin_auth_failed", request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        buildRedirectUrl("/solicitante/login-simulado?error=missing_params", request.url)
      );
    }

    // Validar state anti-CSRF
    // NOTA:
    // - En Vercel / LinkedIn a veces la cookie oauth_state no llega de vuelta,
    //   lo que provocaba errores "Solicitud inválida" aunque el state fuera correcto.
    // - El state ya es un JWT firmado con SECRET_KEY, así que podemos verificarlo
    //   directamente sin depender de la cookie.
    const cookieStore = await cookies();
    const storedState = cookieStore.get("oauth_state")?.value;

    console.log("🔍 Validando state:", {
      hasStoredState: !!storedState,
      hasStateParam: !!state,
      // Solo comparamos si ambas existen; ya no forzamos error solo por mismatch
      statesMatch: storedState && state ? storedState === state : "skipped",
      storedStateLength: storedState?.length,
      stateParamLength: state?.length,
    });

    // Verificar y decodificar el state para obtener el rol usando SIEMPRE el parámetro state
    let role: string;
    try {
      const { payload } = await jwtVerify(state, secret);
      role = (payload as any).role;
    } catch (error) {
      console.error("❌ Error verificando state JWT:", error);
      return NextResponse.redirect(
        buildRedirectUrl("/solicitante/login-simulado?error=invalid_state", request.url)
      );
    }

    // Limpiar cookie de state si existía
    if (storedState) {
      cookieStore.delete("oauth_state");
    }

    console.log("🔄 Intercambiando código por token...");
    // Intercambiar código por token
    // Usar la URL del request actual para mantener el dominio correcto (preview/production)
    const baseUrl = new URL(request.url).origin;
    let accessToken: string;
    try {
      accessToken = await exchangeCodeForToken(code, baseUrl);
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
      console.log("✅ UserInfo obtenido (raw):", JSON.stringify(userInfo, null, 2));
      console.log("✅ UserInfo resumido:", { 
        email: userInfo.email, 
        sub: userInfo.sub,
        name: userInfo.name,
        picture: userInfo.picture ? "YES" : "NO",
        allKeys: Object.keys(userInfo),
      });
      
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
    let positionTitle: string | null = null;
    let positionCompany: string | null = null;
    try {
      const positionResult = await getCurrentPosition(accessToken);
      positionTitle = positionResult.title;
      positionCompany = positionResult.companyName;
      console.log("📋 Resultado de getCurrentPosition:", { positionTitle, positionCompany });
    } catch (positionError: any) {
      console.warn("⚠️ Error obteniendo posición actual desde LinkedIn API:", positionError.message);
      // Continuar sin posición actual, usaremos el fallback del headline
    }
    
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

    // Verificar si el usuario ya existe en la BD
    // Si el usuario YA EXISTE, NO mostrar el formulario (asumimos que ya tenemos los datos)
    // Solo mostrar formulario a usuarios NUEVOS que no existen en la BD
    const existingUser = await findUserByLinkedInOrEmail(linkedinId, email);
    const isNewUser = !existingUser;
    
    // Solo pedir completar perfil si es un usuario NUEVO y LinkedIn no proporcionó los datos
    let needsProfileCompletion = isNewUser && (!current_job_title || !current_company);
    
    // Si el usuario ya existe, usar los datos de la BD si LinkedIn no los proporcionó
    if (!isNewUser && (!current_job_title || !current_company)) {
      // Usuario existente pero LinkedIn no proporcionó datos, usar datos de BD
      if (existingUser.current_company) {
        current_company = existingUser.current_company;
      }
      if (existingUser.current_job_title) {
        current_job_title = existingUser.current_job_title;
      }
      
      // Si aún faltan, verificar en candidates
      if ((!current_company || !current_job_title) && existingUser.email) {
        const { data: existingCandidate } = await supabase
          .from("candidates")
          .select("current_company, current_job_title")
          .eq("email", existingUser.email)
          .maybeSingle();
        
        if (existingCandidate) {
          if (!current_company && existingCandidate.current_company) {
            current_company = existingCandidate.current_company;
          }
          if (!current_job_title && existingCandidate.current_job_title) {
            current_job_title = existingCandidate.current_job_title;
          }
        }
      }
      
      console.log("✅ Usuario existente, usando datos de BD:", {
        current_company: current_company || "null",
        current_job_title: current_job_title || "null",
        fromUser: !!existingUser.current_company || !!existingUser.current_job_title
      });
    }
    
    if (isNewUser) {
      console.log("📝 Usuario nuevo detectado, needsProfileCompletion:", needsProfileCompletion);
    } else {
      console.log("✅ Usuario existente, NO mostrar formulario de completar perfil");
    }

    // Procesar según el rol
    if (role === "admin") {
      // Validar whitelist
      if (!isAdminAuthorized(email)) {
        return NextResponse.redirect(
          buildRedirectUrl("/solicitante/login-simulado?error=unauthorized_admin", request.url)
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

      // Si falta información del perfil, redirigir a completar perfil
      if (needsProfileCompletion) {
        const redirectUrl = buildRedirectUrl("/auth/complete-profile", request.url);
        console.log(`🔗 [ADMIN] Redirigiendo a completar perfil: ${redirectUrl.toString()}`);
        return NextResponse.redirect(redirectUrl);
      }
      
      const redirectUrl = buildRedirectUrl("/admin/solicitudes", request.url);
      console.log(`🔗 [ADMIN] Redirigiendo a /admin/solicitudes: ${redirectUrl.toString()}`);
      return NextResponse.redirect(redirectUrl);
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

      // Si falta información del perfil, redirigir a completar perfil
      if (needsProfileCompletion) {
        const redirectUrl = buildRedirectUrl("/auth/complete-profile", request.url);
        console.log(`🔗 [SOLICITANTE] Redirigiendo a completar perfil: ${redirectUrl.toString()}`);
        return NextResponse.redirect(redirectUrl);
      }
      
      const redirectUrl = buildRedirectUrl("/solicitante/solicitudes", request.url);
      console.log(`🔗 [SOLICITANTE] Redirigiendo a /solicitante/solicitudes: ${redirectUrl.toString()}`);
      return NextResponse.redirect(redirectUrl);
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

      // Si falta información del perfil, redirigir a completar perfil
      if (needsProfileCompletion) {
        const redirectUrl = buildRedirectUrl("/auth/complete-profile", request.url);
        console.log(`🔗 [HYPERCONNECTOR] Redirigiendo a completar perfil: ${redirectUrl.toString()}`);
        return NextResponse.redirect(redirectUrl);
      }
      
      const redirectUrl = buildRedirectUrl("/hyperconnector/jobs-home", request.url);
      console.log(`🔗 [HYPERCONNECTOR] Redirigiendo a /hyperconnector/jobs-home: ${redirectUrl.toString()}`);
      return NextResponse.redirect(redirectUrl);
    }

    // Rol no reconocido
    return NextResponse.redirect(
      buildRedirectUrl("/solicitante/login-simulado?error=invalid_role", request.url)
    );
  } catch (error: any) {
    console.error("❌ Error en /api/auth/linkedin/callback:", error);
    console.error("Stack:", error.stack);
    
    // Limpiar cookies de sesión y state en caso de error
    try {
      const cookieStore = await cookies();
      cookieStore.delete("oauth_state");
      cookieStore.delete("session");
    } catch (cookieError) {
      console.warn("⚠️ Error limpiando cookies:", cookieError);
    }
    
    // Determinar el tipo de error para mostrar mensaje apropiado
    let errorCode = "auth_error";
    if (error.message?.includes("token")) {
      errorCode = "token_error";
    } else if (error.message?.includes("userinfo")) {
      errorCode = "userinfo_error";
    }
    
    try {
      return NextResponse.redirect(
        buildRedirectUrl(`/solicitante/login-simulado?error=${errorCode}`, request.url)
      );
    } catch (redirectError) {
      // Si incluso la redirección falla, devolver una respuesta de error simple
      console.error("❌ Error crítico en redirección:", redirectError);
      return new NextResponse(
        JSON.stringify({ error: "Error de autenticación. Por favor intenta de nuevo." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}


