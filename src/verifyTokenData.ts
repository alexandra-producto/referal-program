import "./config/env";
import { getJobById } from "./domain/jobs";
import { getHyperconnectorById } from "./domain/hyperconnectors";
import { validateRecommendationToken } from "./utils/recommendationTokens";

async function verifyToken() {
  const token = "9baeabc1276a83ee5fa86e78f9cdaa07.MWI4ZDU5ZjgtNGY2Yi00NWZmLWE0MjktYWEwMmMyZTc5ODM4OjE4NTU0MGUyLWI3NzItNDAxYy1iODNlLTk0NWFiNjE4NjlmMDoxNzYzNDcyODcwNDU2";
  
  console.log("🔍 Verificando token...\n");
  
  // 1. Validar token criptográficamente
  const decoded = validateRecommendationToken(token);
  if (!decoded) {
    console.error("❌ Token inválido criptográficamente");
    return;
  }
  
  console.log("✅ Token válido criptográficamente");
  console.log(`   HCI ID: ${decoded.hyperconnectorId}`);
  console.log(`   Job ID: ${decoded.jobId}\n`);
  
  // 2. Verificar que el hyperconnector existe
  console.log("🔍 Verificando hyperconnector...");
  try {
    const hci = await getHyperconnectorById(decoded.hyperconnectorId);
    if (hci) {
      console.log(`✅ Hyperconnector encontrado: ${hci.full_name} (${hci.email || "sin email"})`);
    } else {
      console.error(`❌ Hyperconnector NO encontrado: ${decoded.hyperconnectorId}`);
    }
  } catch (error: any) {
    console.error(`❌ Error buscando hyperconnector: ${error.message}`);
  }
  
  console.log("");
  
  // 3. Verificar que el job existe
  console.log("🔍 Verificando job...");
  try {
    const job = await getJobById(decoded.jobId);
    if (job) {
      console.log(`✅ Job encontrado: ${job.role_title || "sin título"} en ${job.company_name || "sin compañía"}`);
      console.log(`   ID: ${job.id}`);
      console.log(`   Campos disponibles: ${Object.keys(job).join(", ")}`);
    } else {
      console.error(`❌ Job NO encontrado: ${decoded.jobId}`);
    }
  } catch (error: any) {
    console.error(`❌ Error buscando job: ${error.message}`);
  }
}

verifyToken();

