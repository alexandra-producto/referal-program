# Job Creation API

## Endpoint

**POST** `/api/jobs`

## Descripción

Crea un nuevo job (solicitud de rol) desde la UI de "Crear solicitud de rol". El job se crea asociado al candidate logueado.

## Autenticación

Actualmente, el `candidateId` debe enviarse en el body del request. En el futuro, esto debería venir de la autenticación (JWT, session, etc.).

## Request Body

```json
{
  "candidateId": "uuid-del-candidate-logueado",
  "jobTitle": "Product Manager Senior",
  "description": "Buscamos PM con experiencia en fintech para liderar equipo de producto digital",
  "nonNegotiables": "Mínimo 5 años de experiencia en PM, experiencia en fintech, liderazgo de equipos",
  "desiredTrajectory": "Industrias: fintech, SaaS, e-commerce. Tipos de empresa: startups en crecimiento, scale-ups",
  "scenario": "El candidato enfrentará el desafío de escalar el producto de 100K a 1M usuarios en 6 meses. Resultado ideal: lograr el objetivo manteniendo alta satisfacción del usuario",
  "technicalBackgroundNeeded": true,
  "modality": "hybrid"
}
```

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `candidateId` | string (UUID) | Sí | ID del candidate logueado |
| `jobTitle` | string | Sí | Título del rol (no vacío) |
| `description` | string | Sí | Descripción del rol (no vacío) |
| `nonNegotiables` | string | Sí | Requisitos innegociables (texto libre) |
| `desiredTrajectory` | string | Sí | Industrias o tipos de empresa deseados (texto libre) |
| `scenario` | string | Sí | Escenario difícil + resultado ideal esperado (texto libre) |
| `technicalBackgroundNeeded` | boolean | Sí | Si el rol necesita background técnico |
| `modality` | 'remote' \| 'hybrid' \| 'onsite' | Sí | Modalidad del rol |

## Response

### Success (201 Created)

```json
{
  "success": true,
  "job": {
    "id": "uuid-del-job-creado",
    "company_name": "Mercado Libre",
    "job_title": "Product Manager Senior",
    "job_level": null,
    "location": null,
    "remote_ok": true,
    "description": "Buscamos PM con experiencia en fintech...",
    "requirements_json": {
      "non_negotiables_text": "Mínimo 5 años...",
      "desired_trajectory_text": "Industrias: fintech...",
      "scenario_text": "El candidato enfrentará...",
      "needs_technical_background": true,
      "modality": "hybrid"
    },
    "status": "open",
    "owner_candidate_id": "uuid-del-candidate",
    "owner_role_title": "Head of Product",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Job created successfully"
}
```

### Error (400 Bad Request)

```json
{
  "error": "jobTitle is required and must be a non-empty string"
}
```

### Error (404 Not Found)

```json
{
  "error": "Candidate with id xxx not found"
}
```

### Error (500 Internal Server Error)

```json
{
  "error": "Error creating job",
  "details": "Error message (solo en desarrollo)"
}
```

## Reglas de Negocio

1. **company_name**: Se obtiene automáticamente de `candidate.current_company`
2. **owner_candidate_id**: Es el `candidateId` del request
3. **owner_role_title**: Se obtiene de `candidate.current_job_title` o de `candidate_experience` donde `is_current = true`
4. **remote_ok**: 
   - `true` si `modality` es `"remote"` o `"hybrid"`
   - `false` si `modality` es `"onsite"`
5. **status**: Siempre se crea como `"open"`
6. **job_level** y **location**: Se dejan en `null` para V1
7. **requirements_json**: Se guarda como JSONB con la estructura definida
8. **Matching automático**: Se dispara automáticamente después de crear el job (asíncrono)

## Estructura de `requirements_json`

```typescript
{
  non_negotiables_text: string;
  desired_trajectory_text: string;
  scenario_text: string;
  needs_technical_background: boolean;
  modality: 'remote' | 'hybrid' | 'onsite';
}
```

## Ejemplo de Uso

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "07a27df4-23f6-43b7-9724-9f082e5debb2",
    "jobTitle": "Product Manager Senior",
    "description": "Buscamos PM con experiencia en fintech",
    "nonNegotiables": "Mínimo 5 años de experiencia",
    "desiredTrajectory": "Industrias: fintech, SaaS",
    "scenario": "Escalar producto de 100K a 1M usuarios",
    "technicalBackgroundNeeded": true,
    "modality": "hybrid"
  }'
```

## Archivos Creados/Modificados

1. **`src/types/jobCreation.ts`**: DTOs y validaciones
2. **`src/services/jobCreationService.ts`**: Lógica de negocio para crear jobs
3. **`app/api/jobs/route.ts`**: Endpoint HTTP

