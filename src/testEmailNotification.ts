/**
 * Script de prueba para enviar email de notificación a un hyperconnector
 * 
 * Usage: npm run test:email-notification <job_id> <hyperconnector_id>
 * Ejemplo: npm run test:email-notification 12cb6910-8019-449e-ae27-b1fb14a8cf6f eccd2f37-c071-4eda-8e4b-24a8d11c369b
 * 
 * Este script usa la función simplificada notifyHyperconnectorForJob()
 * que obtiene todos los datos necesarios y envía el email automáticamente.
 */

import "./config/env";
import { notifyHyperconnectorForJob } from "./utils/notifyHyperconnectorForJob";

async function testEmailNotification(jobId: string, hyperconnectorId: string) {
  try {
    console.log("=".repeat(80));
    console.log("📧 PRUEBA DE NOTIFICACIÓN POR EMAIL");
    console.log("=".repeat(80));
    console.log("");
    console.log(`📋 Job ID: ${jobId}`);
    console.log(`👤 Hyperconnector ID: ${hyperconnectorId}`);
    console.log("");

    // Verificar variables de entorno
    if (!process.env.FLODESK_API_KEY) {
      throw new Error("FLODESK_API_KEY no está configurada en .env.local");
    }
    console.log("✅ FLODESK_API_KEY encontrada");

    if (!process.env.FLODESK_SEGMENT_ID) {
      throw new Error("FLODESK_SEGMENT_ID no está configurada en .env.local");
    }
    console.log("✅ FLODESK_SEGMENT_ID encontrada");
    console.log("");

    // Usar la función simplificada que hace todo el trabajo
    console.log("🔄 Ejecutando notifyHyperconnectorForJob()...");
    console.log("");
    
    const result = await notifyHyperconnectorForJob(jobId, hyperconnectorId);

    console.log("");
    console.log("=".repeat(80));
    
    if (result.success) {
      console.log("✅ EMAIL ENVIADO EXITOSAMENTE");
      console.log("=".repeat(80));
      console.log("");
      console.log(`📧 Message ID: ${result.messageId || "N/A"}`);
      console.log(`🔗 Link de Recomendación: ${result.recommendUrl}`);
      console.log("");
      console.log("✅ Verifica tu bandeja de entrada (y spam) para ver el email");
      console.log("");
      console.log("💡 El workflow en Flodesk se activó automáticamente al agregar");
      console.log("   el suscriptor al segmento configurado.");
      console.log("");
    } else {
      console.log("❌ ERROR AL ENVIAR EMAIL");
      console.log("=".repeat(80));
      console.log("");
      console.error(`Error: ${result.error}`);
      console.log("");
      process.exit(1);
    }

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
if (args.length < 2) {
  console.error("❌ Error: Se requieren 2 argumentos");
  console.error("");
  console.error("Usage: npm run test:email-notification <job_id> <hyperconnector_id>");
  console.error("");
  console.error("Ejemplo:");
  console.error("  npm run test:email-notification 12cb6910-8019-449e-ae27-b1fb14a8cf6f eccd2f37-c071-4eda-8e4b-24a8d11c369b");
  process.exit(1);
}

const [jobId, hyperconnectorId] = args;
testEmailNotification(jobId, hyperconnectorId);

