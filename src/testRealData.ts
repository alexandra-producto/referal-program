import "./config/env";
import { getAllHyperconnectors, getHyperconnectorById } from "./domain/hyperconnectors";
import { getAllCandidates } from "./domain/candidates";
import { getJobById, getJobByCompanyNameLike } from "./domain/jobs";
import { getRecommendableCandidatesForHyperconnector } from "./domain/hyperconnectorCandidates";
import { generateRecommendationUrl } from "./utils/recommendationTokens";
import { supabase } from "./db/supabaseClient";

async function testWithRealData() {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  try {
    console.log("🔍 Buscando datos reales en la base de datos...\n");

    // 1. Buscar a Emilio (hyperconnector)
    console.log("1️⃣ Buscando a Emilio (hyperconnector)...");
    const { data: hcis, error: hciError } = await supabase
      .from("hyperconnectors")
      .select("*")
      .ilike("full_name", "%emilio%");

    if (hciError) throw new Error(`Error buscando hyperconnectors: ${hciError.message}`);
    
    if (!hcis || hcis.length === 0) {
      throw new Error("No se encontró a Emilio en la tabla hyperconnectors");
    }

    const emilio = hcis[0];
    console.log(`   ✅ Encontrado: ${emilio.full_name} (ID: ${emilio.id})\n`);

    // 2. Buscar a Alexandra (candidate)
    console.log("2️⃣ Buscando a Alexandra (candidate)...");
    const { data: candidates, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .ilike("full_name", "%alexandra%");

    if (candidateError) throw new Error(`Error buscando candidates: ${candidateError.message}`);
    
    if (!candidates || candidates.length === 0) {
      throw new Error("No se encontró a Alexandra en la tabla candidates");
    }

    const alexandra = candidates[0];
    console.log(`   ✅ Encontrada: ${alexandra.full_name} (ID: ${alexandra.id})\n`);

    // 3. Verificar relación entre Emilio y Alexandra
    console.log("3️⃣ Verificando relación entre Emilio y Alexandra...");
    const { data: relation, error: relationError } = await supabase
      .from("hyperconnector_candidates")
      .select("*")
      .eq("hyperconnector_id", emilio.id)
      .eq("candidate_id", alexandra.id)
      .maybeSingle();

    if (relationError) {
      console.warn(`   ⚠️ Error verificando relación: ${relationError.message}`);
    }

    if (!relation) {
      console.log("   ⚠️ No hay relación directa registrada. Buscando jobs con candidatos relacionados...\n");
    } else {
      console.log(`   ✅ Relación encontrada: ${relation.shared_experience || "Sin experiencia compartida específica"}\n`);
    }

    // 4. Buscar jobs que tengan matches con Alexandra
    console.log("4️⃣ Buscando jobs relacionados...");
    const { data: jobMatches, error: jobMatchError } = await supabase
      .from("job_candidate_matches")
      .select("job_id, fit_score")
      .eq("candidate_id", alexandra.id)
      .limit(5);

    if (jobMatchError) {
      console.warn(`   ⚠️ Error buscando job matches: ${jobMatchError.message}`);
    }

    let job: any = null;

    if (jobMatches && jobMatches.length > 0) {
      // Buscar el job con mejor match
      const bestMatch = jobMatches.sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0))[0];
      job = await getJobById(bestMatch.job_id);
      console.log(`   ✅ Job encontrado: ${job?.role_title} en ${job?.company_name} (Match: ${bestMatch.fit_score}%)\n`);
    } else {
      // Si no hay matches, buscar cualquier job
      job = await getJobByCompanyNameLike("");
      if (!job) {
        const { data: anyJob } = await supabase
          .from("jobs")
          .select("*")
          .limit(1)
          .maybeSingle();
        job = anyJob;
      }
      
      if (job) {
        console.log(`   ✅ Job encontrado: ${job.role_title} en ${job.company_name}\n`);
      } else {
        throw new Error("No se encontró ningún job en la base de datos");
      }
    }

    // 5. Obtener candidatos recomendables para Emilio en este job
    console.log("5️⃣ Obteniendo candidatos recomendables para Emilio...");
    const recommendableCandidates = await getRecommendableCandidatesForHyperconnector(
      job.id,
      emilio.id
    );

    console.log(`   ✅ Candidatos encontrados: ${recommendableCandidates.length}`);
    recommendableCandidates.forEach((c, i) => {
      console.log(`      ${i + 1}. ${c.full_name}${c.fit_score ? ` (${c.fit_score}% match)` : ""}`);
    });
    console.log("");

    // 6. Generar el link de recomendación
    const recommendUrl = generateRecommendationUrl(emilio.id, job.id, baseUrl);
    const token = recommendUrl.split("/").pop();

    console.log("=".repeat(70));
    console.log("🔗 LINK DE RECOMENDACIÓN GENERADO (DATOS REALES)");
    console.log("=".repeat(70));
    console.log(`\n${recommendUrl}\n`);
    console.log("=".repeat(70));
    console.log("\n📋 Información del link:");
    console.log(`   👤 Hyperconnector: ${emilio.full_name} (${emilio.email || "sin email"})`);
    console.log(`   💼 Job: ${job.role_title} en ${job.company_name}`);
    console.log(`   👥 Candidatos recomendables: ${recommendableCandidates.length}`);
    if (recommendableCandidates.length > 0) {
      console.log(`      - ${recommendableCandidates.map(c => c.full_name).join(", ")}`);
    }
    console.log(`   🔑 Token: ${token?.substring(0, 30)}...`);
    console.log("\n💡 Para probar:");
    console.log(`   1. Asegúrate de que Next.js esté corriendo: npm run next:dev`);
    console.log(`   2. Abre el link en tu navegador: ${recommendUrl}`);
    console.log(`   3. Emilio podrá ver y recomendar a los candidatos\n`);

    // 7. Mostrar información adicional
    if (alexandra && recommendableCandidates.some(c => c.id === alexandra.id)) {
      console.log("✨ Alexandra está en la lista de candidatos recomendables para Emilio!");
    } else if (alexandra) {
      console.log("ℹ️  Nota: Alexandra no aparece en la lista porque:");
      console.log("   - No hay un match entre ella y este job, o");
      console.log("   - No hay relación registrada entre Emilio y Alexandra");
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

testWithRealData();

