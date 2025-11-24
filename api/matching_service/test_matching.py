"""
Script de test para el AI Matching Service
Busca un job real y ejecuta el matching con un candidato específico
"""

import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Agregar el directorio actual al path para importar matching_service
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from matching_service import calculate_and_save_match, supabase
import json

# ID del candidato a testear
CANDIDATE_ID = "d6331880-2c84-45a1-a0f3-86e2cde16cbc"


def list_available_jobs():
    """Lista los jobs disponibles en la base de datos"""
    print("\n" + "="*60)
    print("📋 BUSCANDO JOBS DISPONIBLES...")
    print("="*60)
    
    try:
        response = supabase.table("jobs").select("id, job_title, company_name, description").limit(10).execute()
        
        if not response.data or len(response.data) == 0:
            print("❌ No se encontraron jobs en la base de datos")
            return None
        
        print(f"\n✅ Encontrados {len(response.data)} jobs:\n")
        
        for i, job in enumerate(response.data, 1):
            print(f"{i}. ID: {job['id']}")
            print(f"   Título: {job.get('job_title', 'Sin título')}")
            print(f"   Empresa: {job.get('company_name', 'Sin empresa')}")
            desc = job.get('description', 'Sin descripción')
            if desc:
                desc_short = desc[:100] + "..." if len(desc) > 100 else desc
                print(f"   Descripción: {desc_short}")
            print()
        
        return response.data[0]  # Retornar el primer job para testear
    
    except Exception as e:
        print(f"❌ Error buscando jobs: {e}")
        return None


def get_candidate_info(candidate_id: str):
    """Obtiene información del candidato"""
    print("\n" + "="*60)
    print(f"👤 INFORMACIÓN DEL CANDIDATO: {candidate_id}")
    print("="*60)
    
    try:
        response = supabase.table("candidates").select("*").eq("id", candidate_id).execute()
        
        if not response.data or len(response.data) == 0:
            print(f"❌ Candidato no encontrado: {candidate_id}")
            return None
        
        candidate = response.data[0]
        print(f"\n✅ Candidato encontrado:")
        print(f"   Nombre: {candidate.get('full_name', 'Sin nombre')}")
        print(f"   Título actual: {candidate.get('current_job_title', 'Sin título')}")
        print(f"   Industria: {candidate.get('industry', 'Sin industria')}")
        print(f"   Empresa actual: {candidate.get('current_company', 'Sin empresa')}")
        
        # Obtener experiencias
        exp_response = supabase.table("candidate_experience").select("*").eq("candidate_id", candidate_id).execute()
        experiences = exp_response.data if exp_response.data else []
        print(f"   Experiencias: {len(experiences)}")
        
        return candidate
    
    except Exception as e:
        print(f"❌ Error obteniendo candidato: {e}")
        return None


def test_matching(job_id: str, candidate_id: str):
    """Ejecuta el matching entre un job y un candidato"""
    print("\n" + "="*60)
    print("🚀 INICIANDO TEST DE MATCHING")
    print("="*60)
    print(f"Job ID: {job_id}")
    print(f"Candidate ID: {candidate_id}")
    print()
    
    try:
        result = calculate_and_save_match(job_id, candidate_id)
        
        print("\n" + "="*60)
        print("✅ RESULTADO DEL MATCHING")
        print("="*60)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        return result
    
    except Exception as e:
        print(f"\n❌ Error en el matching: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Función principal"""
    print("\n" + "="*60)
    print("🧪 TEST DE AI MATCHING SERVICE")
    print("="*60)
    
    # Verificar variables de entorno
    print("\n📝 Verificando configuración...")
    openai_key = os.getenv("OPENAI_API_KEY")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not openai_key:
        print("❌ OPENAI_API_KEY no configurada")
        return
    else:
        print("✅ OPENAI_API_KEY configurada")
    
    if not supabase_url:
        print("❌ SUPABASE_URL no configurada")
        return
    else:
        print(f"✅ SUPABASE_URL configurada: {supabase_url[:30]}...")
    
    if not supabase_key:
        print("❌ SUPABASE_SERVICE_ROLE_KEY no configurada")
        return
    else:
        print(f"✅ SUPABASE_SERVICE_ROLE_KEY configurada")
    
    # Obtener información del candidato
    candidate = get_candidate_info(CANDIDATE_ID)
    if not candidate:
        print("\n❌ No se pudo obtener información del candidato. Abortando.")
        return
    
    # Buscar un job
    job = list_available_jobs()
    if not job:
        print("\n❌ No se encontró ningún job. Abortando.")
        return
    
    # Confirmar antes de ejecutar
    print("\n" + "="*60)
    print("⚠️  CONFIRMACIÓN")
    print("="*60)
    print(f"¿Ejecutar matching entre:")
    print(f"  Job: {job.get('job_title', 'Sin título')} ({job['id']})")
    print(f"  Candidate: {candidate.get('full_name', 'Sin nombre')} ({CANDIDATE_ID})")
    print()
    
    # Ejecutar matching
    result = test_matching(job['id'], CANDIDATE_ID)
    
    if result:
        print("\n" + "="*60)
        print("🎉 TEST COMPLETADO EXITOSAMENTE")
        print("="*60)
        print(f"Score final: {result['match_score']}")
        print(f"Key Gap: {result['match_detail']['key_gap']}")
    else:
        print("\n" + "="*60)
        print("❌ TEST FALLÓ")
        print("="*60)


if __name__ == "__main__":
    main()

