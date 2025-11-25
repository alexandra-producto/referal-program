#!/usr/bin/env tsx
/**
 * Script para crear .env.local desde un template
 * Uso: npm run create:env-local
 */

import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const envLocalPath = resolve(process.cwd(), ".env.local");

if (existsSync(envLocalPath)) {
  console.log("⚠️  .env.local ya existe. No se sobrescribirá.");
  console.log("   Si quieres recrearlo, elimínalo primero: rm .env.local");
  process.exit(0);
}

const envTemplate = `# ============================================
# VARIABLES DE ENTORNO - LOCAL DEVELOPMENT
# ============================================
# Completa los valores con tus credenciales reales

# ============================================
# SUPABASE
# ============================================
# URL de tu proyecto Supabase
# Obtener desde: Supabase Dashboard > Settings > API > Project URL
SUPABASE_URL=https://tu-proyecto.supabase.co

# Service Role Key de Supabase (⚠️ SECRETO - no compartir)
# Obtener desde: Supabase Dashboard > Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# TWILIO (WhatsApp)
# ============================================
# Account SID de Twilio
# Obtener desde: Twilio Console > Account > Account SID
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Auth Token de Twilio (⚠️ SECRETO - no compartir)
# Obtener desde: Twilio Console > Account > Auth Token
TWILIO_AUTH_TOKEN=tu_auth_token_aqui

# Número de WhatsApp de Twilio (formato: whatsapp:+14155238886)
# Obtener desde: Twilio Console > Phone Numbers > WhatsApp Sandbox
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# ============================================
# LINKEDIN OAUTH
# ============================================
# Client ID de LinkedIn OAuth
# Obtener desde: LinkedIn Developers > Tu App > Auth > Client ID
LINKEDIN_CLIENT_ID=tu_client_id_aqui

# Client Secret de LinkedIn OAuth (⚠️ SECRETO - no compartir)
# Obtener desde: LinkedIn Developers > Tu App > Auth > Client Secret
LINKEDIN_CLIENT_SECRET=tu_client_secret_aqui

# Redirect URI para desarrollo local
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback

# ============================================
# SEGURIDAD (JWT y Tokens)
# ============================================
# Secret para firmar sesiones JWT (mínimo 32 caracteres)
# Generar con: openssl rand -base64 32
SESSION_SECRET=tu_session_secret_minimo_32_caracteres_aqui_cambiar_por_uno_seguro

# Secret para tokens de recomendación (mínimo 32 caracteres)
# Generar con: openssl rand -base64 32
RECOMMENDATION_SECRET=tu_recommendation_secret_minimo_32_caracteres_aqui_cambiar_por_uno_seguro

# ============================================
# ADMIN
# ============================================
# Emails de administradores (separados por comas)
# Solo estos emails pueden hacer login como admin
ADMIN_EMAILS=alexa00rivera@gmail.com

# ============================================
# OPCIONAL
# ============================================
# URL base de la aplicación (opcional - se detecta automáticamente en local)
APP_URL=http://localhost:3000

# Número de teléfono para testing (opcional)
# TEST_PHONE_NUMBER=+573208631577

# ============================================
# TESTING (solo para desarrollo local)
# ============================================
# Access token de LinkedIn para testing (obtener desde logs después de hacer login)
# TEST_LINKEDIN_ACCESS_TOKEN=

# ============================================
# OPENAI (para AI Matching - opcional si no usas Control Tower)
# ============================================
# OPENAI_API_KEY=sk-proj-...
`;

try {
  writeFileSync(envLocalPath, envTemplate, "utf-8");
  console.log("✅ Archivo .env.local creado exitosamente!");
  console.log("\n📝 Próximos pasos:");
  console.log("1. Abre .env.local y completa los valores con tus credenciales reales");
  console.log("2. Puedes obtener los valores desde:");
  console.log("   - Supabase: Dashboard > Settings > API");
  console.log("   - Twilio: Console > Account");
  console.log("   - LinkedIn: Developers > Tu App > Auth");
  console.log("3. Para generar secrets seguros, ejecuta:");
  console.log("   openssl rand -base64 32");
  console.log("\n4. Verifica que todo esté correcto:");
  console.log("   npm run check:env");
} catch (error: any) {
  console.error("❌ Error creando .env.local:", error.message);
  process.exit(1);
}

