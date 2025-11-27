#!/usr/bin/env tsx
/**
 * Script para verificar y corregir el status de TODOS los jobs
 * Uso: npx tsx scripts/fix-all-job-statuses.ts
 */

import dotenv from "dotenv";
import { resolve } from "path";
import { supabase } from "../src/db/supabaseClient";
import { updateJobStatusFromRecommendations } from "../src/domain/jobs";

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function fixAllJobStatuses() {
  console.log("🔍 Verificando y corrigiendo status de todos los jobs...");
  console.log("=".repeat(80));

  try {
    // 1. Obtener todos los jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, job_title, company_name, status")
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.error("❌ Error obteniendo jobs:", jobsError);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log("⚠️  No hay jobs en la base de datos");
      return;
    }

    console.log(`\n📊 Total de jobs encontrados: ${jobs.length}`);
    console.log("=".repeat(80));

    let corrected = 0;
    let alreadyCorrect = 0;
    let errors = 0;

    // 2. Para cada job, verificar y corregir su status
    for (const job of jobs) {
      try {
        console.log(`\n🔍 Verificando job: ${job.id}`);
        console.log(`   Título: ${job.job_title}`);
        console.log(`   Status actual: ${job.status}`);

        // Obtener status actual antes de actualizar
        const { data: jobBefore } = await supabase
          .from("jobs")
          .select("status")
          .eq("id", job.id)
          .maybeSingle();

        // Ejecutar la función de actualización
        await updateJobStatusFromRecommendations(job.id);

        // Verificar el status después de actualizar
        const { data: jobAfter } = await supabase
          .from("jobs")
          .select("status")
          .eq("id", job.id)
          .maybeSingle();

        if (jobBefore?.status !== jobAfter?.status) {
          console.log(`   ✅ Corregido: '${jobBefore?.status}' → '${jobAfter?.status}'`);
          corrected++;
        } else {
          console.log(`   ✓ Status correcto: ${jobAfter?.status}`);
          alreadyCorrect++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error procesando job ${job.id}:`, error.message);
        errors++;
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 Resumen:");
    console.log(`   ✅ Jobs corregidos: ${corrected}`);
    console.log(`   ✓ Jobs ya correctos: ${alreadyCorrect}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📊 Total procesados: ${jobs.length}`);
    console.log("=".repeat(80));
    console.log("\n✅ Proceso completado");

  } catch (error: any) {
    console.error("❌ Error:", error);
    console.error("Stack:", error.stack);
  }
}

fixAllJobStatuses();

