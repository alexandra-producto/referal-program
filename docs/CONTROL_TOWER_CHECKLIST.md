# Control Tower - Checklist de Implementación

## ✅ Completado

- [x] Wrapper TypeScript para llamar al servicio Python
- [x] Página Control Tower con UI
- [x] API route para estadísticas
- [x] API route para activar el agente
- [x] Serverless Function de Python para Vercel
- [x] Configuración de vercel.json
- [x] Botón actualizado en admin

## ⚠️ Pendiente / Verificar

### 1. Variables de Entorno en Vercel

**Acción requerida:** Agregar estas variables en Vercel Dashboard:

1. Ve a: Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
2. Agrega estas 3 variables (para Production, Preview y Development):
   - `OPENAI_API_KEY` = `sk-proj-...` (tu API key de OpenAI)
   - `SUPABASE_URL` = `https://tu-proyecto.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Cómo obtener:**
- OpenAI API Key: https://platform.openai.com/api-keys
- Supabase URL y Service Role Key: Supabase Dashboard → Settings → API

### 2. Verificar que el Path del Matching Service sea Correcto

El código en `api/ai-match.py` intenta importar desde múltiples paths. Verificar que funcione en Vercel.

**Si falla:** Puede necesitar ajustar los paths en `api/ai-match.py`

### 3. Probar Localmente

Antes de deployar a Vercel, probar localmente:

```bash
# 1. Asegurar que tienes las variables en .env.local
# 2. Ejecutar servidor
npm run next:dev

# 3. Navegar a /admin/control-tower
# 4. Verificar que las estadísticas carguen
# 5. Intentar activar el agente (puede fallar si Python no está en PATH)
```

### 4. Verificar URL de la API en Producción

En `src/agents/aiMatchingAgent.ts`, la URL se construye así:
- Si `VERCEL_URL` existe: `https://${VERCEL_URL}/api/ai-match`
- Si no: usa `NEXT_PUBLIC_APP_URL` o `localhost:3000`

**Verificar:** Que `VERCEL_URL` esté disponible en el runtime de Vercel (debería estarlo automáticamente).

### 5. Timeout de Serverless Functions

Vercel tiene límites de timeout:
- Hobby: 10 segundos
- Pro: 60 segundos
- Enterprise: 900 segundos

**Problema potencial:** Si hay muchos matches, puede exceder el timeout.

**Solución:** El código ya procesa en batches y tiene delays, pero si hay muchos jobs/candidatos, considerar:
- Procesar de forma asíncrona (queue system)
- O limitar la cantidad procesada por ejecución

### 6. Dependencias Python en Vercel

Vercel instalará automáticamente las dependencias de `api/requirements.txt` cuando detecte funciones Python.

**Verificar:** Que `api/requirements.txt` tenga todas las dependencias necesarias.

## 🧪 Testing

### Test Local (Desarrollo)

1. **Test de estadísticas:**
   ```bash
   curl http://localhost:3000/api/admin/control-tower/stats
   ```

2. **Test de matching individual:**
   ```bash
   curl -X POST http://localhost:3000/api/ai-match \
     -H "Content-Type: application/json" \
     -d '{"job_id": "xxx", "candidate_id": "yyy"}'
   ```

3. **Test de activación completa:**
   - Ir a `/admin/control-tower`
   - Click en "Activar Agent Recruiter"
   - Verificar logs en consola

### Test en Vercel (Producción)

1. Después del deploy, verificar:
   - Las estadísticas cargan correctamente
   - El botón de activación no da errores inmediatos
   - Revisar logs de Vercel para ver errores de Python

2. Si hay errores:
   - Revisar logs en Vercel Dashboard → Functions → api/ai-match
   - Verificar que las variables de entorno estén configuradas
   - Verificar que las dependencias se instalaron correctamente

## 📝 Notas Importantes

1. **Costo de OpenAI:** Cada match usa tokens de GPT-4o. Monitorear uso en OpenAI Dashboard.

2. **Rate Limits:** OpenAI tiene rate limits. El código tiene delays de 200ms entre matches, pero si procesas muchos, puede haber rate limiting.

3. **Base de Datos:** Asegurar que `job_candidate_matches` tenga los índices correctos para performance:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_jcm_job_candidate ON job_candidate_matches(job_id, candidate_id);
   CREATE INDEX IF NOT EXISTS idx_jcm_source ON job_candidate_matches(match_source);
   ```

## 🚀 Próximos Pasos

1. ✅ Configurar variables de entorno en Vercel
2. ✅ Hacer deploy y probar
3. ⚠️ Si hay errores, revisar logs y ajustar según sea necesario
4. ⚠️ Considerar agregar manejo de errores más robusto
5. ⚠️ Considerar agregar progress tracking para el usuario (cuántos matches se han procesado)

