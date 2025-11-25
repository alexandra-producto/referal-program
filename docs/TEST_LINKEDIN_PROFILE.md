# Cómo Testear el Perfil de LinkedIn Localmente

Este script te permite ver exactamente qué datos devuelve la API de LinkedIn para tu perfil.

## Pasos para obtener el Access Token

### Opción 1: Desde los logs del servidor (Recomendado)

1. Inicia el servidor de desarrollo:
   ```bash
   npm run next:dev
   ```

2. Haz login en tu aplicación como admin (o el rol que quieras testear)

3. En los logs del servidor, busca una línea que diga:
   ```
   ✅ Token obtenido exitosamente
   ```

4. Justo después, debería haber logs del callback. Busca el `accessToken` en los logs.

5. Copia el token y agrégalo a `.env.local`:
   ```bash
   TEST_LINKEDIN_ACCESS_TOKEN=tu_token_aqui
   ```

### Opción 2: Modificar temporalmente el callback

1. Abre `app/api/auth/linkedin/callback/route.ts`

2. Justo después de la línea donde se obtiene el token (alrededor de línea 92), agrega:
   ```typescript
   console.log("🔑 ACCESS TOKEN PARA TEST:", accessToken);
   ```

3. Haz login y copia el token de los logs

4. Agrégalo a `.env.local` como `TEST_LINKEDIN_ACCESS_TOKEN`

5. **IMPORTANTE**: Elimina el console.log después de obtener el token por seguridad

## Ejecutar el Test

Una vez que tengas el token en `.env.local`:

```bash
npm run test:linkedin-profile
```

## Qué verás

El script probará 5 endpoints diferentes de LinkedIn:

1. `/v2/userinfo` - Información básica del usuario (OpenID Connect)
2. `/v2/me?projection=(id,vanityName,headline)` - Perfil básico con headline
3. `/v2/me?projection=(id,positions~)` - Perfil con posiciones (lo que necesitamos)
4. `/v2/positions` - Endpoint directo de posiciones
5. `/v2/me` - Perfil sin projection (ver qué devuelve por defecto)

## Interpretar los Resultados

- Si el endpoint de `positions` funciona, verás la estructura completa de las posiciones
- Busca la posición con `isCurrent: true` o sin `endDate`
- Anota la estructura exacta de los campos (`title`, `companyName`, `localizedTitle`, etc.)

## Compartir los Resultados

Copia y pega la salida del script (especialmente la sección 3 y 4) para que podamos ajustar el código según la estructura real de datos que devuelve LinkedIn.

