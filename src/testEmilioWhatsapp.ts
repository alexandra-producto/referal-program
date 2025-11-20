import "./config/env";
import { getAllHyperconnectors } from "./domain/hyperconnectors";
import { getJobById, getJobByCompanyNameLike } from "./domain/jobs";
import { getRecommendableCandidatesForHyperconnector } from "./domain/hyperconnectorCandidates";
import { sendHciWhatsappNotification } from "./agents/sendHciWhatsappNotification";
import { supabase } from "./db/supabaseClient";

async function testEmilioWhatsapp() {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || "+573208631577";

  try {
    console.log("🚀 Iniciando test completo con WhatsApp (Emilio y Alexandra)\n");
    console.log("=".repeat(70));

    // 1. Buscar a Emilio (hyperconnector)
    console.log("\n1️⃣ Buscando a Emilio (hyperconnector)...");
    const { data: hcis, error: hciError } = await supabase
      .from("hyperconnectors")
      .select("*")
      .ilike("full_name", "%emilio%");

    if (hciError) throw new Error(`Error buscando hyperconnectors: ${hciError.message}`);
    
    if (!hcis || hcis.length === 0) {
      throw new Error("No se encontró a Emilio en la tabla hyperconnectors");
    }

    const emilio = hcis[0];
    const emilioPhone = emilio.phone_number || testPhoneNumber;
    console.log(`   ✅ Encontrado: ${emilio.full_name} (ID: ${emilio.id})`);
    console.log(`   📱 Teléfono: ${emilioPhone}\n`);

    // 2. Buscar un job
    console.log("2️⃣ Buscando job...");
    let job: any = null;
    
    // Intentar buscar job de Watts Mobility (el que encontramos antes)
    job = await getJobById("185540e2-b772-401c-b83e-945ab61869f0");
    
    if (!job) {
      // Si no existe, buscar cualquier job
      const { data: anyJob } = await supabase
        .from("jobs")
        .select("*")
        .limit(1)
        .maybeSingle();
      job = anyJob;
    }

    if (!job) {
      throw new Error("No se encontró ningún job en la base de datos");
    }

    console.log(`   ✅ Job encontrado: ${job.job_title || job.role_title || "Sin título"} en ${job.company_name}`);
    console.log(`   📋 Job ID: ${job.id}\n`);

    // 3. Obtener candidatos recomendables para Emilio en este job
    console.log("3️⃣ Obteniendo candidatos recomendables para Emilio...");
    const recommendableCandidates = await getRecommendableCandidatesForHyperconnector(
      job.id,
      emilio.id
    );

    console.log(`   ✅ Candidatos encontrados: ${recommendableCandidates.length}`);
    if (recommendableCandidates.length > 0) {
      recommendableCandidates.forEach((c, i) => {
        console.log(`      ${i + 1}. ${c.full_name}${c.match_score ? ` (${c.match_score}% match)` : ""}${c.shared_experience ? ` - ${c.shared_experience}` : ""}`);
      });
    } else {
      console.log("   ⚠️ No hay candidatos recomendables. El mensaje se enviará sin candidatos.");
    }
    console.log("");

    // 4. Preparar datos en el formato correcto para sendHciWhatsappNotification
    const hciData = {
      id: emilio.id,
      full_name: emilio.full_name,
    };

    const jobData = {
      id: job.id,
      company_name: job.company_name,
      role_title: job.job_title || job.role_title || "Posición",
      non_negotiables: job.non_negotiables || 
                       (job.requirements_json && Array.isArray(job.requirements_json) ? job.requirements_json : null) ||
                       null,
    };

    const candidatesData = recommendableCandidates.map(c => ({
      full_name: c.full_name,
      current_company: c.current_company,
      match_score: c.match_score,
      shared_experience: c.shared_experience,
    }));

    // 5. Enviar WhatsApp
    console.log("4️⃣ Enviando mensaje de WhatsApp...");
    console.log(`   📱 Destinatario: ${emilioPhone}`);
    console.log(`   👤 HCI: ${emilio.full_name}`);
    console.log(`   💼 Job: ${jobData.role_title} en ${jobData.company_name}`);
    console.log(`   👥 Candidatos: ${candidatesData.length}\n`);

    const result = await sendHciWhatsappNotification(
      emilioPhone,
      hciData,
      jobData,
      candidatesData,
      baseUrl
    );

    console.log("=".repeat(70));
    console.log("✅ MENSAJE ENVIADO EXITOSAMENTE");
    console.log("=".repeat(70));
    console.log(`\n📨 Message SID: ${result.sid}`);
    console.log(`📊 Estado: ${result.status}`);
    console.log(`🔗 Link de recomendación: ${result.recommendUrl}\n`);

    // 6. Verificar que el link funciona
    console.log("5️⃣ Verificando que el link funciona...");
    try {
      const token = result.recommendUrl.split("/").pop();
      const apiUrl = `${baseUrl}/api/recommend/${token}`;
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log("   ✅ Link verificado correctamente");
        console.log(`   📋 Job: ${data.job?.job_title || data.job?.role_title || "Sin título"}`);
        console.log(`   👤 Hyperconnector: ${data.hyperconnector?.full_name}`);
        console.log(`   👥 Candidatos: ${data.candidates?.length || 0}`);
      } else {
        const errorData = await response.json();
        console.warn(`   ⚠️ Link generado pero la API retornó error: ${errorData.error}`);
      }
    } catch (verifyError: any) {
      console.warn(`   ⚠️ No se pudo verificar el link (Next.js puede no estar corriendo): ${verifyError.message}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("📋 RESUMEN DEL TEST");
    console.log("=".repeat(70));
    console.log(`\n✅ WhatsApp enviado a: ${emilioPhone}`);
    console.log(`✅ Link generado: ${result.recommendUrl}`);
    console.log(`✅ Token: ${result.recommendUrl.split("/").pop()?.substring(0, 30)}...`);
    console.log(`\n💡 Para probar la interfaz:`);
    console.log(`   1. Asegúrate de que Next.js esté corriendo: npm run next:dev`);
    console.log(`   2. Abre el link en tu navegador: ${result.recommendUrl}`);
    console.log(`   3. Emilio podrá ver la interfaz y hacer recomendaciones\n`);

  } catch (error: any) {
    console.error("\n" + "=".repeat(70));
    console.error("❌ ERROR EN EL TEST");
    console.error("=".repeat(70));
    console.error(`\nError: ${error.message}`);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

testEmilioWhatsapp();

