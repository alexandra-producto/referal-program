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
 * FLUJO DE DOS PASOS:
 * 1. Crear el suscriptor (POST /subscribers) con datos mínimos
 * 2. Actualizar el suscriptor (PATCH /subscribers/{id}) con segment_id y custom_fields
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
 * Crea o actualiza un suscriptor en Flodesk usando el flujo de dos pasos
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

  console.log("📧 Creando/actualizando suscriptor en Flodesk:");
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
    // PASO 1: Crear el suscriptor (o obtenerlo si ya existe)
    // ========================================================================
    console.log("");
    console.log("🔹 PASO 1: Creando suscriptor...");
    
    const createBody: any = {
      email: email,
      first_name: defaultFirstName,
    };
    
    if (lastName) {
      createBody.last_name = lastName;
    }

    console.log(`   POST https://api.flodesk.com/v1/subscribers`);
    console.log(`   Body: ${JSON.stringify(createBody, null, 2)}`);

    const createResponse = await fetch("https://api.flodesk.com/v1/subscribers", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createBody),
    });

    let subscriberId: string;
    let subscriberData: any;

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      // Si el suscriptor ya existe (error 422 o similar), intentar obtenerlo por email
      if (createResponse.status === 422 || createResponse.status === 409) {
        console.log(`   ℹ️  Suscriptor ya existe, obteniendo por email...`);
        
        // Intentar obtener el suscriptor por email
        const getResponse = await fetch(`https://api.flodesk.com/v1/subscribers?email=${encodeURIComponent(email)}`, {
          method: "GET",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        });

        if (getResponse.ok) {
          const getData = await getResponse.json();
          // La respuesta puede ser un array o un objeto
          if (Array.isArray(getData) && getData.length > 0) {
            subscriberData = getData[0];
            subscriberId = subscriberData.id || subscriberData.subscriber_id;
          } else if (getData.id || getData.subscriber_id) {
            subscriberData = getData;
            subscriberId = getData.id || getData.subscriber_id;
          } else {
            throw new Error(`No se pudo obtener el ID del suscriptor existente: ${errorData.message || errorText}`);
          }
          console.log(`   ✅ Suscriptor existente encontrado: ${subscriberId}`);
        } else {
          throw new Error(`Error al obtener suscriptor existente: ${errorData.message || errorText}`);
        }
      } else {
        console.error("❌ Error en respuesta de Flodesk (crear suscriptor):", {
          status: createResponse.status,
          statusText: createResponse.statusText,
          error: errorData,
        });
        throw new Error(
          `Flodesk API error: ${createResponse.status} - ${errorData.message || errorText}`
        );
      }
    } else {
      subscriberData = await createResponse.json();
      subscriberId = subscriberData.id || subscriberData.subscriber_id;
      console.log(`   ✅ Suscriptor creado exitosamente: ${subscriberId}`);
    }

    if (!subscriberId) {
      throw new Error("No se pudo obtener el subscriber_id después de crear/obtener el suscriptor");
    }

    // ========================================================================
    // PASO 2: Actualizar el suscriptor con segmento y campos personalizados
    // ========================================================================
    console.log("");
    console.log("🔹 PASO 2: Actualizando suscriptor con segmento y campos personalizados...");
    
    // Flodesk requiere "segment_ids" (no "segments") como array
    // IMPORTANTE: Los custom_fields deben existir previamente en Flodesk
    const updateBody: any = {
      email: email,
      first_name: defaultFirstName,
      segment_ids: [segmentId], // Array de segment IDs - campo correcto según documentación
    };
    
    if (lastName) {
      updateBody.last_name = lastName;
    }

    // Agregar campos personalizados si existen
    // NOTA: Estos campos DEBEN existir previamente en Flodesk para que se guarden
    if (Object.keys(validatedCustomFields).length > 0) {
      updateBody.custom_fields = validatedCustomFields;
      console.log("   ⚠️  IMPORTANTE: Los custom_fields deben existir previamente en Flodesk");
      console.log(`   ⚠️  Campos que se intentarán guardar: ${Object.keys(validatedCustomFields).join(", ")}`);
    }

    console.log(`   POST https://api.flodesk.com/v1/subscribers (actualizar existente)`);
    console.log(`   Body: ${JSON.stringify(updateBody, null, 2)}`);

    // Flodesk permite usar POST para actualizar un suscriptor existente
    // Si el suscriptor ya existe, POST lo actualiza en lugar de crear uno nuevo
    const updateResponse = await fetch("https://api.flodesk.com/v1/subscribers", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateBody),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      console.error("❌ Error en respuesta de Flodesk (actualizar suscriptor):", {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        error: errorData,
      });

      throw new Error(
        `Flodesk API error al actualizar: ${updateResponse.status} - ${errorData.message || errorText}`
      );
    }

    const updateResult = await updateResponse.json();

    console.log("");
    console.log("✅ Suscriptor actualizado exitosamente:");
    console.log(`   Subscriber ID: ${subscriberId}`);
    console.log(`   Email: ${updateResult.email || email}`);
    
    // Log completo de la respuesta para debugging
    console.log("");
    console.log("📋 Respuesta completa de Flodesk (para debugging):");
    console.log(JSON.stringify(updateResult, null, 2));
    console.log("");
    
    // Verificar segmentos en la respuesta
    let segmentsFound = false;
    let segmentIds: string[] = [];
    
    if (updateResult.segment_ids && Array.isArray(updateResult.segment_ids) && updateResult.segment_ids.length > 0) {
      segmentIds = updateResult.segment_ids;
      segmentsFound = true;
    } else if (updateResult.segments) {
      if (Array.isArray(updateResult.segments)) {
        // segments puede ser un array de objetos {id, name} o un array de strings
        if (updateResult.segments.length > 0) {
          if (typeof updateResult.segments[0] === 'object' && updateResult.segments[0].id) {
            // Array de objetos con id y name
            segmentIds = updateResult.segments.map((s: any) => s.id || s);
            const segmentNames = updateResult.segments.map((s: any) => s.name || 'N/A');
            console.log(`   ✅ Segments añadidos: ${segmentNames.join(", ")} (IDs: ${segmentIds.join(", ")})`);
            segmentsFound = true;
          } else if (typeof updateResult.segments[0] === 'string') {
            // Array de strings (IDs)
            segmentIds = updateResult.segments;
            console.log(`   ✅ Segment IDs en respuesta: ${segmentIds.join(", ")}`);
            segmentsFound = true;
          }
        }
      } else if (typeof updateResult.segments === 'object') {
        // Puede ser un objeto con IDs como keys
        const segmentKeys = Object.keys(updateResult.segments);
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
    if (updateResult.custom_fields && Object.keys(updateResult.custom_fields).length > 0) {
      console.log("   📋 Campos personalizados guardados en Flodesk:");
      const receivedKeys = Object.keys(updateResult.custom_fields);
      const sentKeys = Object.keys(validatedCustomFields);
      
      // Mostrar campos que SÍ se guardaron (los que enviamos)
      const successfullySaved = sentKeys.filter(key => receivedKeys.includes(key));
      if (successfullySaved.length > 0) {
        console.log("   ✅ Campos enviados y guardados correctamente:");
        successfullySaved.forEach(key => {
          const valueStr = String(updateResult.custom_fields[key]);
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
      const extraKeys = receivedKeys.filter(key => !sentKeys.includes(key));
      if (extraKeys.length > 0) {
        console.log("   ℹ️  Campos adicionales en Flodesk (no enviados en esta solicitud):");
        extraKeys.forEach(key => {
          const valueStr = String(updateResult.custom_fields[key]);
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
 * Internamente usa createOrUpdateFlodeskSubscriber que sigue el flujo de dos pasos.
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

  console.log("📧 Enviando email con Flodesk (usando flujo de dos pasos):");
  console.log(`   To: ${options.to}`);
  console.log(`   Segment ID: ${segmentId}`);
  console.log(`   Subject: ${options.subject}`);

  // Usar la nueva función que sigue el flujo de dos pasos
  const result = await createOrUpdateFlodeskSubscriber(
    options.to,
    segmentId,
    options.customFields || {},
    firstName
  );

  return result;
}

