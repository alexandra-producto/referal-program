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
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
;
;
// Cargar variables de entorno
if (!process.env.LINKEDIN_CLIENT_ID) {
    __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
        path: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["resolve"])(process.cwd(), ".env.local")
    });
}
// Funciones helper para obtener variables de entorno (lazy loading)
function getLinkedInClientId() {
    const value = process.env.LINKEDIN_CLIENT_ID;
    if (!value) {
        throw new Error("LINKEDIN_CLIENT_ID no está configurado");
    }
    return value;
}
function getLinkedInClientSecret() {
    const value = process.env.LINKEDIN_CLIENT_SECRET;
    if (!value) {
        throw new Error("LINKEDIN_CLIENT_SECRET no está configurado");
    }
    return value;
}
function getLinkedInRedirectUri() {
    const value = process.env.LINKEDIN_REDIRECT_URI;
    if (!value) {
        throw new Error("LINKEDIN_REDIRECT_URI no está configurado");
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
"[project]/Referal MVP/app/api/auth/linkedin/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/jose/dist/webapi/jwt/sign.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/node_modules/next/headers.js [app-route] (ecmascript)");
// Importar después de cargar env
var __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$linkedinAuth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Referal MVP/src/utils/linkedinAuth.ts [app-route] (ecmascript)");
;
;
;
;
;
// Cargar variables de entorno SIEMPRE en rutas API
__TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].config({
    path: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["resolve"])(process.cwd(), ".env.local")
});
;
const SECRET_KEY = process.env.SESSION_SECRET || process.env.RECOMMENDATION_SECRET || "fallback-secret-key";
const secret = new TextEncoder().encode(SECRET_KEY);
async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const role = searchParams.get("role");
        if (!role || ![
            "admin",
            "hyperconnector",
            "solicitante"
        ].includes(role)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Rol inválido. Debe ser: admin, hyperconnector o solicitante"
            }, {
                status: 400
            });
        }
        // Generar state anti-CSRF
        const state = await new __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignJWT"]({
            role,
            timestamp: Date.now()
        }).setProtectedHeader({
            alg: "HS256"
        }).setExpirationTime("10m") // 10 minutos
        .sign(secret);
        // Guardar state en cookie firmada
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        cookieStore.set("oauth_state", state, {
            httpOnly: true,
            secure: ("TURBOPACK compile-time value", "development") === "production",
            sameSite: "lax",
            maxAge: 600,
            path: "/"
        });
        // Redirigir a LinkedIn
        const authUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$src$2f$utils$2f$linkedinAuth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getLinkedInAuthUrl"])(state, role);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(authUrl);
    } catch (error) {
        console.error("Error en /api/auth/linkedin:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Referal__MVP$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Error al iniciar autenticación con LinkedIn"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6bca7cd1._.js.map