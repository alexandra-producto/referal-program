# Configurar Vercel: Preview y Production

Esta guía te ayuda a configurar Vercel para tener ambos ambientes: **Preview** (para testing) y **Production** (para usuarios finales), con control sobre cuándo se despliega a cada uno.

## ⚠️ Estado Actual: Base de Datos Compartida

**IMPORTANTE:** Actualmente, tanto Preview como Production comparten la **misma base de datos de Supabase**. Esto significa que:

- ✅ **Ventaja**: No necesitas configurar una base de datos separada para empezar
- ⚠️ **Consideración**: Los datos de testing en Preview se mezclarán con los datos de Production
- 💡 **Recomendación**: Para testing intensivo, considera crear una base de datos separada (ver sección más abajo)

## Configuración Recomendada: Ambos Ambientes

### Configuración Ideal:

1. **Production Branch: `main`**
   - Solo despliega a producción cuando promuevas manualmente
   - O cuando hagas merge a `main` desde un PR aprobado

2. **Preview Branches: Todos los demás**
   - Cada push a cualquier branch crea un preview
   - Perfecto para testing antes de producción

### Pasos para Configurar:

1. **Ve a tu proyecto en Vercel Dashboard**
   - URL: `https://vercel.com/producto-alexs-projects/referal-program`

2. **Ve a Settings → Git**
   - **Production Branch**: Deja `main` configurado
   - **Preview Deployments**: Asegúrate de que esté habilitado
   - Opcional: Desmarca "Automatically deploy from this branch" si quieres control manual

3. **Configura Branch Protection (Opcional pero Recomendado)**
   - En GitHub, ve a Settings → Branches
   - Protege el branch `main`
   - Requiere pull requests antes de merge
   - Esto asegura que solo código revisado vaya a producción

### Flujo de Trabajo Recomendado:

1. **Desarrollo/Testing:**
   - Trabaja en branches (ej: `feature/nueva-funcionalidad`)
   - Cada push crea un **Preview** automáticamente
   - Prueba en el preview antes de mergear
   - ⚠️ **Nota**: Los datos de testing se guardarán en la misma base de datos que Production

2. **Promover a Producción:**
   - Cuando estés listo, haz merge a `main`
   - O promueve manualmente un preview a producción desde Vercel Dashboard

### Resultado:
- **Preview**: Se crea automáticamente con cada push a cualquier branch
- **Production**: Solo cuando promuevas manualmente o hagas merge a `main`
- Tienes control total sobre cuándo va a producción
- **Base de datos**: Compartida entre ambos ambientes (por ahora)

## Opción Alternativa: Branch Separado para Producción

Si prefieres tener un branch dedicado solo para producción:

### Pasos:

1. **Crea un branch `production` en GitHub**
   ```bash
   git checkout -b production
   git push origin production
   ```

2. **En Vercel, configura:**
   - **Production Branch**: `production`
   - **Preview Branches**: `main` y todos los demás

3. **Flujo de Trabajo:**
   - Desarrollo en `main` → Crea previews
   - Cuando estés listo para producción → Mergea `main` a `production`
   - `production` → Despliega automáticamente a producción

### Resultado:
- `main` → Preview deployments (testing)
- `production` → Production deployments (usuarios finales)

## Variables de Entorno por Ambiente

Puedes tener diferentes variables de entorno para cada ambiente:

### Configurar en Vercel:

1. **Ve a Settings → Environment Variables**

2. **Agrega variables y selecciona los ambientes:**
   - **Production**: Variables para usuarios finales
   - **Preview**: Variables para testing (pueden ser las mismas o diferentes)
   - **Development**: Variables para desarrollo local

### Configuración Actual (Base de Datos Compartida):

**IMPORTANTE:** Como compartes la misma base de datos, usa las **mismas credenciales de Supabase** para ambos ambientes:

- **Production**: 
  - `SUPABASE_URL=https://tu-proyecto.supabase.co` (tu proyecto actual)
  - `SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...` (tu key actual)
  
- **Preview**: 
  - `SUPABASE_URL=https://tu-proyecto.supabase.co` (mismo proyecto)
  - `SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...` (misma key)

- **Development**: 
  - `SUPABASE_URL=https://tu-proyecto.supabase.co` (mismo proyecto)
  - `SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...` (misma key)

### Variables que SÍ pueden ser diferentes:

- **Production**: `ADMIN_EMAILS=admin1@company.com,admin2@company.com`
- **Preview**: `ADMIN_EMAILS=tu-email@example.com` (solo para testing)
- **Development**: `ADMIN_EMAILS=admin@referal.com` (local)

