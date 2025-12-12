# Configuración de Envío de Emails con Resend

Este proyecto usa Resend para enviar emails directamente desde `hola@product-latam.com`.

## Requisitos Previos

1. Crear una cuenta en [Resend](https://resend.com)
2. Verificar el dominio `product-latam.com` en Resend
3. Generar una API Key en Resend

## Paso 1: Crear Cuenta en Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta
2. Verifica tu email

## Paso 2: Verificar Dominio

1. En el dashboard de Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa `product-latam.com`
4. Resend te dará registros DNS que debes agregar a tu proveedor de dominio:
   - Un registro SPF
   - Un registro DKIM
   - Un registro DMARC (opcional pero recomendado)
5. Una vez verificados los registros DNS, el dominio estará listo para enviar emails

## Paso 3: Generar API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Asigna un nombre descriptivo (ej: "Referal MVP - Production")
4. Copia la clave generada (solo se muestra una vez)

## Paso 4: Configurar Variables de Entorno

Agrega las siguientes variables a tu `.env.local`:

```env
# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration (opcional - defaults a hola@product-latam.com)
EMAIL_FROM=hola@product-latam.com
EMAIL_FROM_NAME=Product Latam
```

**Para producción (Vercel):**
1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega `RESEND_API_KEY` con tu API key de Resend
4. Opcionalmente agrega `EMAIL_FROM` y `EMAIL_FROM_NAME`

## Cómo Funciona

1. Cuando se ejecuta `notifyHyperconnectorForJob()`, se obtiene el email del hyperconnector
2. Se obtienen los datos del job, hyperconnector y candidatos
3. Se construye el HTML del email usando `buildHciEmailMessage()`
4. Se llama a `sendEmail()` que usa Resend para enviar el email directamente
5. El email se envía desde `hola@product-latam.com` con el HTML completo

## Ventajas sobre Flodesk

- ✅ Envío directo sin workflows intermedios
- ✅ HTML completo sin limitaciones de caracteres
- ✅ Control total sobre el contenido del email
- ✅ Más rápido y confiable
- ✅ Sin necesidad de configurar campos personalizados

## Testing

Para probar el envío de emails:

```bash
npm run test:email-notification <job_id> <hyperconnector_id>
```

## Troubleshooting

### Error: "RESEND_API_KEY no está configurada"
- Verifica que hayas agregado `RESEND_API_KEY` a `.env.local`
- En producción, verifica que esté configurada en Vercel

### Error: "Domain not verified"
- Verifica que el dominio `product-latam.com` esté verificado en Resend
- Asegúrate de que los registros DNS estén correctamente configurados

### Error: "Invalid API key"
- Verifica que la API key sea correcta
- Asegúrate de que la API key esté activa en Resend

### Los emails no llegan
- Verifica la carpeta de spam
- Revisa los logs de Resend en el dashboard
- Verifica que el dominio esté correctamente verificado

