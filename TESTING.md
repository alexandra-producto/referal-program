# Guía de Testing - Sistema de Recomendaciones

## 🧪 Tests Disponibles

### 1. Test de Link de Recomendación (Recomendado)

Genera un link de recomendación para probar la interfaz:

```bash
# Generar solo el link (sin enviar WhatsApp)
npm run test:recommendation-link

# Generar link y enviar WhatsApp
npm run test:recommendation-link -- --send-whatsapp

# Usar datos reales de la base de datos
npm run test:recommendation-link -- --real-data

# Combinar ambas opciones
npm run test:recommendation-link -- --send-whatsapp --real-data
```

**Qué hace:**
- Genera un token único de recomendación
- Crea la URL completa del link
- Opcionalmente envía WhatsApp con el link
- Muestra toda la información necesaria para probar

**Ejemplo de salida:**
```
🔗 LINK DE RECOMENDACIÓN GENERADO
============================================================

http://localhost:3000/recommend/abc123def456...

============================================================

📋 Información del link:
   👤 Hyperconnector: Juan Pérez
   💼 Job: Product Manager en Vemo
   👥 Candidatos: 3
   🔑 Token: abc123def456...

💡 Para probar:
   1. Asegúrate de que Next.js esté corriendo: npm run next:dev
   2. Abre el link en tu navegador
   3. Prueba la interfaz de recomendación
```

### 2. Test de Notificación WhatsApp

Envía una notificación completa por WhatsApp:

```bash
npm run test:hci-notification
```

**Nota:** Necesitas actualizar los IDs en `src/testHciNotification.ts` con datos reales de tu BD.

### 3. Test Básico de WhatsApp

Prueba solo el envío de WhatsApp:

```bash
npm run test:whatsapp
```

## 🚀 Flujo Completo de Testing

### Paso 1: Iniciar Next.js

En una terminal, inicia el servidor de desarrollo:

```bash
npm run next:dev
```

El servidor estará disponible en `http://localhost:3000`

### Paso 2: Generar Link de Prueba

En otra terminal, genera un link:

```bash
npm run test:recommendation-link
```

### Paso 3: Probar la Interfaz

1. Copia el link generado
2. Ábrelo en tu navegador
3. Prueba:
   - Ver la información del job
   - Ver la lista de candidatos
   - Expandir un candidato y llenar el formulario
   - Enviar una recomendación
   - Probar la opción de "Recomendar alguien más"

### Paso 4: Probar con WhatsApp Real (Opcional)

Si quieres probar el flujo completo:

```bash
npm run test:recommendation-link -- --send-whatsapp
```

Esto enviará un WhatsApp real con el link. Asegúrate de tener configurado:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TEST_PHONE_NUMBER` (opcional, por defecto usa el del código)

## 🔍 Probar la API Directamente

### Obtener datos del link

```bash
# Reemplaza TOKEN con el token generado
curl http://localhost:3000/api/recommend/TOKEN
```

### Enviar recomendación

```bash
curl -X POST http://localhost:3000/api/recommend/TOKEN/submit \
  -H "Content-Type: application/json" \
  -d '{
    "candidateIds": ["candidate-id-1"],
    "notes": "Esta persona es excelente para el puesto"
  }'
```

## 📝 Variables de Entorno Necesarias

Asegúrate de tener en tu `.env.local`:

```env
# Supabase
SUPABASE_URL=tu_url
SUPABASE_SERVICE_ROLE_KEY=tu_key

# Twilio (solo si pruebas WhatsApp)
TWILIO_ACCOUNT_SID=tu_sid
TWILIO_AUTH_TOKEN=tu_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# App URL
APP_URL=http://localhost:3000

# Secret para tokens (opcional)
RECOMMENDATION_SECRET=tu-secret

# Número de teléfono para tests (opcional)
TEST_PHONE_NUMBER=+573208631577
```

## 🐛 Troubleshooting

### El link no carga

1. Verifica que Next.js esté corriendo: `npm run next:dev`
2. Verifica que el token sea válido (no muy viejo)
3. Revisa la consola del navegador para errores

### Error "Token inválido o expirado"

- Los tokens expiran después de 30 días
- Genera un nuevo link con `npm run test:recommendation-link`

### No se encuentran datos en la BD

- Usa `--real-data` solo si tienes datos en Supabase
- Sin `--real-data`, el test usa datos de ejemplo

### WhatsApp no se envía

- Verifica las credenciales de Twilio
- Asegúrate de que el número esté en formato correcto: `+573208631577`
- Verifica que el número esté verificado en Twilio (modo sandbox)

## 📊 Datos de Ejemplo vs Datos Reales

**Datos de ejemplo (`--real-data` NO usado):**
- Usa IDs temporales generados
- No requiere datos en la BD
- Perfecto para probar la interfaz
- El token funcionará pero los datos no estarán en la BD

**Datos reales (`--real-data` usado):**
- Obtiene datos reales de Supabase
- Requiere que existan hyperconnectors y jobs en la BD
- Los candidatos deben estar relacionados con el HCI
- Las recomendaciones se guardarán en la BD

## ✅ Checklist de Testing

- [ ] Next.js está corriendo
- [ ] Link generado correctamente
- [ ] Interfaz carga sin errores
- [ ] Se muestran los candidatos
- [ ] Formulario de recomendación funciona
- [ ] Validación de campos funciona (mínimo 20 caracteres)
- [ ] Diálogo de confirmación aparece
- [ ] Recomendación se envía correctamente
- [ ] Mensaje de éxito aparece
- [ ] Opción "Recomendar alguien más" funciona
- [ ] Validación de LinkedIn URL funciona
- [ ] WhatsApp se envía (si se probó)

