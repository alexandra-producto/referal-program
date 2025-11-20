# Checklist de Deployment en Vercel

## ✅ Lo que YO (el código) ya hice por ti

- [x] Configuración de Vercel (`vercel.json`)
- [x] Archivos excluidos del deployment (`.vercelignore`)
- [x] Detección automática de URL de Vercel
- [x] Construcción automática de `LINKEDIN_REDIRECT_URI`
- [x] Documentación completa

## 📋 Lo que TÚ debes hacer

### Paso 1: Preparación Local (5 minutos)

- [ ] Verificar que tienes todas las variables en `.env.local`
  ```bash
  npm run check:env
  ```
- [ ] Si faltan variables, copia `.env.example` a `.env.local` y completa los valores

### Paso 2: Conectar a Vercel (10 minutos)

**Esto requiere acceso a tu cuenta de Vercel:**

1. [ ] Ir a [vercel.com](https://vercel.com) e iniciar sesión
2. [ ] Click en "Add New Project"
3. [ ] Importar el repositorio `alexandra-producto/referal-program`
4. [ ] Vercel detectará automáticamente Next.js

### Paso 3: Configurar Variables de Entorno en Vercel (15 minutos)

**En el dashboard de Vercel, Settings > Environment Variables:**

Copia estas variables desde tu `.env.local`:

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_WHATSAPP_FROM`
- [ ] `LINKEDIN_CLIENT_ID`
- [ ] `LINKEDIN_CLIENT_SECRET`
- [ ] `SESSION_SECRET`
- [ ] `RECOMMENDATION_SECRET`
- [ ] `ADMIN_EMAILS`

**⚠️ IMPORTANTE:**
- NO configures `APP_URL` - se detecta automáticamente
- NO configures `LINKEDIN_REDIRECT_URI` - se construye automáticamente

### Paso 4: Primer Deployment (5 minutos)

- [ ] Click en "Deploy" en Vercel
- [ ] Esperar a que el build complete
- [ ] Verificar que no haya errores en los logs
- [ ] Copiar la URL del deployment (ej: `https://referal-program-abc123.vercel.app`)

### Paso 5: Actualizar LinkedIn OAuth (5 minutos)

**Esto requiere acceso a LinkedIn Developers:**

1. [ ] Ir a [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. [ ] Seleccionar tu aplicación
3. [ ] Ir a "Auth" > "Redirect URLs"
4. [ ] Agregar la URL de callback de Vercel:
   ```
   https://tu-proyecto.vercel.app/api/auth/linkedin/callback
   ```
   (Reemplaza `tu-proyecto.vercel.app` con la URL real de tu deployment)
5. [ ] Guardar los cambios

### Paso 6: Verificación (10 minutos)

- [ ] Abrir la URL de Vercel en el navegador
- [ ] Verificar que la página carga correctamente
- [ ] Probar login con LinkedIn (debe funcionar después del paso 5)
- [ ] Verificar que las páginas de Solicitante, Admin y Hyperconnector cargan
- [ ] Probar crear un job desde la interfaz de Solicitante

## 🛠️ Comandos Útiles

### Verificar variables de entorno localmente
```bash
npm run check:env
```

### Ver logs en Vercel
- Dashboard de Vercel > Deployments > Seleccionar deployment > Logs

### Redeploy
- Dashboard de Vercel > Deployments > Tres puntos > Redeploy

## ❓ Problemas Comunes

### "LINKEDIN_REDIRECT_URI does not match"
**Solución:** Asegúrate de que la URL en LinkedIn Developers coincida EXACTAMENTE con la URL de Vercel (incluyendo `https://`)

### "Missing SUPABASE_URL"
**Solución:** Verifica que todas las variables estén configuradas en Vercel Dashboard > Settings > Environment Variables

### Build falla
**Solución:** Revisa los logs en Vercel para ver el error específico. Usualmente es una variable de entorno faltante.

## 📞 Siguiente Paso: Producción

Cuando estés listo para producción:
1. Crea un nuevo proyecto en Vercel (o usa branches)
2. Configura las mismas variables pero con valores de producción
3. Configura un dominio personalizado
4. Actualiza LinkedIn OAuth con la nueva URL

