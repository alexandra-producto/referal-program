# Autenticación con LinkedIn OAuth2 + OpenID Connect

## 📋 Resumen

Este documento describe la implementación completa de autenticación con LinkedIn OAuth2 + OpenID Connect para reemplazar el login simulado. El sistema soporta tres tipos de usuarios: **Admin**, **Hyperconnector** y **Solicitante**.

## 🔄 Diagrama del Flujo

```
┌─────────────────┐
│  Usuario        │
│  (Frontend)     │
└────────┬────────┘
         │
         │ 1. Click "Continuar como [Rol]"
         ▼
┌─────────────────────────────────────┐
│  /login                            │
│  (Página de Login)                  │
└────────┬────────────────────────────┘
         │
         │ 2. Redirige a /api/auth/linkedin?role=[rol]
         ▼
┌─────────────────────────────────────┐
│  GET /api/auth/linkedin             │
│  - Genera state anti-CSRF (JWT)    │
│  - Guarda state en cookie           │
│  - Redirige a LinkedIn OAuth        │
└────────┬────────────────────────────┘
         │
         │ 3. Usuario autoriza en LinkedIn
         ▼
┌─────────────────────────────────────┐
│  LinkedIn OAuth                     │
│  - Usuario inicia sesión            │
│  - Autoriza aplicación              │
└────────┬────────────────────────────┘
         │
         │ 4. LinkedIn redirige con code y state
         ▼
┌─────────────────────────────────────┐
│  GET /api/auth/linkedin/callback   │
│  - Valida state                     │
│  - Intercambia code por token       │
│  - Obtiene perfil de LinkedIn       │
│  - Procesa según rol                │
└────────┬────────────────────────────┘
         │
         ├─ Admin: Valida whitelist
         ├─ Solicitante: Crea/actualiza candidate + user
         └─ Hyperconnector: Crea/actualiza candidate + hyperconnector + user
         │
         │ 5. Crea sesión JWT
         ▼
┌─────────────────────────────────────┐
│  Sesión creada (cookie httpOnly)    │
│  - Redirige a dashboard del rol     │
└─────────────────────────────────────┘
```

## 🗄️ Estructura de la Tabla `users`

La tabla `users` ya existe en Supabase y contiene los siguientes campos:

```typescript
interface User {
  id: string;                    // UUID, PK
  email: string;                 // Email del usuario
  full_name: string;             // Nombre completo
  role: UserRole;                // 'admin' | 'hyperconnector' | 'solicitante'
  candidate_id?: string | null;   // FK a candidates (si aplica)
  hyperconnector_id?: string | null; // FK a hyperconnectors (si aplica)
  linkedin_id?: string | null;   // LinkedIn ID (sub de OpenID)
  linkedin_url?: string | null;  // URL del perfil de LinkedIn
  current_role?: string | null;  // Rol actual parseado del headline
  current_company?: string | null; // Empresa actual parseada del headline
  auth_provider?: string | null; // 'linkedin'
  provider_user_id?: string | null; // LinkedIn ID (duplicado para compatibilidad)
  last_login_at?: string | null; // Timestamp del último login
  created_at?: string;           // Timestamp de creación
  updated_at?: string;           // Timestamp de actualización
}
```

## 🔐 Variables de Entorno

El proyecto usa `.env.local` como archivo de variables de entorno. Las siguientes variables deben estar configuradas:

```bash
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=tu_client_id
LINKEDIN_CLIENT_SECRET=tu_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback

# Sesiones (JWT)
SESSION_SECRET=tu_secret_key_segura

# Admin Whitelist (opcional, separado por comas)
ADMIN_EMAILS=alexa00rivera@gmail.com
```

**⚠️ IMPORTANTE:** No crear nuevas variables ni cambiar nombres. Usar exactamente las variables listadas arriba.

## 📍 Rutas de API

### 1. Iniciar Autenticación

**GET** `/api/auth/linkedin?role=[rol]`

- **Query Params:**
  - `role`: `admin` | `hyperconnector` | `solicitante`

- **Respuesta:** Redirección a LinkedIn OAuth

- **Proceso:**
  1. Valida que el rol sea válido
  2. Genera un `state` JWT con el rol y timestamp
  3. Guarda el `state` en una cookie httpOnly
  4. Redirige a LinkedIn con los parámetros OAuth

### 2. Callback de LinkedIn

**GET** `/api/auth/linkedin/callback?code=[code]&state=[state]`

- **Query Params:**
  - `code`: Código de autorización de LinkedIn
  - `state`: State anti-CSRF generado anteriormente

- **Proceso:**
  1. Valida el `state` contra la cookie
  2. Intercambia el `code` por un `access_token`
  3. Obtiene información del usuario:
     - `/v2/userinfo` (OpenID Connect)
     - `/v2/me` (perfil adicional con headline)
  4. Parsea el headline para extraer `current_role` y `current_company`
  5. Construye la URL de LinkedIn (si hay `vanityName`)
  6. Procesa según el rol (ver sección "Reglas por Rol")
  7. Crea sesión JWT y redirige al dashboard

