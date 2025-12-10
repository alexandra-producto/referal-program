import "./config/env";
import { generateRecommendationUrl } from "./utils/recommendationTokens";

const hyperconnectorId = "eccd2f37-c071-4eda-8e4b-24a8d11c369b";
const jobId = "12cb6910-8019-449e-ae27-b1fb14a8cf6f";

// Forzar explícitamente http://localhost:3000
const baseUrl = "http://localhost:3000";

const link = generateRecommendationUrl(hyperconnectorId, jobId, baseUrl);

console.log("=".repeat(80));
console.log("🔗 LINK GENERADO");
console.log("=".repeat(80));
console.log("");
console.log(link);
console.log("");
console.log("Verificaciones:");
console.log(`  - ¿Empieza con http://? ${link.startsWith("http://")}`);
console.log(`  - ¿Empieza con https://? ${link.startsWith("https://")}`);
console.log(`  - ¿Contiene localhost:3000? ${link.includes("localhost:3000")}`);
console.log("");
