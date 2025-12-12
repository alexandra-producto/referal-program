import dotenv from "dotenv";
import { createOrUpdateFlodeskSubscriber } from "./utils/flodeskClient";

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

async function testCustomFieldsOnly() {
  console.log("================================================================================");
  console.log("🧪 PRUEBA: Actualizar SOLO campos personalizados (SIN añadir al segmento)");
  console.log("================================================================================");
  console.log("");

  const email = "alexa00rivera@gmail.com";
  const segmentId = process.env.FLODESK_SEGMENT_ID || "";

  if (!segmentId) {
    console.error("❌ FLODESK_SEGMENT_ID no está configurado");
    process.exit(1);
  }

  // Campos personalizados de prueba
  const customFields = {
    first_name: "Alexandra",
    job_info: "Senior Product Manager - Fintech & Payments en Product-LatAm",
    candidates_info: "3 persona(s): Carlos Mendoza, Diego Herrera, Ana Sofía Ramírez",
    recommend_url: "http://localhost:3000/recommend-redirect/test-url-123",
    full_name_solicitante: "Alexandra Rivera Duarte",
  };

  console.log("📧 Email:", email);
  console.log("📋 Campos personalizados a actualizar:");
  Object.entries(customFields).forEach(([key, value]) => {
    const truncated = String(value).length > 60 ? String(value).substring(0, 57) + "..." : String(value);
    console.log(`   - ${key}: ${truncated}`);
  });
  console.log("");

  try {
    // Llamar directamente a la función pero modificando temporalmente para NO añadir al segmento
    // Vamos a hacer la actualización manualmente
    const apiKey = process.env.FLODESK_API_KEY;
    
    if (!apiKey) {
      throw new Error("FLODESK_API_KEY no está configurada");
    }

    const auth = Buffer.from(`${apiKey}:`).toString("base64");

    console.log("🔹 Actualizando SOLO campos personalizados (sin segmento)...");
    console.log("");

    const updateBody = {
      email: email,
      first_name: customFields.first_name,
      custom_fields: {
        job_info: customFields.job_info,
        candidates_info: customFields.candidates_info,
        recommend_url: customFields.recommend_url,
        full_name_solicitante: customFields.full_name_solicitante,
      },
    };

    console.log("📦 Body que se enviará:");
    console.log(JSON.stringify(updateBody, null, 2));
    console.log("");

    const response = await fetch("https://api.flodesk.com/v1/subscribers", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      console.error("❌ Error en respuesta de Flodesk:");
      console.error(JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    const result = await response.json();

    console.log("✅ Respuesta de Flodesk:");
    console.log(JSON.stringify(result, null, 2));
    console.log("");

    // Verificar campos personalizados
    if (result.custom_fields) {
      console.log("📋 Campos personalizados en la respuesta:");
      Object.entries(result.custom_fields).forEach(([key, value]) => {
        const valueStr = String(value);
        const truncated = valueStr.length > 60 ? valueStr.substring(0, 57) + "..." : valueStr;
        const status = Object.keys(updateBody.custom_fields).includes(key) ? "✅" : "ℹ️";
        console.log(`   ${status} ${key}: ${truncated}`);
      });
      console.log("");

      // Comparar campos enviados vs recibidos
      const sentKeys = Object.keys(updateBody.custom_fields);
      const receivedKeys = Object.keys(result.custom_fields);
      const successfullySaved = sentKeys.filter(key => receivedKeys.includes(key));
      const missing = sentKeys.filter(key => !receivedKeys.includes(key));

      console.log("");
      console.log("📊 Análisis de campos:");
      console.log(`   Campos enviados: ${sentKeys.length}`);
      console.log(`   Campos en respuesta: ${receivedKeys.length}`);
      console.log(`   Campos guardados exitosamente: ${successfullySaved.length}`);
      console.log(`   Campos faltantes: ${missing.length}`);
      console.log("");

      if (successfullySaved.length === sentKeys.length) {
        console.log("✅ TODOS los campos personalizados se guardaron correctamente");
        console.log(`   Campos guardados: ${successfullySaved.join(", ")}`);
        console.log("");
        console.log("🔍 Verificando valores guardados:");
        successfullySaved.forEach(key => {
          const sentValue = updateBody.custom_fields[key];
          const receivedValue = result.custom_fields[key];
          const match = String(sentValue) === String(receivedValue) ? "✅" : "⚠️";
          console.log(`   ${match} ${key}:`);
          console.log(`      Enviado: ${String(sentValue).substring(0, 80)}${String(sentValue).length > 80 ? "..." : ""}`);
          console.log(`      Guardado: ${String(receivedValue).substring(0, 80)}${String(receivedValue).length > 80 ? "..." : ""}`);
        });
      } else {
        console.log("⚠️  ALGUNOS campos NO se guardaron:");
        console.log(`   ✅ Guardados: ${successfullySaved.join(", ") || "ninguno"}`);
        console.log(`   ❌ Faltantes: ${missing.join(", ") || "ninguno"}`);
        console.log("");
        console.log("💡 Verifica en Flodesk:");
        console.log("   1. Ve a Audience > Subscriber Data > Custom Fields");
        console.log("   2. Asegúrate de que estos campos existan:");
        missing.forEach(key => {
          console.log(`      - ${key}`);
        });
      }

      // Mostrar campos adicionales que pueden estar causando confusión
      const extraFields = receivedKeys.filter(key => !sentKeys.includes(key) && key !== "first_name" && key !== "lastIp" && key !== "lastOpen");
      if (extraFields.length > 0) {
        console.log("");
        console.log("⚠️  Campos adicionales encontrados en Flodesk (pueden causar confusión):");
        extraFields.forEach(key => {
          const value = result.custom_fields[key];
          console.log(`   - ${key}: ${String(value).substring(0, 50)}${String(value).length > 50 ? "..." : ""}`);
        });
        console.log("💡 Considera eliminar o renombrar estos campos si no los necesitas");
      }
    } else {
      console.log("❌ No se recibieron custom_fields en la respuesta");
      console.log("💡 Esto indica que los campos no se guardaron");
    }

    console.log("");
    console.log("💡 Verifica manualmente en Flodesk:");
    console.log(`   1. Busca el suscriptor: ${email}`);
    console.log("   2. Revisa la sección 'Subscriber data'");
    console.log("   3. Verifica que los campos personalizados tengan los valores correctos");
    console.log("");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCustomFieldsOnly();

