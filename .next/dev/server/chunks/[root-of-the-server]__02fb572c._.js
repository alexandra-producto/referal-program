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
    ()=>updateCandidate
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
}),
"[project]/Referal MVP/app/api/candidates/[id]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$candidates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/domain/candidates.ts [app-route] (ecmascript)");
;
;
async function GET(request, { params }) {
    try {
        const { id } = await params;
        const candidate = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$domain$2f$candidates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCandidateById"])(id);
        if (!candidate) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Candidate not found'
            }, {
                status: 404
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(candidate);
    } catch (error) {
        console.error('❌ Error fetching candidate:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Error fetching candidate',
            details: ("TURBOPACK compile-time truthy", 1) ? error.message : "TURBOPACK unreachable"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__02fb572c._.js.map