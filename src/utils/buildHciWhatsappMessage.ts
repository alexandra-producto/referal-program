type HciInfo = {
  full_name: string;
};

type JobInfo = {
  company_name: string;
  role_title: string;
  non_negotiables?: string[] | null;
  requirements_json?: any;
};

type CandidateInfo = {
  full_name: string;
  current_company: string | null;
  fit_score?: number | null;
  shared_experience?: string | null;
};

type OwnerInfo = {
  full_name: string;
};

export function buildHciWhatsappMessage(
  hci: HciInfo,
  job: JobInfo,
  candidates: CandidateInfo[],
  recommendUrl: string,
  owner?: OwnerInfo | null
) {
  // Obtener nombre del owner o usar "Un miembro de la comunidad"
  const ownerName = owner?.full_name || "Un miembro de la comunidad";
  
  // Obtener non_negotiables desde requirements_json o desde el array directo
  let nonNegotiablesText = "";
  if (job.requirements_json && typeof job.requirements_json === 'object' && 'non_negotiables_text' in job.requirements_json) {
    nonNegotiablesText = job.requirements_json.non_negotiables_text || "";
  } else if (job.non_negotiables && Array.isArray(job.non_negotiables) && job.non_negotiables.length > 0) {
    nonNegotiablesText = job.non_negotiables.join("\n");
  } else if (job.non_negotiables && typeof job.non_negotiables === 'string') {
    nonNegotiablesText = job.non_negotiables;
  }

  // Formatear lista de candidatos con "coincidieron en {donde coincidieron laboralmente}"
  const listaCandidatos = candidates
    .map((c) => {
      // Prioridad: shared_experience > current_company > texto genérico
      let dondeCoincidieron = "la comunidad";
      if (c.shared_experience) {
        dondeCoincidieron = c.shared_experience;
      } else if (c.current_company) {
        dondeCoincidieron = c.current_company;
      }
      return `• ${c.full_name} – coincidieron en ${dondeCoincidieron}`;
    })
    .join("\n");

  // Determinar si es singular o plural
  const esPlural = candidates.length > 1;
  const textoConoces = esPlural 
    ? "conoces a algunos miembros de la comunidad" 
    : "conoces a alguien";

  return `Hola ${hci.full_name}

${ownerName} está buscando a esa persona para su rol ${job.role_title}

Nada de checklists ni CVs eternos — aquí se trata de quién es la persona, cómo piensa y qué tan bien navega problemas reales.

Lo único que es no negociable:

${nonNegotiablesText || "No especificado"}

Vimos que ${textoConoces} que podría encajar perfecto con este reto:

${listaCandidatos}

¿Quieres recomendar a alguien para este reto?

Entra aquí para ver de qué va la oportunidad y elegir a quién recomendar: ${recommendUrl}`.trim();
}
