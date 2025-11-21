# Configurar Vercel: Preview y Production

Esta guía te ayuda a configurar Vercel para tener ambos ambientes: **Preview** (para testing) y **Production** (para usuarios finales), con control sobre cuándo se despliega a cada uno.

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

2. **Promover a Producción:**
   - Cuando estés listo, haz merge a `main`
   - O promueve manualmente un preview a producción desde Vercel Dashboard

### Resultado:
- **Preview**: Se crea automáticamente con cada push a cualquier branch
- **Production**: Solo cuando promuevas manualmente o hagas merge a `main`
- Tienes control total sobre cuándo va a producción

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

### Ejemplo:

- **Production**: `ADMIN_EMAILS=admin1@company.com,admin2@company.com`
- **Preview**: `ADMIN_EMAILS=tu-email@example.com` (solo para testing)
- **Development**: `ADMIN_EMAILS=admin@referal.com` (local)

Esto te permite probar con diferentes configuraciones sin afectar producción.

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

## Resumen de Configuración

### Configuración Recomendada:

✅ **Production Branch**: `main` (con control manual o PR required)  
✅ **Preview Deployments**: Habilitado para todos los branches  
✅ **Variables de Entorno**: Configuradas por ambiente  
✅ **LinkedIn OAuth**: URLs agregadas para production y preview  

### Flujo de Trabajo:

1. **Desarrollo** → Trabaja en branches → Crea previews automáticamente
2. **Testing** → Prueba en preview antes de mergear
3. **Producción** → Promueve manualmente o mergea a `main` con PR

Esto te da flexibilidad para probar sin riesgo y control sobre cuándo va a producción.

