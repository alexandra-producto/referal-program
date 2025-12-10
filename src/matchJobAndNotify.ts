/**
 * Script para hacer matching de un job específico y luego notificar a hyperconnectors
 * 
 * Usage: npm run match:job-and-notify <job_id>
 * Ejemplo: npm run match:job-and-notify 12cb6910-8019-449e-ae27-b1fb14a8cf6f
 */

import "./config/env";
import { matchJobWithAllCandidates } from "./agents/matchJobCandidate";
import { notifyHyperconnectorsForJob } from "./agents/notifyHyperconnectorsForJob";
import { getAppUrl } from "./utils/appUrl";

async function matchJobAndNotify(jobId: string) {
  try {
    console.log("=".repeat(80));
    console.log("🚀 MATCHING Y NOTIFICACIÓN: Job Específico");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📋 Job ID: ${jobId}`);
    console.log("");

    // Paso 1: Ejecutar matching para el job
    console.log("=".repeat(80));
    console.log("🔄 PASO 1: Ejecutando Matching para el Job");
    console.log("=".repeat(80));
    console.log("");
    
    console.log("   🔍 Buscando candidatos vinculados a hyperconnectors...");
    const matchesCreated = await matchJobWithAllCandidates(jobId);
    
    console.log("");
    console.log(`   ✅ Matches creados/actualizados: ${matchesCreated}`);
    console.log("");

    // Paso 2: Notificar a hyperconnectors
    console.log("=".repeat(80));
    console.log("📤 PASO 2: Notificando a Hyperconnectors");
    console.log("=".repeat(80));
    console.log("");
    
    // En local, forzar http://localhost:3000
    const appUrl = process.env.NODE_ENV === 'development' || !process.env.VERCEL_URL
      ? "http://localhost:3000"
      : getAppUrl();
    console.log(`   🌐 Usando App URL: ${appUrl}`);
    console.log("");
    
    console.log("   📨 Enviando notificaciones de WhatsApp...");
    const notificationResult = await notifyHyperconnectorsForJob(jobId, appUrl);
    
    console.log("");
    console.log("=".repeat(80));
    console.log("✅ PROCESO COMPLETADO");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📊 Resumen:`);
    console.log(`   - Matches procesados: ${matchesCreated}`);
    console.log(`   - WhatsApp enviados: ${notificationResult.notified}`);
    console.log(`   - Emails enviados: ${notificationResult.emailsSent || 0}`);
    console.log(`   - Errores en notificaciones: ${notificationResult.errors}`);
    console.log("");

  } catch (error: any) {
    console.error("");
    console.error("=".repeat(80));
    console.error("❌ ERROR EN EL PROCESO");
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
  console.error("Usage: npm run match:job-and-notify <job_id>");
  console.error("");
  console.error("Ejemplo:");
  console.error("  npm run match:job-and-notify 12cb6910-8019-449e-ae27-b1fb14a8cf6f");
  process.exit(1);
}

const [jobId] = args;
matchJobAndNotify(jobId);


