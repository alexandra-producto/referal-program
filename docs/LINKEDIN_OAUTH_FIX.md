# Solución: LinkedIn OAuth con Múltiples Previews en Vercel

## Problema

Cada preview deployment en Vercel genera una URL única (ej: `referal-program-e48d0vivg-producto-alexs-projects.vercel.app`), y LinkedIn requiere que la URL exacta esté registrada. Esto causa el error: "The redirect_uri does not match the registered value".

## Solución Recomendada: Usar URL Fija de Producción

La mejor solución es configurar una variable de entorno `LINKEDIN_REDIRECT_URI` que siempre use la misma URL (la de producción), independientemente del ambiente.

### Pasos:

1. **Identifica tu URL de Producción**
   - Ve a tu proyecto en Vercel
   - Ve a **Settings → Domains**
   - Encuentra la URL de producción (ej: `referal-programa.vercel.app` o tu dominio personalizado)

2. **Configura la Variable de Entorno en Vercel**
   - Ve a **Settings → Environment Variables**
   - Agrega una nueva variable:
     - **Name**: `LINKEDIN_REDIRECT_URI`
     - **Value**: `https://referal-programa.vercel.app/api/auth/linkedin/callback`
       (Reemplaza con tu URL de producción real)
   - **Selecciona los ambientes**: Production, Preview, Development
   - Haz clic en **Save**

3. **Agrega la URL en LinkedIn Developers**
   - Ve a [LinkedIn Developers](https://www.linkedin.com/developers/apps)
   - Selecciona tu aplicación
   - Ve a **"Auth"** → **"Redirect URLs"**
   - Agrega esta URL exacta:
     ```
     https://referal-programa.vercel.app/api/auth/linkedin/callback
     ```
   - Guarda los cambios

4. **Haz un nuevo Deployment**
   - Vercel necesita un nuevo deployment para aplicar la variable de entorno
   - Puedes hacer un push a tu repositorio o hacer "Redeploy" desde Vercel

### Resultado:

- ✅ Todos los deployments (preview y production) usarán la misma URL para LinkedIn OAuth
- ✅ Solo necesitas agregar una URL en LinkedIn
- ✅ Funciona para todos los ambientes

## Alternativa: Usar Dominio Personalizado

Si tienes un dominio personalizado, úsalo:

1. **Configura el dominio en Vercel**
   - Ve a **Settings → Domains**
   - Agrega tu dominio personalizado (ej: `app.tudominio.com`)

2. **Configura la variable de entorno:**
   ```
   LINKEDIN_REDIRECT_URI=https://app.tudominio.com/api/auth/linkedin/callback
   ```

3. **Agrega la URL en LinkedIn:**
   ```
   https://app.tudominio.com/api/auth/linkedin/callback
   ```

## Cómo Funciona

El código en `src/utils/linkedinAuth.ts` verifica primero si existe `LINKEDIN_REDIRECT_URI`:

```typescript
function getLinkedInRedirectUri(): string {
  // Si está configurado explícitamente, usarlo
  if (process.env.LINKEDIN_REDIRECT_URI) {
    return process.env.LINKEDIN_REDIRECT_URI;
  }
  
  // Si estamos en Vercel, construir la URL automáticamente
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/auth/linkedin/callback`;
  
  return redirectUri;
}
```

Al configurar `LINKEDIN_REDIRECT_URI`, siempre usará esa URL fija, sin importar si es preview o production.

## Verificar que Funciona

Después de configurar:

1. Haz un nuevo deployment
2. Intenta iniciar sesión con LinkedIn
3. Debería funcionar sin el error de redirect_uri

## Nota Importante

⚠️ **Asegúrate de que la URL de producción esté accesible** desde los previews. Cuando un usuario en un preview haga login, será redirigido a la URL de producción después de autenticarse con LinkedIn, y luego tu aplicación lo redirigirá de vuelta a donde estaba.

Si prefieres que cada preview use su propia URL, tendrías que agregar cada URL de preview en LinkedIn manualmente, lo cual no es práctico.

