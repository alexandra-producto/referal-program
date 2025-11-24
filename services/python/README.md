# AI Matching Agent Service

Servicio de evaluación de compatibilidad entre vacantes (Jobs) y candidatos usando OpenAI GPT-4o con análisis estructurado en 4 dimensiones ponderadas.

## 🚀 Configuración Inicial

### 1. Instalar Dependencias

```bash
cd services/python
pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto o configura estas variables de entorno:

```bash
# OpenAI API Key
export OPENAI_API_KEY="sk-..."

# Supabase
export SUPABASE_URL="https://tu-proyecto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**⚠️ IMPORTANTE:** 
- `OPENAI_API_KEY`: Obtén tu API key en https://platform.openai.com/api-keys
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (con permisos completos) - **NO uses la anon key**

### 3. Verificar Configuración

```bash
python matching_service.py
```

Si falta alguna variable, verás un error claro indicando cuál falta.

## 📋 Uso

### Desde Línea de Comandos

```bash
python matching_service.py <job_id> <candidate_id>
```

Ejemplo:
```bash
python matching_service.py 123e4567-e89b-12d3-a456-426614174000 987fcdeb-51a2-43d7-8f9e-123456789abc
```

### Desde Código Python

```python
from matching_service import calculate_and_save_match

result = calculate_and_save_match(
    job_id="123e4567-e89b-12d3-a456-426614174000",
    candidate_id="987fcdeb-51a2-43d7-8f9e-123456789abc"
)

print(f"Score: {result['match_score']}")
print(f"Key Gap: {result['match_detail']['key_gap']}")
```

## 🧠 Lógica del Agente

### Dimensiones Evaluadas (con pesos)

1. **TRAYECTORIA** (40%): 
   - ¿Viene de la industria correcta?
   - ¿Viene de empresas relevantes (Startups, Big 3, Tech Giants)?

2. **ROLE FIT** (30%):
   - ¿Ha tenido el título exacto antes?
   - ¿Tiene la antigüedad (seniority) requerida?

3. **HARD SKILLS** (20%):
   - Verifica los "Non Negotiables" del Job
   - Si piden skills técnicos y no están explícitos, puntúa bajo

4. **ESTABILIDAD** (10%):
   - Penaliza saltos de trabajo < 1 año sin justificación
   - Premia estancias > 2 años

### Cálculo del Score Final

El score se calcula en Python (NO en el LLM) con esta fórmula:

```python
final_score = (
    trajectory.score * 0.40 +
    role_fit.score * 0.30 +
    hard_skills.score * 0.20 +
    stability.score * 0.10
)
```

## 📊 Estructura de Datos

### Input (desde Base de Datos)

- **jobs**: `id`, `job_title`, `description`, `requirements_json`
- **candidates**: `id`, `full_name`, `current_job_title`, `industry`
- **candidate_experiences**: `candidate_id`, `company_name`, `role_title`, `start_date`, `end_date`, `description`

### Output (guardado en `job_candidate_matches`)

- `job_id`: UUID
- `candidate_id`: UUID
- `match_score`: Float (0-100)
- `match_detail`: JSONB con análisis completo
- `match_source`: "openai-gpt4o"

### Estructura de `match_detail`

```json
{
  "trajectory": {
    "score": 85,
    "reasoning": "Viene de fintech, experiencia en startups..."
  },
  "role_fit": {
    "score": 90,
    "reasoning": "Ha sido Product Manager Senior antes..."
  },
  "hard_skills": {
    "score": 70,
    "reasoning": "Falta experiencia explícita en SQL..."
  },
  "stability": {
    "score": 80,
    "reasoning": "Estancias promedio de 2+ años..."
  },
  "key_gap": "Falta experiencia explícita en análisis de datos con SQL",
  "weights": {
    "trajectory": 0.40,
    "role_fit": 0.30,
    "hard_skills": 0.20,
    "stability": 0.10
  },
  "calculated_at": "2024-01-15T10:30:00"
}
```

## 🔧 Troubleshooting

### Error: "OPENAI_API_KEY no está configurada"

- Verifica que la variable esté en tu `.env` o exportada en tu shell
- Asegúrate de que el archivo `.env` esté en la raíz del proyecto o usa `python-dotenv`

### Error: "Job no encontrado" o "Candidato no encontrado"

- Verifica que los UUIDs sean correctos
- Asegúrate de que el `SUPABASE_SERVICE_ROLE_KEY` tenga permisos de lectura

### Error: "Error en llamada a OpenAI"

- Verifica que tu API key sea válida
- Revisa que tengas créditos disponibles en OpenAI
- El modelo `gpt-4o-2024-08-06` debe estar disponible en tu cuenta

### Error al guardar en base de datos

- Verifica que la tabla `job_candidate_matches` exista
- Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` tenga permisos de escritura
- Revisa que los campos `match_score`, `match_detail`, `match_source` existan en la tabla

## 📝 Notas Adicionales

- El servicio usa **Structured Outputs** de OpenAI (beta) para garantizar respuestas consistentes
- Las fechas se manejan correctamente: si `end_date` es `None`, se asume trabajo actual
- El resume se genera cronológicamente (más reciente primero)
- Los scores se redondean a 2 decimales
- El sistema hace UPSERT: actualiza si existe, inserta si no

## 🔐 Seguridad

- **NUNCA** commitees el archivo `.env` con tus API keys
- Usa `SUPABASE_SERVICE_ROLE_KEY` (no la anon key) para tener permisos completos
- En producción, usa un gestor de secretos (AWS Secrets Manager, Vercel Env, etc.)

