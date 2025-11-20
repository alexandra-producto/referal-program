import { config } from "dotenv";
import { resolve } from "path";

config({
  path: resolve(process.cwd(), ".env.local"),
});

console.log("✅ Env loaded from .env.local");
