import { resolve } from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Carga .env.local desde la raíz del proyecto (solo en desarrollo local)
// En producción (Vercel), las variables de entorno se cargan automáticamente
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ [supabaseClient] SUPABASE_URL:", url ? "✅ Configurado" : "❌ No configurado");
  console.error("❌ [supabaseClient] SUPABASE_SERVICE_ROLE_KEY:", key ? "✅ Configurado" : "❌ No configurado");
  console.error("❌ [supabaseClient] NODE_ENV:", process.env.NODE_ENV);
  throw new Error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

// Crear cliente con SERVICE_ROLE_KEY para bypass RLS
// El SERVICE_ROLE_KEY tiene permisos completos y bypass todas las políticas RLS
export const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  // Asegurar que usamos el service role key correctamente
  global: {
    headers: {
      'apikey': key,
    },
  },
});
