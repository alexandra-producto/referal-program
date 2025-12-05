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

# Variables de entorno (se cargan cuando se necesiten)
OPENAI_API_KEY = None
SUPABASE_URL = None
SUPABASE_SERVICE_ROLE_KEY = None

# Inicializar clientes (lazy initialization)
# Se inicializarán cuando se llame calculate_and_save_match
openai_client = None
supabase: Client = None

def _ensure_clients_initialized():
    """Inicializa los clientes si no están inicializados"""
    global openai_client, supabase, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
    
    # Cargar variables de entorno si no están cargadas
    if OPENAI_API_KEY is None:
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if SUPABASE_URL is None:
        SUPABASE_URL = os.getenv("SUPABASE_URL")
    if SUPABASE_SERVICE_ROLE_KEY is None:
        SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    # Validar que estén configuradas
    if not OPENAI_API_KEY:
        raise ValueError("❌ OPENAI_API_KEY no está configurada. Configúrala en variables de entorno de Vercel")
    if not SUPABASE_URL:
        raise ValueError("❌ SUPABASE_URL no está configurada. Configúrala en variables de entorno de Vercel")
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("❌ SUPABASE_SERVICE_ROLE_KEY no está configurada. Configúrala en variables de entorno de Vercel")
    
    # Inicializar clientes si no están inicializados
    if openai_client is None:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
    if supabase is None:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# ============================================================================
# MODELOS PYDANTIC (Structured Outputs)
# ============================================================================

class Dimension(BaseModel):
    """Dimensión de evaluación con score y razonamiento"""
    score: float = Field(..., ge=0.0, le=100.0, description="Score de 0.0 a 100.0 (puede incluir decimales)")
    reasoning: str = Field(..., description="Razonamiento breve y directo sobre la evidencia")


class MatchAnalysis(BaseModel):
    """Análisis completo de match entre job y candidato"""
    trajectory: Dimension = Field(..., description="Evaluación de trayectoria e industria")
    role_fit: Dimension = Field(..., description="Evaluación de fit del rol y seniority")
    hard_skills: Dimension = Field(..., description="Evaluación de hard skills y non-negotiables")
    stability: Dimension = Field(..., description="Evaluación de estabilidad laboral")
    key_gap: str = Field(..., description="Brecha principal detectada entre candidato y vacante")


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
    
    # Ordenar por fecha de inicio (más reciente primero)
    sorted_experiences = sorted(
        candidate_experiences,
        key=lambda x: (
            datetime.fromisoformat(x['start_date'].replace('Z', '+00:00')) if isinstance(x['start_date'], str)
            else x['start_date']
        ).date() if isinstance(x['start_date'], str) or hasattr(x['start_date'], 'date')
        else x['start_date'],
        reverse=True
    )
    
    resume_parts = []
    
    for exp in sorted_experiences:
        # Parsear fechas
        start_date_str = exp.get('start_date')
        end_date_str = exp.get('end_date')
        
        # Convertir strings a date objects si es necesario
        if isinstance(start_date_str, str):
            try:
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
            except:
                start_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d').date()
        else:
            start_date = start_date_str if isinstance(start_date_str, date) else date.today()
        
        end_date = None
        if end_date_str:
            if isinstance(end_date_str, str):
                try:
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00')).date()
                except:
                    end_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d').date()
            else:
                end_date = end_date_str if isinstance(end_date_str, date) else None
        
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
        "needs_technical_background": requirements.get("needs_technical_background", False)
    }


# ============================================================================
# SYSTEM PROMPT
# ============================================================================

