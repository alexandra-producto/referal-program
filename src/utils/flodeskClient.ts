/**
 * Cliente para Flodesk API
 * Documentación: https://developers.flodesk.com
 * 
 * Flodesk usa autenticación básica con la API key como username
 * 
 * NOTA: Flodesk no tiene endpoint directo para enviar emails.
 * En su lugar, se agregan suscriptores a un segmento que tiene un workflow configurado.
 * El workflow se activa automáticamente y envía el email.
 * 
 * FLUJO DE UNA SOLA LLAMADA:
 * Se envía todo en una sola petición POST /subscribers con:
 * - email
 * - segment_ids (array)
 * - custom_fields (objeto)
 * Esto garantiza que el suscriptor se cree/actualice, se añada al segmento
 * y se guarden los campos personalizados simultáneamente.
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
 * Crea o actualiza un suscriptor en Flodesk en una sola llamada
 * 
 * IMPORTANTE: Esta función envía todo en una sola petición POST:
 * - email, segment_ids y custom_fields juntos
 * - Esto garantiza que el suscriptor se cree/actualice, se añada al segmento
 *   y se guarden los campos personalizados simultáneamente
 * 
 * @param email - Email del suscriptor
 * @param segmentId - ID del segmento destino
 * @param customFields - Objeto con las variables dinámicas para el workflow
 * @param firstName - Primer nombre del suscriptor (opcional)
 * @param lastName - Apellido del suscriptor (opcional)
 * @returns Promise con el resultado (subscriberId)
 */
