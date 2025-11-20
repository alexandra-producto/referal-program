import "./config/env";              // 👈 IMPORTANTE: carga .env.local
import { sendWhatsApp } from "./utils/sendWhatsApp";

async function test() {
  const to = "+573208631577"; // tu número
  const message = "Hola! Este es un mensaje de prueba desde Twilio + Cursor 🚀";

  const resp = await sendWhatsApp(to, message);

  console.log("✅ Message SID:", resp.sid);
}

test();
