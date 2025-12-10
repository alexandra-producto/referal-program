import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

// Cargar variables de entorno
config({
  path: resolve(process.cwd(), '.env.local'),
});

// Tipos
type ExperienceItem = {
  company_name: string;
  start_date: string | null; // 'YYYY-MM-01'
  end_date: string | null;   // 'YYYY-MM-01' o null si Present
  location: string | null;
};

type CSVRow = {
  hyper_full_name: string;
  full_name: string;
  email: string;
  linkedin_url: string;
  current_job_title: string;
  current_company: string;
  work_history_raw: string;
  industry: string;
  seniority: string;
  country: string;
  phone_number: string;
  profile_picture_url: string;
  hyper_email: string;
  hyper_linkedin_url: string;
  hyper_current_job_title: string;
  hyper_current_company: string;
  hyper_country: string;
  hyper_work_history_raw: string;
};

// Mapa de meses
const MONTH_MAP: Record<string, string> = {
  'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
  'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
  'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
};

// Inicializar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parsea el historial laboral crudo en un array de experiencias
 */
function parseWorkHistory(raw: string): ExperienceItem[] {
  if (!raw || !raw.trim()) {
    return [];
  }

  const experiences: ExperienceItem[] = [];
  
  // Separar por ), para obtener cada bloque
  const blocks = raw.split('),').map(block => block.trim());
  
  for (const block of blocks) {
    if (!block) continue;
    
    // Limpiar paréntesis final si existe
    const cleanBlock = block.replace(/\)$/, '').trim();
    
    // Buscar el primer ( para separar company_name del resto
    const parenIndex = cleanBlock.indexOf('(');
    
    if (parenIndex === -1) {
      // No hay paréntesis, solo nombre de empresa
      experiences.push({
        company_name: cleanBlock.trim(),
        start_date: null,
        end_date: null,
        location: null,
      });
      continue;
    }
    
    const company_name = cleanBlock.substring(0, parenIndex).trim();
    const insideParen = cleanBlock.substring(parenIndex + 1).trim();
    
    // Separar por coma para obtener fechas y location
    const parts = insideParen.split(',').map(p => p.trim());
    const dateRange = parts[0] || '';
    const location = parts[1] || null;
    
    // Parsear fechas: "Aug 2022 - Present" o "Aug 2022 - Aug 2021"
    let start_date: string | null = null;
    let end_date: string | null = null;
    
    if (dateRange) {
      const dateMatch = dateRange.match(/(\w+)\s+(\d{4})\s*-\s*(\w+)\s*(\d{4})?/);
      
      if (dateMatch) {
        // Formato: "Aug 2022 - Aug 2021" o "Aug 2022 - Present"
        const startMonth = dateMatch[1];
        const startYear = dateMatch[2];
        const endToken = dateMatch[3];
        const endYear = dateMatch[4];
        
        if (MONTH_MAP[startMonth] && startYear) {
          start_date = `${startYear}-${MONTH_MAP[startMonth]}-01`;
        }
        
        if (endToken === 'Present') {
          end_date = null;
        } else if (MONTH_MAP[endToken] && endYear) {
          end_date = `${endYear}-${MONTH_MAP[endToken]}-01`;
        }
      } else {
        // Intentar formato más simple: "Aug 2022"
        const simpleMatch = dateRange.match(/(\w+)\s+(\d{4})/);
        if (simpleMatch) {
          const month = simpleMatch[1];
          const year = simpleMatch[2];
          if (MONTH_MAP[month] && year) {
            start_date = `${year}-${MONTH_MAP[month]}-01`;
          }
        }
      }
    }
    
    experiences.push({
      company_name,
      start_date,
      end_date,
      location,
    });
  }
  
  return experiences;
}

/**
 * Inserta experiencias para un candidato
 */
async function insertExperiences(
  candidateId: string,
  experiences: ExperienceItem[],
  source: 'hyper' | 'candidate'
): Promise<void> {
  if (experiences.length === 0) return;
  
  for (const exp of experiences) {
    try {
      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('candidate_experience')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('company_name', exp.company_name)
        .eq('start_date', exp.start_date)
        .maybeSingle();
      
      if (existing) {
        continue; // Ya existe, saltar
      }
      
      // Insertar nueva experiencia
      const { error } = await supabase
        .from('candidate_experience')
        .insert({
          candidate_id: candidateId,
          company_name: exp.company_name,
          role_title: null,
          start_date: exp.start_date,
          end_date: exp.end_date,
          location: exp.location,
          description: null,
          experience_source: 'sheet_import',
        });
      
      if (error && error.code !== '23505') {
        console.error(`   ⚠️  Error insertando experiencia: ${exp.company_name}`, error.message);
      }
    } catch (err: any) {
      console.error(`   ⚠️  Error procesando experiencia: ${exp.company_name}`, err.message);
    }
  }
}

