/**
 * Script de prueba para ver qué datos devuelve la API de LinkedIn
 * Ejecutar: npx tsx scripts/test-linkedin-profile.ts
 */

import dotenv from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const ACCESS_TOKEN = process.env.TEST_LINKEDIN_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("❌ TEST_LINKEDIN_ACCESS_TOKEN no está configurado en .env.local");
  console.log("\nPara obtener un token de prueba:");
  console.log("1. Haz login en tu app");
  console.log("2. Copia el access_token de los logs del servidor");
  console.log("3. Agrégalo a .env.local como: TEST_LINKEDIN_ACCESS_TOKEN=tu_token");
  process.exit(1);
}

async function testLinkedInEndpoints() {
  console.log("🔍 Probando endpoints de LinkedIn API...\n");

  // 1. Test /v2/userinfo
  console.log("=".repeat(80));
  console.log("1. GET /v2/userinfo (OpenID Connect)");
  console.log("=".repeat(80));
  try {
    const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      console.log("✅ UserInfo obtenido:");
      console.log(JSON.stringify(userInfo, null, 2));
    } else {
      const errorText = await userInfoResponse.text();
      console.log("❌ Error:", userInfoResponse.status, errorText);
    }
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n");

  // 2. Test /v2/me (profile básico)
  console.log("=".repeat(80));
  console.log("2. GET /v2/me?projection=(id,vanityName,headline)");
  console.log("=".repeat(80));
  try {
    const profileResponse = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,vanityName,localizedFirstName,localizedLastName,headline)",
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log("✅ Profile obtenido:");
      console.log(JSON.stringify(profile, null, 2));
    } else {
      const errorText = await profileResponse.text();
      console.log("❌ Error:", profileResponse.status, errorText);
    }
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n");

  // 3. Test /v2/me con positions
  console.log("=".repeat(80));
  console.log("3. GET /v2/me?projection=(id,positions~)");
  console.log("=".repeat(80));
  try {
    const positionsResponse = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,positions~)",
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    if (positionsResponse.ok) {
      const positionsData = await positionsResponse.json();
      console.log("✅ Positions obtenido:");
      console.log(JSON.stringify(positionsData, null, 2));
      
      // Intentar extraer posición actual
      const positions = positionsData.positions?.elements || positionsData.positions || [];
      console.log("\n📋 Análisis de posiciones:");
      console.log(`Total de posiciones: ${positions.length}`);
      
      positions.forEach((pos: any, index: number) => {
        console.log(`\nPosición ${index + 1}:`);
        console.log(`  - ID: ${pos.id}`);
        console.log(`  - Title: ${pos.title || pos.localizedTitle || "N/A"}`);
        console.log(`  - Company: ${pos.companyName || pos.company?.localizedName || "N/A"}`);
        console.log(`  - IsCurrent: ${pos.isCurrent || "N/A"}`);
        console.log(`  - TimePeriod:`, pos.timePeriod || "N/A");
        console.log(`  - Full object:`, JSON.stringify(pos, null, 2));
      });
      
      const currentPosition = positions.find((pos: any) => pos.isCurrent === true || !pos.timePeriod?.endDate);
      if (currentPosition) {
        console.log("\n✅ Posición actual encontrada:");
        console.log(JSON.stringify(currentPosition, null, 2));
      } else {
        console.log("\n⚠️ No se encontró posición actual");
      }
    } else {
      const errorText = await positionsResponse.text();
      console.log("❌ Error:", positionsResponse.status, errorText);
    }
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n");

  // 4. Test /v2/positions directamente
  console.log("=".repeat(80));
  console.log("4. GET /v2/positions");
  console.log("=".repeat(80));
  try {
    const positionsDirectResponse = await fetch("https://api.linkedin.com/v2/positions", {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (positionsDirectResponse.ok) {
      const positionsDirect = await positionsDirectResponse.json();
      console.log("✅ Positions (directo) obtenido:");
      console.log(JSON.stringify(positionsDirect, null, 2));
    } else {
      const errorText = await positionsDirectResponse.text();
      console.log("❌ Error:", positionsDirectResponse.status, errorText);
    }
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n");

  // 5. Test /v2/me con projection completa
  console.log("=".repeat(80));
  console.log("5. GET /v2/me (sin projection, ver qué devuelve por defecto)");
  console.log("=".repeat(80));
  try {
    const meResponse = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log("✅ /v2/me (default) obtenido:");
      console.log(JSON.stringify(meData, null, 2));
    } else {
      const errorText = await meResponse.text();
      console.log("❌ Error:", meResponse.status, errorText);
    }
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }
}

testLinkedInEndpoints().catch(console.error);

