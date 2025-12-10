/**
 * Cliente para Flodesk API
 * Documentación: https://developers.flodesk.com
 * 
 * Flodesk usa autenticación básica con la API key como username
 * 
 * NOTA: Flodesk no tiene endpoint directo para enviar emails.
 * En su lugar, se agregan suscriptores a un segmento que tiene un workflow configurado.
 * El workflow se activa automáticamente y envía el email.
 */

interface FlodeskEmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  fromEmail?: string;
  fromName?: string;
  // Campos personalizados para pasar datos al workflow
  customFields?: Record<string, any>;
}

interface FlodeskResponse {
  success: boolean;
  subscriberId?: string;
  error?: string;
}

/**
 * Envía un email usando Flodesk API
 * 
 * Flodesk funciona agregando un suscriptor a un segmento que tiene un workflow configurado.
 * El workflow debe estar configurado en Flodesk para enviar el email cuando se agrega el suscriptor.
 * 
 * @param options - Opciones del email (to, subject, htmlBody, fromEmail, fromName, customFields)
 * @returns Promise con el resultado del envío
 */
export async function sendFlodeskEmail(
  options: FlodeskEmailOptions
): Promise<FlodeskResponse> {
  const apiKey = process.env.FLODESK_API_KEY;
  
  if (!apiKey) {
    throw new Error("FLODESK_API_KEY no está configurada en las variables de entorno");
  }

  // Obtener Form ID (prioridad) o Segment ID (fallback)
  const formId = process.env.FLODESK_FORM_ID;
  const segmentId = process.env.FLODESK_SEGMENT_ID;
  
  if (!formId && !segmentId) {
    throw new Error("FLODESK_FORM_ID o FLODESK_SEGMENT_ID debe estar configurado en .env.local. Si tienes campos personalizados en un formulario, usa FLODESK_FORM_ID.");
  }

  // Autenticación básica: API key como username, password vacío
  // Flodesk requiere Basic auth con formato: "API_KEY:" codificado en base64
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  // Extraer nombre del email si no se proporciona
  const emailParts = options.to.split("@");
  const firstName = options.customFields?.first_name || emailParts[0].split(".")[0] || "Usuario";

  console.log("📧 Enviando email con Flodesk:");
  console.log(`   To: ${options.to}`);
  if (formId) {
    console.log(`   Form ID: ${formId} (usando formulario para campos personalizados)`);
  } else {
    console.log(`   Segment ID: ${segmentId}`);
  }
  console.log(`   Subject: ${options.subject}`);
  
  // Preparar el body según la documentación oficial de Flodesk
  // Cuando usamos un formulario, debemos usar form_id (singular) y asegurarnos
  // de que todos los campos personalizados estén correctamente formateados
  const requestBody: any = {
    email: options.to,
    first_name: firstName,
  };
  
  // Agregar campos personalizados - DEBEN existir en el formulario
  // NOTA: Flodesk limita los custom fields a 256 caracteres
  if (options.customFields && Object.keys(options.customFields).length > 0) {
    requestBody.custom_fields = options.customFields;
  }
  
  // Si hay formId, usar form_id (singular) según documentación de Flodesk
  // El formulario debe estar configurado para agregar automáticamente al segmento
  if (formId) {
    requestBody.form_id = formId;
    console.log("   ✅ Usando formulario (form_id) - el segmento se agregará automáticamente");
    console.log("   ⚠️  Asegúrate de que los campos personalizados existan en el formulario");
  } else if (segmentId) {
    // Si no hay formId, usar segment_id directamente
    requestBody.segment_id = segmentId;
    console.log("   ✅ Usando segmento directamente");
  }
  
  // Validar que los campos personalizados no estén vacíos
  if (formId && (!options.customFields || Object.keys(options.customFields).length === 0)) {
    console.warn("   ⚠️  ADVERTENCIA: No hay campos personalizados para enviar al formulario");
  }
  
  console.log("📋 Campos personalizados que se enviarán:");
  if (requestBody.custom_fields && Object.keys(requestBody.custom_fields).length > 0) {
    Object.entries(requestBody.custom_fields).forEach(([key, value]) => {
      const valueStr = String(value);
      const truncated = valueStr.length > 50 ? valueStr.substring(0, 47) + '...' : valueStr;
      const length = valueStr.length;
      const status = length > 256 ? "❌ EXCEDE LÍMITE" : "✅";
      console.log(`   ${status} ${key}: ${truncated} (${length} caracteres)`);
    });
  } else {
    console.log("   ⚠️  No hay campos personalizados para enviar");
  }
  
  // Mostrar el body completo que se enviará (para debugging)
  console.log("");
  console.log("📦 Body completo que se enviará a Flodesk:");
  console.log(JSON.stringify(requestBody, null, 2));
  console.log("");
  
  // Validar que el body tenga la estructura correcta
  if (formId && !requestBody.form_id) {
    throw new Error("Error: form_id no se agregó correctamente al request body");
  }
  if (!formId && !segmentId && !requestBody.segment_id) {
    throw new Error("Error: No se configuró ni form_id ni segment_id");
  }

  try {
    // IMPORTANTE: Cuando hay formId, necesitamos crear el suscriptor primero
    // y luego asociarlo al formulario, o usar el método correcto
    // Flodesk requiere que los suscriptores se creen a través del formulario
    // para que los campos personalizados se guarden correctamente
    
    let response;
    
    // Usar el endpoint de suscriptores (único endpoint disponible en Flodesk)
    console.log(`🔗 Usando endpoint: https://api.flodesk.com/v1/subscribers`);
    if (formId) {
      console.log(`   📝 Form IDs: [${formId}] (enviado como array en form_ids)`);
      console.log("   ⚠️  El formulario debe estar configurado para agregar al segmento automáticamente");
    } else if (segmentId) {
      console.log(`   📝 Segment ID: ${segmentId}`);
    }
    
    // Crear el suscriptor
    response = await fetch("https://api.flodesk.com/v1/subscribers", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      console.error("❌ Error en respuesta de Flodesk:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      throw new Error(
        `Flodesk API error: ${response.status} - ${errorData.message || errorText}`
      );
    }

    const result = await response.json();

    console.log("✅ Suscriptor agregado a Flodesk:");
    console.log(`   Subscriber ID: ${result.id || result.subscriber_id || "N/A"}`);
    console.log(`   Email: ${result.email || options.to}`);
    
    // Mostrar información completa de la respuesta
    if (result.form_id || result.form_ids) {
      console.log(`   📝 Form ID en respuesta: ${result.form_id || result.form_ids || "N/A"}`);
    }
    if (result.segment_id || result.segment_ids) {
      console.log(`   📝 Segment ID en respuesta: ${result.segment_id || result.segment_ids || "N/A"}`);
    }
    
    // Mostrar los campos personalizados que se guardaron
    if (result.custom_fields && Object.keys(result.custom_fields).length > 0) {
      console.log("   📋 Campos personalizados guardados en Flodesk:");
      Object.entries(result.custom_fields).forEach(([key, value]) => {
        const valueStr = String(value);
        const truncated = valueStr.length > 50 ? valueStr.substring(0, 47) + '...' : valueStr;
        console.log(`      ✅ ${key}: ${truncated}`);
      });
    } else {
      console.log("   ⚠️  ADVERTENCIA: No se recibieron campos personalizados en la respuesta");
      console.log("   ⚠️  Esto puede indicar que:");
      console.log("      - Los campos no existen en el formulario");
      console.log("      - Los nombres de los campos no coinciden exactamente");
      console.log("      - El formulario no está configurado correctamente");
    }
    
    // Comparar campos enviados vs recibidos
    if (options.customFields && result.custom_fields) {
      const sentKeys = Object.keys(options.customFields);
      const receivedKeys = Object.keys(result.custom_fields);
      const missingKeys = sentKeys.filter(key => !receivedKeys.includes(key));
      
      if (missingKeys.length > 0) {
        console.log("   ⚠️  Campos enviados pero NO guardados:");
        missingKeys.forEach(key => {
          console.log(`      ❌ ${key}: ${options.customFields![key]}`);
        });
      }
    }
    
    console.log("");
    console.log("💡 Verifica en Flodesk que:");
    console.log("   1. El suscriptor aparezca en el formulario con ID: " + (formId || "N/A"));
    console.log("   2. El suscriptor esté en el segmento 'referrals'");
    console.log("   3. Todos los campos personalizados estén llenos");
    console.log("   4. El workflow esté activo y se active automáticamente");
    console.log("");

    return {
      success: true,
      subscriberId: result.id || result.subscriber_id,
    };
  } catch (error: any) {
    console.error("❌ Error al enviar email con Flodesk:", {
      message: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

