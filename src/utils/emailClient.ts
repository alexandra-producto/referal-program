/**
 * Cliente para envío de emails directo
 * Usa Resend para enviar emails desde hola@product-latam.com
 */

import { Resend } from "resend";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envía un email usando Resend
 * 
 * @param options - Opciones del email (to, subject, html, from, fromName)
 * @returns Promise con el resultado del envío
 */
export async function sendEmail(
  options: EmailOptions
): Promise<EmailResponse> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no está configurada en las variables de entorno");
  }

  const resend = new Resend(apiKey);

  // Email desde el que se envía
  const fromEmail = options.from || process.env.EMAIL_FROM || "hola@product-latam.com";
  const fromName = options.fromName || process.env.EMAIL_FROM_NAME || "Product Latam";
  const from = `${fromName} <${fromEmail}>`;

  console.log("📧 Enviando email directo:");
  console.log(`   From: ${from}`);
  console.log(`   To: ${options.to}`);
  console.log(`   Subject: ${options.subject}`);

  try {
    const { data, error } = await resend.emails.send({
      from: from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("❌ Error al enviar email:", error);
      return {
        success: false,
        error: error.message || "Error desconocido al enviar email",
      };
    }

    console.log("✅ Email enviado exitosamente:");
    console.log(`   Message ID: ${data?.id || "N/A"}`);

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error("❌ Error al enviar email:", {
      message: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message || "Error desconocido al enviar email",
    };
  }
}

