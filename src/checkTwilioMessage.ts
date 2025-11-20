/**
 * Script para verificar el estado de un mensaje de Twilio
 * 
 * Usage: npm run check:message -- SMd14f7e3cb7a95e67c12ff5e2001faf08
 */

import "./config/env";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

async function checkMessage(messageSid: string) {
  try {
    console.log(`🔍 Verificando mensaje: ${messageSid}\n`);

    const message = await client.messages(messageSid).fetch();

    console.log("=".repeat(70));
    console.log("📊 ESTADO DEL MENSAJE");
    console.log("=".repeat(70));
    console.log(`\n📨 SID: ${message.sid}`);
    console.log(`📊 Estado: ${message.status}`);
    console.log(`📱 De: ${message.from}`);
    console.log(`📱 Para: ${message.to}`);
    console.log(`📝 Cuerpo: ${message.body?.substring(0, 100)}...`);
    console.log(`❌ Error Code: ${message.errorCode || "Ninguno"}`);
    console.log(`❌ Error Message: ${message.errorMessage || "Ninguno"}`);
    console.log(`💰 Precio: ${message.price || "N/A"}`);
    console.log(`📅 Fecha de creación: ${message.dateCreated}`);
    console.log(`📅 Fecha de envío: ${message.dateSent || "No enviado aún"}`);
    console.log(`📅 Fecha de actualización: ${message.dateUpdated}`);

    if (message.errorCode) {
      console.log("\n" + "=".repeat(70));
      console.log("⚠️  ERRORES DETECTADOS");
      console.log("=".repeat(70));
      console.log(`\nCódigo: ${message.errorCode}`);
      console.log(`Mensaje: ${message.errorMessage}`);
      console.log(`\n💡 Posibles causas:`);
      
      if (message.errorCode === 21211) {
        console.log("   - El número de destino no es válido");
        console.log("   - Verifica que el número esté en formato internacional (+57...)");
      } else if (message.errorCode === 21608 || message.errorCode === 63016) {
        console.log("   - El número no está verificado en Twilio Sandbox");
        console.log("   - Para verificar el número:");
        console.log("     1. Ve a https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn");
        console.log("     2. Busca el código de verificación (ej: 'join xxxxx')");
        console.log("     3. Envía ese código desde WhatsApp al número: +1 415 523 8886");
        console.log("     4. Espera la confirmación de Twilio");
        console.log("   - O usa una cuenta de producción (no sandbox) para enviar a cualquier número");
      } else if (message.errorCode === 21614) {
        console.log("   - El número 'from' no es válido");
        console.log("   - Verifica TWILIO_WHATSAPP_FROM en .env.local");
      } else {
        console.log(`   - Código de error: ${message.errorCode}`);
        console.log("   - Consulta https://www.twilio.com/docs/api/errors para más información");
      }
    } else if (message.status === "queued" || message.status === "sending") {
      console.log("\n💡 El mensaje está en cola o enviándose. Puede tardar unos segundos.");
      console.log("   Si estás en Twilio Sandbox, asegúrate de que el número esté verificado.");
    } else if (message.status === "delivered") {
      console.log("\n✅ El mensaje fue entregado exitosamente!");
    } else if (message.status === "failed") {
      console.log("\n❌ El mensaje falló al enviarse.");
    } else if (message.status === "undelivered") {
      console.log("\n⚠️  El mensaje no pudo ser entregado.");
    }

    console.log("\n" + "=".repeat(70));
  } catch (error: any) {
    console.error("❌ Error al verificar mensaje:", error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    process.exit(1);
  }
}

const messageSid = process.argv[2] || "SMd14f7e3cb7a95e67c12ff5e2001faf08";

checkMessage(messageSid);
