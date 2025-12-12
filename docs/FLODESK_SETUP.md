# Configuración de Flodesk para Envío de Emails

## Requisitos Previos

1. Tener una cuenta de Flodesk activa
2. Generar una API Key en Flodesk
3. Crear un segmento en Flodesk para las notificaciones
4. Configurar un workflow que se active al agregar suscriptores al segmento

## Paso 1: Generar API Key en Flodesk

1. Inicia sesión en tu cuenta de Flodesk
2. Ve a **Configuración de cuenta** > **Integraciones** > **Claves de API**
3. Haz clic en **Crear clave de API**
4. Asigna un nombre descriptivo (ej: "Referal MVP - Notificaciones")
5. Copia la clave generada (solo se muestra una vez)

## Paso 2: Crear Segmento en Flodesk

1. En Flodesk, ve a **Segmentos**
2. Crea un nuevo segmento (ej: "Notificaciones de Recomendaciones")
3. Copia el **ID del segmento** (lo necesitarás para la configuración)

## Paso 3: Configurar Workflow en Flodesk

1. Ve a **Automatizaciones** > **Workflows**
2. Crea un nuevo workflow que se active cuando se agrega un suscriptor al segmento creado
3. En el workflow, configura un email que use los campos personalizados:
   - `first_name` - Primer nombre del hyperconnector
   - `full_name` - Nombre completo
   - `job_title` - Título del trabajo
   - `company_name` - Nombre de la empresa
   - `recommend_url` - URL del link de recomendación
   - `candidates_list` - Lista de nombres de candidatos (separados por comas)
   - `candidates_count` - Número de candidatos

**IMPORTANTE**: 
- Flodesk limita los campos personalizados a 256 caracteres, por lo que NO enviamos el HTML completo
- El workflow debe construir el email usando estos campos personalizados
- El workflow debe diseñar el template del email en Flodesk usando estos campos

## Paso 4: Configurar Variables de Entorno

Agrega las siguientes variables a tu `.env.local`:

```env
# Flodesk API Configuration
FLODESK_API_KEY=tu_api_key_aqui

# IMPORTANTE: Si tus campos personalizados están en un formulario, usa FLODESK_FORM_ID
# Si no, usa FLODESK_SEGMENT_ID
FLODESK_FORM_ID=id_del_formulario_aqui
# O alternativamente:
# FLODESK_SEGMENT_ID=id_del_segmento_aqui

FLODESK_FROM_EMAIL=noreply@tudominio.com
FLODESK_FROM_NAME=Product Latam
```

**Nota sobre Form ID vs Segment ID:**
- Si tus campos personalizados están configurados en un **formulario** de Flodesk, debes usar `FLODESK_FORM_ID`
- El Form ID se encuentra en la URL del formulario: `https://app.flodesk.com/forms/[FORM_ID]`
- Si usas `FLODESK_FORM_ID`, los campos personalizados se guardarán correctamente cuando agregues el suscriptor

## Paso 5: Subir Imagen del Header

1. Sube la imagen del banner "CONNECTING TOP-TIER TALENT" a:
   - `public/images/email-header-banner.png`

2. O configura una URL absoluta en producción para que la imagen se cargue correctamente en los clientes de email

## Cómo Funciona (Flujo de Dos Pasos)

La integración sigue un flujo de dos pasos para asegurar que los datos se guarden correctamente:

### Paso 1: Crear el Suscriptor
1. Se llama a `POST /v1/subscribers` con datos mínimos:
   - `email`: Email del hyperconnector
   - `first_name`: Primer nombre (extraído del email si no se proporciona)

### Paso 2: Actualizar el Suscriptor
2. Inmediatamente después, se llama nuevamente a `POST /v1/subscribers` (Flodesk actualiza si el suscriptor ya existe):
   - `email`: Mismo email del paso 1
   - `segments`: Array con el `segment_id` configurado
   - `custom_fields`: Objeto con las variables dinámicas (máx 256 caracteres cada campo)

### Flujo Completo
1. Cuando se ejecuta `notifyHyperconnectorForJob()`, se obtiene el email del hyperconnector
2. Se obtienen los datos del job, hyperconnector y candidatos
3. Se llama a `sendFlodeskEmail()` que internamente usa `createOrUpdateFlodeskSubscriber()`:
   - **Paso 1**: Crea el suscriptor con datos mínimos
   - **Paso 2**: Actualiza el suscriptor con `segments` y `custom_fields`
4. El workflow en Flodesk se activa automáticamente cuando el suscriptor se agrega al segmento
5. El workflow construye y envía el email usando los campos personalizados y el template configurado en Flodesk

**Nota**: El flujo es idempotente - si el suscriptor ya existe, se obtiene su ID y se actualiza sin crear duplicados.

## Testing

Para probar el envío de emails:

```bash
npm run test:email-notification <job_id> <hyperconnector_id>
```

## Troubleshooting

### Error: "FLODESK_SEGMENT_ID no está configurada"
- Verifica que hayas creado el segmento en Flodesk
- Copia el ID del segmento y agrégalo a `.env.local`

### Error: "Flodesk API error: 401"
- Verifica que la API key sea correcta
- Asegúrate de que la API key esté activa en Flodesk

### Error: "Flodesk API error: 404"
- Verifica que el segmento ID sea correcto
- Asegúrate de que el segmento exista en Flodesk

### Error: "CustomFields[email_html] must be a maximum of 256 characters"
- Flodesk limita los campos personalizados a 256 caracteres
- NO se debe enviar HTML completo como campo personalizado
- El workflow debe construir el email usando los campos personalizados disponibles

### El email no se envía
- Verifica que el workflow esté activo en Flodesk
- Verifica que el workflow esté configurado para activarse cuando se agrega un suscriptor al segmento
- Verifica que el template del email en el workflow use los campos personalizados correctos
- Revisa los logs en Flodesk para ver si hay errores en el workflow

