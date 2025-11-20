module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/Referal MVP/src/utils/linkedinAuth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Funciones helper para obtener variables de entorno (lazy loading)
// Next.js carga .env.local automáticamente, pero verificamos que estén disponibles
__turbopack_context__.s([
    "buildLinkedInUrl",
    ()=>buildLinkedInUrl,
    "exchangeCodeForToken",
    ()=>exchangeCodeForToken,
    "getLinkedInAuthUrl",
    ()=>getLinkedInAuthUrl,
    "getProfile",
    ()=>getProfile,
    "getUserInfo",
    ()=>getUserInfo,
    "parseHeadline",
    ()=>parseHeadline
]);
function getLinkedInClientId() {
    const value = process.env.LINKEDIN_CLIENT_ID;
    if (!value) {
        console.error("❌ LINKEDIN_CLIENT_ID no encontrado en process.env");
        console.error("Variables disponibles:", Object.keys(process.env).filter((k)=>k.includes("LINKEDIN")));
        throw new Error("LINKEDIN_CLIENT_ID no está configurado. Verifica que esté en .env.local");
    }
    return value;
}
function getLinkedInClientSecret() {
    const value = process.env.LINKEDIN_CLIENT_SECRET;
    if (!value) {
        console.error("❌ LINKEDIN_CLIENT_SECRET no encontrado en process.env");
        throw new Error("LINKEDIN_CLIENT_SECRET no está configurado. Verifica que esté en .env.local");
    }
    return value;
}
function getLinkedInRedirectUri() {
    const value = process.env.LINKEDIN_REDIRECT_URI;
    if (!value) {
        console.error("❌ LINKEDIN_REDIRECT_URI no encontrado en process.env");
        throw new Error("LINKEDIN_REDIRECT_URI no está configurado. Verifica que esté en .env.local");
    }
    return value;
}
function getLinkedInAuthUrl(state, role) {
    const clientId = getLinkedInClientId();
    const redirectUri = getLinkedInRedirectUri();
    const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "openid profile email",
        state: state
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}
async function exchangeCodeForToken(code) {
    const clientId = getLinkedInClientId();
    const clientSecret = getLinkedInClientSecret();
    const redirectUri = getLinkedInRedirectUri();
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret
        })
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error obteniendo token: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return data.access_token;
}
async function getUserInfo(accessToken) {
    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error obteniendo userinfo: ${response.status} - ${errorText}`);
    }
    return await response.json();
}
async function getProfile(accessToken) {
    try {
        const response = await fetch("https://api.linkedin.com/v2/me?projection=(id,vanityName,localizedFirstName,localizedLastName,headline)", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            // Si falla, no es crítico, retornamos null
            return null;
        }
        return await response.json();
    } catch (error) {
        console.warn("Error obteniendo perfil adicional de LinkedIn:", error);
        return null;
    }
}
function parseHeadline(headline) {
    if (!headline) {
        return {
            current_role: null,
            current_company: null
        };
    }
    // Buscar patrón "Role at Company"
    const atMatch = headline.match(/^(.+?)\s+at\s+(.+)$/i);
    if (atMatch) {
        return {
            current_role: atMatch[1].trim(),
            current_company: atMatch[2].trim()
        };
    }
    return {
        current_role: null,
        current_company: null
    };
}
function buildLinkedInUrl(vanityName) {
    if (!vanityName) {
        return null;
    }
    return `https://www.linkedin.com/in/${vanityName}`;
}
}),
"[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
;
;
;
// Carga .env.local desde la raíz del proyecto
__TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
    path: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["resolve"])(process.cwd(), ".env.local")
});
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error("SUPABASE_URL:", url);
    console.error("SUPABASE_SERVICE_ROLE_KEY:", key);
    throw new Error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, key);
}),
"[project]/Referal MVP/src/domain/users.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createUser",
    ()=>createUser,
    "findUserByLinkedInOrEmail",
    ()=>findUserByLinkedInOrEmail,
    "getUserById",
    ()=>getUserById,
    "updateLastLogin",
    ()=>updateLastLogin,
    "updateUser",
    ()=>updateUser,
    "upsertUser",
    ()=>upsertUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript)");
