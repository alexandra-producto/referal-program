import dotenv from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const secret = process.env.RECOMMENDATION_SECRET;

console.log("=".repeat(70));
console.log("🔍 VERIFICACIÓN DE RECOMMENDATION_SECRET");
console.log("=".repeat(70));
console.log("");

if (!secret) {
  console.error("❌ RECOMMENDATION_SECRET NO ESTÁ CONFIGURADO en .env.local");
  console.error("");
  console.error("Para generarlo, ejecuta:");
  console.error("  openssl rand -base64 32");
  console.error("");
  console.error("Luego agrégalo a .env.local:");
  console.error("  RECOMMENDATION_SECRET=el_secret_generado");
  process.exit(1);
}

console.log("✅ RECOMMENDATION_SECRET está configurado en .env.local");
console.log("");
console.log("📋 Información del secret:");
console.log(`   Length: ${secret.length} caracteres`);
console.log(`   Primeros 10 caracteres: ${secret.substring(0, 10)}`);
console.log(`   Últimos 10 caracteres: ${secret.substring(secret.length - 10)}`);
console.log("");

console.log("💡 Para configurarlo en Vercel:");
console.log("   1. Ve a: Vercel Dashboard → Tu Proyecto → Settings → Environment Variables");
console.log("   2. Agrega RECOMMENDATION_SECRET con el MISMO valor que en .env.local");
console.log("   3. Asegúrate de configurarlo para Production, Preview y Development");
console.log("   4. Guarda y redeploya la aplicación");
console.log("");

console.log("⚠️  IMPORTANTE:");
console.log("   - El secret debe ser EXACTAMENTE el mismo en local y producción");
console.log("   - Si cambias el secret, todos los tokens anteriores dejarán de funcionar");
console.log("   - Después de configurarlo en Vercel, regenera los links");
console.log("");

