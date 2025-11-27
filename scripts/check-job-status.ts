#!/usr/bin/env tsx
/**
 * Script para verificar y corregir el estado de un job y sus recomendaciones
 * Uso: npx tsx scripts/check-job-status.ts <jobId>
 */

import dotenv from "dotenv";
import { resolve } from "path";
import { supabase } from "../src/db/supabaseClient";
import { updateJobStatusFromRecommendations } from "../src/domain/jobs";
import { getRecommendationsForJob } from "../src/domain/recommendations";

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const JOB_ID = process.argv[2] || "4028c26a-18dd-4a8d-b909-cc945d0fd6af";

async function checkJobStatus() {
  console.log("🔍 Verificando estado del job:", JOB_ID);
  console.log("=".repeat(80));

  try {
    // 1. Obtener información del job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, job_title, company_name, status")
      .eq("id", JOB_ID)
      .maybeSingle();

    if (jobError) {
      console.error("❌ Error obteniendo job:", jobError);
      return;
    }

    if (!job) {
      console.error("❌ Job no encontrado con ID:", JOB_ID);
      return;
    }

    console.log("\n📋 Información del Job:");
    console.log("  ID:", job.id);
    console.log("  Título:", job.job_title);
    console.log("  Empresa:", job.company_name);
    console.log("  Status actual:", job.status);

    // 2. Obtener todas las recomendaciones
    const recommendations = await getRecommendationsForJob(JOB_ID);

    console.log("\n📊 Recomendaciones encontradas:", recommendations?.length || 0);

    if (!recommendations || recommendations.length === 0) {
      console.log("⚠️  No hay recomendaciones para este job");
      console.log("\n🔄 Actualizando status a 'open_without_recommendations'...");
      await updateJobStatusFromRecommendations(JOB_ID);
      return;
    }

    // 3. Analizar estados de las recomendaciones
    console.log("\n📋 Detalle de recomendaciones:");
    const statusCounts: Record<string, number> = {};
    recommendations.forEach((rec: any, index: number) => {
      const status = rec.status || "null";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      console.log(`  ${index + 1}. ID: ${rec.id}, Status: ${status}, Candidate ID: ${rec.candidate_id || "null"}`);
    });

    console.log("\n📊 Resumen por estado:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // 4. Determinar el status correcto
    const hasContracted = recommendations.some((r: any) => r.status === "contracted");
    const hasInReview = recommendations.some((r: any) => r.status === "in_review");
    const allRejected = recommendations.every((r: any) => r.status === "rejected");
    const hasPending = recommendations.some((r: any) => r.status === "pending");

    let expectedStatus: string;
    if (hasContracted) {
      expectedStatus = "hired";
    } else if (hasInReview) {
      expectedStatus = "recruitment_process";
    } else if (allRejected) {
      expectedStatus = "all_recommendations_rejected";
    } else if (hasPending || recommendations.length > 0) {
      expectedStatus = "open_with_recommendations";
    } else {
      expectedStatus = "open_without_recommendations";
    }

    console.log("\n🎯 Análisis:");
    console.log("  Status actual del job:", job.status);
    console.log("  Status esperado:", expectedStatus);
    console.log("  ¿Coinciden?", job.status === expectedStatus ? "✅ Sí" : "❌ No");

    if (job.status !== expectedStatus) {
      console.log("\n🔄 Corrigiendo status del job...");
      await updateJobStatusFromRecommendations(JOB_ID);

      // Verificar que se actualizó
      const { data: updatedJob } = await supabase
        .from("jobs")
        .select("status")
        .eq("id", JOB_ID)
        .maybeSingle();

      console.log("  Status después de corrección:", updatedJob?.status);
    }

    // 5. Verificar que la API devuelve las recomendaciones
    console.log("\n🔍 Verificando API de recomendaciones...");
    const apiUrl = `http://localhost:3000/api/jobs/${JOB_ID}/recommendations`;
    console.log("  URL:", apiUrl);
    console.log("  (Ejecuta manualmente: curl " + apiUrl + ")");

    console.log("\n✅ Verificación completada");
  } catch (error: any) {
    console.error("❌ Error:", error);
    console.error("Stack:", error.stack);
  }
}

checkJobStatus();

