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
"[project]/Referal MVP/app/api/hyperconnector/id/[id]/jobs/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript)");
;
;
async function GET(request, { params }) {
    try {
        const { id: hyperconnectorId } = await params;
        if (!hyperconnectorId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Hyperconnector ID requerido"
            }, {
                status: 400
            });
        }
        console.log("🔍 Obteniendo jobs para hyperconnector:", hyperconnectorId);
        // Obtener información del hyperconnector
        const { data: hyperconnector, error: hciError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("hyperconnectors").select("id, full_name").eq("id", hyperconnectorId).maybeSingle();
        if (hciError) {
            console.error("❌ Error obteniendo hyperconnector:", hciError);
            // No cortamos con 404 para no romper la UI: devolvemos lista vacía
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                jobs: [],
                hyperconnector: null,
                hyperconnectorId,
                message: "No se pudo obtener el hyperconnector"
            }, {
                status: 200
            });
        }
        if (!hyperconnector) {
            console.warn("⚠️ Hyperconnector no encontrado en la BD:", hyperconnectorId);
            // En lugar de 404 devolvemos 200 con lista vacía para evitar errores en la UI
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                jobs: [],
                hyperconnector: null,
                hyperconnectorId,
                message: "Hyperconnector no encontrado"
            }, {
                status: 200
            });
        }
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
                hyperconnector,
                hyperconnectorId,
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
            console.log("⚠️ No hay matches para estos candidatos");
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                jobs: [],
                hyperconnector,
                hyperconnectorId,
                message: "No hay jobs con matches para los candidatos relacionados"
            });
        }
        const jobIds = [
            ...new Set(jobMatches.map((jm)=>jm.job_id))
        ];
        // Obtener detalles de los jobs
        // Mostrar jobs activos (excluir solo los cerrados/cancelados)
        const { data: allJobs, error: jobsError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("jobs").select("id, company_name, job_title, description, owner_candidate_id, owner_role_title, status").in("id", jobIds);
        if (jobsError) {
            console.error("❌ Error obteniendo jobs:", jobsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Error al obtener jobs"
            }, {
                status: 500
            });
        }
        // Filtrar jobs activos (excluir contratados - hired)
        const jobs = (allJobs || []).filter((job)=>job.status !== "hired");
        if (jobsError) {
            console.error("❌ Error obteniendo jobs:", jobsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Error al obtener jobs"
            }, {
                status: 500
            });
        }
        // Para cada job, obtener el mejor match score y contar candidatos elegibles
        const jobsWithDetails = await Promise.all((jobs || []).map(async (job)=>{
            // Obtener matches para este job con candidatos del hyperconnector
            const { data: matches } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("job_candidate_matches").select("match_score, candidate_id").eq("job_id", job.id).in("candidate_id", candidateIds);
            const matchScores = (matches || []).map((m)=>m.match_score || 0);
            const bestMatchScore = matchScores.length > 0 ? Math.max(...matchScores) : null;
            const eligibleCandidatesCount = matches?.length || 0;
            // Obtener información del owner candidate
            let ownerCandidate = null;
            if (job.owner_candidate_id) {
                const { data: owner } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("candidates").select("id, full_name, current_company, email").eq("id", job.owner_candidate_id).maybeSingle();
                ownerCandidate = owner;
            }
            // Obtener conteo de recomendaciones del hyperconnector para este job
            const { data: myRecommendations } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from("recommendations").select("id").eq("job_id", job.id).eq("hyperconnector_id", hyperconnectorId);
            const myRecommendationsCount = myRecommendations?.length || 0;
            return {
                id: job.id,
                company_name: job.company_name,
                job_title: job.job_title,
                role_title: job.job_title,
                description: job.description,
                owner_role: job.owner_role_title,
                owner_candidate_id: job.owner_candidate_id,
                eligibleCandidatesCount,
                bestMatchScore,
                ownerCandidate,
                myRecommendationsCount
            };
        }));
        console.log(`✅ Encontrados ${jobsWithDetails.length} jobs elegibles`);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            jobs: jobsWithDetails,
            hyperconnector,
            hyperconnectorId
        });
    } catch (error) {
        console.error("❌ Error en GET /api/hyperconnector/id/[id]/jobs:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Error interno del servidor"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__67ebec30._.js.map