SYSTEM_PROMPT = """Eres un Senior Technical Recruiter experto en evaluar talento. Tu misión es analizar el encaje (match) entre un Candidato y una Vacante basándote estrictamente en la evidencia provista.

Evalúa estas 4 dimensiones (0-100 pts, puedes usar decimales para mayor precisión):

1. TRAYECTORIA (Peso crítico): ¿El candidato viene de la industria correcta (ej: Supply Chain, Fintech)? ¿Viene de empresas relevantes (Startups, Big 3, Tech Giants)? Evalúa la relevancia de su trayectoria profesional.

2. ROLE FIT (CRÍTICO - Verifica el rol actual): 
   - PRIMERO: Verifica el rol actual del candidato (current_job_title) y compáralo con el rol requerido en la vacante.
   - Si el rol actual NO hace match con el rol requerido (ej: Product Manager vs Engineer, Data Scientist vs Frontend Developer), DEBES penalizar fuertemente esta dimensión (score 0-30).
   - Si el rol actual hace match parcial (ej: Product Manager vs Senior Product Manager), evalúa la diferencia de seniority.
   - Si el rol actual hace match exacto o muy cercano, puntúa alto (70-100).
   - ¿Ha tenido el título exacto antes en su experiencia? ¿Tiene la antigüedad (seniority) requerida?
   - EJEMPLOS DE NO MATCH que deben puntuar bajo:
     * Product Manager → Engineer/Developer: 0-20
     * Data Scientist → Frontend Developer: 0-25
     * Marketing Manager → Software Engineer: 0-20
     * Sales Manager → Product Manager: 0-30

3. HARD SKILLS: Verifica los "Non Negotiables" del Job. Si piden skills técnicos (SQL, Python) y no están explícitos en la experiencia del candidato, puntúa bajo. Evalúa la presencia de las habilidades críticas requeridas.

4. ESTABILIDAD: Penaliza saltos de trabajo < 1 año sin justificación. Premia estancias > 2 años. Evalúa la estabilidad laboral del candidato.

IMPORTANTE: 
- Sé preciso y variado en tus evaluaciones. No uses siempre el mismo score.
- VERIFICA SIEMPRE el rol actual del candidato vs el rol requerido. Si no hay match de rol, el score total debe ser bajo (0-40).
- Un candidato con evidencia sólida Y match de rol debe tener 70-85.
- Un candidato perfecto (match de rol + skills + trayectoria) debe tener 90-100.
- Un candidato con gaps significativos pero match de rol debe tener 40-69.
- Un candidato SIN match de rol debe tener 0-39, independientemente de otras dimensiones.
- Usa decimales para mayor precisión (ej: 72.5, 68.3, 85.7).

En 'reasoning', sé breve y directo sobre la evidencia encontrada o faltante, especialmente menciona si hay o no match de rol."""


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
    # Asegurar que los clientes estén inicializados
    _ensure_clients_initialized()
    
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
    
    # Construir contexto del job
    job_context = f"""
TÍTULO DE LA VACANTE: {job.get('job_title', 'Sin título')}

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
    
    # Construir contexto del candidato
    candidate_context = f"""
NOMBRE: {candidate.get('full_name', 'Sin nombre')}
TÍTULO ACTUAL: {candidate.get('current_job_title', 'Sin título')}
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
                    "content": f"""Analiza el match entre esta vacante y este candidato:

=== VACANTE ===
{job_context}

=== CANDIDATO ===
{candidate_context}

Evalúa las 4 dimensiones y proporciona un análisis estructurado."""
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
    
    # Pesos según especificación
    weights = {
        "trajectory": 0.40,
        "role_fit": 0.30,
        "hard_skills": 0.20,
        "stability": 0.10
    }
    
    final_score = (
        match_analysis.trajectory.score * weights["trajectory"] +
        match_analysis.role_fit.score * weights["role_fit"] +
        match_analysis.hard_skills.score * weights["hard_skills"] +
        match_analysis.stability.score * weights["stability"]
    )
    
    # Redondear a 2 decimales
    final_score = round(final_score, 2)
    
    print(f"   ✅ Score final calculado: {final_score}")
    print(f"      - Trayectoria: {match_analysis.trajectory.score} (40%)")
    print(f"      - Role Fit: {match_analysis.role_fit.score} (30%)")
    print(f"      - Hard Skills: {match_analysis.hard_skills.score} (20%)")
    print(f"      - Estabilidad: {match_analysis.stability.score} (10%)")
    
    # ========================================================================
    # Paso 5: Preparar match_detail (JSON completo)
    # ========================================================================
    match_detail = {
        "trajectory": {
            "score": match_analysis.trajectory.score,
            "reasoning": match_analysis.trajectory.reasoning
        },
        "role_fit": {
            "score": match_analysis.role_fit.score,
            "reasoning": match_analysis.role_fit.reasoning
        },
        "hard_skills": {
            "score": match_analysis.hard_skills.score,
            "reasoning": match_analysis.hard_skills.reasoning
        },
        "stability": {
            "score": match_analysis.stability.score,
            "reasoning": match_analysis.stability.reasoning
        },
        "key_gap": match_analysis.key_gap,
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
    print(f"   Key Gap: {match_analysis.key_gap}")
    
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

