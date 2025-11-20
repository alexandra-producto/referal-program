import "./config/env"; // 👈 IMPORTANTE: carga .env.local
import { sendHciWhatsappNotification } from "./agents/sendHciWhatsappNotification";

async function test() {
  const hciPhoneNumber = "+573208631577"; // tu número de WhatsApp

  // Datos de ejemplo para la prueba
  // NOTA: Necesitas usar IDs reales de tu base de datos
  const hci = {
    id: "hci-id-example", // Reemplaza con un ID real de hyperconnector
    full_name: "Juan Pérez",
  };

  const job = {
    id: "job-id-example", // Reemplaza con un ID real de job
    company_name: "Vemo",
    role_title: "Product Manager",
    non_negotiables: [
      "5+ años de experiencia en producto",
      "Experiencia en startups de tecnología",
      "Track record comprobable",
    ],
  };

  const candidates = [
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
      shared_experience: null, // Sin experiencia compartida específica
    },
    {
      full_name: "Ana Martínez",
      current_company: null, // Sin compañía actual
      fit_score: 82,
      shared_experience: "Colaboraron en proyecto freelance",
    },
  ];

  // La URL se genera automáticamente ahora
  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  try {
    console.log("🚀 Enviando notificación de WhatsApp al HCI...");
    console.log(`📱 Destinatario: ${hciPhoneNumber}`);
    console.log(`👤 HCI: ${hci.full_name} (ID: ${hci.id})`);
    console.log(`💼 Job: ${job.role_title} en ${job.company_name} (ID: ${job.id})`);
    console.log(`👥 Candidatos: ${candidates.length}`);
    console.log(`🌐 Base URL: ${baseUrl}`);

    const resp = await sendHciWhatsappNotification(
      hciPhoneNumber,
      hci,
      job,
      candidates,
      baseUrl
    );

    console.log("✅ Mensaje enviado exitosamente!");
    console.log("📨 Message SID:", resp.sid);
    console.log("📊 Estado:", resp.status);
    console.log("🔗 Link de recomendación:", resp.recommendUrl);
  } catch (error: any) {
    console.error("❌ Error al enviar el mensaje:", error.message);
    if (error.code) {
      console.error("🔴 Código de error:", error.code);
    }
  }
}

test();

