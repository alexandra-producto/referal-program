"""
AI Matching Agent Service
Evalúa la compatibilidad entre una vacante (Job) y un candidato usando OpenAI GPT-4o
con análisis estructurado en 4 dimensiones ponderadas.
"""

import os
import json
import sys
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pathlib import Path

# Intentar cargar .env desde varios lugares posibles
try:
    from dotenv import load_dotenv
    # Buscar .env en varios lugares:
    # 1. En el directorio actual (services/python/.env)
    # 2. En la raíz del proyecto (.env)
    # 3. En la raíz del proyecto (.env.local) - usado por Next.js
    current_dir = Path(__file__).parent
    project_root = current_dir.parent.parent
    
    env_files = [
        current_dir / ".env",
        project_root / ".env",
        project_root / ".env.local",
        current_dir / ".env.local",
        project_root / "docs" / ".env"  # También buscar en docs/.env
    ]
    
    loaded = False
    for env_file in env_files:
        if env_file.exists():
            load_dotenv(env_file)
            print(f"✅ Cargado .env desde: {env_file}")
            loaded = True
            break
    
    if not loaded:
        # Intentar cargar desde variables de entorno del sistema
        load_dotenv()
        print("ℹ️  No se encontró archivo .env, usando variables de entorno del sistema")
except ImportError:
    # Si no hay python-dotenv, solo usar variables de entorno del sistema
    print("ℹ️  python-dotenv no instalado, usando variables de entorno del sistema")

# Dependencias externas (instalar con pip)
try:
    from openai import OpenAI
    from pydantic import BaseModel, Field
    from supabase import create_client, Client
except ImportError as e:
    print(f"❌ Error: Faltan dependencias. Instala con: pip install openai pydantic supabase")
    print(f"   Error específico: {e}")
    sys.exit(1)


# ============================================================================
# CONFIGURACIÓN Y VARIABLES DE ENTORNO
# ============================================================================

# IMPORTANTE: Configura estas variables de entorno antes de ejecutar:
# - OPENAI_API_KEY: Tu API key de OpenAI
# - SUPABASE_URL: URL de tu proyecto Supabase
# - SUPABASE_SERVICE_ROLE_KEY: Service role key de Supabase (con permisos completos)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY no está configurada. Configúrala en tu .env o variables de entorno")
if not SUPABASE_URL:
    raise ValueError("❌ SUPABASE_URL no está configurada")
if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("❌ SUPABASE_SERVICE_ROLE_KEY no está configurada")