export async function createOrUpdateFlodeskSubscriber(
  email: string,
  segmentId: string,
  customFields: Record<string, any> = {},
  firstName?: string,
  lastName?: string
): Promise<{ success: boolean; subscriberId?: string; error?: string }> {
  const apiKey = process.env.FLODESK_API_KEY;
  
  if (!apiKey) {
    throw new Error("FLODESK_API_KEY no está configurada en las variables de entorno");
  }

  if (!segmentId) {
    throw new Error("segmentId es requerido");
  }

  // Autenticación básica: API key como username, password vacío
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  // Extraer nombre del email si no se proporciona
  const emailParts = email.split("@");
  const defaultFirstName = firstName || emailParts[0].split(".")[0] || "Usuario";

  console.log("📧 Creando/actualizando suscriptor en Flodesk (una sola llamada):");
  console.log(`   Email: ${email}`);
  console.log(`   Segment ID: ${segmentId}`);
  console.log(`   First Name: ${defaultFirstName}`);
  if (lastName) {
    console.log(`   Last Name: ${lastName}`);
  }

  // Validar campos personalizados (máximo 256 caracteres cada uno)
  console.log("📋 Validando campos personalizados:");
  const validatedCustomFields: Record<string, string> = {};
  Object.entries(customFields).forEach(([key, value]) => {
    const valueStr = String(value);
    if (valueStr.length > 256) {
      console.warn(`   ⚠️  Campo '${key}' excede 256 caracteres (${valueStr.length}), será truncado`);
      validatedCustomFields[key] = valueStr.substring(0, 256);
    } else {
      validatedCustomFields[key] = valueStr;
      console.log(`   ✅ ${key}: ${valueStr.length} caracteres`);
    }
  });

  try {
    // ========================================================================
    // UNA SOLA LLAMADA: Crear/actualizar suscriptor con segment_ids y custom_fields
    // ========================================================================
    console.log("");
    console.log("🔹 Enviando una sola petición con email, segment_ids y custom_fields...");
    
    const requestBody: any = {
      email: email,
      first_name: defaultFirstName,
      segment_ids: [segmentId], // Array de segment IDs
    };
    
    if (lastName) {
      requestBody.last_name = lastName;
    }

    // Agregar campos personalizados si existen
    if (Object.keys(validatedCustomFields).length > 0) {
      requestBody.custom_fields = validatedCustomFields;
      console.log("   ⚠️  IMPORTANTE: Los custom_fields deben existir previamente en Flodesk");
      console.log(`   ⚠️  Campos que se intentarán guardar: ${Object.keys(validatedCustomFields).join(", ")}`);
    }

    console.log(`   POST https://api.flodesk.com/v1/subscribers`);
    console.log(`   Body: ${JSON.stringify(requestBody, null, 2)}`);
    console.log("");

    const response = await fetch("https://api.flodesk.com/v1/subscribers", {
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

    console.log("");
    console.log("✅ Suscriptor creado/actualizado exitosamente:");
    console.log(`   Subscriber ID: ${result.id || result.subscriber_id || "N/A"}`);
    console.log(`   Email: ${result.email || email}`);
    
    // Log completo de la respuesta para debugging
    console.log("");
    console.log("📋 Respuesta completa de Flodesk (para debugging):");
    console.log(JSON.stringify(result, null, 2));
    console.log("");
    
    const subscriberId = result.id || result.subscriber_id;
    
    // Verificar segmentos en la respuesta
    let segmentsFound = false;
    let segmentIds: string[] = [];
    
    if (result.segment_ids && Array.isArray(result.segment_ids) && result.segment_ids.length > 0) {
      segmentIds = result.segment_ids;
      segmentsFound = true;
    } else if (result.segments) {
      if (Array.isArray(result.segments)) {
        // segments puede ser un array de objetos {id, name} o un array de strings
        if (result.segments.length > 0) {
          if (typeof result.segments[0] === 'object' && result.segments[0].id) {
            // Array de objetos con id y name
            segmentIds = result.segments.map((s: any) => s.id || s);
            const segmentNames = result.segments.map((s: any) => s.name || 'N/A');
            console.log(`   ✅ Segments añadidos: ${segmentNames.join(", ")} (IDs: ${segmentIds.join(", ")})`);
            segmentsFound = true;
          } else if (typeof result.segments[0] === 'string') {
            // Array de strings (IDs)
            segmentIds = result.segments;
            console.log(`   ✅ Segment IDs en respuesta: ${segmentIds.join(", ")}`);
            segmentsFound = true;
          }
        }
      } else if (typeof result.segments === 'object') {
        // Puede ser un objeto con IDs como keys
        const segmentKeys = Object.keys(result.segments);
        if (segmentKeys.length > 0) {
          segmentIds = segmentKeys;
          console.log(`   ✅ Segments (objeto) en respuesta: ${segmentKeys.join(", ")}`);
          segmentsFound = true;
        }
      }
    }
    
    // Verificar que el segmento esperado esté en la lista
    if (segmentsFound) {
      if (segmentIds.includes(segmentId)) {
        console.log(`   ✅ El suscriptor está correctamente añadido al segmento ${segmentId}`);
      } else {
        console.log(`   ⚠️  ADVERTENCIA: El segmento ${segmentId} no aparece en la respuesta`);
        console.log(`   ⚠️  Segmentos encontrados: ${segmentIds.join(", ")}`);
      }
    } else {
      console.log(`   ⚠️  ADVERTENCIA: No se encontraron segment_ids en la respuesta`);
      console.log(`   ⚠️  Verifica que el segment_id ${segmentId} exista en Flodesk`);
    }
    
    // Verificar custom fields en la respuesta
    if (result.custom_fields && Object.keys(result.custom_fields).length > 0) {
      console.log("   📋 Campos personalizados guardados en Flodesk:");
      const receivedKeys = Object.keys(result.custom_fields);
      const sentKeys = Object.keys(validatedCustomFields);
      
      // Mostrar campos que SÍ se guardaron (los que enviamos)
      const successfullySaved = sentKeys.filter(key => receivedKeys.includes(key));
      if (successfullySaved.length > 0) {
        console.log("   ✅ Campos enviados y guardados correctamente:");
        successfullySaved.forEach(key => {
          const valueStr = String(result.custom_fields[key]);
          const truncated = valueStr.length > 50 ? valueStr.substring(0, 47) + '...' : valueStr;
          console.log(`      ✅ ${key}: ${truncated}`);
        });
      }
      
      // Mostrar campos que NO se guardaron (no existen en Flodesk)
      const missingKeys = sentKeys.filter(key => !receivedKeys.includes(key));
      if (missingKeys.length > 0) {
        console.log("   ⚠️  Campos enviados pero NO guardados (no existen en Flodesk):");
        missingKeys.forEach(key => {
          console.log(`      ❌ ${key}: ${validatedCustomFields[key]}`);
        });
        console.log("   💡 Crea estos campos en Flodesk: Audience > Subscriber Data > Custom Fields");
        console.log(`   💡 Nombres exactos requeridos: ${missingKeys.join(", ")}`);
      }
      
      // Mostrar campos adicionales que existen en Flodesk pero no enviamos
      const extraKeys = receivedKeys.filter(key => !sentKeys.includes(key) && key !== 'lastIp' && key !== 'lastOpen');
      if (extraKeys.length > 0) {
        console.log("   ℹ️  Campos adicionales en Flodesk (no enviados en esta solicitud):");
        extraKeys.forEach(key => {
          const valueStr = String(result.custom_fields[key]);
          const truncated = valueStr.length > 30 ? valueStr.substring(0, 27) + '...' : valueStr;
          console.log(`      ℹ️  ${key}: ${truncated}`);
        });
      }
    } else {
      console.log("   ⚠️  ADVERTENCIA: No se recibieron custom_fields en la respuesta");
      console.log("   ⚠️  Esto puede indicar que:");
      console.log("      - Los campos no existen en Flodesk (Audience > Subscriber Data > Custom Fields)");
      console.log("      - Los nombres de los campos no coinciden exactamente");
      console.log(`   💡 Campos enviados: ${Object.keys(validatedCustomFields).join(", ")}`);
      console.log("   💡 IMPORTANTE: Los nombres deben coincidir EXACTAMENTE (case-sensitive)");
    }

    console.log("");
    console.log("💡 Verifica en Flodesk que:");
    console.log(`   1. El suscriptor (ID: ${subscriberId}) esté en el segmento con ID: ${segmentId}`);
    console.log("   2. Todos los campos personalizados estén llenos");
    console.log("   3. El workflow esté activo y se active automáticamente");
    console.log("");

    return {
      success: true,
      subscriberId: subscriberId,
    };
  } catch (error: any) {
    console.error("❌ Error en createOrUpdateFlodeskSubscriber:", {
      message: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Envía un email usando Flodesk API (función de compatibilidad)
 * 
 * Esta función mantiene la compatibilidad con el código existente.
 * Internamente usa createOrUpdateFlodeskSubscriber que envía todo en una sola llamada.
 * 
 * @param options - Opciones del email (to, subject, htmlBody, fromEmail, fromName, customFields)
 * @returns Promise con el resultado del envío
 */
export async function sendFlodeskEmail(
  options: FlodeskEmailOptions
): Promise<FlodeskResponse> {
  // Obtener Segment ID (requerido)
  const segmentId = process.env.FLODESK_SEGMENT_ID;
  
  if (!segmentId) {
    throw new Error("FLODESK_SEGMENT_ID debe estar configurado en .env.local");
  }

  // Extraer nombre del email si no se proporciona
  const emailParts = options.to.split("@");
  const firstName = options.customFields?.first_name || emailParts[0].split(".")[0] || "Usuario";

  console.log("📧 Enviando email con Flodesk (una sola llamada):");
  console.log(`   To: ${options.to}`);
  console.log(`   Segment ID: ${segmentId}`);
  console.log(`   Subject: ${options.subject}`);

  // Usar la función que envía todo en una sola llamada
  const result = await createOrUpdateFlodeskSubscriber(
    options.to,
    segmentId,
    options.customFields || {},
    firstName
  );

  return result;
}

