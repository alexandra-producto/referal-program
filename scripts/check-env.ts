#!/usr/bin/env tsx
/**
 * Script para verificar que todas las variables de entorno necesarias estén configuradas
 * Uso: npm run check:env
 */

import { config } from "dotenv";
import { resolve } from "path";

// Cargar .env.local
config({
  path: resolve(process.cwd(), ".env.local"),
});

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  check?: (value: string | undefined) => boolean;
}

const requiredVars: EnvVar[] = [
  {
    name: "SUPABASE_URL",
    required: true,
    description: "URL de tu proyecto Supabase",
    check: (v) => v?.startsWith("https://") || false,
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    description: "Service Role Key de Supabase",
    check: (v) => (v?.length || 0) > 20,
  },
  {
    name: "TWILIO_ACCOUNT_SID",
    required: true,
    description: "Account SID de Twilio",
  },
  {
    name: "TWILIO_AUTH_TOKEN",
    required: true,
    description: "Auth Token de Twilio",
  },
  {
    name: "TWILIO_WHATSAPP_FROM",
    required: true,
    description: "Número de WhatsApp de Twilio (formato: whatsapp:+14155238886)",
    check: (v) => v?.startsWith("whatsapp:+") || false,
  },
  {
    name: "LINKEDIN_CLIENT_ID",
    required: true,
    description: "Client ID de LinkedIn OAuth",
  },
  {
    name: "LINKEDIN_CLIENT_SECRET",
    required: true,
    description: "Client Secret de LinkedIn OAuth",
  },
  {
    name: "SESSION_SECRET",
    required: true,
    description: "Secret para firmar sesiones JWT (mínimo 32 caracteres)",
    check: (v) => (v?.length || 0) >= 32,
  },
  {
    name: "RECOMMENDATION_SECRET",
    required: true,
    description: "Secret para tokens de recomendación (mínimo 32 caracteres)",
    check: (v) => (v?.length || 0) >= 32,
  },
  {
    name: "ADMIN_EMAILS",
    required: true,
    description: "Emails de administradores (separados por comas)",
    check: (v) => {
      if (!v) return false;
      const emails = v.split(",").map((e) => e.trim());
      return emails.every((e) => e.includes("@"));
    },
  },
  {
    name: "APP_URL",
    required: false,
    description: "URL base de la aplicación (opcional, se detecta automáticamente en Vercel)",
  },
  {
    name: "TEST_PHONE_NUMBER",
    required: false,
    description: "Número de teléfono para testing (opcional)",
  },
];

function checkEnvVars() {
  console.log("🔍 Verificando variables de entorno...\n");

  let allValid = true;
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const envVar of requiredVars) {
    const value = process.env[envVar.name];
    const isSet = value !== undefined && value !== "";

    if (envVar.required && !isSet) {
      console.error(`❌ ${envVar.name}: FALTANTE (requerido)`);
      console.error(`   ${envVar.description}\n`);
      missing.push(envVar.name);
      allValid = false;
      continue;
    }

    if (!isSet) {
      console.warn(`⚠️  ${envVar.name}: No configurado (opcional)`);
      console.warn(`   ${envVar.description}\n`);
      continue;
    }

    // Validación personalizada
    if (envVar.check && !envVar.check(value)) {
      console.error(`❌ ${envVar.name}: VALOR INVÁLIDO`);
      console.error(`   ${envVar.description}`);
      console.error(`   Valor actual: ${value?.substring(0, 20)}...\n`);
      invalid.push(envVar.name);
      allValid = false;
      continue;
    }

    // Ocultar valores sensibles
    const displayValue =
      envVar.name.includes("SECRET") || envVar.name.includes("KEY") || envVar.name.includes("TOKEN")
        ? `${value?.substring(0, 10)}... (${value?.length} caracteres)`
        : value;

    console.log(`✅ ${envVar.name}: OK`);
    console.log(`   ${envVar.description}`);
    console.log(`   Valor: ${displayValue}\n`);
  }

  // Resumen
  console.log("=".repeat(60));
  if (allValid) {
    console.log("✅ Todas las variables de entorno están configuradas correctamente!");
  } else {
    console.error("❌ Hay problemas con las variables de entorno:");
    if (missing.length > 0) {
      console.error(`   - Faltantes: ${missing.join(", ")}`);
    }
    if (invalid.length > 0) {
      console.error(`   - Inválidas: ${invalid.join(", ")}`);
    }
    console.error("\n💡 Revisa .env.local y asegúrate de tener todos los valores correctos.");
    console.error("   Puedes usar .env.example como referencia.");
  }
  console.log("=".repeat(60));

  process.exit(allValid ? 0 : 1);
}

checkEnvVars();