;
async function findUserByLinkedInOrEmail(linkedinId, email) {
    if (!linkedinId && !email) {
        return null;
    }
    let query = __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("users").select("*");
    if (linkedinId) {
        query = query.eq("linkedin_id", linkedinId);
    } else if (email) {
        query = query.eq("email", email);
    }
    const { data, error } = await query.maybeSingle();
    if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
    }
    return data || null;
}
async function createUser(userData) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("users").insert({
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
}
async function updateUser(id, updates) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("users").update({
        ...updates,
        updated_at: new Date().toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
}
async function upsertUser(userData) {
    const existing = await findUserByLinkedInOrEmail(userData.linkedin_id || undefined, userData.email || undefined);
    if (existing) {
        return await updateUser(existing.id, userData);
    } else {
        return await createUser(userData);
    }
}
async function getUserById(id) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
}
async function updateLastLogin(userId) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("users").update({
        last_login_at: new Date().toISOString()
    }).eq("id", userId);
}
}),
"[project]/Referal MVP/src/domain/candidates.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createCandidate",
    ()=>createCandidate,
    "deleteCandidate",
    ()=>deleteCandidate,
    "getAllCandidates",
    ()=>getAllCandidates,
    "getCandidateById",
    ()=>getCandidateById,
    "updateCandidate",
    ()=>updateCandidate,
    "upsertCandidate",
    ()=>upsertCandidate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript)");
;
async function getAllCandidates() {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").select("*");
    if (error) throw error;
    return data;
}
async function getCandidateById(id) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
}
async function createCandidate(candidate, options) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").insert(candidate).select().single();
    if (error) throw error;
    // Trigger matching if requested (non-blocking)
    if (options?.triggerMatching && data?.id) {
        // Run asynchronously to not block the insert
        __turbopack_context__.A("[project]/Referal MVP/src/agents/matchJobCandidate.ts [app-route] (ecmascript, async loader)").then(({ matchCandidateWithAllJobs })=>{
            matchCandidateWithAllJobs(data.id).catch((err)=>{
                console.error("Error in background matching after candidate creation:", err);
            });
        }).catch((err)=>{
            console.error("Error loading matching module:", err);
        });
    }
    // Trigger relationship sync (non-blocking)
    if (data?.id) {
        __turbopack_context__.A("[project]/Referal MVP/src/agents/syncHyperconnectorRelationships.ts [app-route] (ecmascript, async loader)").then(({ syncHyperconnectorCandidateRelationshipsForCandidate })=>{
            syncHyperconnectorCandidateRelationshipsForCandidate(data.id).catch((err)=>{
                console.error("Error in background relationship sync after candidate creation:", err);
            });
        }).catch((err)=>{
            console.error("Error loading relationship sync module:", err);
        });
    }
    return data;
}
async function updateCandidate(id, updates) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
}
async function deleteCandidate(id) {
    const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").delete().eq("id", id);
    if (error) throw error;
    return true;
}
async function upsertCandidate(candidateData) {
    // Buscar candidate existente
    let existing = null;
    // Prioridad 1: Buscar por user_id (más confiable)
    if (candidateData.user_id) {
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").select("*").eq("user_id", candidateData.user_id).maybeSingle();
        existing = data;
    }
    // Prioridad 2: Buscar por email si no se encontró por user_id
    if (!existing && candidateData.email) {
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").select("*").eq("email", candidateData.email).maybeSingle();
        existing = data;
    }
    if (existing) {
        // Actualizar
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").update({
            ...candidateData,
            updated_at: new Date().toISOString()
        }).eq("id", existing.id).select().single();
        if (error) throw error;
        return data;
    } else {
        // Crear nuevo
        return await createCandidate(candidateData, {
            triggerMatching: true
        });
    }
}
}),
"[project]/Referal MVP/src/domain/hyperconnectors.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createHyperconnector",
    ()=>createHyperconnector,
    "deleteHyperconnector",
    ()=>deleteHyperconnector,
    "getAllHyperconnectors",
    ()=>getAllHyperconnectors,
    "getHyperconnectorById",
    ()=>getHyperconnectorById,
    "updateHyperconnector",
    ()=>updateHyperconnector,
    "upsertHyperconnector",
    ()=>upsertHyperconnector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript)");
