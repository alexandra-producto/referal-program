/**
 * Script para crear un job de prueba basado en un job existente
 * Job base: 2d9fa5c0-360c-4436-a4e5-8a2ff78a8738
 * Nuevo job: "Product Manager - Mobility & Fleet T2"
 */

import { createJob } from "../src/domain/jobs";
import { getAppUrl } from "../src/utils/appUrl";

async function createTestJob() {
  try {
    console.log("🚀 Creando job de prueba...\n");

    // Datos del job original
    const jobData = {
      company_name: "Edenred Mobility Mexico",
      job_title: "Product Manager - Mobility & Fleet T2",
      job_level: "senior",
      location: "Mexico City",
      remote_ok: true,
      description: "Product Manager enfocado en productos de movilidad, administración de flotas y medios de pago (vales/tarjetas). B2B/B2B2C, integración con sistemas corporativos.",
      requirements_json: {
        languages: ["spanish", "english"],
        seniority: "senior",
        industries: ["mobility", "fleet_management", "payments", "fintech"],
        must_have_skills: [
          "product_management",
          "b2b",
          "payment_systems",
          "integrations",
          "stakeholder_management"
        ],
        location_preference: ["Mexico"],
        nice_to_have_skills: ["fleet_cards", "fuel_payments", "logistics"]
      },
      status: "open_without_recommendations",
      owner_candidate_id: "7be8b532-8bad-4137-ac5d-aff00a60a5f7",
      owner_role_title: "CPO",
      document_url: null,
    };

    console.log("📋 Datos del job:");
    console.log(JSON.stringify(jobData, null, 2));
    console.log("\n");

    // Crear el job con matching automático
    console.log("💾 Creando job en la base de datos...");
    const job = await createJob(jobData, { triggerMatching: true });

    console.log("\n✅ Job creado exitosamente!");
    console.log("📋 Detalles:");
    console.log(`   - ID: ${job.id}`);
    console.log(`   - Título: ${job.job_title}`);
    console.log(`   - Company: ${job.company_name}`);
    console.log(`   - Status: ${job.status}`);
    console.log(`   - Owner: ${job.owner_candidate_id}`);
    console.log("\n");

    console.log("🔄 El matching automático se está ejecutando en background...");
    console.log("📱 Las notificaciones de WhatsApp se enviarán automáticamente");
    console.log("   a los hyperconnectors con candidatos match >= 70%");
    console.log("\n");

    console.log("⏳ Espera unos minutos y luego verifica:");
    console.log(`   1. Los matches en job_candidate_matches para job_id: ${job.id}`);
    console.log(`   2. Las notificaciones enviadas en los logs de Vercel`);
    console.log(`   3. Que el job aparezca en /api/hyperconnector/get-jobs para los hyperconnectors correspondientes`);

    return job;
  } catch (error: any) {
    console.error("❌ Error creando job:", error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestJob()
    .then(() => {
      console.log("\n✅ Script completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error en script:", error);
      process.exit(1);
    });
}

export { createTestJob };