### 3. Obtener Sesión Actual

**GET** `/api/auth/session`

- **Respuesta:**
  ```json
  {
    "authenticated": true,
    "user": {
      "userId": "uuid",
      "role": "solicitante",
      "candidateId": "uuid",
      "hyperconnectorId": null,
      "email": "user@example.com",
      "fullName": "Nombre Usuario"
    }
  }
  ```

### 4. Cerrar Sesión

**POST** `/api/auth/logout`

- **Respuesta:**
  ```json
  {
    "success": true
  }
  ```

## 🎯 Reglas de Negocio por Rol

### 🔹 Solicitante

**Flujo:**
1. Upsert en `candidates`:
   - Busca por `linkedin_id` o `email`
   - Si existe → actualiza
   - Si no existe → crea nuevo
   - Campos: `email`, `full_name`, `current_company`, `current_job_title`, `linkedin_id`, `linkedin_url`

2. Upsert en `users`:
   - Busca por `linkedin_id` o `email`
   - Si existe → actualiza
   - Si no existe → crea nuevo
   - Campos: `role='solicitante'`, `candidate_id`, `linkedin_id`, `linkedin_url`, `current_role`, `current_company`, `auth_provider='linkedin'`

3. Actualiza `last_login_at`

4. Crea sesión JWT con:
   ```json
   {
     "userId": "uuid",
     "role": "solicitante",
     "candidateId": "uuid",
     "email": "user@example.com",
     "fullName": "Nombre Usuario"
   }
   ```

5. Redirige a `/solicitante/solicitudes`

### 🔹 Hyperconnector

**Flujo:**
1. Upsert en `candidates` (igual que solicitante)

2. Upsert en `hyperconnectors`:
   - Busca por `linkedin_id`, `email` o `candidate_id`
   - Si existe → actualiza
   - Si no existe → crea nuevo
   - Campos: `email`, `full_name`, `candidate_id`, `linkedin_id`, `linkedin_url`

3. Upsert en `users`:
   - Campos: `role='hyperconnector'`, `candidate_id`, `hyperconnector_id`, `linkedin_id`, etc.

4. Actualiza `last_login_at`

5. Crea sesión JWT con:
   ```json
   {
     "userId": "uuid",
     "role": "hyperconnector",
     "candidateId": "uuid",
     "hyperconnectorId": "uuid",
     "email": "user@example.com",
     "fullName": "Nombre Usuario"
   }
   ```

6. Redirige a `/hyperconnector/jobs-home`

### 🔹 Admin

**Flujo:**
1. **Validación de Whitelist:**
   - Verifica que el email esté en `ADMIN_EMAILS` (variable de entorno)
   - Si no está autorizado → redirige a login con error `unauthorized_admin`

2. Upsert en `users`:
   - **NO** crea `candidate` ni `hyperconnector`
   - Campos: `role='admin'`, `linkedin_id`, `linkedin_url`, `current_role`, `current_company`, `auth_provider='linkedin'`

3. Actualiza `last_login_at`

4. Crea sesión JWT con:
   ```json
   {
     "userId": "uuid",
     "role": "admin",
     "email": "user@example.com",
     "fullName": "Nombre Usuario"
   }
   ```

5. Redirige a `/admin/solicitudes`

## 🔍 Parseo de Datos de LinkedIn

### Headline Parsing

El sistema parsea el `headline` de LinkedIn para extraer `current_role` y `current_company`:

**Patrón:** `"Role at Company"`

**Ejemplo:**
- Headline: `"Senior Software Engineer at Google"`
- Resultado:
  - `current_role`: `"Senior Software Engineer"`
  - `current_company`: `"Google"`

Si no hay patrón "at", ambos campos quedan en `null`.

### LinkedIn URL

- Si hay `vanityName` → `https://www.linkedin.com/in/${vanityName}`
- Si no hay `vanityName` → `null`

## 🛡️ Protección de Rutas

Todas las páginas protegidas verifican la sesión antes de mostrar contenido:

```typescript
// Ejemplo en página de solicitante
useEffect(() => {
  async function checkAuth() {
    const session = await authStore.getSession();
    if (!session || session.role !== "solicitante" || !session.candidateId) {
      router.push("/login");
      return;
    }
    // Continuar con la lógica de la página
  }
  checkAuth();
}, [router]);
```

## 🧪 Checklist de Pruebas

### ✅ Primera vez - Solicitante

- [ ] Click en "Continuar como Solicitante"
- [ ] Redirige a LinkedIn
- [ ] Autorizar aplicación
- [ ] Se crea registro en `candidates`
- [ ] Se crea registro en `users` con `role='solicitante'`
- [ ] Se redirige a `/solicitante/solicitudes`
- [ ] La sesión está activa (cookie `session` presente)