;
async function getAllHyperconnectors() {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").select("*");
    if (error) throw error;
    return data;
}
async function getHyperconnectorById(id) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
}
async function createHyperconnector(hci) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").insert(hci).select().single();
    if (error) throw error;
    // Trigger relationship sync (non-blocking)
    if (data?.id) {
        __turbopack_context__.A("[project]/Referal MVP/src/agents/syncHyperconnectorRelationships.ts [app-route] (ecmascript, async loader)").then(({ syncHyperconnectorCandidateRelationshipsForHyperconnector })=>{
            syncHyperconnectorCandidateRelationshipsForHyperconnector(data.id).catch((err)=>{
                console.error("Error in background relationship sync after hyperconnector creation:", err);
            });
        }).catch((err)=>{
            console.error("Error loading relationship sync module:", err);
        });
    }
    return data;
}
async function updateHyperconnector(id, updates) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
}
async function deleteHyperconnector(id) {
    const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").delete().eq("id", id);
    if (error) throw error;
    return true;
}
async function upsertHyperconnector(hyperconnectorData) {
    // Buscar hyperconnector existente
    let existing = null;
    // Prioridad 1: Buscar por user_id (más confiable)
    if (hyperconnectorData.user_id) {
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").select("*").eq("user_id", hyperconnectorData.user_id).maybeSingle();
        existing = data;
    }
    // Prioridad 2: Buscar por email si no se encontró por user_id
    if (!existing && hyperconnectorData.email) {
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").select("*").eq("email", hyperconnectorData.email).maybeSingle();
        existing = data;
    }
    // Prioridad 3: Buscar por candidate_id si no se encontró por user_id ni email
    if (!existing && hyperconnectorData.candidate_id) {
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").select("*").eq("candidate_id", hyperconnectorData.candidate_id).maybeSingle();
        existing = data;
    }
    if (existing) {
        // Actualizar
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").update({
            ...hyperconnectorData,
            updated_at: new Date().toISOString()
        }).eq("id", existing.id).select().single();
        if (error) throw error;
        return data;
    } else {
        // Crear nuevo
        return await createHyperconnector(hyperconnectorData);
    }
}
}),
"[project]/Referal MVP/src/utils/session.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSession",
    ()=>createSession,
    "deleteSession",
    ()=>deleteSession,
    "getSession",
    ()=>getSession,
    "getSessionFromToken",
    ()=>getSessionFromToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/jose/dist/webapi/jwt/sign.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/jose/dist/webapi/jwt/verify.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
