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

/**
 * Construye el HTML del email para hyperconnectors
 * Similar a buildHciWhatsappMessage pero en formato HTML
 */
export function buildHciEmailMessage(
  hci: HciInfo,
  job: JobInfo,
  candidates: CandidateInfo[],
  recommendUrl: string,
  owner?: OwnerInfo | null,
  baseUrl?: string
): { subject: string; html: string } {
  // Obtener solo el primer nombre del hyperconnector
  const hciFirstName = hci.full_name.split(' ')[0];
  
  // Obtener nombre del owner o usar "Un miembro de la comunidad"
  const ownerName = owner?.full_name || "Un miembro de la comunidad";
  
  // Obtener must_have_skills desde requirements_json
  let nonNegotiablesText = "";
  if (job.requirements_json && typeof job.requirements_json === 'object') {
    // Prioridad 1: must_have_skills (nuevo formato)
    if ('must_have_skills' in job.requirements_json && Array.isArray(job.requirements_json.must_have_skills)) {
      const skills = job.requirements_json.must_have_skills;
      if (skills.length > 0) {
        // Formatear skills de manera legible
        nonNegotiablesText = skills
          .map((skill: string) => {
            // Convertir snake_case a título legible
            return skill
              .split('_')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          })
          .join(', ');
      }
    }
    // Fallback: non_negotiables_text (formato antiguo)
    if (!nonNegotiablesText && 'non_negotiables_text' in job.requirements_json) {
      nonNegotiablesText = job.requirements_json.non_negotiables_text || "";
    }
  }
  
  // Fallback adicional: non_negotiables directo
  if (!nonNegotiablesText) {
    if (job.non_negotiables && Array.isArray(job.non_negotiables) && job.non_negotiables.length > 0) {
      nonNegotiablesText = job.non_negotiables.join(", ");
    } else if (job.non_negotiables && typeof job.non_negotiables === 'string') {
      nonNegotiablesText = job.non_negotiables;
    }
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
      return {
        name: c.full_name,
        where: dondeCoincidieron,
      };
    });

  // Determinar si es singular o plural
  const esPlural = candidates.length > 1;
  const textoConoces = esPlural 
    ? "Vimos que conoces a personas que podrían encajar perfecto con este reto:" 
    : "Vimos que conoces a alguien que podría encajar perfecto con este reto:";

  // URL de la imagen del header desde Google Drive (link directo)
  // Convertir link de Google Drive a formato directo para mejor compatibilidad
  // Link original: https://drive.google.com/file/d/1xrDIDndIFDvYWEMM_dZ9seNchOtoByvi/view?usp=sharing
  // Link directo: https://drive.google.com/uc?export=view&id=FILE_ID
  const headerImageUrl = "https://drive.google.com/uc?export=view&id=1xrDIDndIFDvYWEMM_dZ9seNchOtoByvi";

  // Construir el HTML como email personal simple con header y botón
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="format-detection" content="telephone=no">
  <title>Recomendación de Talento</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #000000;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-size: 16px; line-height: 1.6;">
    
    <!-- Header con imagen -->
    <div style="margin: 0 0 30px 0; text-align: center;">
      <img src="${headerImageUrl}" alt="Product Latam - Connecting Top-Tier Talent" style="width: 100%; max-width: 600px; height: auto; display: block; border: 0; outline: none; text-decoration: none;" />
    </div>
    
    <p style="margin: 0 0 20px 0;">
      Hola ${hciFirstName},
    </p>
    
    <p style="margin: 0 0 20px 0;">
      Estamos construyendo una red de expertos en tech y queremos que tú seas parte de ella.
    </p>
    
    <p style="margin: 0 0 20px 0;">
      ${ownerName} de <strong>${job.company_name || "la comunidad"}</strong> está buscando a una persona para su rol de <strong>${job.role_title}</strong>.
    </p>
    
    <p style="margin: 0 0 20px 0;">
      Nada de checklists ni CVs eternos — aquí se trata de quién es la persona, cómo piensa y qué tan bien navega problemas reales.
    </p>
    
    ${nonNegotiablesText ? `
    <p style="margin: 0 0 20px 0;">
      <strong>Skills no negociables:</strong><br>
      ${nonNegotiablesText}
    </p>
    ` : ''}
    
    <p style="margin: 0 0 20px 0;">
      ${textoConoces}
    </p>
    
    <ul style="margin: 0 0 20px 0; padding-left: 20px;">
      ${listaCandidatos.map(c => `
        <li style="margin: 0 0 10px 0;">
          <strong>${c.name}</strong> – coincidieron en ${c.where}
        </li>
      `).join('')}
    </ul>
    
    <p style="margin: 0 0 20px 0;">
      ¿Nos ayudas con una recomendación?
    </p>
    
    <!-- Botón CTA -->
    <div style="margin: 0 0 20px 0; text-align: center;">
      <a href="${recommendUrl}" style="display: inline-block; padding: 16px 32px; background-color: #fc039f; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px rgba(252, 3, 159, 0.3);">
        Recomienda Aquí
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; font-size: 14px; color: #666666;">
      Gracias,<br>
      Equipo Product Latam
    </p>
    
  </div>
</body>
</html>
  `.trim();

  // Subject line: catchy y personal
  const subject = "Tu criterio pesa. ¿A quién pondrías en esta mesa?";

  return { subject, html };
}