### ✅ Segunda vez - Solicitante

- [ ] Click en "Continuar como Solicitante"
- [ ] Redirige a LinkedIn
- [ ] Autorizar aplicación
- [ ] Se actualiza registro en `candidates` (no duplica)
- [ ] Se actualiza registro en `users` (no duplica)
- [ ] Se actualiza `last_login_at`
- [ ] Se redirige a `/solicitante/solicitudes`

### ✅ Primera vez - Hyperconnector

- [ ] Click en "Continuar como Hiperconector"
- [ ] Redirige a LinkedIn
- [ ] Autorizar aplicación
- [ ] Se crea registro en `candidates`
- [ ] Se crea registro en `hyperconnectors`
- [ ] Se crea registro en `users` con `role='hyperconnector'`
- [ ] Se redirige a `/hyperconnector/jobs-home`
- [ ] La sesión incluye `hyperconnectorId`

### ✅ Segunda vez - Hyperconnector

- [ ] Click en "Continuar como Hiperconector"
- [ ] Redirige a LinkedIn
- [ ] Autorizar aplicación
- [ ] Se actualizan registros (no duplica)
- [ ] Se redirige a `/hyperconnector/jobs-home`

### ✅ Admin Autorizado

- [ ] Email en `ADMIN_EMAILS`
- [ ] Click en "Continuar como Admin"
- [ ] Redirige a LinkedIn
- [ ] Autorizar aplicación
- [ ] Se crea/actualiza registro en `users` con `role='admin'`
- [ ] **NO** se crea `candidate` ni `hyperconnector`
- [ ] Se redirige a `/admin/solicitudes`

### ✅ Admin No Autorizado

- [ ] Email **NO** en `ADMIN_EMAILS`
- [ ] Click en "Continuar como Admin"
- [ ] Redirige a LinkedIn
- [ ] Autorizar aplicación
- [ ] Se redirige a login con error `unauthorized_admin`
- [ ] Mensaje de error visible en la página de login

### ✅ Logout

- [ ] Click en "Cerrar Sesión" desde cualquier página
- [ ] Cookie `session` se elimina
- [ ] Redirige a `/login`
- [ ] Intentar acceder a página protegida → redirige a login

### ✅ Protección de Rutas

- [ ] Acceder a `/solicitante/solicitudes` sin sesión → redirige a login
- [ ] Acceder a `/hyperconnector/jobs-home` sin sesión → redirige a login
- [ ] Acceder a `/admin/solicitudes` sin sesión → redirige a login
- [ ] Acceder con sesión de rol incorrecto → redirige a login

## 🚀 Cómo Correr en Local

1. **Configurar variables de entorno:**
   ```bash
   # .env.local
   LINKEDIN_CLIENT_ID=tu_client_id
   LINKEDIN_CLIENT_SECRET=tu_client_secret
   LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
   SESSION_SECRET=tu_secret_key_segura
   ADMIN_EMAILS=admin@example.com
   ```

2. **Configurar LinkedIn App:**
   - Ir a [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Crear una aplicación
   - Configurar redirect URI: `http://localhost:3000/api/auth/linkedin/callback`
   - Obtener `Client ID` y `Client Secret`
   - Agregar scopes: `openid`, `profile`, `email`

3. **Iniciar servidor:**
   ```bash
   npm run next:dev
   ```

4. **Probar:**
   - Ir a `http://localhost:3000/login`
   - Click en cualquier botón de login
   - Seguir el flujo de LinkedIn

## 📝 Notas Técnicas

- **Sesiones:** Se usan JWT firmados con `jose` almacenados en cookies httpOnly
- **State Anti-CSRF:** Se usa JWT firmado con expiración de 10 minutos
- **Upsert Logic:** Se busca primero por `linkedin_id`, luego por `email`
- **Transacciones:** Los upserts se hacen secuencialmente (no hay transacciones explícitas en Supabase)
- **Error Handling:** Todos los errores redirigen a la página de login con query params de error

## 🔗 Archivos Relacionados

- **Rutas de API:**
  - `app/api/auth/linkedin/route.ts`
  - `app/api/auth/linkedin/callback/route.ts`
  - `app/api/auth/session/route.ts`
  - `app/api/auth/logout/route.ts`

- **Utilidades:**
  - `src/utils/linkedinAuth.ts` - Funciones de LinkedIn OAuth
  - `src/utils/session.ts` - Manejo de sesiones JWT
  - `src/utils/adminWhitelist.ts` - Validación de admins

- **Dominio:**
  - `src/domain/users.ts` - CRUD de usuarios
  - `src/domain/candidates.ts` - CRUD de candidatos
  - `src/domain/hyperconnectors.ts` - CRUD de hyperconnectors

- **Frontend:**
  - `app/login/page.tsx` - Página de login
  - `app/lib/authStore.ts` - Store de autenticación (usa sesiones reales)

