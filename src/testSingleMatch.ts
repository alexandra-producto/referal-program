/**
 * Script para testear un match específico con logging detallado
 * 
 * Usage: npm run test:single-match <job_id> <candidate_id>
 * Ejemplo: npm run test:single-match 3a78065b-e350-4257-88ac-81009d17666f 3aec8129-bc96-4058-aad4-d8660cde993b
 */

import "./config/env";
import { matchJobCandidate } from "./agents/matchJobCandidate";
import { supabase } from "./db/supabaseClient";
import { getJobById } from "./domain/jobs";
import { getCandidateById } from "./domain/candidates";
import { getExperienceForCandidate } from "./domain/candidateExperience";

async function testSingleMatch(jobId: string, candidateId: string) {
  try {
    console.log("=".repeat(80));
    console.log("🔍 TEST: Match Específico con Logging Detallado");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📋 Job ID: ${jobId}`);
    console.log(`👤 Candidate ID: ${candidateId}`);
    console.log("");

    // Paso 1: Obtener información del job
    console.log("=".repeat(80));
    console.log("📋 PASO 1: Información del Job");
    console.log("=".repeat(80));
    const job = await getJobById(jobId);
    if (!job) {
      throw new Error(`Job no encontrado: ${jobId}`);
    }
    console.log(`   Título: ${job.job_title}`);
    console.log(`   Empresa: ${job.company_name}`);
    console.log(`   Nivel: ${job.job_level || job.requirements_json?.seniority || "No especificado"}`);
    console.log(`   Ubicación: ${job.location || "No especificado"}`);
    console.log(`   Remoto: ${job.remote_ok ? "Sí" : "No"}`);
    console.log(`   Descripción: ${job.description?.substring(0, 200)}...`);
    console.log("");
    if (job.requirements_json) {
      const req = typeof job.requirements_json === 'string' 
        ? JSON.parse(job.requirements_json) 
        : job.requirements_json;
      console.log(`   Skills requeridos (must_have): ${req.must_have_skills?.join(", ") || "No especificado"}`);
      console.log(`   Skills deseables (nice_to_have): ${req.nice_to_have_skills?.join(", ") || "No especificado"}`);
      console.log(`   Industrias: ${req.industries?.join(", ") || "No especificado"}`);
      console.log(`   Idiomas: ${req.languages?.join(", ") || "No especificado"}`);
      console.log(`   Preferencias de ubicación: ${req.location_preference?.join(", ") || "No especificado"}`);
    }
    console.log("");

    // Paso 2: Obtener información del candidato
    console.log("=".repeat(80));
    console.log("👤 PASO 2: Información del Candidato");
    console.log("=".repeat(80));
    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      throw new Error(`Candidato no encontrado: ${candidateId}`);
    }
    console.log(`   Nombre: ${candidate.full_name}`);
    console.log(`   Email: ${candidate.email || "No especificado"}`);
    console.log(`   Rol actual: ${candidate.current_job_title || "No especificado"}`);
    console.log(`   Empresa actual: ${candidate.current_company || "No especificado"}`);
    console.log(`   Industria: ${candidate.industry || "No especificado"}`);
    console.log(`   Seniority: ${candidate.seniority || "No especificado"}`);
    console.log(`   Ubicación: ${candidate.location || "No especificado"}`);
    console.log(`   Idiomas: ${candidate.languages?.join(", ") || "No especificado"}`);
    console.log("");

    // Paso 3: Obtener experiencia del candidato
    console.log("=".repeat(80));
    console.log("💼 PASO 3: Experiencia Laboral del Candidato");
    console.log("=".repeat(80));
    const experiences = await getExperienceForCandidate(candidateId);
    if (!experiences || experiences.length === 0) {
      console.log("   ⚠️  No se encontró experiencia laboral");
    } else {
      console.log(`   Total de experiencias: ${experiences.length}`);
      experiences.forEach((exp: any, idx: number) => {
        console.log(`   ${idx + 1}. ${exp.role_title || "Sin título"} en ${exp.company_name || "Sin empresa"}`);
        console.log(`      Período: ${exp.start_date} - ${exp.end_date || "Actualidad"}`);
        console.log(`      Descripción: ${exp.description?.substring(0, 150) || "Sin descripción"}...`);
        console.log("");
      });
    }
    console.log("");

    // Paso 4: Verificar match de rol
    console.log("=".repeat(80));
    console.log("🎯 PASO 4: Verificación de Match de Rol");
    console.log("=".repeat(80));
    const candidateRole = candidate.current_job_title?.toLowerCase() || "";
    const jobRole = job.job_title?.toLowerCase() || "";
    console.log(`   Rol del candidato: ${candidate.current_job_title || "No especificado"}`);
    console.log(`   Rol requerido: ${job.job_title}`);
    console.log("");
    
    // Análisis básico de match de rol
    const roleKeywords = {
      "product manager": ["product manager", "pm", "product owner"],
      "engineer": ["engineer", "developer", "programmer", "software engineer", "backend", "frontend", "fullstack"],
      "data scientist": ["data scientist", "data analyst", "ml engineer"],
      "designer": ["designer", "ux", "ui", "product designer"],
      "marketing": ["marketing", "growth", "brand"],
      "sales": ["sales", "business development", "account manager"]
    };
    
    let candidateRoleType = "unknown";
    let jobRoleType = "unknown";
    
    for (const [type, keywords] of Object.entries(roleKeywords)) {
      if (keywords.some(kw => candidateRole.includes(kw))) {
        candidateRoleType = type;
      }
      if (keywords.some(kw => jobRole.includes(kw))) {
        jobRoleType = type;
      }
    }
    
    console.log(`   Tipo de rol del candidato: ${candidateRoleType}`);
    console.log(`   Tipo de rol requerido: ${jobRoleType}`);
    
    if (candidateRoleType !== jobRoleType && candidateRoleType !== "unknown" && jobRoleType !== "unknown") {
      console.log(`   ⚠️  ADVERTENCIA: No hay match de tipo de rol!`);
      console.log(`      Esto debería resultar en un score bajo (0-40%)`);
    } else if (candidateRoleType === jobRoleType) {
      console.log(`   ✅ Hay match de tipo de rol`);
    } else {
      console.log(`   ℹ️  No se pudo determinar el tipo de rol automáticamente`);
    }
    console.log("");

    // Paso 5: Ejecutar matching
    console.log("=".repeat(80));
    console.log("🔄 PASO 5: Ejecutando Matching");
    console.log("=".repeat(80));
    console.log("");
    
    console.log("   🤖 Intentando con AI matching (OpenAI GPT-4o)...");
    const result = await matchJobCandidate(jobId, candidateId, { useAI: true });
    
    console.log("");
    console.log("=".repeat(80));
    console.log("📊 RESULTADO DEL MATCHING");
    console.log("=".repeat(80));
    console.log("");
    console.log(`   Score final: ${result.score}%`);
    console.log("");
    
    if (result.detail) {
      console.log("   Componentes del score:");
      if (result.detail.components) {
        console.log(`      - Seniority: ${(result.detail.components.seniority * 100).toFixed(1)}%`);
        console.log(`      - Skills: ${(result.detail.components.skills * 100).toFixed(1)}%`);
        console.log(`      - Industry: ${(result.detail.components.industry * 100).toFixed(1)}%`);
        console.log(`      - Location/Language: ${(result.detail.components.location_language * 100).toFixed(1)}%`);
      } else if (result.detail.trajectory || result.detail.role_fit) {
        // AI matching format
        console.log(`      - Trayectoria: ${result.detail.trajectory?.score || "N/A"}%`);
        console.log(`      - Role Fit: ${result.detail.role_fit?.score || "N/A"}%`);
        console.log(`      - Hard Skills: ${result.detail.hard_skills?.score || "N/A"}%`);
        console.log(`      - Estabilidad: ${result.detail.stability?.score || "N/A"}%`);
        if (result.detail.trajectory?.reasoning) {
          console.log(`      - Trayectoria reasoning: ${result.detail.trajectory.reasoning}`);
        }
        if (result.detail.role_fit?.reasoning) {
          console.log(`      - Role Fit reasoning: ${result.detail.role_fit.reasoning}`);
        }
        if (result.detail.hard_skills?.reasoning) {
          console.log(`      - Hard Skills reasoning: ${result.detail.hard_skills.reasoning}`);
        }
        if (result.detail.stability?.reasoning) {
          console.log(`      - Estabilidad reasoning: ${result.detail.stability.reasoning}`);
        }
        if (result.detail.key_gap) {
          console.log(`      - Key Gap: ${result.detail.key_gap}`);
        }
      }
      console.log("");
      
      if (result.detail.strong_fit && result.detail.strong_fit.length > 0) {
        console.log("   ✨ Strong Fit:");
        result.detail.strong_fit.forEach((fit: string) => {
          console.log(`      - ${fit}`);
        });
        console.log("");
      }
      
      if (result.detail.gaps && result.detail.gaps.length > 0) {
        console.log("   ⚠️  Gaps:");
        result.detail.gaps.forEach((gap: string) => {
          console.log(`      - ${gap}`);
        });
        console.log("");
      }
      
      if (result.detail.summary) {
        console.log(`   📝 Summary: ${result.detail.summary}`);
        console.log("");
      }
    }

    // Paso 6: Verificar en base de datos
    console.log("=".repeat(80));
    console.log("💾 PASO 6: Verificando Match en Base de Datos");
    console.log("=".repeat(80));
    const { data: dbMatch, error } = await supabase
      .from("job_candidate_matches")
      .select("*")
      .eq("job_id", jobId)
      .eq("candidate_id", candidateId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error(`   ❌ Error obteniendo match de BD: ${error.message}`);
    } else if (dbMatch) {
      console.log(`   ✅ Match encontrado en BD:`);
      console.log(`      - Score: ${dbMatch.match_score}%`);
      console.log(`      - Source: ${dbMatch.match_source}`);
      console.log(`      - Última actualización: ${dbMatch.updated_at}`);
    } else {
      console.log(`   ⚠️  No se encontró match en BD`);
    }
    console.log("");

    console.log("=".repeat(80));
    console.log("✅ TEST COMPLETADO");
    console.log("=".repeat(80));

  } catch (error: any) {
    console.error("");
    console.error("=".repeat(80));
    console.error("❌ ERROR EN EL TEST");
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
  console.error("Usage: npm run test:single-match <job_id> <candidate_id>");
  console.error("");
  console.error("Ejemplo:");
  console.error("  npm run test:single-match 3a78065b-e350-4257-88ac-81009d17666f 3aec8129-bc96-4058-aad4-d8660cde993b");
  process.exit(1);
}

const [jobId, candidateId] = args;
testSingleMatch(jobId, candidateId);

