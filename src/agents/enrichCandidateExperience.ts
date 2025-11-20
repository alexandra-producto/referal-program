import { resolve } from "path";
import dotenv from "dotenv";

import { getAllCandidates } from "../domain/candidates";
import {
  deleteExperienceForCandidate,
  insertExperienceRecords
} from "../domain/candidateExperience";

// Cargar variables de entorno (.env.local en la raíz del proyecto)
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const PDL_API_KEY = process.env.PDL_API_KEY;

if (!PDL_API_KEY) {
  console.error("❌ Missing PDL_API_KEY in .env.local");
  process.exit(1);
}

/**
 * Normaliza fechas de PDL ("YYYY-MM") a "YYYY-MM-01" para columnas tipo DATE.
 */
function normalizeDate(ym: string | null | undefined): string | null {
  if (!ym) return null;
  if (/^\d{4}-\d{2}$/.test(ym)) {
    return ym + "-01";
  }
  return null;
}

/**
 * Mapea el objeto `data` de PDL (record completo) a filas para candidate_experience.
 * Usamos el array `experience` del JSON como fuente principal.
 */
function mapPDLToExperience(candidateId: string, pdlRecord: any) {
  const experience = Array.isArray(pdlRecord.experience)
    ? pdlRecord.experience
    : [];

  return experience.map((exp: any) => {
    const company = exp.company || {};
    const title = exp.title || {};

    const locationNames = Array.isArray(exp.location_names)
      ? exp.location_names
      : [];
    const firstLocation = locationNames.length > 0 ? locationNames[0] : null;

    return {
      candidate_id: candidateId,
      company_name: company.name || null,
      title: title.name || null,
      start_date: normalizeDate(exp.start_date),
      end_date: normalizeDate(exp.end_date),
      is_current: exp.end_date == null,
      location: firstLocation,
      source: "pdl",
      raw_payload: exp
    };
  });
}

/**
 * Llama a la Person Enrichment API de People Data Labs usando:
 *  - name  (full_name del candidato)
 *  - company (current_company si lo tienes)
 *  - email
 * Devuelve el objeto `data` (record) o null si no hay match.
 */
async function fetchWorkExperienceFromPDL(candidate: any) {
  try {
    const url = "https://api.peopledatalabs.com/v5/person/enrich";

    const params: Record<string, string> = {};

    if (candidate.full_name) {
      params.name = candidate.full_name;
    }

    if (candidate.current_company) {
      params.company = candidate.current_company;
    }

    if (candidate.email) {
      params.email = candidate.email;
    }

    if (!params.name && !params.email) {
      console.log(
        `   ⚠️ Candidate ${candidate.id} has neither name nor email, skipping`
      );
      return null;
    }

    const qs = new URLSearchParams(params).toString();

    const response = await fetch(`${url}?${qs}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": PDL_API_KEY as string
      }
    });

    const json = await response.json();

    if (!json || typeof json !== "object") {
      console.error("   ❌ Invalid JSON from PDL:", json);
      return null;
    }

    if (json.status !== 200) {
      console.warn(
        `   ⚠️ PDL returned status=${json.status} for ${candidate.full_name}`,
        json.error || ""
      );
      return null;
    }

    // json.data es el record con campos: experience, job_title, etc.
    return json.data;
  } catch (err) {
    console.error("   ❌ Error in fetchWorkExperienceFromPDL:", err);
    return null;
  }
}

/**
 * Enriquecimiento masivo: toma candidatos desde Supabase,
 * llama a PDL y guarda su historial laboral en candidate_experience.
 */
export async function enrichCandidatesExperience(limit: number = 1) {
  console.log("🚀 Starting PDL enrichment...");

  try {
    const candidates = await getAllCandidates();

    const targets = candidates
      .filter((c: any) => c.email || c.full_name || c.current_company)
      .slice(0, limit);

    console.log(`📌 Enriching ${targets.length} candidates`);

    for (const candidate of targets) {
      try {
        console.log(`➡️ Fetching work history for: ${candidate.full_name}`);

        const pdlRecord = await fetchWorkExperienceFromPDL(candidate);

        if (!pdlRecord) {
          console.log(`   ⚠️ No PDL data for ${candidate.full_name}`);
          continue;
        }

        const experienceRecords = mapPDLToExperience(candidate.id, pdlRecord);

        // Borramos experiencia previa para tener snapshot limpio
        await deleteExperienceForCandidate(candidate.id);

        if (experienceRecords.length > 0) {
          await insertExperienceRecords(experienceRecords);
          console.log(
            `   ✔️ Inserted ${experienceRecords.length} experience entries`
          );
        } else {
          console.log(
            `   ⚠️ PDL record has no experience array for ${candidate.full_name}`
          );
        }
      } catch (innerError: any) {
        console.error(`   ❌ Error enriching ${candidate.full_name}`, innerError);
      }
    }

    console.log("🏁 Enrichment complete.");
  } catch (outerError: any) {
    console.error("❌ Fatal error in enrichment script:", outerError);
  }
}

/**
 * Punto de entrada si ejecutas el archivo directamente:
 *   npm run enrich:experience
 */
if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module
) {
  enrichCandidatesExperience(5);
}