**Nota sobre LinkedIn OAuth:**
- `LINKEDIN_CLIENT_ID` y `LINKEDIN_CLIENT_SECRET` pueden ser los mismos en ambos ambientes
- `LINKEDIN_REDIRECT_URI` se construye automáticamente desde `VERCEL_URL` (no necesitas configurarla manualmente)
- Solo asegúrate de agregar las URLs de callback en LinkedIn Developers (ver sección más abajo)

Esto te permite probar con diferentes configuraciones sin afectar producción (excepto los datos en la base de datos si no has creado una separada).

## Verificar la Configuración

Después de configurar:

1. Haz un push a `main`
2. Ve a **Deployments** en Vercel
3. Verifica que el deployment aparezca como **"Preview"** y no como **"Production"**

## Promover Preview a Producción (Cuando Estés Listo)

Cuando quieras desplegar a producción:

1. Ve a **Deployments** en Vercel
2. Encuentra el preview que quieres promover
3. Haz clic en los **tres puntos (⋯)** → **"Promote to Production"**

O simplemente mergea a tu branch de producción si configuraste la Opción 3.

## Configurar LinkedIn OAuth para Ambos Ambientes

### URLs para Agregar en LinkedIn Developers:

**⚠️ IMPORTANTE**: LinkedIn requiere que TODAS las URLs de callback estén registradas exactamente. Si falta alguna, verás el error: "The redirect_uri does not match the registered value".

