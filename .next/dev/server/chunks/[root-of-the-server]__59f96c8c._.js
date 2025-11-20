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
"[project]/Referal MVP/app/api/jobs/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/server.js [app-route] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../../../../src/types/jobCreation'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module '../../../../src/services/jobCreationService'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ownerCandidateId = searchParams.get('owner_candidate_id');
        const { supabase } = await (()=>{
            const e = new Error("Cannot find module '../../../../src/db/supabaseClient'");
            e.code = 'MODULE_NOT_FOUND';
            throw e;
        })();
        let query = supabase.from('jobs').select('*');
        if (ownerCandidateId) {
            query = query.eq('owner_candidate_id', ownerCandidateId);
        }
        // Ordenar por fecha de creación (más recientes primero)
        query = query.order('created_at', {
            ascending: false
        });
        const { data: jobs, error } = await query;
        if (error) {
            console.error('❌ Error fetching jobs:', error);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Error fetching jobs',
                details: error.message
            }, {
                status: 500
            });
        }
        // Para cada job, obtener el conteo de recomendaciones
        if (jobs && jobs.length > 0) {
            const jobIds = jobs.map((j)=>j.id);
            const { data: recommendations } = await supabase.from('recommendations').select('job_id').in('job_id', jobIds);
            // Contar recomendaciones por job
            const recommendationCounts = new Map();
            if (recommendations) {
                recommendations.forEach((r)=>{
                    const count = recommendationCounts.get(r.job_id) || 0;
                    recommendationCounts.set(r.job_id, count + 1);
                });
            }
            // Agregar conteo a cada job
            const jobsWithCounts = jobs.map((job)=>({
                    ...job,
                    recommendations_count: recommendationCounts.get(job.id) || 0
                }));
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                jobs: jobsWithCounts
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            jobs: []
        });
    } catch (error) {
        console.error('❌ Error in GET /api/jobs:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Error fetching jobs',
            details: ("TURBOPACK compile-time truthy", 1) ? error.message : "TURBOPACK unreachable"
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        // Validar el body
        const validation = validateCreateJobRequest(body);
        if (!validation.valid || !validation.data) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: validation.error || 'Invalid request body'
            }, {
                status: 400
            });
        }
        // Obtener candidateId del body (en el futuro esto vendrá de la autenticación)
        const candidateId = body.candidateId;
        if (!candidateId || typeof candidateId !== 'string') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'candidateId is required in the request body'
            }, {
                status: 400
            });
        }
        // Crear el job
        const job = await createJobFromCandidate(candidateId, validation.data);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            job,
            message: 'Job created successfully'
        }, {
            status: 201
        });
    } catch (error) {
        console.error('❌ Error creating job:', error);
        // Manejar errores específicos
        if (error.message?.includes('not found')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: error.message
            }, {
                status: 404
            });
        }
        if (error.message?.includes('current_company')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: error.message
            }, {
                status: 400
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Error creating job',
            details: ("TURBOPACK compile-time truthy", 1) ? error.message : "TURBOPACK unreachable"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__59f96c8c._.js.map