import "./config/env";
import { supabase } from "./db/supabaseClient";
import { generateRecommendationUrl } from "./utils/recommendationTokens";
import { createRecommendationLink } from "./domain/recommendationLinks";

const EMILIO_CANDIDATE_ID = "07a27df4-23f6-43b7-9724-9f082e5debb2";

async function generateEmilioLink() {
  console.log("🔍 Buscando hyperconnector de Emilio...");
  
  // Buscar hyperconnector vinculado a Emilio
  const { data: hyperconnector, error } = await supabase
    .from("hyperconnectors")
    .select("id, full_name, candidate_id")
    .eq("candidate_id", EMILIO_CANDIDATE_ID)
    .maybeSingle();

  if (error || !hyperconnector) {
    console.error("❌ No se encontró hyperconnector para Emilio");
    console.error("Error:", error?.message);
    return;
  }

  console.log(`✅ Hyperconnector encontrado: ${hyperconnector.full_name} (${hyperconnector.id})`);

  // Buscar cualquier job para generar el token (el token es válido para el hub)
  // Si no hay jobs, usamos un job ID dummy - el endpoint del hub solo necesita validar el token
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .limit(1);

  let jobId: string;
  if (!jobs || jobs.length === 0) {
    console.log("⚠️ No hay jobs, usando job ID dummy para generar token...");
    // Usar un UUID dummy - el endpoint validará el token y obtendrá los jobs del hyperconnector
    jobId = "00000000-0000-0000-0000-000000000000";
  } else {
    jobId = jobs[0].id;
  }

  // Crear el link en la BD (esto genera el token y lo guarda)
  try {
    console.log("📝 Creando link en recommendation_links...");
    const linkData = await createRecommendationLink(hyperconnector.id, jobId);
    const token = linkData.token;
    
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const hubUrl = `${baseUrl}/hyperconnector/jobs-home?token=${token}`;
    
    console.log("\n" + "=".repeat(70));
    console.log("🔗 LINK PARA EL TALENT CUPID HUB DE EMILIO:");
    console.log("=".repeat(70));
    console.log(hubUrl);
    console.log("=".repeat(70));
    console.log("\n✅ Token guardado en recommendation_links y válido por 30 días");
    console.log("💡 El endpoint del hub validará el token y mostrará todos los jobs");
    console.log("   donde Emilio tiene candidatos elegibles.\n");
  } catch (error: any) {
    console.error("❌ Error creando link en BD:", error.message);
    console.log("\n⚠️ Intentando generar token sin guardarlo en BD...");
    
    // Fallback: generar token sin guardarlo
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const url = generateRecommendationUrl(hyperconnector.id, jobId, baseUrl);
    const token = url.split("/recommend/")[1];
    const hubUrl = `${baseUrl}/hyperconnector/jobs-home?token=${token}`;
    
    console.log("\n" + "=".repeat(70));
    console.log("🔗 LINK GENERADO (sin guardar en BD):");
    console.log("=".repeat(70));
    console.log(hubUrl);
    console.log("=".repeat(70));
    console.log("\n⚠️ Este link puede no funcionar si la validación requiere la tabla recommendation_links\n");
  }
}

generateEmilioLink();

