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
"[project]/Referal MVP/src/utils/recommendationTokens.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateRecommendationToken",
    ()=>generateRecommendationToken,
    "generateRecommendationUrl",
    ()=>generateRecommendationUrl,
    "validateRecommendationToken",
    ()=>validateRecommendationToken
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
;
;
;
// Cargar variables de entorno si no están ya cargadas
if (!process.env.RECOMMENDATION_SECRET) {
    __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
        path: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["resolve"])(process.cwd(), ".env.local")
    });
}
function generateRecommendationToken(hyperconnectorId, jobId) {
    // Crear un payload simple
    const payload = `${hyperconnectorId}:${jobId}:${Date.now()}`;
    // Generar un hash único usando SHA256
    const secret = process.env.RECOMMENDATION_SECRET || "default-secret";
    const hash = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHash("sha256").update(payload + secret).digest("hex");
    // Tomar los primeros 32 caracteres para un token más corto
    const token = hash.substring(0, 32);
    // Codificar el payload en base64url para poder decodificarlo después
    const encodedPayload = Buffer.from(payload).toString("base64url");
    // Combinar: token + payload codificado (separados por punto)
    return `${token}.${encodedPayload}`;
}
function validateRecommendationToken(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 2) return null;
        const [hashPart, encodedPayload] = parts;
        // Decodificar el payload
        const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
        const [hyperconnectorId, jobId, timestampStr] = payload.split(":");
        if (!hyperconnectorId || !jobId || !timestampStr) return null;
        // Validar el hash
        const secret = process.env.RECOMMENDATION_SECRET || "default-secret";
        const expectedHash = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHash("sha256").update(payload + secret).digest("hex").substring(0, 32);
        if (hashPart !== expectedHash) {
            console.warn("❌ Hash mismatch:", {
                received: hashPart,
                expected: expectedHash.substring(0, 10) + "...",
                secretLength: secret.length,
                payload: payload.substring(0, 50) + "..."
            });
            return null;
        }
        // Verificar que el token no sea muy viejo (opcional: 30 días)
        const timestamp = parseInt(timestampStr, 10);
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días en ms
        if (Date.now() - timestamp > maxAge) return null;
        return {
            hyperconnectorId,
            jobId,
            timestamp
        };
    } catch (error) {
        return null;
    }
}
/**
 * Normaliza la URL base para asegurar que localhost use http://
 */ function normalizeBaseUrl(url) {
    if (!url) return "http://localhost:3000";
    // Si es localhost, forzar http://
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
        return url.replace(/^https?:\/\//, "http://");
    }
    // Para otras URLs, mantener el protocolo original o usar https:// por defecto
    if (!url.match(/^https?:\/\//)) {
        return `https://${url}`;
    }
    return url;
}
function generateRecommendationUrl(hyperconnectorId, jobId, baseUrl = process.env.APP_URL || "http://localhost:3000") {
    const normalizedUrl = normalizeBaseUrl(baseUrl);
    const token = generateRecommendationToken(hyperconnectorId, jobId);
    // Asegurar que no haya doble slash
    const cleanUrl = normalizedUrl.replace(/\/$/, "");
    return `${cleanUrl}/recommend/${token}`;
}
}),
"[project]/Referal MVP/src/domain/recommendationLinks.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createRecommendationLink",
    ()=>createRecommendationLink,
    "markRecommendationLinkAsUsed",
    ()=>markRecommendationLinkAsUsed,
    "validateRecommendationLink",
    ()=>validateRecommendationLink
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$recommendationTokens$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/utils/recommendationTokens.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
;
;
;
;
// Asegurar que las variables de entorno estén cargadas
if (!process.env.RECOMMENDATION_SECRET) {
    __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
        path: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["resolve"])(process.cwd(), ".env.local")
    });
}
async function createRecommendationLink(hyperconnectorId, jobId) {
    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$recommendationTokens$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateRecommendationToken"])(hyperconnectorId, jobId);
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("recommendation_links").insert({
        hyperconnector_id: hyperconnectorId,
        job_id: jobId,
        token: token,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }).select().single();
    if (error) {
        // Si la tabla no existe, retornamos solo el token (modo fallback)
        console.warn("⚠️ recommendation_links table might not exist:", error.message);
        return {
            token
        };
    }
    return data;
}
async function validateRecommendationLink(token) {
    // Primero validar el token criptográficamente
    const decoded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$recommendationTokens$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateRecommendationToken"])(token);
    if (!decoded) return null;
    // Luego verificar en la BD (si la tabla existe)
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("recommendation_links").select("*").eq("token", token).single();
    if (error) {
        // Si la tabla no existe, confiar solo en la validación criptográfica
        console.warn("⚠️ recommendation_links table might not exist:", error.message);
        return decoded;
    }
    if (!data) return null;
    // Verificar que no haya expirado
    if (new Date(data.expires_at) < new Date()) {
        return null;
    }
    return {
        hyperconnectorId: data.hyperconnector_id,
        jobId: data.job_id,
        timestamp: decoded.timestamp
    };
}
async function markRecommendationLinkAsUsed(token) {
    const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("recommendation_links").update({
        used_at: new Date().toISOString()
    }).eq("token", token);
    if (error) {
        console.warn("⚠️ Could not mark link as used:", error.message);
    }
}
}),
"[project]/Referal MVP/src/domain/jobs.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createJob",
    ()=>createJob,
    "getJobByCompanyNameLike",
    ()=>getJobByCompanyNameLike,
    "getJobById",
    ()=>getJobById
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript)");
;
async function getJobById(id) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("jobs").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
}
async function getJobByCompanyNameLike(company) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("jobs").select("*").ilike("company_name", `%${company}%`).limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
}
async function createJob(job, options) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("jobs").insert(job).select().single();
    if (error) throw new Error(error.message);
    // Trigger matching if requested (non-blocking)
    if (options?.triggerMatching && data?.id) {
        // Run asynchronously to not block the insert
        __turbopack_context__.A("[project]/Referal MVP/src/agents/matchJobCandidate.ts [app-route] (ecmascript, async loader)").then(({ matchJobWithAllCandidates })=>{
            matchJobWithAllCandidates(data.id).catch((err)=>{
                console.error("Error in background matching after job creation:", err);
            });
        }).catch((err)=>{
            console.error("Error loading matching module:", err);
        });
    }
    return data;
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
    ()=>updateHyperconnector
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
}),
"[project]/Referal MVP/src/domain/hyperconnectorCandidates.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getHyperconnectorByEmail",
    ()=>getHyperconnectorByEmail,
    "getRecommendableCandidatesForHyperconnector",
    ()=>getRecommendableCandidatesForHyperconnector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript)");
