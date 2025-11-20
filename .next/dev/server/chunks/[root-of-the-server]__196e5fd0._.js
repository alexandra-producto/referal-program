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
"[project]/Referal MVP/app/api/hyperconnector/token/[token]/jobs/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$recommendationLinks$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/recommendationLinks.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript)");
;
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
async function GET(request, { params }) {
    try {
        const { token } = await params;
        console.log("🔍 Validando token para jobs hub:", token.substring(0, 30) + "...");
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
        const hyperconnectorId = linkData.hyperconnectorId || linkData.hyperconnector_id;
        if (!hyperconnectorId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Token inválido: faltan datos"
            }, {
                status: 401
            });
        }
        console.log("✅ Token válido - HCI:", hyperconnectorId);
        // Obtener candidatos relacionados con el hyperconnector
        const { data: hyperconnectorCandidates, error: hciCandidatesError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnector_candidates").select("candidate_id").eq("hyperconnector_id", hyperconnectorId);
        if (hciCandidatesError) {
            console.error("❌ Error obteniendo candidatos del hyperconnector:", hciCandidatesError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Error al obtener candidatos"
            }, {
                status: 500
            });
        }
        if (!hyperconnectorCandidates || hyperconnectorCandidates.length === 0) {
            console.log("⚠️ Hyperconnector no tiene candidatos relacionados");
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                jobs: [],
                message: "No hay candidatos relacionados con este hyperconnector"
            });
        }
        const candidateIds = hyperconnectorCandidates.map((hc)=>hc.candidate_id);
        // Obtener jobs que tienen matches con estos candidatos
        const { data: jobMatches, error: matchesError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("job_candidate_matches").select("job_id").in("candidate_id", candidateIds);
        if (matchesError) {
            console.error("❌ Error obteniendo matches:", matchesError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Error al obtener matches"
            }, {
                status: 500
            });
        }
        if (!jobMatches || jobMatches.length === 0) {
            console.log("⚠️ No hay jobs con matches para estos candidatos");
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                jobs: [],
                message: "No hay jobs disponibles con candidatos elegibles"
            });
        }
        // Obtener job IDs únicos
        const jobIds = [
            ...new Set(jobMatches.map((jm)=>jm.job_id))
        ];
        // Obtener información completa de los jobs
        const { data: jobs, error: jobsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("jobs").select("*").in("id", jobIds);
        if (jobsError) {
            console.error("❌ Error obteniendo jobs:", jobsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Error al obtener jobs"
            }, {
                status: 500
            });
        }
        // Para cada job, obtener el número de candidatos elegibles, el mejor match score y el owner candidate
        const jobsWithDetails = await Promise.all((jobs || []).map(async (job)=>{
            // Obtener matches para este job con los candidatos del hyperconnector
            const { data: jobMatchesForJob } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("job_candidate_matches").select("candidate_id, match_score").eq("job_id", job.id).in("candidate_id", candidateIds);
            const eligibleCandidatesCount = jobMatchesForJob?.length || 0;
            const bestMatchScore = jobMatchesForJob && jobMatchesForJob.length > 0 ? Math.max(...jobMatchesForJob.map((m)=>m.match_score)) : null;
            // Obtener información del owner candidate
            let ownerCandidate = null;
            if (job.owner_candidate_id) {
                const { data: ownerData, error: ownerError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").select("id, full_name, current_company, email").eq("id", job.owner_candidate_id).maybeSingle();
                if (!ownerError && ownerData) {
                    ownerCandidate = ownerData;
                }
            }
            return {
                ...job,
                eligibleCandidatesCount,
                bestMatchScore,
                ownerCandidate
            };
        }));
        // Ordenar por mejor match score (descendente)
        jobsWithDetails.sort((a, b)=>{
            const scoreA = a.bestMatchScore || 0;
            const scoreB = b.bestMatchScore || 0;
            return scoreB - scoreA;
        });
        console.log(`✅ Encontrados ${jobsWithDetails.length} jobs elegibles`);
        // Obtener información del hyperconnector
        const { data: hyperconnector, error: hciError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").select("id, full_name").eq("id", hyperconnectorId).maybeSingle();
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            jobs: jobsWithDetails,
            hyperconnectorId,
            hyperconnector: hyperconnector || null
        });
    } catch (error) {
        console.error("❌ Error en GET /api/hyperconnector/token/[token]/jobs:", error);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__196e5fd0._.js.map