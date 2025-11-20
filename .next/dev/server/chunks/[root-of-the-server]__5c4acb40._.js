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
"[project]/Referal MVP/app/api/jobs/all/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/server.js [app-route] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../../../src/db/supabaseClient'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
;
async function GET(request) {
    try {
        // Obtener todos los jobs
        const { data: jobs, error: jobsError } = await supabase.from('jobs').select('*').order('created_at', {
            ascending: false
        });
        if (jobsError) {
            console.error('❌ Error fetching jobs:', jobsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Error fetching jobs',
                details: jobsError.message
            }, {
                status: 500
            });
        }
        if (!jobs || jobs.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                jobs: []
            });
        }
        // Obtener IDs de jobs y owner candidates
        const jobIds = jobs.map((j)=>j.id);
        const ownerCandidateIds = jobs.map((j)=>j.owner_candidate_id).filter((id)=>id !== null);
        // Obtener información de los owner candidates
        let ownerCandidates = new Map();
        if (ownerCandidateIds.length > 0) {
            const { data: candidates, error: candidatesError } = await supabase.from('candidates').select('id, full_name, current_company, current_job_title').in('id', ownerCandidateIds);
            if (!candidatesError && candidates) {
                candidates.forEach((c)=>{
                    ownerCandidates.set(c.id, c);
                });
            }
        }
        // Obtener conteo de recomendaciones por job
        const { data: recommendations } = await supabase.from('recommendations').select('job_id').in('job_id', jobIds);
        // Contar recomendaciones
        const recommendationCounts = new Map();
        if (recommendations) {
            recommendations.forEach((r)=>{
                const count = recommendationCounts.get(r.job_id) || 0;
                recommendationCounts.set(r.job_id, count + 1);
            });
        }
        // Combinar toda la información
        // El status viene directamente de la tabla jobs
        const jobsWithDetails = jobs.map((job)=>{
            const ownerCandidate = ownerCandidates.get(job.owner_candidate_id);
            const recommendationsCount = recommendationCounts.get(job.id) || 0;
            return {
                ...job,
                ownerCandidate: ownerCandidate || null,
                recommendations_count: recommendationsCount
            };
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            jobs: jobsWithDetails
        });
    } catch (error) {
        console.error('❌ Error in GET /api/jobs/all:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Error fetching jobs',
            details: ("TURBOPACK compile-time truthy", 1) ? error.message : "TURBOPACK unreachable"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5c4acb40._.js.map