# Sistema de Short Links para Emails

## Resumen

Este sistema genera links cortos para emails que mejoran la entregabilidad y UX. En lugar de enviar URLs largas con tokens visibles (ej: `/recommend-redirect/abc123...`), los emails ahora incluyen links cortos tipo `https://app.com/r/xyz789`.

## Configuración

### 1. Variables de Entorno

Agrega la siguiente variable a tu `.env.local`:

```env
# URL pública de la aplicación (para short links en emails)
# Prioridad: PUBLIC_APP_URL > NEXT_PUBLIC_APP_URL > VERCEL_URL > APP_URL
PUBLIC_APP_URL=https://referal-programa.vercel.app
```

**Para producción (Vercel):**
1. Ve a tu proyecto en Vercel Dashboard
2. Settings > Environment Variables
3. Agrega `PUBLIC_APP_URL` con la URL pública de tu aplicación
   - Ejemplo: `https://referal-programa.vercel.app`
   - O tu dominio personalizado si lo tienes

**Nota:** Si no configuras `PUBLIC_APP_URL`, el sistema usará `VERCEL_URL` o `APP_URL` como fallback.

### 2. Base de Datos

Ejecuta la migración SQL en Supabase:

```bash
# Opción 1: Desde Supabase Dashboard
# Ve a SQL Editor y ejecuta el contenido de:
sql/create_short_links_table.sql

# Opción 2: Desde Supabase CLI
supabase db push
```

La migración crea la tabla `short_links` con:
- `code`: Código corto único (12 caracteres base62)
- `target_url`: URL destino completa con token
- `expires_at`: Fecha de expiración (default: 90 días)
- `used_at`: Fecha de primer uso (opcional, para single-use)
- `metadata`: JSON con información adicional (hyperconnector_id, job_id, etc.)

## Cómo Funciona

### Flujo de Generación

1. Cuando se envía un email, `sendHciEmailNotification()` llama a `createShortRecommendationLink()`
2. Se genera la URL larga normal con token: `/recommend-redirect/abc123...`
3. Se crea un código corto único (12 caracteres base62)
4. Se guarda en la BD: `{ code: "xyz789", target_url: "/recommend-redirect/abc123...", ... }`
5. Se retorna la URL corta: `https://app.com/r/xyz789`

### Flujo de Resolución

1. Usuario hace click en `https://app.com/r/xyz789`
2. El endpoint `GET /r/[code]` busca el código en la BD
3. Verifica que no esté expirado
4. Redirige (302) a la `target_url` original
5. El usuario llega a `/recommend-redirect/abc123...` como antes

## Endpoints

### GET /r/:code

Resuelve un short link y redirige a la URL destino.

**Respuestas:**
- `302 Redirect`: Si el link existe y no está expirado
- `404 HTML`: Si el link no existe o expiró (muestra página "Link Expirado")

## Funciones Disponibles

### `createShortLink(options)`

Crea un short link genérico.

```typescript
const { code, shortUrl, expiresAt } = await createShortLink({
  targetUrl: "https://app.com/recommend-redirect/abc123...",
  ttlSeconds: 90 * 24 * 60 * 60, // 90 días
  metadata: { hyperconnector_id: "...", job_id: "..." }
});
```

### `createShortRecommendationLink(hyperconnectorId, jobId, baseUrl?)`

Crea un short link específico para recomendaciones (usado en emails).

```typescript
const shortUrl = await createShortRecommendationLink(
  hyperconnectorId,
  jobId,
  baseUrl
);
```

### `resolveShortLink(code, markAsUsed?)`

Resuelve un código corto y retorna la URL destino.

```typescript
const result = await resolveShortLink("xyz789", false);
// { targetUrl: "...", metadata: {...} }
```

## Ventajas

- ✅ **Mejor entregabilidad**: Links cortos son menos sospechosos para filtros de spam
- ✅ **Mejor UX**: Links más limpios y profesionales en emails
- ✅ **Tracking**: Podemos trackear clicks (usando `used_at`)
- ✅ **Expiración**: Links expiran automáticamente después de 90 días
- ✅ **Metadata**: Guardamos información adicional para analytics

## Troubleshooting

### Error: "PUBLIC_APP_URL debe estar configurado"

**Solución:** Agrega `PUBLIC_APP_URL` a tus variables de entorno.

### Error: "Short link no encontrado"

**Causas posibles:**
- El código no existe en la BD
- El link expiró (default: 90 días)
- Error de conexión a la BD

**Solución:** Verifica que la tabla `short_links` exista y que el código sea correcto.

### Los links no funcionan en producción

**Solución:** Asegúrate de que `PUBLIC_APP_URL` esté configurado en Vercel con la URL correcta de producción.

## Testing

Para probar el sistema:

```bash
# 1. Ejecutar migración SQL en Supabase
# 2. Configurar PUBLIC_APP_URL en .env.local
# 3. Enviar un email de prueba
npm run test:email-notification <job_id> <hyperconnector_id>
# 4. Verificar que el email contiene un link corto tipo /r/xyz789
# 5. Hacer click y verificar que redirige correctamente
```

