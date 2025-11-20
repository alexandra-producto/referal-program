# Sistema de Recomendaciones - Guía de Configuración

## 📋 Resumen

Este sistema permite enviar links autorizados a hyperconnectors por WhatsApp para que puedan ver candidatos y hacer recomendaciones sin necesidad de login.

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Asegúrate de tener estas variables en tu `.env.local`:

```env
# Supabase
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Twilio (para WhatsApp)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# App URL (para generar links)
APP_URL=http://localhost:3000  # En producción: https://app.referal.com

# Secret para tokens (opcional, pero recomendado)
RECOMMENDATION_SECRET=tu_secret_super_seguro_aqui
```

### 2. Base de Datos

Crea la tabla `recommendation_links` en Supabase (opcional, pero recomendado para tracking):

```sql
CREATE TABLE recommendation_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hyperconnector_id UUID NOT NULL REFERENCES hyperconnectors(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_hyperconnector FOREIGN KEY (hyperconnector_id) REFERENCES hyperconnectors(id),
  CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX idx_recommendation_links_token ON recommendation_links(token);
CREATE INDEX idx_recommendation_links_hci_job ON recommendation_links(hyperconnector_id, job_id);
```

**Nota:** Si no creas esta tabla, el sistema funcionará igual usando solo validación criptográfica.

### 3. Estructura de la Tabla `recommendations`

Asegúrate de que tu tabla `recommendations` tenga estos campos:

```sql
- id (UUID)
- hyperconnector_id (UUID) → references hyperconnectors(id)
- job_id (UUID) → references jobs(id)
- candidate_id (UUID) → references candidates(id)
- notes (TEXT, nullable)
- status (TEXT) -- ej: 'pending', 'accepted', 'rejected'
- created_at (TIMESTAMP)
```

## 🚀 Uso

### Enviar Notificación de WhatsApp

```typescript
import { sendHciWhatsappNotification } from "./agents/sendHciWhatsappNotification";

const result = await sendHciWhatsappNotification(
  "+573208631577", // número de WhatsApp del HCI
  {
    id: "uuid-del-hci", // ID del hyperconnector en la BD
    full_name: "Juan Pérez"
  },
  {
    id: "uuid-del-job", // ID del job en la BD
    company_name: "Vemo",
    role_title: "Product Manager",
    non_negotiables: ["5+ años experiencia", "Startup experience"]
  },
  [
    {
      full_name: "María García",
      current_company: "TechCorp",
      fit_score: 95,
      shared_experience: "Trabajaron juntos en StartupX"
    }
  ],
  "https://app.referal.com" // base URL (opcional)
);

console.log("Link generado:", result.recommendUrl);
```

### Ejecutar el Frontend

```bash
# Desarrollo
npm run next:dev

# Producción
npm run next:build
npm run next:start
```

El frontend estará disponible en `http://localhost:3000`

## 🔗 Flujo de Links

1. **Generación**: Cuando envías un WhatsApp, se genera un token único que contiene:
   - ID del hyperconnector
   - ID del job
   - Timestamp
   - Hash de seguridad

2. **URL**: El link generado es: `{APP_URL}/recommend/{token}`

3. **Validación**: Cuando el HCI hace clic:
   - Se valida el token criptográficamente
   - Se verifica en la BD (si existe la tabla)
   - Se carga la información del job y candidatos

4. **Recomendación**: El HCI selecciona candidatos y envía la recomendación

## 📁 Estructura de Archivos

```
/app
  /api
    /recommend
      /[token]
        route.ts          # GET: Obtiene datos del job y candidatos
        /submit
          route.ts        # POST: Crea recomendaciones
  /recommend
    /[token]
      page.tsx            # Frontend: Interfaz de recomendación
  layout.tsx              # Layout principal
  globals.css             # Estilos globales

/src
  /agents
    sendHciWhatsappNotification.ts  # Función para enviar WhatsApp
  /domain
    recommendationLinks.ts          # Gestión de links en BD
    recommendations.ts              # CRUD de recomendaciones
  /utils
    recommendationTokens.ts         # Generación y validación de tokens
    buildHciWhatsappMessage.ts      # Construcción del mensaje
    sendWhatsApp.ts                 # Envío por Twilio
```

## 🎨 Personalización del Frontend

El diseño actual es básico con Tailwind CSS. Puedes personalizarlo en:
- `app/recommend/[token]/page.tsx` - Interfaz principal
- `app/globals.css` - Estilos globales
- `tailwind.config.js` - Configuración de Tailwind

## 🔒 Seguridad

- Los tokens expiran después de 30 días
- Los tokens son únicos y no pueden ser adivinados
- Cada token está vinculado a un HCI y job específicos
- La validación es criptográfica (no solo verificación en BD)

## 🧪 Testing

```bash
# Test de envío de WhatsApp
npm run test:hci-notification
```

Asegúrate de usar IDs reales de tu base de datos en el test.

## 📝 Notas Importantes

1. **APP_URL**: Configura correctamente la URL base en producción
2. **RECOMMENDATION_SECRET**: Usa un secret fuerte en producción
3. **Tabla recommendation_links**: Es opcional pero recomendada para analytics
4. **IDs requeridos**: La función `sendHciWhatsappNotification` ahora requiere los IDs del HCI y job

