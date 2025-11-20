#!/usr/bin/env tsx
/**
 * Pre-push check script
 * Verifica que el código compile correctamente antes de hacer push
 * Esto ayuda a detectar errores de imports antes de que Vercel falle
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { glob } from "glob";

console.log("🔍 Verificando imports y sintaxis...\n");

// 1. Verificar que todos los imports usen alias @/ en lugar de rutas relativas profundas
console.log("1. Verificando imports con rutas relativas profundas...");
const files = glob.sync("app/**/*.{ts,tsx}", { ignore: ["**/node_modules/**"] });
let foundIssues = false;

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const lines = content.split("\n");
  
  lines.forEach((line, index) => {
    // Detectar imports con más de 3 niveles de ../
    if (line.includes("from") && line.match(/\.\.\/\.\.\/\.\.\/\.\./)) {
      console.error(`❌ ${file}:${index + 1} - Ruta relativa muy profunda: ${line.trim()}`);
      console.error(`   Considera usar alias @/components, @/app, o @/src`);
      foundIssues = true;
    }
  });
}

if (foundIssues) {
  console.error("\n❌ Se encontraron imports con rutas relativas muy profundas.");
  console.error("   Usa alias @/components, @/app, o @/src en su lugar.\n");
  process.exit(1);
}

console.log("✅ Todos los imports están correctos.\n");

// 2. Verificar que TypeScript compile
console.log("2. Verificando compilación de TypeScript...");
try {
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  console.log("✅ TypeScript compila correctamente.\n");
} catch (error) {
  console.error("\n❌ Errores de TypeScript encontrados.");
  process.exit(1);
}

// 3. Verificar que Next.js puede hacer build (solo verificación de sintaxis)
console.log("3. Verificando sintaxis de Next.js...");
try {
  // Solo verificamos que no haya errores de sintaxis críticos
  // No hacemos build completo porque es lento
  execSync("npx next lint --dir app --dir components", { stdio: "inherit" });
  console.log("✅ Sintaxis de Next.js correcta.\n");
} catch (error) {
  console.warn("⚠️  Advertencias de linting encontradas (no crítico).\n");
}

console.log("✅ Pre-push check completado. Listo para hacer push!");