# Inicializar clientes
openai_client = OpenAI(api_key=OPENAI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# ============================================================================
# MODELOS PYDANTIC (Structured Outputs)
# ============================================================================

class SeniorityMatch(BaseModel):
    """Evaluación de match de seniority usando Career Matrix"""
    job_level: str = Field(..., description="Nivel del job en Career Matrix (ej: PM3, SE2)")
    candidate_level: str = Field(..., description="Nivel del candidato en Career Matrix (ej: PM3, SE2)")
    score: float = Field(..., ge=0.0, le=100.0, description="Score de 0.0 a 100.0")
    reason: str = Field(..., description="Razón del score, especialmente si levels no coinciden")


class RoleFit(BaseModel):
    """Evaluación de fit del rol"""
    job_role: str = Field(..., description="Rol requerido en el job")
    candidate_role: str = Field(..., description="Rol actual del candidato")
    score: float = Field(..., ge=0.0, le=100.0, description="Score de 0.0 a 100.0")
    reason: str = Field(..., description="Razón del score, especialmente si hay mismatch")


class Industry(BaseModel):
    """Evaluación de industria"""
    job_industries: List[str] = Field(..., description="Industrias requeridas por el job")
    candidate_industries: List[str] = Field(..., description="Industrias donde ha trabajado el candidato")
    score: float = Field(..., ge=0.0, le=100.0, description="Score de 0.0 a 100.0")
    reason: str = Field(..., description="Razón del score basada en alineación de industrias")


class Stability(BaseModel):
    """Evaluación de estabilidad laboral"""
    score: float = Field(..., ge=0.0, le=100.0, description="Score de 0.0 a 100.0")
    reason: str = Field(..., description="Razón del score basada en historial de empleo")


class MatchAnalysis(BaseModel):
    """Análisis completo de match entre job y candidato"""
    seniority_match: SeniorityMatch = Field(..., description="Evaluación de match de seniority (40%)")
    role_fit: RoleFit = Field(..., description="Evaluación de fit del rol (20%)")
    industry: Industry = Field(..., description="Evaluación de industria (30%)")
    stability: Stability = Field(..., description="Evaluación de estabilidad laboral (10%)")


# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

def calculate_duration_months(start_date: date, end_date: Optional[date]) -> tuple[int, int]:
    """
    Calcula la duración entre dos fechas en años y meses.
    
    Args:
        start_date: Fecha de inicio
        end_date: Fecha de fin (None si es trabajo actual)
    
    Returns:
        Tuple (años, meses)
    """
    if end_date is None:
        end_date = date.today()
    
    # Calcular diferencia
    years = end_date.year - start_date.year
    months = end_date.month - start_date.month
    
    # Ajustar si el día de fin es anterior al día de inicio
    if end_date.day < start_date.day:
        months -= 1
    
    # Ajustar años y meses
    if months < 0:
        years -= 1
        months += 12
    
    return years, months


def format_duration(years: int, months: int) -> str:
    """Formatea duración en texto legible"""
    parts = []
    if years > 0:
        parts.append(f"{years} año{'s' if years > 1 else ''}")
    if months > 0:
        parts.append(f"{months} mes{'es' if months > 1 else ''}")
    return ", ".join(parts) if parts else "Menos de 1 mes"


def generate_candidate_resume(candidate_experiences: List[Dict[str, Any]]) -> str:
    """
    Genera un string de texto cronológico (Resume) a partir de las experiencias del candidato.
    
    Args:
        candidate_experiences: Lista de experiencias del candidato
    
    Returns:
        String formateado con el resume cronológico
    """
    if not candidate_experiences:
        return "Sin experiencia laboral registrada."
    
    # Función helper para parsear fecha de inicio de forma segura
    def parse_start_date(exp: Dict[str, Any]) -> date:
        """Parsea start_date de forma segura, retornando date.today() si es None"""
        start_date_str = exp.get('start_date')
        
        if start_date_str is None:
            return date.today()  # Fallback si no hay fecha
        
        if isinstance(start_date_str, str):
            try:
                return datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
            except:
                try:
                    return datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d').date()
                except:
                    return date.today()  # Fallback si el parsing falla
        elif isinstance(start_date_str, date):
            return start_date_str
        else:
            return date.today()  # Fallback para cualquier otro caso
    
    # Ordenar por fecha de inicio (más reciente primero)
    # Usar una fecha muy antigua como fallback para None, para que aparezcan al final
    sorted_experiences = sorted(
        candidate_experiences,
        key=lambda x: parse_start_date(x),
        reverse=True
    )
    
    resume_parts = []
    
    for exp in sorted_experiences:
        # Parsear fechas
        start_date_str = exp.get('start_date')
        end_date_str = exp.get('end_date')
        
        # Convertir strings a date objects si es necesario
        # Asegurar que start_date nunca sea None
        if start_date_str is None:
            start_date = date.today()  # Fallback si no hay fecha
        elif isinstance(start_date_str, str):
            try:
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
            except:
                try:
                    start_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d').date()
                except:
                    start_date = date.today()  # Fallback si el parsing falla
        elif isinstance(start_date_str, date):
            start_date = start_date_str
        else:
            start_date = date.today()  # Fallback para cualquier otro caso
        
        # Parsear end_date (puede ser None)
        end_date = None
        if end_date_str:
            if isinstance(end_date_str, str):
                try:
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00')).date()
                except:
                    try:
                        end_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d').date()
                    except:
                        end_date = None  # Si falla el parsing, dejar como None
            elif isinstance(end_date_str, date):
                end_date = end_date_str
        
        # Validar que start_date no sea None antes de calcular duración
        if start_date is None:
            start_date = date.today()  # Último fallback
        
        # Calcular duración
        years, months = calculate_duration_months(start_date, end_date)
        duration_str = format_duration(years, months)
        
        # Formatear período
        start_str = start_date.strftime('%b %Y')
        end_str = "Actualidad" if end_date is None else end_date.strftime('%b %Y')
        period = f"{start_str} - {end_str} ({duration_str})"
        
        # Construir entrada del resume
        role_title = exp.get('role_title', 'Sin título')
        company_name = exp.get('company_name', 'Sin empresa')
        description = exp.get('description', '')
        
        entry = f"• {role_title} en {company_name} ({period})"
        if description:
            entry += f"\n  {description}"
        
        resume_parts.append(entry)
    
    return "\n\n".join(resume_parts)


def parse_job_requirements(requirements_json_data: Any) -> Dict[str, Any]:
    """
    Parsea el JSON de requirements_json y extrae la información relevante.
    
    Args:
        requirements_json_data: Puede ser un string JSON o un dict ya parseado
    
    Returns:
        Dict con non_negotiables_text, desired_trajectory_text, needs_technical_background
    """
    if not requirements_json_data:
        return {
            "non_negotiables_text": "",
            "desired_trajectory_text": "",
            "needs_technical_background": False
        }
    
    # Si ya es un dict, usarlo directamente
    if isinstance(requirements_json_data, dict):
        requirements = requirements_json_data
    # Si es un string, parsearlo
    elif isinstance(requirements_json_data, str):
        try:
            requirements = json.loads(requirements_json_data)
        except json.JSONDecodeError as e:
            print(f"⚠️  Error parseando requirements_json: {e}")
            return {
                "non_negotiables_text": "",
                "desired_trajectory_text": "",
                "needs_technical_background": False
            }
    else:
        print(f"⚠️  requirements_json tiene tipo inesperado: {type(requirements_json_data)}")
        return {
            "non_negotiables_text": "",
            "desired_trajectory_text": "",
            "needs_technical_background": False
        }
    
    return {
        "non_negotiables_text": requirements.get("non_negotiables_text", ""),
        "desired_trajectory_text": requirements.get("desired_trajectory_text", ""),
        "needs_technical_background": requirements.get("needs_technical_background", False),
        "seniority": requirements.get("seniority", ""),
        "industries": requirements.get("industries", [])
    }


# ============================================================================
# SYSTEM PROMPT
# ============================================================================

SYSTEM_PROMPT = """You are an expert matching engine for job–candidate fit.

Your task: read a job object and a candidate object (with candidate_experience) and compute a match_score (0–100) plus a detailed JSON breakdown following the exact rules below.

==========================
MATCHING RULES (STRICT)
==========================

DIMENSIONS & WEIGHTS:
1. Seniority Match – 40%
2. Role Fit – 20%
3. Industria – 30%
4. Estabilidad – 10%

-----------------------------------
1. SENIORITY MATCH (40%) — CRITICAL
-----------------------------------

Use the Career Matrix for PM and Software Engineering.

CAREER MATRIX:

PRODUCT MANAGEMENT:
- PM1: Associate / Junior PM — 0–1 años
- PM2: Product Manager — 1–3 años
- PM3: Senior PM — 3–6 años
- PM4: Lead/Staff PM — 6–8 años
- PM5: Principal PM — 8–10+ años
- PM6: Director/Head of Product — 10+ años

SOFTWARE ENGINEERING:
- SE1: Junior Engineer — 0–1 años
- SE2: Mid-Level Engineer — 1–3 años
- SE3: Senior Engineer — 3–6 años
- SE4: Staff Engineer — 6–8 años
- SE5: Principal Engineer — 8–10+ años
- SE6: Director/Head of Engineering — 10+ años

SCORING RULES (BASED ON LEVEL DISTANCE):
- Perfect match (same level): Score = 100%
- Calculate distance between job_level and candidate_level in the Career Matrix
- Distance = |job_level_number - candidate_level_number|
  - Example: PM3 (job) vs PM2 (candidate) = distance of 1
  - Example: PM3 (job) vs PM5 (candidate) = distance of 2
  - Example: PM3 (job) vs PM1 (candidate) = distance of 2

SCORE CALCULATION:
- Distance 0 (perfect match): 100%
- Distance 1: 60-80% (closer to job level)
- Distance 2: 30-50% (moderate distance)
- Distance 3: 10-30% (far from job level)
- Distance 4+: 0-10% (very far from job level)

CRITICAL RULES:
- If job and candidate belong to different tracks (PM vs SE): Score = 0
- Score decreases proportionally as distance increases
- Closer to job level = higher score, farther = lower score
- Use decimals for precision (e.g., 75.5, 42.3, 18.7)

You MUST determine the candidate's level from their current_job_title and experience history. Infer from:
- Job titles (Junior, Mid, Senior, Lead, Principal, Director, Head)
- Years of experience
- Company type and progression

-----------------------------------
2. ROLE FIT (20%) — CRITICAL
-----------------------------------

Compare job.title vs candidate.current_job_title.

Hard mismatches → score MUST be 0:
- PM vs Engineer
- Engineer vs Product
- Marketing vs Engineering
- Sales vs Product
- Data Scientist vs Frontend

Partial matches → 30–60
Exact/near match → 80–100

If the candidate had the exact role in past experience → +10 points bonus (but don't exceed range).

-----------------------------------
3. INDUSTRIA (30%)
-----------------------------------

Score based on:
- Industry alignment (fintech, mobility, logistics, supply chain)
- Company relevance (Big Tech, YC companies, unicorns, startups tier A)

Strong industry alignment → high score (70-100)
Partial alignment → medium score (40-69)
No alignment → low score (0-39)

Focus on:
- Direct industry match between job_industries and candidate_industries
- Company type and relevance (Big Tech, unicorns, tier A startups)
- Industry experience depth and recency

-----------------------------------
4. STABILITY (10%)
-----------------------------------

Analyze employment history:
- Roles < 1 year without justification → penalize
- Roles > 2 years → reward
- Many jumps → low score
- Consistent tenure → high score

-----------------------------------
OUTPUT FORMAT
-----------------------------------

Return structured data with:
- seniority_match: {job_level, candidate_level, score, reason}
- role_fit: {job_role, candidate_role, score, reason}
- industry: {job_industries, candidate_industries, score, reason}
- stability: {score, reason}

-----------------------------------
IMPORTANT
-----------------------------------

- NEVER inflate scores.
- CRITICAL mismatches must drop dimensions to 0.
- Be extremely strict with seniority and role fit.
- Use decimals for precision (e.g., 72.5, 68.3, 85.7).
- Be precise and varied in your evaluations."""


# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

def calculate_and_save_match(job_id: str, candidate_id: str) -> Dict[str, Any]:
    """
    Calcula el match entre un job y un candidato usando OpenAI y guarda el resultado.
    
    Args:
        job_id: UUID del job
        candidate_id: UUID del candidato
    
    Returns:
        Dict con match_score, match_detail y status
    """
    print(f"\n🔍 [AI MATCHING] Iniciando matching para Job {job_id} ↔ Candidate {candidate_id}")
    
    # ========================================================================
    # Paso 1: Obtener datos del Job
    # ========================================================================
    print("📋 [AI MATCHING] Obteniendo datos del job...")
    job_response = supabase.table("jobs").select("*").eq("id", job_id).execute()
    
    if not job_response.data or len(job_response.data) == 0:
        raise ValueError(f"❌ Job no encontrado: {job_id}")
    
    job = job_response.data[0]
    print(f"   ✅ Job encontrado: {job.get('job_title', 'Sin título')}")
    
    # Parsear requirements_json
    requirements = parse_job_requirements(job.get('requirements_json', ''))
    
    # Obtener seniority level del job (puede estar en job_level o requirements_json.seniority)
    job_seniority = job.get('job_level') or requirements.get('seniority', '')
    
    # Obtener industrias del job (puede estar en requirements_json.industries)
    job_industries = requirements.get('industries', [])
    if isinstance(job_industries, str):
        job_industries = [job_industries] if job_industries else []
    elif not isinstance(job_industries, list):
        job_industries = []
    
    # Construir contexto del job
    job_context = f"""
TÍTULO DE LA VACANTE: {job.get('job_title', 'Sin título')}
NIVEL REQUERIDO (Career Matrix): {job_seniority if job_seniority else 'No especificado - inferir del título y descripción'}
INDUSTRIAS: {', '.join(job_industries) if job_industries else 'No especificadas'}

DESCRIPCIÓN:
{job.get('description', 'Sin descripción')}

REQUISITOS NO NEGOCIABLES:
{requirements.get('non_negotiables_text', 'No especificados')}

TRAYECTORIA DESEADA:
{requirements.get('desired_trajectory_text', 'No especificada')}

REQUIERE BACKGROUND TÉCNICO: {'Sí' if requirements.get('needs_technical_background') else 'No'}
"""
    
    # ========================================================================
    # Paso 2: Obtener datos del Candidato
    # ========================================================================
    print("👤 [AI MATCHING] Obteniendo datos del candidato...")
    candidate_response = supabase.table("candidates").select("*").eq("id", candidate_id).execute()
    
    if not candidate_response.data or len(candidate_response.data) == 0:
        raise ValueError(f"❌ Candidato no encontrado: {candidate_id}")
    
    candidate = candidate_response.data[0]
    print(f"   ✅ Candidato encontrado: {candidate.get('full_name', 'Sin nombre')}")
    
    # Obtener experiencias del candidato
    experiences_response = supabase.table("candidate_experience").select("*").eq("candidate_id", candidate_id).execute()
    experiences = experiences_response.data if experiences_response.data else []
    print(f"   ✅ Experiencias encontradas: {len(experiences)}")
    
    # Generar resume del candidato
    candidate_resume = generate_candidate_resume(experiences)
    
    # Obtener seniority del candidato
    candidate_seniority = candidate.get('seniority', '')
    
    # Construir contexto del candidato
    candidate_context = f"""
NOMBRE: {candidate.get('full_name', 'Sin nombre')}
TÍTULO ACTUAL: {candidate.get('current_job_title', 'Sin título')}
NIVEL (Career Matrix): {candidate_seniority if candidate_seniority else 'No especificado - inferir del título actual y experiencia'}
INDUSTRIA: {candidate.get('industry', 'No especificada')}

EXPERIENCIA LABORAL (Cronológica):
{candidate_resume}
"""
    
    # ========================================================================
    # Paso 3: Llamada a OpenAI con Structured Outputs
    # ========================================================================
    print("🤖 [AI MATCHING] Enviando análisis a OpenAI GPT-4o...")
    
    try:
        response = openai_client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"""Analyze the match between this job and this candidate:

=== JOB ===
{job_context}

=== CANDIDATE ===
{candidate_context}

Evaluate all dimensions following the Career Matrix rules:
1. Determine the seniority level for both job and candidate (PM1-PM6 or SE1-SE6)
   - Calculate distance between levels and assign score based on proximity (perfect match = 100%, farther = lower)
2. Compare role fit (job title vs candidate current title)
3. Evaluate industry alignment (job industries vs candidate industries, company relevance)
4. Analyze stability (employment history)

Provide a structured analysis with scores and detailed reasoning."""
                }
            ],
            response_format=MatchAnalysis,
            temperature=0.3  # Más determinístico para evaluaciones
        )
        
        match_analysis: MatchAnalysis = response.choices[0].message.parsed
        print("   ✅ Análisis recibido de OpenAI")
        
    except Exception as e:
        print(f"   ❌ Error en llamada a OpenAI: {e}")
        raise
    
    # ========================================================================
    # Paso 4: Calcular Score Final (Ponderado en Python)
    # ========================================================================
    print("📊 [AI MATCHING] Calculando score final ponderado...")
    
    # Pesos según nueva especificación
    weights = {
        "seniority_match": 0.40,
        "role_fit": 0.20,
        "industry": 0.30,
        "stability": 0.10
    }
    
    # Calcular score final ponderado
    final_score = (
        match_analysis.seniority_match.score * weights["seniority_match"] +
        match_analysis.role_fit.score * weights["role_fit"] +
        match_analysis.industry.score * weights["industry"] +
        match_analysis.stability.score * weights["stability"]
    )
    
    # Redondear a 2 decimales
    final_score = round(final_score, 2)
    
    print(f"   ✅ Score final calculado: {final_score}")
    print(f"      - Seniority Match: {match_analysis.seniority_match.score} (40%)")
    print(f"      - Role Fit: {match_analysis.role_fit.score} (20%)")
    print(f"      - Industria: {match_analysis.industry.score} (30%)")
    print(f"      - Estabilidad: {match_analysis.stability.score} (10%)")
    
    # ========================================================================
    # Paso 5: Preparar match_detail (JSON completo)
    # ========================================================================
    match_detail = {
        "seniority_match": {
            "job_level": match_analysis.seniority_match.job_level,
            "candidate_level": match_analysis.seniority_match.candidate_level,
            "score": match_analysis.seniority_match.score,
            "reason": match_analysis.seniority_match.reason
        },
        "role_fit": {
            "job_role": match_analysis.role_fit.job_role,
            "candidate_role": match_analysis.role_fit.candidate_role,
            "score": match_analysis.role_fit.score,
            "reason": match_analysis.role_fit.reason
        },
        "industry": {
            "job_industries": match_analysis.industry.job_industries,
            "candidate_industries": match_analysis.industry.candidate_industries,
            "score": match_analysis.industry.score,
            "reason": match_analysis.industry.reason
        },
        "stability": {
            "score": match_analysis.stability.score,
            "reason": match_analysis.stability.reason
        },
        "final_score": final_score,
        "weights": weights,
        "calculated_at": datetime.now().isoformat()
    }
    
    # ========================================================================
    # Paso 6: Guardar en job_candidate_matches (UPSERT)
    # ========================================================================
    print("💾 [AI MATCHING] Guardando resultado en base de datos...")
    
    try:
        # Intentar actualizar primero
        update_response = supabase.table("job_candidate_matches").update({
            "match_score": float(final_score),
            "match_detail": match_detail,
            "match_source": "openai-gpt4o",
            "updated_at": datetime.now().isoformat()
        }).eq("job_id", job_id).eq("candidate_id", candidate_id).execute()
        
        # Si no se actualizó ninguna fila, insertar
        if not update_response.data:
            insert_response = supabase.table("job_candidate_matches").insert({
                "job_id": job_id,
                "candidate_id": candidate_id,
                "match_score": float(final_score),
                "match_detail": match_detail,
                "match_source": "openai-gpt4o",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }).execute()
            
            if insert_response.data:
                print("   ✅ Match insertado exitosamente")
            else:
                raise Exception("No se pudo insertar el match")
        else:
            print("   ✅ Match actualizado exitosamente")
        
    except Exception as e:
        print(f"   ❌ Error guardando en base de datos: {e}")
        raise
    
    print(f"\n✅ [AI MATCHING] Matching completado exitosamente!")
    print(f"   Score final: {final_score}")
    print(f"   Seniority: {match_analysis.seniority_match.job_level} vs {match_analysis.seniority_match.candidate_level}")
    print(f"   Role Fit: {match_analysis.role_fit.job_role} vs {match_analysis.role_fit.candidate_role}")
    
    return {
        "status": "success",
        "job_id": job_id,
        "candidate_id": candidate_id,
        "match_score": final_score,
        "match_detail": match_detail
    }


