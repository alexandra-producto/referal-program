(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Referal MVP/app/lib/hyperconnectorStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Simple hyperconnector store using localStorage for simulated login
 */ __turbopack_context__.s([
    "hyperconnectorStore",
    ()=>hyperconnectorStore
]);
const HYPERCONNECTOR_STORAGE_KEY = 'hyperconnector_auth';
const hyperconnectorStore = {
    /**
   * Get the current logged-in hyperconnector
   */ getCurrentHyperconnector () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const stored = localStorage.getItem(HYPERCONNECTOR_STORAGE_KEY);
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch  {
            return null;
        }
    },
    /**
   * Set the current logged-in hyperconnector
   */ setCurrentHyperconnector (hyperconnector) {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        localStorage.setItem(HYPERCONNECTOR_STORAGE_KEY, JSON.stringify(hyperconnector));
    },
    /**
   * Clear the current session
   */ clearSession () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        localStorage.removeItem(HYPERCONNECTOR_STORAGE_KEY);
    },
    /**
   * Check if user is logged in
   */ isAuthenticated () {
        return this.getCurrentHyperconnector() !== null;
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Referal%20MVP_app_lib_hyperconnectorStore_ts_3ee0b954._.js.map