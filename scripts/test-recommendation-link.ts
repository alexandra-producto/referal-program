import { generateRecommendationUrl, validateRecommendationToken } from "../src/utils/recommendationTokens";
import { validateRecommendationLink } from "../src/domain/recommendationLinks";
import dotenv from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function testRecommendationLink() {
  const hyperconnectorId = "39e4f352-9b4e-4132-b88a-6563490a52ef";
  const jobId = "1bc70ebc-0c10-4bb8-b641-313737b99abe";

  console.log("=".repeat(70));
  console.log("🧪 PRUEBA DE GENERACIÓN Y VALIDACIÓN DE TOKEN");
  console.log("=".repeat(70));
  console.log(`Hyperconnector ID: ${hyperconnectorId}`);
  console.log(`Job ID: ${jobId}`);
  console.log("");

  // Verificar que RECOMMENDATION_SECRET esté configurado
  const secret = process.env.RECOMMENDATION_SECRET;
  console.log("📋 Verificación de configuración:");
  console.log(`   RECOMMENDATION_SECRET configurado: ${!!secret}`);
  console.log(`   RECOMMENDATION_SECRET length: ${secret?.length || 0}`);
  if (secret) {
    console.log(`   RECOMMENDATION_SECRET preview: ${secret.substring(0, 5)}...${secret.substring(secret.length - 5)}`);
  } else {
    console.error("   ❌ RECOMMENDATION_SECRET NO ESTÁ CONFIGURADO!");
    console.error("   Por favor, agrega RECOMMENDATION_SECRET a .env.local");
    return;
  }
  console.log("");

  // Generar nuevo link
  console.log("🔗 Generando nuevo link de recomendación...");
  const baseUrl = process.env.PRODUCTION_URL || "https://referrals.product-latam.com";
  const url = generateRecommendationUrl(hyperconnectorId, jobId, baseUrl);
  console.log(`   URL generada: ${url}`);
  
  // Extraer el token de la URL
  const tokenMatch = url.match(/\/recommend\/([^\/\?]+)/);
  if (!tokenMatch) {
    console.error("   ❌ No se pudo extraer el token de la URL");
    return;
  }
  const token = tokenMatch[1];
  console.log(`   Token extraído: ${token.substring(0, 50)}...`);
  console.log("");

  // Validar el token inmediatamente (validación criptográfica)
  console.log("🔍 Validando token criptográficamente...");
  const decoded = validateRecommendationToken(token);
  if (!decoded) {
    console.error("   ❌ Token criptográficamente inválido");
    console.error("   Esto indica que RECOMMENDATION_SECRET no coincide o hay un problema con el token");
    return;
  }
  console.log("   ✅ Token criptográficamente válido:");
  console.log(`      Hyperconnector ID: ${decoded.hyperconnectorId}`);
  console.log(`      Job ID: ${decoded.jobId}`);
  console.log(`      Timestamp: ${new Date(decoded.timestamp).toISOString()}`);
  console.log(`      Edad del token: ${Math.floor((Date.now() - decoded.timestamp) / 1000)} segundos`);
  console.log("");

  // Validar usando la función de dominio (incluye validación en BD)
  console.log("🔍 Validando token usando validateRecommendationLink (incluye BD)...");
  const linkData = await validateRecommendationLink(token);
  if (!linkData) {
    console.error("   ❌ Token inválido según validateRecommendationLink");
    console.error("   Esto puede indicar que el token no está en la BD o expiró");
    return;
  }
  console.log("   ✅ Token válido según validateRecommendationLink:");
  console.log(`      Hyperconnector ID: ${linkData.hyperconnectorId}`);
  console.log(`      Job ID: ${linkData.jobId}`);
  console.log("");

  // Probar el endpoint de la API
  console.log("🌐 Probando endpoint de la API...");
  const apiUrl = `${baseUrl}/api/recommend/get?token=${token}`;
  console.log(`   URL de la API: ${apiUrl}`);
  
  try {
    const response = await fetch(apiUrl);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Error en la API: ${errorText}`);
    } else {
      const data = await response.json();
      console.log("   ✅ Respuesta exitosa de la API:");
      console.log(`      Job: ${data.job?.job_title || "N/A"}`);
      console.log(`      Hyperconnector: ${data.hyperconnector?.full_name || "N/A"}`);
    }
  } catch (error: any) {
    console.error(`   ❌ Error al llamar a la API: ${error.message}`);
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("✅ PRUEBA COMPLETADA");
  console.log("=".repeat(70));
  console.log("");
  console.log("📋 RESUMEN:");
  console.log(`   Link generado: ${url}`);
  console.log(`   Token: ${token}`);
  console.log("");
  console.log("💡 Si el token sigue fallando:");
  console.log("   1. Verifica que RECOMMENDATION_SECRET esté configurado en Vercel");
  console.log("   2. Verifica que el secret sea el mismo en local y producción");
  console.log("   3. Regenera los links después de configurar el secret");
}

testRecommendationLink().catch(console.error);

