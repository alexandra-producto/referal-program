/**
 * Script para listar todos los candidatos de Lucía Bayly que hacen match con un job
 * Muestra trabajo actual y empresa actual de cada candidato
 * 
 * Usage: npm run list:lucia-candidates <job_id>
 */

import "./config/env";
import { getRecommendableCandidatesForHyperconnector } from "./domain/hyperconnectorCandidates";
import { supabase } from "./db/supabaseClient";

async function listLuciaCandidates(jobId: string) {
  try {
    console.log("=".repeat(80));
    console.log("👥 CANDIDATOS DE LUCÍA BAYLY PARA EL JOB");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📋 Job ID: ${jobId}`);
    console.log("");

    // ID de Lucía Bayly
    const luciaId = "eccd2f37-c071-4eda-8e4b-24a8d11c369b";

    // Obtener candidatos recomendables
    const candidates = await getRecommendableCandidatesForHyperconnector(jobId, luciaId);

    console.log(`✅ Candidatos recomendables encontrados: ${candidates.length}`);
    console.log("");
    console.log("=".repeat(80));
    console.log("");

    if (candidates.length === 0) {
      console.log("⚠️  No hay candidatos recomendables que cumplan los criterios:");
      console.log("   - match_score > 60%");
      console.log("   - match_source != 'auto'");
      return;
    }

    // Obtener información detallada de cada candidato
    const candidateIds = candidates.map((c: any) => c.id);
    
    // Obtener experiencias actuales de los candidatos
    const { data: experiences, error: expError } = await supabase
      .from("candidate_experience")
      .select("candidate_id, title, company_name, is_current, start_date, end_date")
      .in("candidate_id", candidateIds)
      .eq("is_current", true)
      .order("start_date", { ascending: false });

    if (expError) {
      console.warn("⚠️  Error obteniendo experiencias:", expError.message);
    }

    // Crear mapa de experiencias por candidato
    const experienceMap = new Map();
    experiences?.forEach((exp: any) => {
      if (!experienceMap.has(exp.candidate_id)) {
        experienceMap.set(exp.candidate_id, exp);
      }
    });

    // Mostrar cada candidato con sus detalles
    candidates.forEach((candidate: any, idx: number) => {
      console.log(`${idx + 1}. ${candidate.full_name}`);
      console.log("   " + "─".repeat(76));
      
      // Match score y source
      console.log(`   📊 Match Score: ${candidate.match_score}%`);
      console.log(`   🔍 Source: ${candidate.match_source || "N/A"}`);
      
      // Experiencia actual
      const currentExp = experienceMap.get(candidate.id);
      if (currentExp) {
        console.log(`   💼 Trabajo Actual: ${currentExp.title || "N/A"}`);
        console.log(`   🏢 Empresa Actual: ${currentExp.company_name || "N/A"}`);
      } else {
        // Fallback a datos del candidato
        console.log(`   💼 Trabajo Actual: ${candidate.current_job_title || "N/A"}`);
        console.log(`   🏢 Empresa Actual: ${candidate.current_company || "N/A"}`);
      }
      
      // Información adicional
      if (candidate.country) {
        console.log(`   🌍 País: ${candidate.country}`);
      }
      if (candidate.industry) {
        console.log(`   🏭 Industria: ${candidate.industry}`);
      }
      if (candidate.shared_experience) {
        console.log(`   🤝 Experiencia Compartida: ${candidate.shared_experience}`);
      }
      
      console.log("");
    });

    console.log("=".repeat(80));
    console.log("📊 RESUMEN");
    console.log("=".repeat(80));
    console.log("");
    console.log(`   Total de candidatos: ${candidates.length}`);
    console.log(`   Score promedio: ${(candidates.reduce((sum: number, c: any) => sum + (c.match_score || 0), 0) / candidates.length).toFixed(2)}%`);
    console.log(`   Score más alto: ${Math.max(...candidates.map((c: any) => c.match_score || 0))}%`);
    console.log(`   Score más bajo: ${Math.min(...candidates.map((c: any) => c.match_score || 0))}%`);
    console.log("");

  } catch (error: any) {
    console.error("");
    console.error("=".repeat(80));
    console.error("❌ ERROR");
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
if (args.length < 1) {
  console.error("❌ Error: Se requiere 1 argumento");
  console.error("");
  console.error("Usage: npm run list:lucia-candidates <job_id>");
  console.error("");
  console.error("Ejemplo:");
  console.error("  npm run list:lucia-candidates 12cb6910-8019-449e-ae27-b1fb14a8cf6f");
  process.exit(1);
}

const [jobId] = args;
listLuciaCandidates(jobId);

