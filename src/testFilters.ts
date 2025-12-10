/**
 * Script de prueba para verificar que los filtros funcionen correctamente:
 * - match_score > 60%
 * - match_source != 'auto'
 * - WhatsApp solo muestra los 3 candidatos más altos
 * 
 * Usage: npm run test:filters <job_id> <hyperconnector_id>
 * Ejemplo: npm run test:filters 12cb6910-8019-449e-ae27-b1fb14a8cf6f <hci-id>
 */

import "./config/env";
import { getRecommendableCandidatesForHyperconnector } from "./domain/hyperconnectorCandidates";
import { supabase } from "./db/supabaseClient";

async function testFilters(jobId: string, hyperconnectorId: string) {
  try {
    console.log("=".repeat(80));
    console.log("🧪 PRUEBA DE FILTROS");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📋 Job ID: ${jobId}`);
    console.log(`👤 Hyperconnector ID: ${hyperconnectorId}`);
    console.log("");

    // Paso 1: Obtener todos los matches del job (sin filtrar)
    console.log("=".repeat(80));
    console.log("📊 PASO 1: Matches en job_candidate_matches (sin filtrar)");
    console.log("=".repeat(80));
    console.log("");

    const { data: allMatches, error: matchesError } = await supabase
      .from("job_candidate_matches")
      .select("candidate_id, match_score, match_source")
      .eq("job_id", jobId);

    if (matchesError) {
      throw new Error(`Error obteniendo matches: ${matchesError.message}`);
    }

    console.log(`   Total de matches encontrados: ${allMatches?.length || 0}`);
    console.log("");

    if (allMatches && allMatches.length > 0) {
      const matchesBySource = new Map<string, number>();
      const matchesByScore = {
        "> 60%": 0,
        "= 60%": 0,
        "< 60%": 0,
      };

      allMatches.forEach((m: any) => {
        const source = m.match_source || "unknown";
        matchesBySource.set(source, (matchesBySource.get(source) || 0) + 1);

        const score = m.match_score || 0;
        if (score > 60) matchesByScore["> 60%"]++;
        else if (score === 60) matchesByScore["= 60%"]++;
        else matchesByScore["< 60%"]++;
      });

      console.log("   📈 Distribución por fuente:");
      matchesBySource.forEach((count, source) => {
        console.log(`      - ${source}: ${count}`);
      });
      console.log("");

      console.log("   📈 Distribución por puntaje:");
      console.log(`      - > 60%: ${matchesByScore["> 60%"]}`);
      console.log(`      - = 60%: ${matchesByScore["= 60%"]}`);
      console.log(`      - < 60%: ${matchesByScore["< 60%"]}`);
      console.log("");

      // Mostrar algunos ejemplos
      console.log("   📋 Ejemplos de matches (primeros 5):");
      allMatches.slice(0, 5).forEach((m: any, idx: number) => {
        console.log(`      ${idx + 1}. Candidate ${m.candidate_id.substring(0, 8)}... - Score: ${m.match_score}% (${m.match_source || 'N/A'})`);
      });
      console.log("");
    }

    // Paso 2: Obtener candidatos del hyperconnector
    console.log("=".repeat(80));
    console.log("👥 PASO 2: Candidatos del hyperconnector");
    console.log("=".repeat(80));
    console.log("");

    const { data: hciCandidates, error: hciError } = await supabase
      .from("hyperconnector_candidates")
      .select("candidate_id")
      .eq("hyperconnector_id", hyperconnectorId);

    if (hciError) {
      throw new Error(`Error obteniendo candidatos del hyperconnector: ${hciError.message}`);
    }

    console.log(`   Total de candidatos del hyperconnector: ${hciCandidates?.length || 0}`);
    console.log("");

    // Paso 3: Obtener candidatos recomendables (con filtros aplicados)
    console.log("=".repeat(80));
    console.log("✅ PASO 3: Candidatos recomendables (CON FILTROS)");
    console.log("=".repeat(80));
    console.log("");
    console.log("   Filtros aplicados:");
    console.log("   - match_score > 60% (estricto: mayor a 60, no igual)");
    console.log("   - match_source != 'auto'");
    console.log("");

    const recommendableCandidates = await getRecommendableCandidatesForHyperconnector(
      jobId,
      hyperconnectorId
    );

    console.log(`   ✅ Candidatos recomendables encontrados: ${recommendableCandidates.length}`);
    console.log("");

    if (recommendableCandidates.length > 0) {
      console.log("   📋 Lista de candidatos recomendables:");
      recommendableCandidates.forEach((c, idx) => {
        console.log(`      ${idx + 1}. ${c.full_name}`);
        console.log(`         - Score: ${c.match_score}%`);
        console.log(`         - Source: ${c.match_source || 'N/A'}`);
        console.log(`         - Company: ${c.current_company || 'N/A'}`);
        console.log(`         - Shared Experience: ${c.shared_experience || 'N/A'}`);
        console.log("");
      });

      // Verificar que todos cumplan los criterios
      console.log("   🔍 Verificación de filtros:");
      let allValid = true;
      recommendableCandidates.forEach((c, idx) => {
        const score = c.match_score || 0;
        const source = c.match_source || 'auto';
        const isValid = score > 60 && source !== 'auto';
        
        if (!isValid) {
          allValid = false;
          console.log(`      ❌ ${c.full_name}: Score ${score}% (debe ser > 60), Source ${source} (debe ser != 'auto')`);
        }
      });

      if (allValid) {
        console.log("      ✅ Todos los candidatos cumplen los criterios de filtrado");
      }
      console.log("");

      // Mostrar los top 3 para WhatsApp
      console.log("   📱 Top 3 candidatos para WhatsApp:");
      const top3 = recommendableCandidates.slice(0, 3);
      top3.forEach((c, idx) => {
        console.log(`      ${idx + 1}. ${c.full_name} (${c.match_score}%)`);
      });
      console.log("");
    } else {
      console.log("   ⚠️  No hay candidatos recomendables que cumplan los criterios");
      console.log("");
      console.log("   💡 Posibles razones:");
      console.log("      - No hay matches con score > 60%");
      console.log("      - Todos los matches tienen source = 'auto'");
      console.log("      - No hay intersección entre candidatos del hyperconnector y matches del job");
      console.log("");
    }

    // Paso 4: Resumen
    console.log("=".repeat(80));
    console.log("📊 RESUMEN");
    console.log("=".repeat(80));
    console.log("");
    console.log(`   Total matches en job: ${allMatches?.length || 0}`);
    console.log(`   Candidatos del hyperconnector: ${hciCandidates?.length || 0}`);
    console.log(`   Candidatos recomendables (filtrados): ${recommendableCandidates.length}`);
    console.log(`   Top 3 para WhatsApp: ${Math.min(3, recommendableCandidates.length)}`);
    console.log("");

  } catch (error: any) {
    console.error("");
    console.error("=".repeat(80));
    console.error("❌ ERROR EN LA PRUEBA");
    console.error("=".repeat(80));
    console.error("");
    console.error(`Error: ${error.message}`);
    console.error("");
    if (error.stack) {
      console.error("Stack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("❌ Error: Se requieren 2 argumentos");
  console.error("");
  console.error("Usage: npm run test:filters <job_id> <hyperconnector_id>");
  console.error("");
  console.error("Ejemplo:");
  console.error("  npm run test:filters 12cb6910-8019-449e-ae27-b1fb14a8cf6f <hci-id>");
  process.exit(1);
}

const [jobId, hyperconnectorId] = args;
testFilters(jobId, hyperconnectorId);

