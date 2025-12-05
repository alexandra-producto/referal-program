/**
 * Script para ejecutar matching entre candidatos vinculados a hyperconnectors
 * y todos los jobs abiertos en producción
 * 
 * Usage: npm run match:hci-candidates
 */

import "./config/env";
import { matchJobCandidate } from "./agents/matchJobCandidate";
import { supabase } from "./db/supabaseClient";

async function matchHyperconnectorCandidates() {
  try {
    console.log("=".repeat(80));
    console.log("🚀 MATCHING: Candidatos vinculados a Hyperconnectors ↔ Jobs Abiertos");
    console.log("=".repeat(80));
    console.log("");

    // Paso 1: Obtener candidatos vinculados a hyperconnectors
    console.log("📋 PASO 1: Obteniendo candidatos vinculados a hyperconnectors...");
    const { data: hciCandidates, error: hciError } = await supabase
      .from("hyperconnector_candidates")
      .select("candidate_id");

    if (hciError) {
      throw new Error(`Error obteniendo candidatos de hyperconnectors: ${hciError.message}`);
    }

    if (!hciCandidates || hciCandidates.length === 0) {
      console.log("❌ No se encontraron candidatos vinculados a hyperconnectors.");
      return;
    }

    const uniqueCandidateIds = [...new Set(hciCandidates.map((hc: any) => hc.candidate_id))];
    console.log(`   ✅ Candidatos únicos vinculados a hyperconnectors: ${uniqueCandidateIds.length}`);
    console.log("");

    // Paso 2: Obtener información de los candidatos
    console.log("👥 PASO 2: Obteniendo información de los candidatos...");
    const { data: candidates, error: candidatesError } = await supabase
      .from("candidates")
      .select("id, full_name, email, current_company, current_job_title")
      .in("id", uniqueCandidateIds);

    if (candidatesError) {
      throw new Error(`Error obteniendo información de candidatos: ${candidatesError.message}`);
    }

    if (!candidates || candidates.length === 0) {
      console.log("❌ No se encontró información de los candidatos.");
      return;
    }

    console.log(`   ✅ Información de candidatos obtenida: ${candidates.length}`);
    candidates.forEach((c: any) => {
      console.log(`      - ${c.full_name} (${c.email || 'sin email'}) - ${c.current_company || 'sin empresa'}`);
    });
    console.log("");

    // Paso 3: Obtener jobs abiertos
    console.log("📋 PASO 3: Obteniendo jobs abiertos...");
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, job_title, company_name, status")
      .not("status", "in", "('hired', 'all_recommendations_rejected')");

    if (jobsError) {
      throw new Error(`Error obteniendo jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log("❌ No se encontraron jobs abiertos.");
      return;
    }

    console.log(`   ✅ Jobs abiertos encontrados: ${jobs.length}`);
    jobs.forEach((job: any) => {
      console.log(`      - ${job.job_title} (${job.company_name}) - Status: ${job.status}`);
    });
    console.log("");

    // Paso 4: Ejecutar matching
    console.log("=".repeat(80));
    console.log("🔄 PASO 4: Ejecutando matching...");
    console.log("=".repeat(80));
    console.log(`   Total de matches a calcular: ${candidates.length * jobs.length}`);
    console.log("");

    const matchResults: Array<{
      candidateId: string;
      candidateName: string;
      jobId: string;
      jobTitle: string;
      score: number;
    }> = [];

    let totalProcessed = 0;
    let successCount = 0;
    let errorCount = 0;

    // Procesar en batches más pequeños y con delays para evitar rate limiting
    const batchSize = 2; // Reducido de 5 a 2 para evitar rate limits
    const delayBetweenBatches = 3000; // 3 segundos entre batches para respetar rate limits
    const delayBetweenMatches = 500; // 500ms entre matches individuales

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      console.log(`\n   🔍 Procesando candidato ${i + 1}/${candidates.length}: ${candidate.full_name}`);

      for (let j = 0; j < jobs.length; j += batchSize) {
        const jobBatch = jobs.slice(j, j + batchSize);

        // Procesar matches secuencialmente con delay para evitar rate limits
        for (let k = 0; k < jobBatch.length; k++) {
          const job = jobBatch[k];
          try {
            totalProcessed++;
            // FORZAR uso de AI matching explícitamente
            const result = await matchJobCandidate(job.id, candidate.id, { useAI: true });
            successCount++;

            // Verificar que el match_source sea "openai-gpt4o" y no "auto"
            const { data: dbMatch } = await supabase
              .from("job_candidate_matches")
              .select("match_source")
              .eq("job_id", job.id)
              .eq("candidate_id", candidate.id)
              .single();

            if (dbMatch && dbMatch.match_source !== "openai-gpt4o") {
              console.warn(`      ⚠️  Match usado fallback 'auto' en lugar de AI para ${candidate.full_name} ↔ ${job.job_title}`);
            }

            if (result.score > 0) {
              matchResults.push({
                candidateId: candidate.id,
                candidateName: candidate.full_name,
                jobId: job.id,
                jobTitle: job.job_title,
                score: result.score,
              });

              const source = dbMatch?.match_source || "unknown";
              console.log(`      ✅ Match: ${candidate.full_name} ↔ ${job.job_title} → ${result.score}% (${source})`);
            }
            
            // Delay entre matches para evitar rate limiting (excepto el último del batch)
            if (k < jobBatch.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, delayBetweenMatches));
            }
          } catch (error: any) {
            errorCount++;
            console.error(`      ❌ Error matching ${candidate.full_name} con ${job.job_title}:`, error.message);
            // Mostrar más detalles del error para debugging
            if (error.stack) {
              console.error(`      Stack: ${error.stack.substring(0, 200)}...`);
            }
            // Si es un error de rate limit, esperar más tiempo
            if (error.message.includes("429") || error.message.includes("rate limit")) {
              console.warn(`      ⏳ Rate limit detectado, esperando 5 segundos antes de continuar...`);
              await new Promise((resolve) => setTimeout(resolve, 5000));
            }
          }
        }

        // Delay entre batches para evitar rate limiting
        if (j + batchSize < jobs.length) {
          console.log(`      ⏳ Esperando ${delayBetweenBatches / 1000}s antes del siguiente batch (rate limiting)...`);
          await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
        }

        console.log(`      📊 Procesados ${Math.min(j + batchSize, jobs.length)}/${jobs.length} jobs para este candidato`);
      }
    }

    // Paso 5: Resumen de resultados
    console.log("");
    console.log("=".repeat(80));
    console.log("📊 PASO 5: Resumen de Matches");
    console.log("=".repeat(80));
    console.log("");

    const matchesAbove60 = matchResults.filter((m) => m.score >= 60);
    const matchesAbove50 = matchResults.filter((m) => m.score >= 50 && m.score < 60);
    const matchesBelow50 = matchResults.filter((m) => m.score < 50);

    console.log(`   ✅ Total procesados: ${totalProcessed}`);
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📊 Matches encontrados: ${matchResults.length}`);
    console.log("");

    if (matchesAbove60.length > 0) {
      console.log(`   🎯 Matches >= 60%: ${matchesAbove60.length}`);
      matchesAbove60
        .sort((a, b) => b.score - a.score)
        .forEach((m) => {
          console.log(`      - ${m.candidateName} ↔ ${m.jobTitle}: ${m.score}%`);
        });
      console.log("");
    }

    if (matchesAbove50.length > 0) {
      console.log(`   ⚠️  Matches 50-59%: ${matchesAbove50.length}`);
      matchesAbove50
        .sort((a, b) => b.score - a.score)
        .slice(0, 10) // Mostrar solo los top 10
        .forEach((m) => {
          console.log(`      - ${m.candidateName} ↔ ${m.jobTitle}: ${m.score}%`);
        });
      console.log("");
    }

    if (matchesBelow50.length > 0) {
      console.log(`   📉 Matches < 50%: ${matchesBelow50.length}`);
      console.log("");
    }

    // Paso 6: Verificar matches en BD
    console.log("=".repeat(80));
    console.log("🔍 PASO 6: Verificando matches guardados en BD...");
    console.log("=".repeat(80));
    console.log("");

    if (matchResults.length > 0) {
      const jobIds = [...new Set(matchResults.map((m) => m.jobId))];
      const candidateIds = [...new Set(matchResults.map((m) => m.candidateId))];

      const { data: dbMatches, error: dbMatchesError } = await supabase
        .from("job_candidate_matches")
        .select("job_id, candidate_id, match_score, match_source")
        .in("job_id", jobIds)
        .in("candidate_id", candidateIds)
        .gte("match_score", 50)
        .order("match_score", { ascending: false });

      if (dbMatchesError) {
        console.error(`   ❌ Error obteniendo matches de BD: ${dbMatchesError.message}`);
      } else {
        console.log(`   ✅ Matches >= 50% encontrados en BD: ${dbMatches?.length || 0}`);
        
        // Contar matches por fuente
        const aiMatches = dbMatches?.filter((m: any) => m.match_source === "openai-gpt4o") || [];
        const autoMatches = dbMatches?.filter((m: any) => m.match_source === "auto") || [];
        
        console.log(`   🤖 Matches con AI (openai-gpt4o): ${aiMatches.length}`);
        console.log(`   ⚙️  Matches con fallback (auto): ${autoMatches.length}`);
        
        if (autoMatches.length > 0) {
          console.warn(`   ⚠️  ADVERTENCIA: ${autoMatches.length} matches usaron fallback 'auto' en lugar de AI matching`);
          console.warn(`      Esto puede indicar errores en el AI matching que necesitan ser corregidos`);
        }
        
        if (dbMatches && dbMatches.length > 0) {
          const topMatches = dbMatches.slice(0, 10);
          topMatches.forEach((match: any) => {
            const candidate = candidates.find((c: any) => c.id === match.candidate_id);
            const job = jobs.find((j: any) => j.id === match.job_id);
            if (candidate && job) {
              const sourceIcon = match.match_source === "openai-gpt4o" ? "🤖" : "⚙️";
              console.log(`      ${sourceIcon} ${candidate.full_name} ↔ ${job.job_title}: ${match.match_score}% (${match.match_source})`);
            }
          });
        }
      }
    }

    console.log("");
    console.log("=".repeat(80));
    console.log("✅ MATCHING COMPLETADO");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📊 Resumen:`);
    console.log(`   - Candidatos procesados: ${candidates.length}`);
    console.log(`   - Jobs procesados: ${jobs.length}`);
    console.log(`   - Matches >= 60%: ${matchesAbove60.length}`);
    console.log(`   - Matches >= 50%: ${matchesAbove50.length + matchesAbove60.length}`);
    console.log("");

  } catch (error: any) {
    console.error("");
    console.error("=".repeat(80));
    console.error("❌ ERROR EN EL MATCHING");
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

// Ejecutar el matching
matchHyperconnectorCandidates();

