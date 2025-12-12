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

  // URL de la imagen del header (usar URL absoluta para compatibilidad con clientes de email)
  // Prioridad: baseUrl > VERCEL_URL > APP_URL > dominio de producción
  let headerImageUrl = "";
  if (baseUrl) {
    headerImageUrl = `${baseUrl}/images/email-header-banner.png`;
  } else if (process.env.VERCEL_URL) {
    headerImageUrl = `https://${process.env.VERCEL_URL}/images/email-header-banner.png`;
  } else if (process.env.APP_URL) {
    headerImageUrl = `${process.env.APP_URL}/images/email-header-banner.png`;
  } else {
    // Fallback: usar el dominio de producción si está configurado, sino localhost
    headerImageUrl = process.env.NODE_ENV === 'production' 
      ? "https://referal-programa.vercel.app/images/email-header-banner.png"
      : "http://localhost:3000/images/email-header-banner.png";
  }

  // Construir el HTML con mejores prácticas para evitar spam
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="format-detection" content="telephone=no">
  <title>Recomendación de Talento</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header con imagen -->
          <tr>
            <td>
              <img src="${headerImageUrl}" alt="Product Latam - Connecting Top-Tier Talent" style="width: 100%; height: auto; display: block; max-width: 600px; border: 0; outline: none; text-decoration: none;" width="600" />
            </td>
          </tr>
          
          <!-- Contenido principal -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Saludo -->
              <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #1a1a1a; line-height: 1.4;">
                Hola ${hciFirstName}
              </h1>
              
              <!-- Intro -->
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                ${ownerName} está buscando a una persona para su rol de: <strong>${job.role_title}</strong>
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Nada de checklists ni CVs eternos — aquí se trata de quién es la persona, cómo piensa y qué tan bien navega problemas reales.
              </p>
              
              <!-- Skills no negociables -->
              <div style="margin: 0 0 30px 0; padding: 20px; background-color: #f9f9f9; border-left: 4px solid #fc039f; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px;">
                  Los únicos skills que no son negociables:
                </p>
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333333;">
                  ${nonNegotiablesText || "No especificado"}
                </p>
              </div>
              
              <!-- Texto de conoces -->
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                ${textoConoces}
              </p>
              
              <!-- Lista de candidatos -->
              <div style="margin: 0 0 30px 0;">
                ${listaCandidatos.map(c => `
                  <div style="margin: 0 0 12px 0; padding: 12px; background-color: #fafafa; border-radius: 6px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #333333;">
                      <strong>${c.name}</strong> – coincidieron en ${c.where}
                    </p>
                  </div>
                `).join('')}
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${recommendUrl}" style="display: inline-block; padding: 16px 32px; background-color: #fc039f; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px rgba(252, 3, 159, 0.3);">
                      Recomienda Aquí
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.5; color: #666666; text-align: center;">
                ¿Nos ayudas con una recomendación?
              </p>
              
            </td>
          </tr>
          
          <!-- Footer con logo -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                Product Latam - Connecting Top-Tier Talent
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Subject line mejorado: más personal y menos promocional para evitar spam
  // Usar el nombre del owner para hacerlo más personal
  const subject = owner?.full_name 
    ? `${owner.full_name} te necesita: ${job.role_title}`
    : `Recomendación de talento: ${job.role_title}`;

  return { subject, html };
}

