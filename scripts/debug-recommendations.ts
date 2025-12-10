import { supabase } from "../src/db/supabaseClient";
import { getRecommendableCandidatesForHyperconnector } from "../src/domain/hyperconnectorCandidates";
import dotenv from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const hyperconnectorId = "39e4f352-9b4e-4132-b88a-6563490a52ef";
const jobId = "1bc70ebc-0c10-4bb8-b641-313737b99abe";

async function debugRecommendations() {
  console.log("=".repeat(70));
  console.log("🔍 DIAGNÓSTICO DE RECOMENDACIONES");
  console.log("=".repeat(70));
  console.log(`Hyperconnector ID: ${hyperconnectorId}`);
  console.log(`Job ID: ${jobId}`);
  console.log("");

  // 1. Verificar que el hyperconnector existe
  console.log("1️⃣ Verificando hyperconnector...");
  const { data: hci, error: hciError } = await supabase
    .from("hyperconnectors")
    .select("id, full_name, email")
    .eq("id", hyperconnectorId)
    .single();

  if (hciError || !hci) {
    console.error("   ❌ Hyperconnector no encontrado:", hciError?.message);
    return;
  }
  console.log(`   ✅ Hyperconnector encontrado: ${hci.full_name} (${hci.email || "sin email"})`);
  console.log("");

  // 2. Verificar relaciones hyperconnector_candidates
  console.log("2️⃣ Verificando relaciones hyperconnector_candidates...");
  const { data: hciCandidates, error: hciCandidatesError } = await supabase
    .from("hyperconnector_candidates")
    .select("candidate_id, relationship_type, relationship_source, confidence_score")
    .eq("hyperconnector_id", hyperconnectorId);

  if (hciCandidatesError) {
    console.error("   ❌ Error obteniendo relaciones:", hciCandidatesError.message);
    return;
  }

  console.log(`   📊 Total de relaciones encontradas: ${hciCandidates?.length || 0}`);
  if (hciCandidates && hciCandidates.length > 0) {
    console.log("   Primeras 5 relaciones:");
    hciCandidates.slice(0, 5).forEach((rel, idx) => {
      console.log(`      ${idx + 1}. Candidate ID: ${rel.candidate_id}, Tipo: ${rel.relationship_type}, Source: ${rel.relationship_source}`);
    });
  } else {
    console.log("   ⚠️  No hay relaciones en hyperconnector_candidates para este hyperconnector");
  }
  console.log("");

  // 3. Verificar matches job_candidate_matches
  console.log("3️⃣ Verificando matches job_candidate_matches...");
  const { data: jobMatches, error: jobMatchesError } = await supabase
    .from("job_candidate_matches")
    .select("candidate_id, match_score, match_source")
    .eq("job_id", jobId);

  if (jobMatchesError) {
    console.error("   ❌ Error obteniendo matches:", jobMatchesError.message);
    return;
  }

  console.log(`   📊 Total de matches encontrados para el job: ${jobMatches?.length || 0}`);
  if (jobMatches && jobMatches.length > 0) {
    console.log("   Primeros 10 matches:");
    jobMatches.slice(0, 10).forEach((match, idx) => {
      console.log(`      ${idx + 1}. Candidate ID: ${match.candidate_id}, Score: ${match.match_score}%, Source: ${match.match_source}`);
    });
  } else {
    console.log("   ⚠️  No hay matches en job_candidate_matches para este job");
  }
  console.log("");

  // 4. Verificar intersección (candidatos que están en ambas tablas)
  const hciCandidateIds = new Set(hciCandidates?.map(r => r.candidate_id) || []);
  const jobCandidateIds = new Set(jobMatches?.map(m => m.candidate_id) || []);
  const intersection = [...hciCandidateIds].filter(id => jobCandidateIds.has(id));

  console.log("4️⃣ Intersección (candidatos en ambas tablas):");
  console.log(`   📊 Candidatos en hyperconnector_candidates: ${hciCandidateIds.size}`);
  console.log(`   📊 Candidatos en job_candidate_matches: ${jobCandidateIds.size}`);
  console.log(`   📊 Candidatos en ambas (intersección): ${intersection.length}`);
  if (intersection.length > 0) {
    console.log("   IDs de candidatos en intersección:");
    intersection.slice(0, 10).forEach((id, idx) => {
      const match = jobMatches?.find(m => m.candidate_id === id);
      console.log(`      ${idx + 1}. ${id} - Score: ${match?.match_score}%, Source: ${match?.match_source}`);
    });
  }
  console.log("");

  // 5. Aplicar filtros (score > 60 y source != 'auto')
  console.log("5️⃣ Aplicando filtros (score > 60 y source != 'auto'):");
  const MIN_MATCH_SCORE = 60;
  const filtered = intersection.filter(candidateId => {
    const match = jobMatches?.find(m => m.candidate_id === candidateId);
    if (!match) return false;
    const score = match.match_score;
    const source = match.match_source;
    const passes = score !== undefined && score > MIN_MATCH_SCORE && source !== 'auto';
    if (!passes) {
      console.log(`   ❌ Filtrado: ${candidateId} - Score: ${score}%, Source: ${source}`);
    }
    return passes;
  });

  console.log(`   📊 Candidatos que pasan los filtros: ${filtered.length}`);
  if (filtered.length > 0) {
    console.log("   ✅ Candidatos que pasan:");
    filtered.forEach((id, idx) => {
      const match = jobMatches?.find(m => m.candidate_id === id);
      console.log(`      ${idx + 1}. ${id} - Score: ${match?.match_score}%, Source: ${match?.match_source}`);
    });
  } else {
    console.log("   ⚠️  Ningún candidato pasa los filtros estrictos");
    console.log("   💡 Posibles causas:");
    console.log("      - match_score <= 60");
    console.log("      - match_source = 'auto'");
    console.log("      - No hay intersección entre las tablas");
  }
  console.log("");

  // 6. Llamar a la función real
  console.log("6️⃣ Llamando a getRecommendableCandidatesForHyperconnector...");
  try {
    const result = await getRecommendableCandidatesForHyperconnector(jobId, hyperconnectorId);
    console.log(`   📊 Resultado: ${result.length} candidatos`);
    if (result.length > 0) {
      result.forEach((c, idx) => {
        console.log(`      ${idx + 1}. ${c.full_name} - Score: ${c.match_score}%, Source: ${c.match_source}`);
      });
    } else {
      console.log("   ⚠️  La función retorna 0 candidatos");
    }
  } catch (error: any) {
    console.error("   ❌ Error:", error.message);
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("✅ DIAGNÓSTICO COMPLETADO");
  console.log("=".repeat(70));
}

debugRecommendations().catch(console.error);

