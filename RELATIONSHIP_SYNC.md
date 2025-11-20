# Hyperconnector-Candidate Relationship Sync System

## Overview

Este sistema detecta automáticamente cuando un hyperconnector y un candidate trabajaron juntos en la misma empresa, basándose en sus historiales laborales (`candidate_experience`).

## Algorithm

### Matching Logic

1. **Company Name Matching**: 
   - Compara nombres de empresas de forma case-insensitive
   - Normaliza nombres removiendo espacios y sufijos comunes (S.A., Inc., LLC, etc.)
   - Ejemplo: "Google Inc." y "google" se consideran iguales

2. **Date Range Overlap**:
   - Compara rangos de fechas de experiencia laboral
   - Trata `end_date = NULL` como fecha actual (o fecha máxima)
   - Dos personas trabajaron juntos si:
     ```
     start_date_1 <= end_date_2 AND start_date_2 <= end_date_1
     ```

3. **Confidence Score Calculation**:
   - Si el overlap es >= 12 meses: `confidence_score = 100`
   - Si el overlap es < 12 meses: `confidence_score = (overlapMonths / 12) * 100`, mínimo 10
   - Si hay múltiples overlaps, se usa el mejor (mayor confidence score)

### Data Model

Las relaciones se guardan en dos tablas:

1. **`candidate_connections`** (nueva tabla):
   - `hyperconnector_id`
   - `candidate_id`
   - `source = 'experience_overlap'`
   - `connection_strength` (0-100, basado en meses de overlap)

2. **`hyperconnector_candidates`** (tabla existente, para compatibilidad):
   - `hyperconnector_id`
   - `candidate_id`
   - `shared_experience` (texto descriptivo)

## Implementation

### Main Functions

#### `syncHyperconnectorCandidateRelationshipsForCandidate(candidateId: string)`

Se ejecuta cuando se crea un nuevo candidate:
- Obtiene todas las experiencias del candidate
- Itera sobre todos los hyperconnectors
- Para cada hyperconnector con `candidate_id` vinculado:
  - Compara experiencias
  - Si hay overlap, crea la relación

#### `syncHyperconnectorCandidateRelationshipsForHyperconnector(hyperconnectorId: string)`

Se ejecuta cuando se crea un nuevo hyperconnector:
- Obtiene el `candidate_id` del hyperconnector
- Obtiene todas las experiencias del hyperconnector
- Obtiene candidates en la red del hyperconnector (o todos si no hay red)
- Para cada candidate:
  - Compara experiencias
  - Si hay overlap, crea la relación

### Integration Points

Las funciones se integran automáticamente en:

1. **`src/domain/candidates.ts`** → `createCandidate()`:
   - Llama a `syncHyperconnectorCandidateRelationshipsForCandidate()` de forma asíncrona

2. **`src/domain/hyperconnectors.ts`** → `createHyperconnector()`:
   - Llama a `syncHyperconnectorCandidateRelationshipsForHyperconnector()` de forma asíncrona

### Duplicate Prevention

El sistema previene duplicados:
- Verifica si ya existe una relación en `candidate_connections` con `source = 'experience_overlap'`
- Si existe, no crea otra relación
- Usa `upsert` con `onConflict` para garantizar idempotencia

## Testing

### Manual Test

Ejecutar el test de integración:

```bash
npm run test:sync-relationships
```

Este test:
1. Usa datos reales (Emilio como hyperconnector/candidate)
2. Verifica que se crean relaciones correctamente
3. Prueba idempotencia (ejecutar dos veces no crea duplicados)
4. Muestra un resumen de relaciones creadas

### Test Data

El test usa:
- **Emilio**: Candidate ID `ec826f0e-758b-4e05-9e98-b97131189884`
- Busca o crea un hyperconnector vinculado a Emilio
- Compara con todos los candidates que tienen experiencia

### Expected Results

Después de ejecutar el test, deberías ver:
- Relaciones creadas en `candidate_connections` con `source = 'experience_overlap'`
- Relaciones creadas en `hyperconnector_candidates` con `shared_experience` descriptivo
- `connection_strength` entre 10-100 basado en meses de overlap

## Assumptions

1. **Hyperconnectors tienen `candidate_id`**: 
   - Los hyperconnectors deben tener un `candidate_id` vinculado para poder comparar experiencias
   - Si no tienen `candidate_id`, se saltan en el proceso de sync

2. **Experiencia requerida**:
   - Tanto hyperconnectors como candidates necesitan tener registros en `candidate_experience`
   - Si no hay experiencia, no se pueden detectar overlaps

3. **Company name matching**:
   - El matching es case-insensitive y normaliza sufijos comunes
   - Puede haber falsos positivos si dos empresas diferentes tienen nombres muy similares

## Future Improvements

1. **Fuzzy matching para nombres de empresas**: Usar algoritmos como Levenshtein distance
2. **Validación de datos**: Verificar que las fechas sean válidas (start_date < end_date)
3. **Métricas**: Agregar logging de métricas (cuántas relaciones se crean, cuántas se saltan, etc.)
4. **Batch processing**: Optimizar para procesar grandes volúmenes de datos
5. **Webhooks/Events**: Notificar cuando se detectan nuevas relaciones


