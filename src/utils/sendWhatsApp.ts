import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

/**
 * Normaliza un número de teléfono para Twilio
 * Acepta formatos: "573208631577", "+573208631577", "whatsapp:+573208631577"
 * Retorna: "whatsapp:+573208631577"
 */
function normalizePhoneNumber(phone: string): string {
  // Remover espacios y caracteres especiales excepto + y whatsapp:
  let cleaned = phone.trim();
  
  // Si ya tiene "whatsapp:", removerlo temporalmente
  const hasWhatsappPrefix = cleaned.startsWith("whatsapp:");
  if (hasWhatsappPrefix) {
    cleaned = cleaned.replace("whatsapp:", "");
  }
  
  // Agregar "+" si no lo tiene
  if (!cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  }
  
  // Siempre agregar el prefijo "whatsapp:"
  return `whatsapp:${cleaned}`;
}

export async function sendWhatsApp(to: string, message: string) {
  // Normalizar números de teléfono
  const formattedTo = normalizePhoneNumber(to);
  const formattedFrom = process.env.TWILIO_WHATSAPP_FROM 
    ? normalizePhoneNumber(process.env.TWILIO_WHATSAPP_FROM)
    : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;

  console.log("📤 Enviando WhatsApp:");
  console.log(`   From: ${formattedFrom}`);
  console.log(`   To: ${formattedTo}`);
  console.log(`   Message length: ${message.length} caracteres`);

  try {
    const result = await client.messages.create({
      from: formattedFrom!,
      to: formattedTo,
      body: message,
    });

    console.log("✅ Mensaje creado en Twilio:");
    console.log(`   SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Error Code: ${result.errorCode || "N/A"}`);
    console.log(`   Error Message: ${result.errorMessage || "N/A"}`);

    // Si hay error, mostrarlo
    if (result.errorCode || result.errorMessage) {
      console.error("❌ Error en el mensaje:", {
        code: result.errorCode,
        message: result.errorMessage,
        status: result.status,
      });
    }

    return result;
  } catch (error: any) {
    console.error("❌ Error al enviar WhatsApp:", {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
    });
    throw error;
  }
}
