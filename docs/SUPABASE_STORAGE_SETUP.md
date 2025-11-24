# Configuración de Supabase Storage para Documentos

## Paso 1: Crear el Bucket en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Storage** en el menú lateral
3. Click en **"New bucket"**
4. Configura el bucket:
   - **Name**: `job-documents`
   - **Public bucket**: ✅ **SÍ** (marcar como público para que las URLs funcionen)
   - **File size limit**: 10 MB (o el límite que prefieras)
   - **Allowed MIME types**: `application/pdf` (opcional, para restricción adicional)

5. Click en **"Create bucket"**

## Paso 2: Configurar Políticas de Seguridad (RLS)

Para que los usuarios puedan subir archivos, necesitas configurar políticas:

1. En el bucket `job-documents`, ve a **"Policies"**
2. Click en **"New Policy"**

### Política para INSERT (Subir archivos)

```sql
-- Nombre: "Allow authenticated users to upload documents"
-- Operación: INSERT
-- Policy definition:
(
  bucket_id = 'job-documents'::text
  AND auth.role() = 'authenticated'::text
)
```

### Política para SELECT (Leer archivos)

```sql
-- Nombre: "Allow public read access"
-- Operación: SELECT
-- Policy definition:
(
  bucket_id = 'job-documents'::text
)
```

O si quieres más control:

```sql
-- Nombre: "Allow authenticated users to read documents"
-- Operación: SELECT
-- Policy definition:
(
  bucket_id = 'job-documents'::text
  AND auth.role() = 'authenticated'::text
)
```

## Paso 3: Verificar que Funciona

Después de configurar, prueba subir un archivo desde el formulario de crear solicitud.

## Notas Importantes

- **Tamaño máximo**: El código valida 10MB en el frontend, pero también puedes configurarlo en Supabase
- **Tipo de archivo**: Solo se aceptan PDFs
- **URLs públicas**: Si el bucket es público, las URLs serán accesibles sin autenticación
- **Organización**: Los archivos se guardan en `job-documents/{timestamp}-{random}-{filename}`

## Troubleshooting

### Error: "Bucket not found"
- Verifica que el bucket se llame exactamente `job-documents`
- Verifica que esté creado en el proyecto correcto

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS estén configuradas correctamente
- Asegúrate de que el usuario esté autenticado

### Error: "File too large"
- Verifica el límite de tamaño en Supabase Storage
- Verifica que el archivo no exceda 10MB

