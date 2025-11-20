# Guía de Deployment en Vercel

Esta guía explica cómo hacer deploy de la aplicación a Vercel para el ambiente DEV.

## Prerrequisitos

1. Cuenta en [Vercel](https://vercel.com)
2. Repositorio en GitHub (ya configurado)
3. Proyecto Supabase (ya configurado)
4. Cuenta de Twilio (ya configurada)
5. Aplicación LinkedIn OAuth configurada

## Paso 1: Conectar Repositorio a Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en "Add New Project"
3. Importa el repositorio `alexandra-producto/referal-program`
4. Vercel detectará automáticamente que es un proyecto Next.js

## Paso 2: Configurar Variables de Entorno

En el dashboard de Vercel, ve a **Settings > Environment Variables** y agrega las siguientes variables:

### Variables Requeridas

```env
# Supabase
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=tu_client_id
LINKEDIN_CLIENT_SECRET=tu_client_secret
# NOTA: LINKEDIN_REDIRECT_URI se construye automáticamente desde VERCEL_URL
# Si necesitas override, puedes configurarlo manualmente

# Seguridad
SESSION_SECRET=tu_secret_super_seguro
RECOMMENDATION_SECRET=tu_secret_super_seguro

# Admin
ADMIN_EMAILS=email1@example.com,email2@example.com

# Opcional (para testing)
TEST_PHONE_NUMBER=+573208631577
```

### Notas Importantes

- **APP_URL**: NO es necesario configurarla. El sistema detecta automáticamente `VERCEL_URL` y construye la URL base.
- **LINKEDIN_REDIRECT_URI**: Se construye automáticamente como `${VERCEL_URL}/api/auth/linkedin/callback`. Si necesitas override, configúrala manualmente.

## Paso 3: Configurar LinkedIn OAuth

Después del primer deployment, necesitarás actualizar la configuración de LinkedIn:

1. Ve a [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Selecciona tu aplicación
3. Ve a "Auth" > "Redirect URLs"
4. Agrega la URL de callback de Vercel:
   ```
   https://tu-proyecto.vercel.app/api/auth/linkedin/callback
   ```
5. Guarda los cambios

**Nota**: La URL exacta la verás después del primer deployment en Vercel.

## Paso 4: Configurar Build Settings

Vercel detecta automáticamente Next.js, pero verifica que:

- **Framework Preset**: Next.js
- **Build Command**: `npm run next:build` (o dejar vacío para auto-detect)
- **Output Directory**: `.next` (auto-detect)
- **Install Command**: `npm install` (auto-detect)

## Paso 5: Hacer el Primer Deployment

1. Click en "Deploy" en Vercel
2. Espera a que el build complete
3. Verifica que no haya errores en los logs
4. Copia la URL del deployment (ej: `https://referal-program-abc123.vercel.app`)

## Paso 6: Verificar el Deployment

### Checklist de Verificación

- [ ] La aplicación carga correctamente en la URL de Vercel
- [ ] El login con LinkedIn funciona (después de actualizar redirect URI)
- [ ] Las páginas de Solicitante, Admin y Hyperconnector cargan
- [ ] Los endpoints de API responden correctamente
- [ ] Las variables de entorno están configuradas

### Probar Endpoints

```bash
# Health check (debería retornar 200)
curl https://tu-proyecto.vercel.app/api/jobs

# Verificar que APP_URL se detecta correctamente
# (revisar logs en Vercel dashboard)
```

## Paso 7: Configurar Dominio Personalizado (Opcional - Para después)

Cuando estés listo para agregar un dominio:

1. Ve a **Settings > Domains** en Vercel
2. Agrega tu dominio (ej: `app.referal.com`)
3. Sigue las instrucciones de DNS que Vercel proporciona
4. Una vez configurado, actualiza `LINKEDIN_REDIRECT_URI` en LinkedIn Developers si es necesario

**Nota**: El código ya está preparado para usar dominios personalizados automáticamente.

## Estructura de URLs

### Desarrollo Local
- Base URL: `http://localhost:3000`
- LinkedIn Callback: `http://localhost:3000/api/auth/linkedin/callback`

### Vercel DEV
- Base URL: `https://tu-proyecto.vercel.app` (o dominio personalizado)
- LinkedIn Callback: `https://tu-proyecto.vercel.app/api/auth/linkedin/callback`

## Detección Automática de URL

El sistema detecta automáticamente la URL base usando esta prioridad:

1. `VERCEL_URL` (disponible automáticamente en Vercel)
2. `APP_URL` (si está configurada manualmente)
3. `http://localhost:3000` (fallback para desarrollo local)

Esto significa que **no necesitas configurar APP_URL** en Vercel, el sistema lo detecta automáticamente.

## Troubleshooting

### Error: "LINKEDIN_REDIRECT_URI does not match"

**Solución**: Asegúrate de que la URL en LinkedIn Developers coincida exactamente con la URL de Vercel (incluyendo `https://`).

### Error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"

**Solución**: Verifica que las variables de entorno estén configuradas en Vercel Dashboard > Settings > Environment Variables.

### Error: "Cannot find module"

**Solución**: Verifica que `.vercelignore` no esté excluyendo archivos necesarios. Los archivos de test están excluidos intencionalmente.

### WhatsApp no funciona

**Solución**: 
1. Verifica que `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_WHATSAPP_FROM` estén configurados
2. Verifica que el número esté verificado en Twilio Sandbox (para testing)
3. Revisa los logs en Vercel para ver errores específicos

## Comandos Útiles

### Ver logs en Vercel
- Ve a **Deployments** > Selecciona un deployment > **Logs**

### Redeploy
- Ve a **Deployments** > Click en los tres puntos > **Redeploy**

### Rollback
- Ve a **Deployments** > Selecciona un deployment anterior > **Promote to Production**

## Próximos Pasos (Producción)

Cuando estés listo para el ambiente de producción:

1. Crea un nuevo proyecto en Vercel (o usa branches)
2. Configura las mismas variables de entorno pero con valores de producción
3. Configura un dominio de producción
4. Actualiza LinkedIn OAuth con la nueva URL de producción

## Checklist Rápido

Para un checklist detallado paso a paso, ver: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## Archivos de Configuración

- `vercel.json`: Configuración de build y framework
- `.vercelignore`: Archivos excluidos del deployment
- `src/utils/appUrl.ts`: Helper para detectar URL automáticamente

## Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica que todas las variables de entorno estén configuradas
3. Verifica que LinkedIn OAuth tenga la URL correcta
4. Revisa la documentación de [Vercel](https://vercel.com/docs)

