import { resolve } from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Carga .env.local desde la raíz del proyecto
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("SUPABASE_URL:", url);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", key);
  throw new Error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

export const supabase = createClient(url, key);