const SECRET_KEY = process.env.SESSION_SECRET || process.env.RECOMMENDATION_SECRET || "fallback-secret-key-change-in-production";
const secret = new TextEncoder().encode(SECRET_KEY);
async function createSession(data) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    const token = await new __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignJWT"]({
        userId: data.userId,
        role: data.role,
        candidateId: data.candidateId,
        hyperconnectorId: data.hyperconnectorId,
        email: data.email,
        fullName: data.fullName
    }).setProtectedHeader({
        alg: "HS256"
    }).setIssuedAt().setExpirationTime(expiresAt).sign(secret);
    return token;
}
async function getSession() {
    try {
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        const token = cookieStore.get("session")?.value;
        if (!token) {
            return null;
        }
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jwtVerify"])(token, secret);
        return {
            userId: payload.userId,
            role: payload.role,
            candidateId: payload.candidateId || null,
            hyperconnectorId: payload.hyperconnectorId || null,
            email: payload.email,
            fullName: payload.fullName
        };
    } catch (error) {
        return null;
    }
}
async function getSessionFromToken(token) {
    try {
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jwtVerify"])(token, secret);
        return {
            userId: payload.userId,
            role: payload.role,
            candidateId: payload.candidateId || null,
            hyperconnectorId: payload.hyperconnectorId || null,
            email: payload.email,
            fullName: payload.fullName
        };
    } catch (error) {
        return null;
    }
}
async function deleteSession() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.delete("session");
}
}),
"[project]/Referal MVP/src/utils/adminWhitelist.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Whitelist de emails autorizados para el rol de admin
 * En producción, esto debería estar en la base de datos o en variables de entorno
 */ __turbopack_context__.s([
    "getAdminEmails",
    ()=>getAdminEmails,
    "isAdminAuthorized",
    ()=>isAdminAuthorized
]);
const ADMIN_EMAILS = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",").map((email)=>email.trim().toLowerCase()) : [
    // Emails por defecto para desarrollo (puedes agregar más)
    "admin@referal.com"
];
function isAdminAuthorized(email) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}
function getAdminEmails() {
    return [
        ...ADMIN_EMAILS
    ];
}
}),
"[project]/Referal MVP/app/api/auth/linkedin/callback/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/jose/dist/webapi/jwt/verify.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$linkedinAuth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/utils/linkedinAuth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/users.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$candidates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/candidates.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$hyperconnectors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/hyperconnectors.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/utils/session.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$adminWhitelist$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/utils/adminWhitelist.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
// Cargar variables de entorno
if (!process.env.SESSION_SECRET) {
    __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
        path: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["resolve"])(process.cwd(), ".env.local")
    });
}
const SECRET_KEY = process.env.SESSION_SECRET || process.env.RECOMMENDATION_SECRET || "fallback-secret-key";
const secret = new TextEncoder().encode(SECRET_KEY);
async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        // Verificar si LinkedIn retornó un error
        if (error) {
            console.error("Error de LinkedIn:", error);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/solicitante/login-simulado?error=linkedin_auth_failed", request.url));
        }
        if (!code || !state) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/solicitante/login-simulado?error=missing_params", request.url));
        }
        // Validar state anti-CSRF
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        const storedState = cookieStore.get("oauth_state")?.value;
        if (!storedState || storedState !== state) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/solicitante/login-simulado?error=invalid_state", request.url));
        }
        // Verificar y decodificar el state para obtener el rol
        let role;
        try {
            const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jwtVerify"])(storedState, secret);
            role = payload.role;
        } catch (error) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/solicitante/login-simulado?error=invalid_state", request.url));
        }
        // Limpiar cookie de state
        cookieStore.delete("oauth_state");
        console.log("🔄 Intercambiando código por token...");
        // Intercambiar código por token
        let accessToken;
        try {
            accessToken = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$linkedinAuth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["exchangeCodeForToken"])(code);
            console.log("✅ Token obtenido exitosamente");
        } catch (error) {
            console.error("❌ Error intercambiando código por token:", error);
            throw new Error(`Error obteniendo token de LinkedIn: ${error.message}`);
        }
        console.log("🔄 Obteniendo información del usuario...");
        // Obtener información del usuario
        let userInfo;
        let profile;
        try {
            userInfo = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$linkedinAuth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserInfo"])(accessToken);
            console.log("✅ UserInfo obtenido:", {
                email: userInfo.email,
                sub: userInfo.sub
            });
            profile = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$linkedinAuth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProfile"])(accessToken);
            console.log("✅ Profile obtenido:", profile ? "Sí" : "No");
        } catch (error) {
            console.error("❌ Error obteniendo información del usuario:", error);
            throw new Error(`Error obteniendo información de LinkedIn: ${error.message}`);
        }
        // Parsear datos
        const linkedinId = userInfo.sub;
        const email = userInfo.email || userInfo.name?.toLowerCase().replace(/\s+/g, ".") + "@linkedin.com";
        const fullName = userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim() || "Usuario";
        console.log("📋 Datos parseados:", {
            linkedinId,
            email,
            fullName
        });
        const { current_role, current_company } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$linkedinAuth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseHeadline"])(profile?.headline);
        const linkedinUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$linkedinAuth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildLinkedInUrl"])(profile?.vanityName);
        // Mapear current_role a current_job_title para la tabla users
        const current_job_title = current_role;
        console.log("📋 Headline parseado:", {
            current_job_title,
            current_company,
            linkedinUrl
        });
        // Procesar según el rol
        if (role === "admin") {
            // Validar whitelist
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$adminWhitelist$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isAdminAuthorized"])(email)) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/solicitante/login-simulado?error=unauthorized_admin", request.url));
            }
            // Upsert user
            const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["upsertUser"])({
                email,
                full_name: fullName,
                role: "admin",
                linkedin_id: linkedinId,
                linkedin_url: linkedinUrl,
                current_job_title,
                current_company,
                auth_provider: "linkedin",
                provider_user_id: linkedinId
            });
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateLastLogin"])(user.id);
            // Crear sesión
            const sessionToken = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createSession"])({
                userId: user.id,
                role: "admin",
                email: user.email,
                fullName: user.full_name
            });
            // Guardar sesión en cookie
            cookieStore.set("session", sessionToken, {
                httpOnly: true,
                secure: ("TURBOPACK compile-time value", "development") === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60,
                path: "/"
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/admin/solicitudes", request.url));
        }
        if (role === "solicitante") {
            console.log("💾 Paso 1: Creando/actualizando user...");
            // 1. Crear/actualizar USER primero
            const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["upsertUser"])({
                email,
                full_name: fullName,
                role: "solicitante",
                linkedin_id: linkedinId,
                linkedin_url: linkedinUrl,
                current_job_title,
                current_company,
                auth_provider: "linkedin",
                provider_user_id: linkedinId
            });
            console.log("💾 Paso 2: Creando/actualizando candidate con user_id...");
            // 2. Crear/actualizar CANDIDATE con user_id
            const candidate = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$candidates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["upsertCandidate"])({
                user_id: user.id,
                email,
                full_name: fullName,
                current_company: current_company,
                current_job_title: current_job_title,
                linkedin_url: linkedinUrl
            });
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateLastLogin"])(user.id);
            // Crear sesión
            const sessionToken = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createSession"])({
                userId: user.id,
                role: "solicitante",
                candidateId: candidate.id,
                email: user.email,
                fullName: user.full_name
            });
            // Guardar sesión en cookie
            cookieStore.set("session", sessionToken, {
                httpOnly: true,
                secure: ("TURBOPACK compile-time value", "development") === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60,
                path: "/"
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/solicitante/solicitudes", request.url));
        }
        if (role === "hyperconnector") {
            console.log("💾 Paso 1: Creando/actualizando user...");
            // 1. Crear/actualizar USER primero
            const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["upsertUser"])({
                email,
                full_name: fullName,
                role: "hyperconnector",
                linkedin_id: linkedinId,
                linkedin_url: linkedinUrl,
                current_job_title,
                current_company,
                auth_provider: "linkedin",
                provider_user_id: linkedinId
            });
            console.log("💾 Paso 2: Creando/actualizando candidate con user_id...");
            // 2. Crear/actualizar CANDIDATE con user_id
            const candidate = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$candidates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["upsertCandidate"])({
                user_id: user.id,
                email,
                full_name: fullName,
                current_company: current_company,
                current_job_title: current_job_title,
                linkedin_url: linkedinUrl
            });
            console.log("💾 Paso 3: Creando/actualizando hyperconnector con user_id...");
            // 3. Crear/actualizar HYPERCONNECTOR con user_id y candidate_id
            const hyperconnector = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$hyperconnectors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["upsertHyperconnector"])({
                user_id: user.id,
                email,
                full_name: fullName,
                candidate_id: candidate.id,
                linkedin_url: linkedinUrl
            });
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateLastLogin"])(user.id);
            // Crear sesión
            const sessionToken = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createSession"])({
                userId: user.id,
                role: "hyperconnector",
                candidateId: candidate.id,
                hyperconnectorId: hyperconnector.id,
                email: user.email,
                fullName: user.full_name
            });
            // Guardar sesión en cookie
            cookieStore.set("session", sessionToken, {
                httpOnly: true,
                secure: ("TURBOPACK compile-time value", "development") === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60,
                path: "/"
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/hyperconnector/jobs-home", request.url));
        }
        // Rol no reconocido
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/solicitante/login-simulado?error=invalid_role", request.url));
    } catch (error) {
        console.error("❌ Error en /api/auth/linkedin/callback:", error);
        console.error("Stack:", error.stack);
        // Limpiar cookies de sesión y state en caso de error
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        cookieStore.delete("oauth_state");
        cookieStore.delete("session");
        // Determinar el tipo de error para mostrar mensaje apropiado
        let errorCode = "auth_error";
        if (error.message?.includes("token")) {
            errorCode = "token_error";
        } else if (error.message?.includes("userinfo")) {
            errorCode = "userinfo_error";
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(`/solicitante/login-simulado?error=${errorCode}`, request.url));
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b27c7e43._.js.map