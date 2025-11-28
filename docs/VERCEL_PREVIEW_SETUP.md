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

Esto te permite probar con diferentes configuraciones sin afectar producción (excepto los datos en la base de datos).

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

Debes agregar las URLs de callback para ambos ambientes:

1. **URL de Production:**
   ```
   https://referal-programa.vercel.app/api/auth/linkedin/callback
   ```
   (O tu dominio personalizado si lo tienes configurado)

2. **URLs de Preview:**
   ```
   https://referal-program-[hash]-producto-alexs-projects.vercel.app/api/auth/linkedin/callback
   ```
   (Cada preview tiene una URL única)

### Solución Recomendada:

- Agrega la URL de **production** (la principal)
- Agrega algunas URLs de **preview** que uses frecuentemente
- O mejor aún: configura un dominio personalizado para preview (ej: `preview.referal-programa.vercel.app`)

LinkedIn permite múltiples redirect URLs, así que puedes agregar todas las que necesites.

## Crear Base de Datos Separada para Preview (Opcional pero Recomendado)

Si quieres aislar completamente los datos de testing de los datos de producción:

### Pasos para Crear Base de Datos de Preview:

1. **Crear Nuevo Proyecto en Supabase**
   - Ve a [Supabase Dashboard](https://app.supabase.com)
   - Click en "New Project"
   - Nombre: `referal-program-preview` (o similar)
   - Región: Misma que tu proyecto de producción
   - Password: Genera una contraseña segura
   - Espera a que se cree el proyecto (2-3 minutos)

2. **Configurar Variables de Entorno en Vercel**
   - Ve a **Settings → Environment Variables**
   - Para cada variable de Supabase:
     - **Production**: Mantén las credenciales de tu proyecto de producción
     - **Preview**: Agrega las credenciales del nuevo proyecto de preview
     - **Development**: Puedes usar las de preview o las de producción

3. **Copiar Schema de Producción a Preview**
   - En Supabase Dashboard, ve a tu proyecto de **producción**
   - Ve a **SQL Editor**
   - Exporta o copia todas las tablas y funciones necesarias
   - En el proyecto de **preview**, ejecuta el mismo SQL para crear las tablas

4. **Configurar RLS (Row Level Security)**
   - Asegúrate de que las políticas RLS estén configuradas igual en ambos proyectos
   - O usa `SUPABASE_SERVICE_ROLE_KEY` que bypass RLS (como en producción)

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

### Próximos Pasos (Opcional):

- [ ] Crear proyecto Supabase separado para Preview
- [ ] Configurar variables de entorno diferentes para Preview
- [ ] Copiar schema de producción a preview
- [ ] Probar que Preview use su propia base de datos

Esto te da flexibilidad para probar sin riesgo y control sobre cuándo va a producción.