# ============================================================================
# FUNCIÓN DE EJECUCIÓN PRINCIPAL (para testing)
# ============================================================================

if __name__ == "__main__":
    """
    Ejemplo de uso:
    
    python matching_service.py <job_id> <candidate_id>
    
    O configurar directamente en el código:
    """
    import sys
    
    if len(sys.argv) >= 3:
        job_id = sys.argv[1]
        candidate_id = sys.argv[2]
        
        try:
            result = calculate_and_save_match(job_id, candidate_id)
            # Imprimir JSON en una sola línea al final para facilitar el parsing
            # Usar un marcador especial para identificar el JSON
            print("\n" + "="*60)
            print("RESULTADO FINAL:")
            print("="*60)
            # Imprimir JSON compacto en una sola línea para el parser
            json_output = json.dumps(result, ensure_ascii=False)
            print(json_output)
        except Exception as e:
            print(f"\n❌ Error: {e}")
            sys.exit(1)
    else:
        print("""
Uso: python matching_service.py <job_id> <candidate_id>

Ejemplo:
  python matching_service.py 123e4567-e89b-12d3-a456-426614174000 987fcdeb-51a2-43d7-8f9e-123456789abc

O importa la función en tu código:
  from matching_service import calculate_and_save_match
  result = calculate_and_save_match(job_id, candidate_id)
        """)

