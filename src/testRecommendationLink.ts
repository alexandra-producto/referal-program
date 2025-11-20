import "./config/env"; // 👈 IMPORTANTE: carga .env.local
import { generateRecommendationUrl } from "./utils/recommendationTokens";
import { getAllHyperconnectors } from "./domain/hyperconnectors";
import { getJobByCompanyNameLike, getJobById } from "./domain/jobs";
import { getRecommendableCandidatesForHyperconnector } from "./domain/hyperconnectorCandidates";
import { sendHciWhatsappNotification } from "./agents/sendHciWhatsappNotification";

/**
 * Test para generar y probar links de recomendación
 * 
 * Opciones:
 * 1. Generar solo el link (sin enviar WhatsApp)
 * 2. Generar link y enviar WhatsApp
 * 3. Usar datos reales de la BD o datos de ejemplo
 */

async function testRecommendationLink() {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const sendWhatsApp = process.argv.includes("--send-whatsapp");
  const useRealData = process.argv.includes("--real-data");
  const hciPhoneNumber = process.env.TEST_PHONE_NUMBER || "+573208631577";

  try {
    let hci: any;
    let job: any;
    let candidates: any[];

    if (useRealData) {
      console.log("📊 Obteniendo datos reales de la base de datos...\n");

      // Obtener el primer hyperconnector
      const allHcis = await getAllHyperconnectors();
      if (!allHcis || allHcis.length === 0) {
        throw new Error("No hay hyperconnectors en la base de datos");
      }
      hci = allHcis[0];
      console.log(`✅ HCI encontrado: ${hci.full_name} (ID: ${hci.id})`);

      // Buscar un job (puedes cambiar "Vemo" por el nombre de la empresa que quieras)
      job = await getJobByCompanyNameLike("Vemo");
      if (!job) {
        // Si no encuentra, intentar obtener el primer job disponible
        const { supabase } = await import("./db/supabaseClient");
        const { data: jobs } = await supabase
          .from("jobs")
          .select("*")
          .limit(1)
          .maybeSingle();
        job = jobs;
      }

      if (!job) {
        throw new Error("No hay jobs en la base de datos");
      }
      console.log(`✅ Job encontrado: ${job.role_title} en ${job.company_name} (ID: ${job.id})`);

      // Obtener candidatos recomendables
      candidates = await getRecommendableCandidatesForHyperconnector(job.id, hci.id);
      console.log(`✅ Candidatos encontrados: ${candidates.length}\n`);
    } else {
      console.log("📝 Usando datos de ejemplo...\n");
      
      // Datos de ejemplo
      hci = {
        id: "hci-test-" + Date.now(),
        full_name: "Juan Pérez",
      };

      job = {
        id: "job-test-" + Date.now(),
        company_name: "Vemo",
        role_title: "Product Manager",
        non_negotiables: [
          "5+ años de experiencia en producto",
          "Experiencia en startups de tecnología",
          "Track record comprobable",
        ],
      };

      candidates = [
        {
          full_name: "María García",
          current_company: "TechCorp",
          fit_score: 95,
          shared_experience: "Trabajaron juntos en StartupX durante 2 años",
        },
        {
          full_name: "Carlos Rodríguez",
          current_company: "InnovateLab",
          fit_score: 88,
          shared_experience: null,
        },
        {
          full_name: "Ana Martínez",
          current_company: null,
          fit_score: 82,
          shared_experience: "Colaboraron en proyecto freelance",
        },
      ];
    }

    // Generar el link de recomendación
    const recommendUrl = generateRecommendationUrl(hci.id, job.id, baseUrl);
    const token = recommendUrl.split("/").pop();

    console.log("=".repeat(60));
    console.log("🔗 LINK DE RECOMENDACIÓN GENERADO");
    console.log("=".repeat(60));
    console.log(`\n${recommendUrl}\n`);
    console.log("=".repeat(60));
    console.log("\n📋 Información del link:");
    console.log(`   👤 Hyperconnector: ${hci.full_name}`);
    console.log(`   💼 Job: ${job.role_title} en ${job.company_name}`);
    console.log(`   👥 Candidatos: ${candidates.length}`);
    console.log(`   🔑 Token: ${token?.substring(0, 20)}...`);
    console.log("\n💡 Para probar:");
    console.log(`   1. Asegúrate de que Next.js esté corriendo: npm run next:dev`);
    console.log(`   2. Abre el link en tu navegador: ${recommendUrl}`);
    console.log(`   3. Prueba la interfaz de recomendación\n`);

    // Si se solicita, enviar WhatsApp
    if (sendWhatsApp) {
      console.log("📱 Enviando WhatsApp...\n");
      
      const resp = await sendHciWhatsappNotification(
        hciPhoneNumber,
        hci,
        job,
        candidates,
        baseUrl
      );

      console.log("✅ Mensaje enviado exitosamente!");
      console.log(`📨 Message SID: ${resp.sid}`);
      console.log(`📊 Estado: ${resp.status}`);
      console.log(`🔗 Link enviado: ${resp.recommendUrl}\n`);
    } else {
      console.log("💡 Para enviar WhatsApp también, ejecuta:");
      console.log(`   npm run test:recommendation-link -- --send-whatsapp\n`);
    }

    // Mostrar cómo probar la API directamente
    console.log("🧪 Para probar la API directamente:");
    console.log(`   curl ${baseUrl}/api/recommend/${token}`);
    console.log("\n");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar el test
testRecommendationLink();

