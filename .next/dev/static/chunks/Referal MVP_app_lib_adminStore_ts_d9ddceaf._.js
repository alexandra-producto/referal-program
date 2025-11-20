(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Referal MVP/app/lib/adminStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Simple admin store using localStorage for simulated login
 */ __turbopack_context__.s([
    "adminStore",
    ()=>adminStore
]);
const ADMIN_STORAGE_KEY = 'admin_auth';
const adminStore = {
    /**
   * Check if admin is logged in
   */ isAuthenticated () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
    },
    /**
   * Set admin as logged in
   */ login () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    },
    /**
   * Clear admin session
   */ logout () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Referal%20MVP_app_lib_adminStore_ts_d9ddceaf._.js.map