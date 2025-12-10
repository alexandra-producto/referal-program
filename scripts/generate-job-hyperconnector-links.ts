/**
 * Script para generar links de recomendación en producción para cada combinación
 * de Job e Hyperconnector.
 * 
 * Genera una tabla CSV con: Hyperconnector, Job, Link
 * 
 * Usage: npm run generate:job-hyperconnector-links
 */

import "../src/config/env";
import { supabase } from "../src/db/supabaseClient";
import { generateRecommendationUrl } from "../src/utils/recommendationTokens";
import { writeFileSync } from "fs";
import { resolve } from "path";

interface LinkRow {
  hyperconnector_id: string;
  hyperconnector_name: string;
  hyperconnector_email: string;
  job_id: string;
  job_title: string;
  company_name: string;
  link: string;
}

async function generateLinksTable() {
  console.log("🚀 Generando tabla de links Job ↔ Hyperconnector\n");
  console.log("=".repeat(80));

  // URL de producción
  const productionUrl = "https://referrals.product-latam.com";
  console.log(`🌐 URL de producción: ${productionUrl}\n`);

  // Paso 1: Obtener todos los jobs
  console.log("📋 Obteniendo todos los jobs...");
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, job_title, company_name")
    .order("created_at", { ascending: false });

  if (jobsError) {
    throw new Error(`Error obteniendo jobs: ${jobsError.message}`);
  }

  if (!jobs || jobs.length === 0) {
    console.log("❌ No se encontraron jobs");
    return;
  }

  console.log(`✅ ${jobs.length} jobs encontrados\n`);

  // Paso 2: Obtener todos los hyperconnectors
  console.log("👥 Obteniendo todos los hyperconnectors...");
  const { data: hyperconnectors, error: hciError } = await supabase
    .from("hyperconnectors")
    .select("id, full_name, email")
    .order("full_name");

  if (hciError) {
    throw new Error(`Error obteniendo hyperconnectors: ${hciError.message}`);
  }

  if (!hyperconnectors || hyperconnectors.length === 0) {
    console.log("❌ No se encontraron hyperconnectors");
    return;
  }

  console.log(`✅ ${hyperconnectors.length} hyperconnectors encontrados\n`);

  // Paso 3: Generar links para cada combinación
  console.log("🔗 Generando links...");
  const links: LinkRow[] = [];

  for (const job of jobs) {
    const jobTitle = job.job_title || "Sin título";
    const companyName = job.company_name || "Sin empresa";

    for (const hci of hyperconnectors) {
      try {
        // Generar el link directamente (sin guardar en BD)
        const link = generateRecommendationUrl(hci.id, job.id, productionUrl);
        
        links.push({
          hyperconnector_id: hci.id,
          hyperconnector_name: hci.full_name || "Sin nombre",
          hyperconnector_email: hci.email || "Sin email",
          job_id: job.id,
          job_title: jobTitle,
          company_name: companyName,
          link: link,
        });
      } catch (error: any) {
        console.error(`   ❌ Error generando link para ${hci.full_name} - ${jobTitle}: ${error.message}`);
      }
    }
  }

  console.log(`✅ ${links.length} links generados\n`);

  // Paso 4: Generar CSV
  console.log("📝 Generando archivo CSV...");
  
  const csvPath = resolve(process.cwd(), 'data', 'job-hyperconnector-links.csv');
  
  // Verificar si el archivo ya existe
  const fs = require('fs');
  const fileExists = fs.existsSync(csvPath);
  if (fileExists) {
    console.log(`   ⚠️  El archivo ${csvPath} ya existe. Se reemplazará con los nuevos datos.\n`);
  }
  
  const csvHeader = "Hyperconnector ID,Hyperconnector Nombre,Hyperconnector Email,Job ID,Job Título,Empresa,Link\n";
  const csvRows = links.map(link => {
    // Escapar comillas y comas en los valores
    const escapeCsv = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    return [
      escapeCsv(link.hyperconnector_id),
      escapeCsv(link.hyperconnector_name),
      escapeCsv(link.hyperconnector_email),
      escapeCsv(link.job_id),
      escapeCsv(link.job_title),
      escapeCsv(link.company_name),
      escapeCsv(link.link),
    ].join(',');
  }).join('\n');

  const csvContent = csvHeader + csvRows;
  
  // Guardar CSV (sobrescribe si ya existe)
  writeFileSync(csvPath, csvContent, 'utf-8');
  console.log(`✅ CSV ${fileExists ? 'reemplazado' : 'guardado'} en: ${csvPath}\n`);

  // Paso 5: Mostrar tabla en consola (primeras 10 filas)
  console.log("=".repeat(80));
  console.log("📊 TABLA DE LINKS (primeras 10 filas):");
  console.log("=".repeat(80));
  console.log("");
  console.log(
    "Hyperconnector".padEnd(30) + 
    "Job".padEnd(40) + 
    "Link".padEnd(50)
  );
  console.log("-".repeat(120));

  links.slice(0, 10).forEach(link => {
    const hciName = (link.hyperconnector_name || "Sin nombre").substring(0, 28);
    const jobTitle = (link.job_title || "Sin título").substring(0, 38);
    const linkShort = link.link.substring(0, 48);
    
    console.log(
      hciName.padEnd(30) + 
      jobTitle.padEnd(40) + 
      linkShort.padEnd(50)
    );
  });

  if (links.length > 10) {
    console.log(`\n... y ${links.length - 10} filas más (ver CSV completo)`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ PROCESO COMPLETADO");
  console.log("=".repeat(80));
  console.log(`\n📊 Resumen:`);
  console.log(`   - Jobs: ${jobs.length}`);
  console.log(`   - Hyperconnectors: ${hyperconnectors.length}`);
  console.log(`   - Links generados: ${links.length}`);
  console.log(`   - Archivo CSV: ${csvPath}`);
  console.log("");
}

// Ejecutar
generateLinksTable().catch((error) => {
  console.error("❌ Error:", error.message);
  if (error.stack) {
    console.error("\nStack trace:", error.stack);
  }
  process.exit(1);
});

