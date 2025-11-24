# AI Matching Agent - Configuración para Vercel

## Problema

Vercel no tiene Python instalado por defecto en sus Serverless Functions. El script Python necesita ejecutarse de alguna manera.

## Soluciones

### Opción 1: Usar Vercel con Python Runtime (Recomendado)

Vercel soporta Python en Serverless Functions. Necesitamos crear una función separada:

1. **Crear `api/ai-match/route.py`** (Serverless Function de Vercel):

```python
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Agregar el path del servicio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../services/python'))

from matching_service import calculate_and_save_match

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            job_id = data.get('job_id')
            candidate_id = data.get('candidate_id')
            
            if not job_id or not candidate_id:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.w.write(json.dumps({'error': 'job_id y candidate_id requeridos'}).encode())
                return
            
            result = calculate_and_save_match(job_id, candidate_id)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
```

2. **Modificar `src/agents/aiMatchingAgent.ts`** para llamar a esta API:

```typescript
export async function calculateAIMatch(
  jobId: string,
  candidateId: string
): Promise<AIMatchResult> {
  // En producción, llamar a la API de Vercel
  if (process.env.VERCEL) {
    const response = await fetch(`${process.env.VERCEL_URL}/api/ai-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, candidate_id: candidateId }),
    });
    
    if (!response.ok) {
      throw new Error(`Error en API de matching: ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      score: result.match_score,
      detail: result.match_detail,
    };
  }
  
  // En desarrollo local, ejecutar script directamente
  // ... código actual ...
}
```

### Opción 2: Ejecutar en el servidor Next.js (Solo desarrollo local)

Para desarrollo local, el código actual funciona si tienes Python instalado.

### Opción 3: Servicio externo (Más robusto)

Crear un servicio separado en Railway, Render, o similar que exponga una API REST para el matching.

## Configuración de Variables de Entorno en Vercel

Asegúrate de tener estas variables en Vercel:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Testing Local

Para probar localmente:

```bash
# Asegúrate de tener Python y las dependencias
cd services/python
pip install -r requirements.txt

# Ejecuta el servidor Next.js
npm run next:dev

# Navega a /admin/control-tower y activa el agente
```

