import "./config/env";

console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("TOKEN:", process.env.TWILIO_AUTH_TOKEN);
console.log("FROM:", process.env.TWILIO_WHATSAPP_FROM);
