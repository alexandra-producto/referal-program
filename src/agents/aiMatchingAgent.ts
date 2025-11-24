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
    // Ruta al script Python (desde la raíz del proyecto)
    const projectRoot = resolve(process.cwd());
    const pythonScript = resolve(projectRoot, 'services/python/matching_service.py');
    
    console.log(`🤖 [AI MATCHING] Ejecutando matching para Job ${jobId} ↔ Candidate ${candidateId}`);
    
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
      }
    );

    if (stderr && !stderr.includes('✅')) {
      console.error('⚠️  Warnings del script Python:', stderr);
    }

    // El script imprime JSON al final, buscar la línea que empieza con {
    const lines = stdout.trim().split('\n');
    let jsonLine: string | undefined;
    
    // Buscar la última línea que sea JSON válido
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('{') && line.endsWith('}')) {
        jsonLine = line;
        break;
      }
    }
    
    if (!jsonLine) {
      // Intentar parsear todo el stdout como JSON
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