;
async function getHyperconnectorByEmail(email) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").select("*").eq("email", email).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
}
async function getRecommendableCandidatesForHyperconnector(jobId, hyperconnectorId) {
    // 1) relaciones HCI ↔ candidatos
    // Intentar obtener shared_experience si existe, sino solo candidate_id
    let links = [];
    let hasSharedExperience = false;
    // Primero intentar con shared_experience
    const { data: linksWithExp, error: expError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnector_candidates").select("candidate_id, shared_experience").eq("hyperconnector_id", hyperconnectorId);
    if (!expError && linksWithExp) {
        links = linksWithExp;
        hasSharedExperience = true;
    } else {
        // Si falla, intentar solo con candidate_id
        const { data: simpleLinks, error: simpleError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnector_candidates").select("candidate_id").eq("hyperconnector_id", hyperconnectorId);
        if (simpleError) throw new Error(simpleError.message);
        if (!simpleLinks || simpleLinks.length === 0) return [];
        links = simpleLinks.map((l)=>({
                candidate_id: l.candidate_id,
                shared_experience: null
            }));
    }
    return processCandidates(links, jobId);
}
async function processCandidates(links, jobId) {
    const candidateIds = links.map((l)=>l.candidate_id);
    // 2) matches job ↔ candidatos (opcional, si la tabla existe)
    let matches = [];
    try {
        const { data: jobMatches, error: matchesError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("job_candidate_matches").select("candidate_id, match_score").eq("job_id", jobId).in("candidate_id", candidateIds);
        if (!matchesError && jobMatches) {
            matches = jobMatches;
        }
    } catch (error) {
        // Si la tabla no existe, continuar sin matches
        console.warn("⚠️ Tabla job_candidate_matches no encontrada, continuando sin matches");
    }
    const matchByCandidateId = new Map(matches.map((m)=>[
            m.candidate_id,
            m.match_score
        ]));
    // 3) info de candidatos (obtener más campos para el diseño)
    const { data: candidates, error: candidatesError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").select("id, full_name, current_company, current_job_title, country, industry").in("id", candidateIds);
    if (candidatesError) throw new Error(candidatesError.message);
    // 4) combinamos todo
    const linkByCandidateId = new Map(links.map((l)=>[
            l.candidate_id,
            l.shared_experience || null
        ]));
    // IMPORTANTE: Solo devolver candidatos que están TANTO en hyperconnector_candidates
    // COMO en job_candidate_matches (intersección de ambas tablas)
    // Si no hay matches, no devolver ningún candidato (requerimos match obligatorio)
    const filteredCandidates = matches.length > 0 ? (candidates || []).filter((c)=>matchByCandidateId.has(c.id)) : []; // No devolver candidatos si no hay matches
    return filteredCandidates.map((c)=>({
            id: c.id,
            full_name: c.full_name,
            current_company: c.current_company,
            current_job_title: c.current_job_title || null,
            country: c.country || null,
            industry: c.industry || null,
            match_score: matchByCandidateId.get(c.id) || null,
            shared_experience: linkByCandidateId.get(c.id) || null
        })).sort((a, b)=>(b.match_score || 0) - (a.match_score || 0));
}
}),
"[project]/Referal MVP/app/api/recommend/[token]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$recommendationLinks$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/recommendationLinks.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$jobs$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/jobs.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$hyperconnectors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/hyperconnectors.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$hyperconnectorCandidates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/hyperconnectorCandidates.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
// Asegurar que las variables de entorno estén cargadas en Next.js
if (!process.env.RECOMMENDATION_SECRET) {
    __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
        path: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["resolve"])(process.cwd(), ".env.local")
    });
}
async function GET(request, { params }) {
    try {
        const { token } = await params;
        console.log("🔍 Validando token:", token.substring(0, 30) + "...");
        // Validar el token
        const linkData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$recommendationLinks$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateRecommendationLink"])(token);
        if (!linkData) {
            console.error("❌ Token inválido o expirado");
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Token inválido o expirado"
            }, {
                status: 401
            });
        }
        console.log("✅ Token válido, linkData:", linkData);
        // linkData puede tener hyperconnectorId/jobId directamente o en propiedades diferentes
        const hyperconnectorId = linkData.hyperconnectorId || linkData.hyperconnector_id;
        const jobId = linkData.jobId || linkData.job_id;
        console.log("📋 IDs extraídos - HCI:", hyperconnectorId, "Job:", jobId);
        if (!hyperconnectorId || !jobId) {
            console.error("❌ Faltan datos en el token");
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Token inválido: faltan datos"
            }, {
                status: 401
            });
        }
        // Obtener datos del job
        console.log("🔍 Buscando job:", jobId);
        const job = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$jobs$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getJobById"])(jobId);
        if (!job) {
            console.error("❌ Job no encontrado:", jobId);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Job no encontrado"
            }, {
                status: 404
            });
        }
        console.log("✅ Job encontrado:", job.role_title || job.company_name);
        // Obtener datos del hyperconnector
        console.log("🔍 Buscando hyperconnector:", hyperconnectorId);
        const hci = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$hyperconnectors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getHyperconnectorById"])(hyperconnectorId);
        if (!hci) {
            console.error("❌ Hyperconnector no encontrado:", hyperconnectorId);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Hyperconnector no encontrado"
            }, {
                status: 404
            });
        }
        console.log("✅ Hyperconnector encontrado:", hci.full_name);
        // Obtener candidatos recomendables
        const candidates = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$hyperconnectorCandidates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getRecommendableCandidatesForHyperconnector"])(jobId, hyperconnectorId);
        // Obtener match scores de job_candidate_matches para cada candidato
        const { supabase } = await __turbopack_context__.A("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript, async loader)");
        const candidateIds = candidates.map((c)=>c.id);
        let matchScores = new Map();
        if (candidateIds.length > 0) {
            const { data: matches, error: matchesError } = await supabase.from("job_candidate_matches").select("candidate_id, match_score").eq("job_id", jobId).in("candidate_id", candidateIds);
            if (!matchesError && matches) {
                matches.forEach((match)=>{
                    matchScores.set(match.candidate_id, match.match_score);
                });
            }
        }
        // Agregar match_score a cada candidato
        const candidatesWithMatch = candidates.map((candidate)=>({
                ...candidate,
                match_score: matchScores.get(candidate.id) || null
            }));
        // Obtener información del owner candidate (quien postuló el job)
        let ownerCandidate = null;
        if (job.owner_candidate_id) {
            // Obtener información básica del candidate
            const { data: ownerData, error: ownerError } = await supabase.from("candidates").select("id, full_name, current_company, email").eq("id", job.owner_candidate_id).maybeSingle();
            if (!ownerError && ownerData) {
                ownerCandidate = ownerData;
                // Intentar obtener el título/posición actual del candidate desde candidate_experience
                const { data: experienceData } = await supabase.from("candidate_experience").select("title, company_name").eq("candidate_id", job.owner_candidate_id).eq("is_current", true).order("start_date", {
                    ascending: false
                }).limit(1).maybeSingle();
                if (experienceData) {
                    ownerCandidate.current_title = experienceData.title;
                    // Si no tiene current_company, usar el de experience
                    if (!ownerCandidate.current_company && experienceData.company_name) {
                        ownerCandidate.current_company = experienceData.company_name;
                    }
                }
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            job: {
                ...job,
                owner_role: job.owner_role || null
            },
            hyperconnector: hci,
            candidates: candidatesWithMatch,
            ownerCandidate,
            token
        });
    } catch (error) {
        console.error("❌ Error en GET /api/recommend/[token]:", error);
        console.error("Stack:", error.stack);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Error interno del servidor",
            details: ("TURBOPACK compile-time truthy", 1) ? error.message : "TURBOPACK unreachable"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__251ffe66._.js.map