/**
 * Upsert de hiperconector
 */
async function upsertHyperconnector(row: CSVRow): Promise<string | null> {
  const hyperEmail = row.hyper_email?.trim() || '';
  const hyperFullName = row.hyper_full_name?.trim() || '';
  
  if (!hyperFullName) {
    return null; // No hay datos de hiperconector
  }
  
  let hyperCandidateId: string | null = null;
  let existingHyperconnectorId: string | null = null;
  
  // Si hay email, buscar existente
  if (hyperEmail) {
    // PASO 1: Buscar directamente en hyperconnectors por email (más directo)
    // Esto evita crear múltiples hiperconectores para el mismo email
    const { data: existingHyperByEmail } = await supabase
      .from('hyperconnectors')
      .select('id, candidate_id, email')
      .eq('email', hyperEmail)
      .maybeSingle();
    
    if (existingHyperByEmail) {
      // El hiperconector ya existe, actualizarlo y retornar
      hyperCandidateId = existingHyperByEmail.candidate_id;
      
      const { error } = await supabase
        .from('hyperconnectors')
        .update({
          full_name: row.hyper_full_name?.trim() || null,
          linkedin_url: row.hyper_linkedin_url?.trim() || null,
          current_job_title: row.hyper_current_job_title?.trim() || null,
          current_company: row.hyper_current_company?.trim() || null,
          country: row.hyper_country?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingHyperByEmail.id);
      
      if (error) {
        console.error(`   ❌ Error actualizando hiperconector:`, error.message);
        return null;
      }
      
      // Actualizar también el candidate asociado
      if (hyperCandidateId) {
        const { error: candidateUpdateError } = await supabase
          .from('candidates')
          .update({
            full_name: hyperFullName,
            linkedin_url: row.hyper_linkedin_url?.trim() || null,
            current_job_title: row.hyper_current_job_title?.trim() || null,
            current_company: row.hyper_current_company?.trim() || null,
            country: row.hyper_country?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', hyperCandidateId);
        
        if (candidateUpdateError) {
          console.error(`   ⚠️  Error actualizando candidate:`, candidateUpdateError.message);
        }
        
        // Procesar historial laboral si existe
        if (row.hyper_work_history_raw?.trim()) {
          const experiences = parseWorkHistory(row.hyper_work_history_raw);
          await insertExperiences(hyperCandidateId, experiences, 'hyper');
        }
      }
      
      return existingHyperByEmail.id;
    }
    
    // PASO 2: Si no se encontró en hyperconnectors, buscar candidate con ese email
    const { data: existingCandidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('email', hyperEmail)
      .maybeSingle();
    
    if (existingCandidate) {
      hyperCandidateId = existingCandidate.id;
      
      // Verificar si ese candidate ya tiene un hiperconector asociado (por candidate_id)
      const { data: existingHyperByCandidate } = await supabase
        .from('hyperconnectors')
        .select('id, candidate_id')
        .eq('candidate_id', existingCandidate.id)
        .maybeSingle();
      
      if (existingHyperByCandidate) {
        // El hiperconector existe pero no tiene email, actualizarlo
        const { error } = await supabase
          .from('hyperconnectors')
          .update({
            email: hyperEmail, // Agregar el email que faltaba
            full_name: row.hyper_full_name?.trim() || null,
            linkedin_url: row.hyper_linkedin_url?.trim() || null,
            current_job_title: row.hyper_current_job_title?.trim() || null,
            current_company: row.hyper_current_company?.trim() || null,
            country: row.hyper_country?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingHyperByCandidate.id);
        
        if (error) {
          console.error(`   ❌ Error actualizando hiperconector:`, error.message);
          return null;
        }
        
        // Actualizar el candidate
        const { error: candidateUpdateError } = await supabase
          .from('candidates')
          .update({
            full_name: hyperFullName,
            linkedin_url: row.hyper_linkedin_url?.trim() || null,
            current_job_title: row.hyper_current_job_title?.trim() || null,
            current_company: row.hyper_current_company?.trim() || null,
            country: row.hyper_country?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCandidate.id);
        
        if (candidateUpdateError) {
          console.error(`   ⚠️  Error actualizando candidate:`, candidateUpdateError.message);
        }
        
        // Procesar historial laboral si existe
        if (row.hyper_work_history_raw?.trim() && hyperCandidateId) {
          const experiences = parseWorkHistory(row.hyper_work_history_raw);
          await insertExperiences(hyperCandidateId, experiences, 'hyper');
        }
        
        return existingHyperByCandidate.id;
      }
      
      // Si no existe hiperconector pero sí candidate, actualizar candidate y crearemos el hiperconector más abajo
      const { error: candidateUpdateError } = await supabase
        .from('candidates')
        .update({
          full_name: hyperFullName,
          linkedin_url: row.hyper_linkedin_url?.trim() || null,
          current_job_title: row.hyper_current_job_title?.trim() || null,
          current_company: row.hyper_current_company?.trim() || null,
          country: row.hyper_country?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCandidate.id);
      
      if (candidateUpdateError) {
        console.error(`   ⚠️  Error actualizando candidate:`, candidateUpdateError.message);
      }
    }
  }
  
  // Si no hay candidate_id, crear uno nuevo
  if (!hyperCandidateId) {
    const { data: newCandidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        full_name: hyperFullName,
        email: hyperEmail || null,
        linkedin_url: row.hyper_linkedin_url?.trim() || null,
        current_job_title: row.hyper_current_job_title?.trim() || null,
        current_company: row.hyper_current_company?.trim() || null,
        country: row.hyper_country?.trim() || null,
        source: 'hyper_import',
      })
      .select('id')
      .single();
    
    if (candidateError) {
      console.error(`   ❌ Error creando candidate para hiperconector:`, candidateError.message);
      return null;
    }
    
    hyperCandidateId = newCandidate.id;
    
    // Procesar historial laboral
    if (row.hyper_work_history_raw?.trim()) {
      const experiences = parseWorkHistory(row.hyper_work_history_raw);
      await insertExperiences(hyperCandidateId, experiences, 'hyper');
    }
  }
  
  // Crear nuevo hiperconector (si llegamos aquí es porque no existía)
  // NOTA: No usamos upsert porque la tabla no tiene constraint único en email
  const { data: hyperconnector, error: hyperError } = await supabase
    .from('hyperconnectors')
    .insert({
      email: hyperEmail || null,
      full_name: hyperFullName,
      linkedin_url: row.hyper_linkedin_url?.trim() || null,
      current_job_title: row.hyper_current_job_title?.trim() || null,
      current_company: row.hyper_current_company?.trim() || null,
      country: row.hyper_country?.trim() || null,
      hci_score: 100,
      candidate_id: hyperCandidateId,
    })
    .select('id')
    .single();
  
  if (hyperError) {
    // Si es error de duplicado (email ya existe), intentar buscar y actualizar
    if (hyperError.code === '23505' && hyperEmail) {
      console.log(`   ℹ️  Hiperconector con email ${hyperEmail} ya existe, buscando para actualizar...`);
      
      const { data: existing } = await supabase
        .from('hyperconnectors')
        .select('id')
        .eq('email', hyperEmail)
        .maybeSingle();
      
      if (existing) {
        // Actualizar el existente
        const { error: updateError } = await supabase
          .from('hyperconnectors')
          .update({
            full_name: hyperFullName,
            linkedin_url: row.hyper_linkedin_url?.trim() || null,
            current_job_title: row.hyper_current_job_title?.trim() || null,
            current_company: row.hyper_current_company?.trim() || null,
            country: row.hyper_country?.trim() || null,
            candidate_id: hyperCandidateId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`   ❌ Error actualizando hiperconector existente:`, updateError.message);
          return null;
        }
        
        // Procesar historial laboral si existe
        if (row.hyper_work_history_raw?.trim() && hyperCandidateId) {
          const experiences = parseWorkHistory(row.hyper_work_history_raw);
          await insertExperiences(hyperCandidateId, experiences, 'hyper');
        }
        
        return existing.id;
      }
    }
    
    console.error(`   ❌ Error creando hiperconector:`, hyperError.message);
    return null;
  }
  
  // Procesar historial laboral si existe (solo para nuevos hiperconectores)
  if (row.hyper_work_history_raw?.trim() && hyperCandidateId) {
    const experiences = parseWorkHistory(row.hyper_work_history_raw);
    await insertExperiences(hyperCandidateId, experiences, 'hyper');
  }
  
  return hyperconnector.id;
}

/**
 * Upsert de candidato
 */
async function upsertCandidate(row: CSVRow): Promise<string | null> {
  const email = row.email?.trim() || '';
  const fullName = row.full_name?.trim() || '';
  
  // Si no hay full_name ni email, no hay candidato
  if (!fullName && !email) {
    return null;
  }
  
  let candidateId: string | null = null;
  
  // Si hay email, buscar existente
  if (email) {
    const { data: existing } = await supabase
      .from('candidates')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (existing) {
      candidateId = existing.id;
      
      // Actualizar solo campos NO vacíos
      const updates: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (fullName) updates.full_name = fullName;
      if (row.linkedin_url?.trim()) updates.linkedin_url = row.linkedin_url.trim();
      if (row.current_job_title?.trim()) updates.current_job_title = row.current_job_title.trim();
      if (row.current_company?.trim()) updates.current_company = row.current_company.trim();
      if (row.industry?.trim()) updates.industry = row.industry.trim();
      if (row.seniority?.trim()) updates.seniority = row.seniority.trim();
      if (row.country?.trim()) updates.country = row.country.trim();
      if (row.phone_number?.trim()) updates.phone_number = row.phone_number.trim();
      if (row.profile_picture_url?.trim()) updates.profile_picture_url = row.profile_picture_url.trim();
      
      const { error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', candidateId);
      
      if (error) {
        console.error(`   ❌ Error actualizando candidate:`, error.message);
      }
    }
  }
  
  // Si no existe, crear nuevo
  if (!candidateId) {
    const { data: newCandidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        full_name: fullName,
        email: email || null,
        linkedin_url: row.linkedin_url?.trim() || null,
        current_job_title: row.current_job_title?.trim() || null,
        current_company: row.current_company?.trim() || null,
        industry: row.industry?.trim() || null,
        seniority: row.seniority?.trim() || null,
        country: row.country?.trim() || null,
        phone_number: row.phone_number?.trim() || null,
        profile_picture_url: row.profile_picture_url?.trim() || null,
        source: 'sheet_import',
      })
      .select('id')
      .single();
    
    if (candidateError) {
      console.error(`   ❌ Error creando candidate:`, candidateError.message);
      return null;
    }
    
    candidateId = newCandidate.id;
  }
  
  // Procesar historial laboral
  if (row.work_history_raw?.trim()) {
    const experiences = parseWorkHistory(row.work_history_raw);
    await insertExperiences(candidateId, experiences, 'candidate');
  }
  
  return candidateId;
}

/**
 * Crear relación hiperconector-candidato
 */
async function createRelationship(
  hyperconnectorId: string,
  candidateId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('hyperconnector_candidates')
      .insert({
        hyperconnector_id: hyperconnectorId,
        candidate_id: candidateId,
        relationship_type: 'worked_together',
        relationship_source: 'sheet_import',
        confidence_score: 100,
      });
    
    if (error) {
      // Si es error de duplicado (23505), ignorarlo
      if (error.code === '23505') {
        // Ya existe, ignorar
        return;
      }
      console.error(`   ⚠️  Error creando relación:`, error.message);
    }
  } catch (err: any) {
    if (err.code === '23505') {
      // Duplicado, ignorar
      return;
    }
    console.error(`   ⚠️  Error creando relación:`, err.message);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando importación de hiperconectores...\n');
  
  // Leer CSV
  const csvPath = resolve(process.cwd(), 'data', 'hyperconnectors.csv');
  console.log(`📂 Leyendo CSV: ${csvPath}`);
  
  let csvContent: string;
  try {
    csvContent = readFileSync(csvPath, 'utf-8');
  } catch (error: any) {
    throw new Error(`No se pudo leer el archivo CSV: ${error.message}`);
  }
  
  // Parsear CSV
  const records: CSVRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  console.log(`✅ CSV parseado: ${records.length} filas encontradas\n`);
  
  // Procesar cada fila
  let processed = 0;
  let errors = 0;
  
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 1;
    
    try {
      console.log(`📋 Procesando fila ${rowNum}/${records.length}:`);
      
      // Upsert hiperconector
      const hyperconnectorId = await upsertHyperconnector(row);
      const hyperName = row.hyper_full_name?.trim() || 'N/A';
      
      if (hyperconnectorId) {
        console.log(`   ✅ Hyperconnector: ${hyperName} (ID: ${hyperconnectorId})`);
      } else {
        console.log(`   ⚠️  Hyperconnector: ${hyperName} (no procesado)`);
      }
      
      // Upsert candidato (si hay datos)
      const candidateId = await upsertCandidate(row);
      const candidateName = row.full_name?.trim() || 'N/A';
      
      if (candidateId) {
        console.log(`   ✅ Candidate: ${candidateName} (ID: ${candidateId})`);
        
        // Crear relación si ambos existen
        if (hyperconnectorId && candidateId) {
          await createRelationship(hyperconnectorId, candidateId);
          console.log(`   ✅ Relación creada: hyperconnector ↔ candidate`);
        }
      } else {
        console.log(`   ℹ️  Candidate: ${candidateName} (sin datos)`);
      }
      
      console.log(`   ✅ Fila ${rowNum} procesada: hyper=${hyperName}, candidate=${candidateName}\n`);
      processed++;
      
    } catch (error: any) {
      errors++;
      console.error(`   ❌ Error procesando fila ${rowNum}:`, error.message);
      console.error(`   ⚠️  Continuando con siguiente fila...\n`);
    }
  }
  
  console.log('='.repeat(80));
  console.log('✅ Importación completada');
  console.log(`   📊 Filas procesadas: ${processed}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log('='.repeat(80));
}

// Ejecutar
main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

