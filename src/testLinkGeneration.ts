console.log("🚀 Iniciando test de generación de link...");

import "./config/env";
import { supabase } from "./db/supabaseClient";
import { createRecommendationLink } from "./domain/recommendationLinks";

const EMILIO_CANDIDATE_ID = "07a27df4-23f6-43b7-9724-9f082e5debb2";

async function test() {
  try {
    console.log("1️⃣ Buscando hyperconnector...");
    
    const { data: hyperconnector, error } = await supabase
      .from("hyperconnectors")
      .select("id, full_name, candidate_id")
      .eq("candidate_id", EMILIO_CANDIDATE_ID)
      .maybeSingle();

    if (error) {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }

    if (!hyperconnector) {
      console.error("❌ No se encontró hyperconnector");
      process.exit(1);
    }

    console.log(`✅ Hyperconnector: ${hyperconnector.full_name} (${hyperconnector.id})`);

    console.log("2️⃣ Buscando job...");
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id")
      .limit(1);

    const jobId = jobs && jobs.length > 0 ? jobs[0].id : "00000000-0000-0000-0000-000000000000";
    console.log(`✅ Job ID: ${jobId}`);

    console.log("3️⃣ Creando link...");
    const linkData = await createRecommendationLink(hyperconnector.id, jobId);
    const token = linkData.token;
    
    console.log(`✅ Token generado: ${token.substring(0, 50)}...`);
    
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const hubUrl = `${baseUrl}/hyperconnector/jobs-home?token=${token}`;
    
    console.log("\n" + "=".repeat(70));
    console.log("🔗 LINK:");
    console.log(hubUrl);
    console.log("=".repeat(70));
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

test();

