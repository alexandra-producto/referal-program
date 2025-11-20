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
"[project]/Referal MVP/src/types/jobCreation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * DTO para crear un job desde la UI
 */ __turbopack_context__.s([
    "buildRequirementsJson",
    ()=>buildRequirementsJson,
    "validateCreateJobRequest",
    ()=>validateCreateJobRequest
]);
function validateCreateJobRequest(body) {
    if (!body) {
        return {
            valid: false,
            error: 'Request body is required'
        };
    }
    const { jobTitle, description, nonNegotiables, desiredTrajectory, scenario, technicalBackgroundNeeded, modality } = body;
    // Validar campos requeridos
    if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
        return {
            valid: false,
            error: 'jobTitle is required and must be a non-empty string'
        };
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return {
            valid: false,
            error: 'description is required and must be a non-empty string'
        };
    }
    if (!nonNegotiables || typeof nonNegotiables !== 'string') {
        return {
            valid: false,
            error: 'nonNegotiables is required and must be a string'
        };
    }
    if (!desiredTrajectory || typeof desiredTrajectory !== 'string') {
        return {
            valid: false,
            error: 'desiredTrajectory is required and must be a string'
        };
    }
    if (!scenario || typeof scenario !== 'string') {
        return {
            valid: false,
            error: 'scenario is required and must be a string'
        };
    }
    if (typeof technicalBackgroundNeeded !== 'boolean') {
        return {
            valid: false,
            error: 'technicalBackgroundNeeded is required and must be a boolean'
        };
    }
    if (!modality || ![
        'remote',
        'hybrid',
        'onsite'
    ].includes(modality)) {
        return {
            valid: false,
            error: 'modality is required and must be one of: remote, hybrid, onsite'
        };
    }
    return {
        valid: true,
        data: {
            jobTitle: jobTitle.trim(),
            description: description.trim(),
            nonNegotiables: nonNegotiables.trim(),
            desiredTrajectory: desiredTrajectory.trim(),
            scenario: scenario.trim(),
            technicalBackgroundNeeded,
            modality
        }
    };
}
function buildRequirementsJson(request) {
    return {
        non_negotiables_text: request.nonNegotiables,
        desired_trajectory_text: request.desiredTrajectory,
        scenario_text: request.scenario,
        needs_technical_background: request.technicalBackgroundNeeded,
        modality: request.modality
    };
}
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
"[project]/Referal MVP/src/services/jobCreationService.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createJobFromCandidate",
    ()=>createJobFromCandidate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$candidates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/candidates.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$jobs$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/jobs.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$types$2f$jobCreation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/types/jobCreation.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript)");
;
;
;
;
/**
 * Obtiene el título actual del candidate desde candidate_experience si está disponible
 */ async function getCandidateCurrentTitle(candidateId) {
    try {
        // Primero intentar obtener desde candidate_experience
        const { data: experienceData } = await __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$db$2f$supabaseClient$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from('candidate_experience').select('title').eq('candidate_id', candidateId).eq('is_current', true).order('start_date', {
            ascending: false
        }).limit(1).maybeSingle();
        if (experienceData?.title) {
            return experienceData.title;
        }
        return null;
    } catch (error) {
        console.warn('Error fetching candidate experience:', error);
        return null;
    }
}
async function createJobFromCandidate(candidateId, request) {
    // 1. Buscar el candidate
    const candidate = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$candidates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCandidateById"])(candidateId);
    if (!candidate) {
        throw new Error(`Candidate with id ${candidateId} not found`);
    }
    // 2. Obtener company_name del candidate
    const companyName = candidate.current_company;
    if (!companyName) {
        throw new Error('Candidate must have a current_company to create a job');
    }
    // 3. Obtener owner_role_title (intentar desde current_job_title o candidate_experience)
    let ownerRoleTitle = candidate.current_job_title || null;
    if (!ownerRoleTitle) {
        ownerRoleTitle = await getCandidateCurrentTitle(candidateId);
    }
    // 4. Calcular remote_ok según la modalidad
    const remoteOk = request.modality === 'remote' || request.modality === 'hybrid';
    // 5. Construir requirements_json
    const requirementsJson = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$types$2f$jobCreation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildRequirementsJson"])(request);
    // 6. Crear el objeto job
    const jobData = {
        company_name: companyName,
        job_title: request.jobTitle,
        job_level: null,
        location: null,
        remote_ok: remoteOk,
        description: request.description,
        requirements_json: requirementsJson,
        status: 'open',
        owner_candidate_id: candidateId,
        owner_role_title: ownerRoleTitle
    };
    // 7. Crear el job (con matching automático)
    const job = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$jobs$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createJob"])(jobData, {
        triggerMatching: true
    });
    return job;
}
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
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$types$2f$jobCreation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/types/jobCreation.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$services$2f$jobCreationService$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/services/jobCreationService.ts [app-route] (ecmascript)");
;
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ownerCandidateId = searchParams.get('owner_candidate_id');
        const { supabase } = await __turbopack_context__.A("[project]/Referal MVP/src/db/supabaseClient.ts [app-route] (ecmascript, async loader)");
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
        const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$types$2f$jobCreation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateCreateJobRequest"])(body);
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
        const job = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$services$2f$jobCreationService$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createJobFromCandidate"])(candidateId, validation.data);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__654a3fc3._.js.map