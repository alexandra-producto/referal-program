# Guía: Crear Campos Personalizados en Flodesk

Esta guía te ayudará a crear todos los campos personalizados necesarios para que el sistema funcione correctamente.

## ⚠️ IMPORTANTE

Los nombres de los campos deben coincidir **EXACTAMENTE** (case-sensitive) con los que se envían desde el código:
- `first_name` (no `First Name` ni `firstname`)
- `job_info` (no `Job Info` ni `jobInfo`)
- `candidates_info` (no `Candidates Info` ni `candidatesInfo`)
- `recommend_url` (no `Recommend Url` ni `recommendUrl`)
- `full_name_solicitante` (no `Full Name Solicitante` ni `fullNameSolicitante`)

## Pasos para Crear Cada Campo

### 1. Acceder a Custom Fields

1. Inicia sesión en Flodesk
2. Ve a **Audience** (o **Suscriptores**)
3. Haz clic en **Subscriber Data** (o **Datos del Suscriptor**)
4. Haz clic en **Custom Fields** (o **Campos Personalizados**)
5. Haz clic en **+ Add custom field** (o **+ Agregar campo personalizado**)

### 2. Crear Campo: `first_name`

1. En el campo "Field name" (o "Nombre del campo"), escribe exactamente: **`first_name`**
2. Tipo de campo: **Text** (Texto)
3. Haz clic en **Save** (Guardar)

### 3. Crear Campo: `job_info`

1. Haz clic en **+ Add custom field** nuevamente
2. En el campo "Field name", escribe exactamente: **`job_info`**
3. Tipo de campo: **Text** (Texto)
4. Haz clic en **Save** (Guardar)

### 4. Crear Campo: `candidates_info`

1. Haz clic en **+ Add custom field** nuevamente
2. En el campo "Field name", escribe exactamente: **`candidates_info`**
3. Tipo de campo: **Text** (Texto)
4. Haz clic en **Save** (Guardar)

### 5. Crear Campo: `recommend_url`

1. Haz clic en **+ Add custom field** nuevamente
2. En el campo "Field name", escribe exactamente: **`recommend_url`**
3. Tipo de campo: **Text** (Texto) o **URL** (si está disponible)
4. Haz clic en **Save** (Guardar)

### 6. Crear Campo: `full_name_solicitante`

1. Haz clic en **+ Add custom field** nuevamente
2. En el campo "Field name", escribe exactamente: **`full_name_solicitante`**
3. Tipo de campo: **Text** (Texto)
4. Haz clic en **Save** (Guardar)

## Verificación

Después de crear todos los campos, verifica que existan:

1. En **Audience > Subscriber Data > Custom Fields**
2. Debes ver estos 5 campos exactamente como se muestran:
   - `first_name`
   - `job_info`
   - `candidates_info`
   - `recommend_url`
   - `full_name_solicitante`

## Probar que Funciona

Una vez creados todos los campos, ejecuta:

```bash
npm run test:flodesk-custom-fields
```

Y luego verifica que se guardaron:

```bash
npm run check:flodesk-subscriber alexa00rivera@gmail.com
```

Deberías ver que todos los campos se guardaron correctamente.

## Notas Importantes

- **NO uses espacios** en los nombres (usa `_` en su lugar)
- **NO uses mayúsculas** excepto donde se especifica
- **NO uses camelCase** (como `fullNameSolicitante`)
- **Solo usa snake_case** (como `full_name_solicitante`)

## Troubleshooting

### Error: "Label is not allowed to be empty"
- Asegúrate de escribir el nombre del campo en el campo "Field name"
- No dejes el campo vacío

### Los campos no se guardan después de crearlos
- Verifica que los nombres coincidan EXACTAMENTE
- Asegúrate de que el tipo de campo sea "Text"
- Intenta crear un campo de prueba primero para verificar el proceso

### El campo aparece con un nombre diferente
- Flodesk puede mostrar un "Label" diferente al "Field name"
- Lo importante es que el "Field name" (o "Field key") sea exactamente como se especifica
- Verifica en la configuración del campo cuál es el "Field key" real