Debes agregar las URLs de callback para ambos ambientes en [LinkedIn Developers](https://www.linkedin.com/developers/apps):

1. **URL de Production (OBLIGATORIA):**
   ```
   https://referal-programa.vercel.app/api/auth/linkedin/callback
   ```
   (O tu dominio personalizado si lo tienes configurado)

2. **URL de Preview (NECESARIA para testing):**
   ```
   https://preview-referal-program.vercel.app/api/auth/linkedin/callback
   ```
   (Esta es la URL del dominio personalizado de preview)

3. **URLs de Preview con Hash (OPCIONAL, si usas previews automáticos):**
   ```
   https://referal-program-[hash]-producto-alexs-projects.vercel.app/api/auth/linkedin/callback
   ```
   (Cada preview automático tiene una URL única con un hash diferente)

4. **URL de Localhost (OPCIONAL, para desarrollo local):**
   ```
   http://localhost:3000/api/auth/linkedin/callback
   ```

### Pasos para Configurar en LinkedIn Developers:

1. Ve a [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Selecciona tu aplicación
3. Ve a **Auth** → **Redirect URLs**
4. Click en **"Add redirect URL"** o el botón **"+"**
5. Agrega las siguientes URLs **UNA POR UNA** (LinkedIn permite múltiples):

   **URL 1 - Production:**
   ```
   https://referal-programa.vercel.app/api/auth/linkedin/callback
   ```

   **URL 2 - Preview (dominio personalizado):**
   ```
   https://preview-referal-program.vercel.app/api/auth/linkedin/callback
   ```

   **URL 3 - Localhost (opcional):**
   ```
   http://localhost:3000/api/auth/linkedin/callback
   ```

6. Click en **"Update"** o **"Save"** después de agregar cada URL

### ⚠️ Notas Importantes:

- **LinkedIn NO permite wildcards**: No puedes usar `https://referal-program-*-producto-alexs-projects.vercel.app/api/auth/linkedin/callback`
- **Las URLs deben ser EXACTAS**: Incluye el protocolo (`https://` o `http://`), el dominio completo, y la ruta completa
- **Cada URL debe agregarse individualmente**: No puedes agregar múltiples URLs en un solo campo
- **Mínimo necesario**: Al menos Production y Preview (dominio personalizado)

### Solución Recomendada:

- ✅ **OBLIGATORIO**: Agrega la URL de **production**
- ✅ **NECESARIO**: Agrega la URL de **preview** (dominio personalizado)
- ✅ **OPCIONAL**: Agrega localhost si desarrollas localmente
- ⚠️ **NO RECOMENDADO**: Agregar URLs de previews automáticos (cada uno tiene un hash diferente y sería muy tedioso)

**Tip**: Si usas un dominio personalizado para preview (`preview-referal-program.vercel.app`), solo necesitas agregar esa URL una vez y funcionará para todos los deployments de preview.

## Crear Base de Datos Separada para Preview (Recomendado para Testing)

Si quieres aislar completamente los datos de testing de los datos de producción, sigue estos pasos:

### Paso 1: Crear Nuevo Proyecto en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Click en **"New Project"** (o el botón "+" en la esquina superior)
3. Completa el formulario:
   - **Name**: `referal-program-preview` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (guárdala en un lugar seguro)
   - **Region**: Selecciona la misma región que tu proyecto de producción (para mejor latencia)
   - **Pricing Plan**: Free tier es suficiente para testing
4. Click en **"Create new project"**
5. Espera 2-3 minutos mientras se crea el proyecto

### Paso 2: Obtener Credenciales del Proyecto Preview

Una vez creado el proyecto:

1. En el Dashboard del proyecto preview, ve a **Settings → API**
2. Copia estos valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **service_role key** (⚠️ SECRETO - no compartir): `eyJhbGci...`
3. Guárdalos temporalmente (los necesitarás en el siguiente paso)

### Paso 3: Exportar Schema de Producción

**Opción A: Usar Supabase CLI (Recomendado)**

Si tienes Supabase CLI instalado:

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login en Supabase
supabase login

# Link tu proyecto de producción
supabase link --project-ref tu-project-ref-de-produccion

# Exportar schema
supabase db dump -f schema-production.sql

# Cambiar al proyecto de preview
supabase link --project-ref tu-project-ref-de-preview

# Aplicar schema
supabase db reset --db-url "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

**Opción B: Exportar desde SQL Editor (Más Simple)**

1. En tu proyecto de **producción**, ve a **SQL Editor**
2. Ejecuta esta query para obtener todas las tablas:

```sql
-- Obtener lista de todas las tablas
SELECT 
    table_name,
    'CREATE TABLE ' || table_name || ' (' || 
    string_agg(
        column_name || ' ' || data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', '
    ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
```

3. O mejor aún, usa la función de exportar schema:
   - Ve a **Database → Schema Visualizer** o
   - Ve a **SQL Editor → New Query** y ejecuta:

```sql
-- Exportar estructura de tablas principales
-- (Ajusta según tus tablas específicas)
```

**Tablas Principales que Necesitas Copiar:**

Basado en el código actual, estas son las tablas principales:

- `users` - Usuarios del sistema
- `candidates` - Candidatos
- `hyperconnectors` - Hyperconnectors
- `jobs` - Vacantes/Posiciones
- `recommendations` - Recomendaciones
- `job_candidate_matches` - Matches entre jobs y candidatos
- `candidate_experience` - Experiencia laboral de candidatos
- `hyperconnector_candidates` - Relación hyperconnector-candidato
- `recommendation_links` - Links de recomendación (opcional)

### Paso 4: Crear Schema en Preview

1. En tu proyecto de **preview**, ve a **SQL Editor**
2. Crea un nuevo query
3. Pega el SQL exportado de producción (o crea las tablas manualmente)
4. Ejecuta el query

**Ejemplo de Schema Mínimo (Ajusta según tus necesidades):**

```sql
-- Ejemplo: Tabla users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  linkedin_id TEXT,
  linkedin_url TEXT,
  role TEXT NOT NULL,
  current_job_title TEXT,
  current_company TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ejemplo: Tabla candidates
CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  current_job_title TEXT,
  current_company TEXT,
  country TEXT,
  industry TEXT,
  linkedin_url TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Continúa con las demás tablas...
```

**💡 Tip**: Si tienes muchas tablas, considera usar un script SQL completo o la opción de Supabase CLI.

### Paso 5: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings → Environment Variables**
3. Para cada variable de Supabase, configura así:

   **Para `SUPABASE_URL`:**
   - Click en la variable existente o crea una nueva
   - **Production**: Mantén `https://tu-proyecto-produccion.supabase.co`
   - **Preview**: Agrega `https://tu-proyecto-preview.supabase.co`
   - **Development**: Puedes usar la de preview o producción
   - Click en **"Save"**

   **Para `SUPABASE_SERVICE_ROLE_KEY`:**
   - Click en la variable existente o crea una nueva
   - **Production**: Mantén tu key de producción
   - **Preview**: Agrega la key de preview (la que copiaste en el Paso 2)
   - **Development**: Puedes usar la de preview o producción
   - Click en **"Save"**

4. Verifica que ambas variables tengan los checkboxes correctos marcados:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (opcional)

### Paso 6: Configurar RLS (Row Level Security)

**Opción A: Usar Service Role Key (Más Simple - Recomendado para Testing)**

Si usas `SUPABASE_SERVICE_ROLE_KEY` en tu código (como actualmente), no necesitas configurar RLS porque el service role key bypass todas las políticas RLS. Esto es perfecto para testing.

**Opción B: Copiar Políticas RLS (Si las tienes)**

Si tienes políticas RLS en producción y quieres replicarlas:

1. En producción, ejecuta:

```sql
-- Obtener todas las políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public';
```

2. Copia las políticas y ejecútalas en preview

### Paso 7: Verificar la Configuración

1. Haz un push a un branch que no sea `main` (ej: `git checkout -b test-preview && git push`)
2. Ve a **Deployments** en Vercel
3. Verifica que se creó un preview deployment
4. Abre el preview y prueba hacer login
5. Verifica en Supabase Dashboard del proyecto **preview** que se crearon registros nuevos
6. Verifica en Supabase Dashboard del proyecto **producción** que NO se crearon registros nuevos

✅ Si todo funciona, ¡tu preview está usando su propia base de datos!

### Ventajas de Base de Datos Separada:

✅ **Aislamiento completo**: Los datos de testing no afectan producción  
✅ **Testing más seguro**: Puedes hacer pruebas destructivas sin riesgo  
✅ **Limpieza fácil**: Puedes resetear la base de preview sin afectar producción  
✅ **Mejor para desarrollo**: Múltiples desarrolladores pueden usar preview sin conflictos  

### Cuándo Crear Base de Datos Separada:

- ✅ Si vas a hacer testing intensivo con datos de prueba
- ✅ Si necesitas probar migraciones de base de datos
- ✅ Si tienes múltiples desarrolladores trabajando en previews
- ✅ Si quieres probar funcionalidades que modifican datos críticos

### Cuándo NO es Necesario (Por Ahora):

- ⚠️ Si solo estás probando cambios de UI
- ⚠️ Si los datos de testing no son un problema
- ⚠️ Si estás en fase temprana de desarrollo
- ⚠️ Si prefieres simplicidad sobre aislamiento

**Recomendación**: Empieza con base de datos compartida, y crea una separada cuando sientas que la necesitas.

## Resumen de Configuración

### Configuración Actual (Base de Datos Compartida):

✅ **Production Branch**: `main` (con control manual o PR required)  
✅ **Preview Deployments**: Habilitado para todos los branches  
✅ **Variables de Entorno**: Configuradas por ambiente (mismas credenciales de Supabase)  
✅ **LinkedIn OAuth**: URLs agregadas para production y preview  
⚠️ **Base de Datos**: Compartida entre Preview y Production  

### Flujo de Trabajo:

1. **Desarrollo** → Trabaja en branches → Crea previews automáticamente
2. **Testing** → Prueba en preview antes de mergear (⚠️ datos se guardan en la misma DB)
3. **Producción** → Promueve manualmente o mergea a `main` con PR

### Próximos Pasos:

**Si NO tienes base de datos separada (Configuración Actual):**
- [x] ✅ Preview deployments habilitados
- [x] ✅ Variables de entorno configuradas (mismas credenciales de Supabase)
- [x] ✅ LinkedIn OAuth URLs agregadas
- [ ] ⚠️ **Considerar**: Crear base de datos separada para testing más seguro

**Si SÍ quieres crear base de datos separada:**
- [ ] Crear proyecto Supabase separado para Preview (ver sección "Crear Base de Datos Separada")
- [ ] Configurar variables de entorno diferentes para Preview en Vercel
- [ ] Copiar schema de producción a preview
- [ ] Verificar que Preview use su propia base de datos (hacer login y verificar en Supabase)

### Checklist de Verificación Final:

1. **Preview Deployments:**
   - [ ] Hacer push a un branch que no sea `main`
   - [ ] Verificar que se crea un preview deployment en Vercel
   - [ ] Verificar que el preview funciona correctamente

2. **Variables de Entorno:**
   - [ ] `SUPABASE_URL` configurada para Production y Preview
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada para Production y Preview
   - [ ] `LINKEDIN_CLIENT_ID` y `LINKEDIN_CLIENT_SECRET` configuradas
   - [ ] `ADMIN_EMAILS` configurada (puede ser diferente por ambiente)

3. **LinkedIn OAuth:**
   - [ ] URL de production agregada en LinkedIn Developers
   - [ ] URLs de preview agregadas (o plan para agregarlas cuando las necesites)

4. **Base de Datos (si creaste una separada):**
   - [ ] Schema copiado a preview
   - [ ] Variables de entorno apuntando a preview en Vercel
   - [ ] Verificado que preview usa su propia base de datos

Esto te da flexibilidad para probar sin riesgo y control sobre cuándo va a producción.

