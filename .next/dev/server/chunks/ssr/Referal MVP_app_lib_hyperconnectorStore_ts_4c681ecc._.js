module.exports = [
"[project]/Referal MVP/app/lib/hyperconnectorStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
        if ("TURBOPACK compile-time truthy", 1) return null;
        //TURBOPACK unreachable
        ;
        const stored = undefined;
    },
    /**
   * Set the current logged-in hyperconnector
   */ setCurrentHyperconnector (hyperconnector) {
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    },
    /**
   * Clear the current session
   */ clearSession () {
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    },
    /**
   * Check if user is logged in
   */ isAuthenticated () {
        return this.getCurrentHyperconnector() !== null;
    }
};
}),
];

//# sourceMappingURL=Referal%20MVP_app_lib_hyperconnectorStore_ts_4c681ecc._.js.map