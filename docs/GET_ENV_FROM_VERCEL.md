# Cómo Obtener Variables de Entorno desde Vercel

Si ya tienes las variables configuradas en Vercel, puedes copiarlas fácilmente:

## Pasos

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `referal-program`
3. Ve a **Settings** > **Environment Variables**
4. Copia cada variable y pégala en tu `.env.local`

## Variables a Copiar

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `SESSION_SECRET`
- `RECOMMENDATION_SECRET`
- `ADMIN_EMAILS`
- `OPENAI_API_KEY` (si la tienes)

## Para Secrets (SESSION_SECRET, RECOMMENDATION_SECRET)

Si no los tienes o quieres generar nuevos:

```bash
# Generar SESSION_SECRET
openssl rand -base64 32

# Generar RECOMMENDATION_SECRET
openssl rand -base64 32
```

## Verificar

Después de completar `.env.local`, verifica que todo esté correcto:

```bash
npm run check:env
```

