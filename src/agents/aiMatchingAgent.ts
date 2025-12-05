/**
 * Wrapper para el servicio de AI Matching Agent en Python
 * Llama al script Python que usa OpenAI GPT-4o para calcular matches
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);

export interface AIMatchResult {
  score: number;
  detail: {
    trajectory: { score: number; reasoning: string };
    role_fit: { score: number; reasoning: string };
    hard_skills: { score: number; reasoning: string };
    stability: { score: number; reasoning: string };
    key_gap: string;
    weights: {
      trajectory: number;
      role_fit: number;
      hard_skills: number;
      stability: number;
    };
    calculated_at: string;
  };
}

/**
 * Calcula el match usando el servicio AI de Python
 * @param jobId - UUID del job
 * @param candidateId - UUID del candidato
 * @returns Resultado del matching con score y detalles
 */
export async function calculateAIMatch(
  jobId: string,
  candidateId: string
): Promise<AIMatchResult> {
  try {
    const isVercel = !!process.env.VERCEL;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // En Vercel/producción, usar la Serverless Function de Python
    if (isVercel || isProduction) {
      // En Vercel, usar la URL relativa (mismo dominio)
      // En producción, VERCEL_URL puede no estar disponible en runtime, usar URL relativa
      const apiUrl = process.env.VERCEL_URL && !isProduction
        ? `https://${process.env.VERCEL_URL}`
        : ''; // URL relativa funciona mejor en Vercel
      
      const apiEndpoint = apiUrl ? `${apiUrl}/api/ai-match` : '/api/ai-match';
      
      console.log(`🤖 [AI MATCHING] Llamando a API de Python en: ${apiEndpoint}`);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          candidate_id: candidateId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Error en API de matching: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log(`✅ [AI MATCHING] Match calculado via API: ${result.match_score}`);
      
      return {
        score: result.match_score,
        detail: result.match_detail,
      };
    }
    
    // En desarrollo local, ejecutar el script Python directamente
    const projectRoot = resolve(process.cwd());
    const pythonScript = resolve(projectRoot, 'services/python/matching_service.py');
    
    console.log(`🤖 [AI MATCHING] Ejecutando matching localmente para Job ${jobId} ↔ Candidate ${candidateId}`);
    
    // Ejecutar el script Python
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScript}" "${jobId}" "${candidateId}"`,
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          // Asegurar que las variables de entorno estén disponibles
          PATH: process.env.PATH || '',
        },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer para respuestas grandes
        timeout: 60000, // 60 segundos timeout
      }
    );

    if (stderr && !stderr.includes('✅')) {
      console.error('⚠️  Warnings del script Python:', stderr);
    }

    // El script imprime JSON al final, buscar la línea que empieza con {
    const lines = stdout.trim().split('\n');
    let jsonLine: string | undefined;
    
    // Buscar la última línea que sea JSON válido (puede ser multilínea)
    // Primero intentar encontrar una línea que empiece con { y termine con }
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('{') && line.endsWith('}')) {
        jsonLine = line;
        break;
      }
    }
    
    // Si no encontramos una línea completa, intentar buscar desde "RESULTADO FINAL:"
    // y concatenar todas las líneas desde ahí hasta el final
    if (!jsonLine) {
      const resultadoIndex = lines.findIndex(line => line.includes('RESULTADO FINAL:'));
      if (resultadoIndex >= 0) {
        // Buscar la primera línea con { después de "RESULTADO FINAL:"
        for (let i = resultadoIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('{')) {
            // Intentar parsear desde esta línea hasta el final
            const jsonCandidate = lines.slice(i).join('').trim();
            try {
              const parsed = JSON.parse(jsonCandidate);
              if (parsed.match_score !== undefined) {
                jsonLine = jsonCandidate;
                break;
              }
            } catch (e) {
              // Continuar buscando
            }
          }
        }
      }
    }
    
    if (!jsonLine) {
      // Intentar parsear todo el stdout como JSON (por si acaso está todo en una línea)
      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.match_score !== undefined) {
          return {
            score: parsed.match_score,
            detail: parsed.match_detail,
          };
        }
      } catch (e) {
        // Continuar con el error original
      }
      
      // Si aún no funciona, buscar cualquier objeto JSON en el output
      const jsonMatch = stdout.match(/\{[\s\S]*"match_score"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.match_score !== undefined) {
            return {
              score: parsed.match_score,
              detail: parsed.match_detail,
            };
          }
        } catch (e) {
          // Continuar con el error original
        }
      }
      
      throw new Error(`No se pudo parsear el resultado del matching. Output: ${stdout.substring(0, 500)}`);
    }

    const result = JSON.parse(jsonLine);
    
    if (!result.match_score || !result.match_detail) {
      throw new Error(`Resultado inválido del matching: ${JSON.stringify(result)}`);
    }
    
    console.log(`✅ [AI MATCHING] Match calculado: ${result.match_score}`);
    
    return {
      score: result.match_score,
      detail: result.match_detail,
    };
  } catch (error: any) {
    console.error('❌ [AI MATCHING] Error ejecutando AI matching:', error);
    
    // Si es un error de Python, intentar dar más contexto
    if (error.stderr) {
      console.error('   Python stderr:', error.stderr);
    }
    if (error.stdout) {
      console.error('   Python stdout:', error.stdout);
    }
    
    throw new Error(`Error en AI matching: ${error.message}`);
  }
}

