import { generateRecommendationUrl } from "../src/utils/recommendationTokens";
import dotenv from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const hyperconnectorId = "39e4f352-9b4e-4132-b88a-6563490a52ef";
const jobId = "1bc70ebc-0c10-4bb8-b641-313737b99abe";

console.log("=".repeat(70));
console.log("🔗 GENERANDO NUEVO LINK DE RECOMENDACIÓN");
console.log("=".repeat(70));
console.log(`Hyperconnector ID: ${hyperconnectorId}`);
console.log(`Job ID: ${jobId}`);
console.log("");

// Verificar que RECOMMENDATION_SECRET esté configurado
const secret = process.env.RECOMMENDATION_SECRET;
if (!secret) {
  console.error("❌ RECOMMENDATION_SECRET NO ESTÁ CONFIGURADO!");
  console.error("   Por favor, agrega RECOMMENDATION_SECRET a .env.local");
  process.exit(1);
}

console.log("✅ RECOMMENDATION_SECRET configurado");
console.log(`   Length: ${secret.length}`);
console.log(`   Preview: ${secret.substring(0, 5)}...${secret.substring(secret.length - 5)}`);
console.log("");

// Generar link con URL de producción
const baseUrl = process.env.PRODUCTION_URL || "https://referrals.product-latam.com";
const url = generateRecommendationUrl(hyperconnectorId, jobId, baseUrl);

console.log("=".repeat(70));
console.log("✅ LINK GENERADO:");
console.log("=".repeat(70));
console.log(url);
console.log("=".repeat(70));
console.log("");

// Extraer el token para referencia
const tokenMatch = url.match(/\/recommend\/([^\/\?]+)/);
if (tokenMatch) {
  const token = tokenMatch[1];
  console.log("📋 Token extraído:");
  console.log(token);
  console.log("");
  console.log("🌐 URL de la API para probar:");
  console.log(`${baseUrl}/api/recommend/get?token=${token}`);
  console.log("");
}

console.log("💡 IMPORTANTE:");
console.log("   1. Verifica que RECOMMENDATION_SECRET esté configurado en Vercel");
console.log("   2. El secret debe ser EXACTAMENTE el mismo en local y producción");
console.log("   3. Si el token falla, regenera los links después de configurar el secret");
console.log("");

