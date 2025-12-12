import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

async function checkFlodeskSubscriber(email: string) {
  console.log("================================================================================");
  console.log("🔍 VERIFICANDO SUSCRIPTOR EN FLODESK");
  console.log("================================================================================");
  console.log("");

  const apiKey = process.env.FLODESK_API_KEY;
  
  if (!apiKey) {
    console.error("❌ FLODESK_API_KEY no está configurada");
    process.exit(1);
  }

  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  console.log("📧 Buscando suscriptor:", email);
  console.log("");

  try {
    // Obtener suscriptor por email
    console.log("🔹 Consultando API de Flodesk...");
    console.log(`   GET https://api.flodesk.com/v1/subscribers?email=${encodeURIComponent(email)}`);
    console.log("");

    const response = await fetch(`https://api.flodesk.com/v1/subscribers?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      console.error("❌ Error al obtener suscriptor:");
      console.error(JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    
    // La respuesta puede ser un objeto con paginación {meta, data} o un array directo
    let subscriber: any;
    if (data.data && Array.isArray(data.data)) {
      // Respuesta paginada
      if (data.data.length === 0) {
        console.error("❌ No se encontró el suscriptor con ese email");
        process.exit(1);
      }
      subscriber = data.data[0];
    } else if (Array.isArray(data)) {
      // Array directo
      if (data.length === 0) {
        console.error("❌ No se encontró el suscriptor con ese email");
        process.exit(1);
      }
      subscriber = data[0];
    } else {
      // Objeto directo
      subscriber = data;
    }

    console.log("✅ Suscriptor encontrado:");
    console.log(`   ID: ${subscriber.id || subscriber.subscriber_id || "N/A"}`);
    console.log(`   Email: ${subscriber.email || "N/A"}`);
    console.log(`   Status: ${subscriber.status || "N/A"}`);
    console.log(`   First Name: ${subscriber.first_name || "N/A"}`);
    console.log(`   Last Name: ${subscriber.last_name || "N/A"}`);
    console.log("");

    // Mostrar segmentos
    if (subscriber.segments && Array.isArray(subscriber.segments)) {
      console.log("📋 Segmentos:");
      subscriber.segments.forEach((segment: any) => {
        if (typeof segment === 'object' && segment.id) {
          console.log(`   ✅ ${segment.name || segment.id} (ID: ${segment.id})`);
        } else {
          console.log(`   ✅ ${segment}`);
        }
      });
      console.log("");
    } else if (subscriber.segment_ids && Array.isArray(subscriber.segment_ids)) {
      console.log("📋 Segment IDs:");
      subscriber.segment_ids.forEach((id: string) => {
        console.log(`   ✅ ${id}`);
      });
      console.log("");
    } else {
      console.log("⚠️  No se encontraron segmentos");
      console.log("");
    }

    // Mostrar campos personalizados
    if (subscriber.custom_fields && Object.keys(subscriber.custom_fields).length > 0) {
      console.log("📋 Campos Personalizados Guardados:");
      console.log("");
      
      const customFields = subscriber.custom_fields;
      const fieldKeys = Object.keys(customFields);
      
      // Campos que esperamos encontrar
      const expectedFields = [
        'first_name',
        'job_info',
        'candidates_info',
        'recommend_url',
        'full_name_solicitante'
      ];

      console.log("✅ Campos esperados encontrados:");
      expectedFields.forEach(field => {
        if (customFields[field]) {
          const value = String(customFields[field]);
          const truncated = value.length > 80 ? value.substring(0, 77) + "..." : value;
          console.log(`   ✅ ${field}: ${truncated}`);
        } else {
          console.log(`   ❌ ${field}: NO ENCONTRADO`);
        }
      });
      console.log("");

      // Campos adicionales que no esperábamos
      const unexpectedFields = fieldKeys.filter(key => !expectedFields.includes(key) && key !== 'lastIp' && key !== 'lastOpen');
      if (unexpectedFields.length > 0) {
        console.log("ℹ️  Campos adicionales encontrados:");
        unexpectedFields.forEach(field => {
          const value = String(customFields[field]);
          const truncated = value.length > 60 ? value.substring(0, 57) + "..." : value;
          console.log(`   ℹ️  ${field}: ${truncated}`);
        });
        console.log("");
      }

      // Mostrar todos los campos en formato JSON para debugging
      console.log("📦 Todos los custom_fields (formato JSON):");
      console.log(JSON.stringify(customFields, null, 2));
      console.log("");

      // Análisis
      const foundCount = expectedFields.filter(field => customFields[field]).length;
      const missingCount = expectedFields.length - foundCount;

      console.log("📊 Resumen:");
      console.log(`   Campos esperados: ${expectedFields.length}`);
      console.log(`   Campos encontrados: ${foundCount}`);
      console.log(`   Campos faltantes: ${missingCount}`);
      console.log("");

      if (foundCount === expectedFields.length) {
        console.log("✅ TODOS los campos personalizados están guardados correctamente");
      } else {
        console.log("⚠️  ALGUNOS campos personalizados NO están guardados");
        console.log("");
        console.log("💡 Posibles causas:");
        console.log("   1. Los campos no existen en Flodesk (Audience > Subscriber Data > Custom Fields)");
        console.log("   2. Los nombres no coinciden exactamente (case-sensitive)");
        console.log("   3. Los campos se crearon pero no se actualizaron en el último envío");
      }
    } else {
      console.log("❌ No se encontraron campos personalizados");
      console.log("");
      console.log("💡 Esto indica que:");
      console.log("   1. Los campos no se están guardando correctamente");
      console.log("   2. Los campos no existen en Flodesk");
      console.log("   3. Hay un problema con la API");
    }

    // Mostrar información completa del suscriptor
    console.log("");
    console.log("📦 Información completa del suscriptor (JSON):");
    console.log(JSON.stringify(subscriber, null, 2));
    console.log("");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Obtener email del argumento de línea de comandos
const email = process.argv[2];

if (!email) {
  console.error("❌ Debes proporcionar un email como argumento");
  console.error("Uso: npm run check:flodesk-subscriber <email>");
  console.error("Ejemplo: npm run check:flodesk-subscriber alexa00rivera@gmail.com");
  process.exit(1);
}

checkFlodeskSubscriber(email);

