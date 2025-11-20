# Integración con Vercel - Monitoreo y Corrección Automática

## Resumen

No es posible estar "conectado" directamente a Vercel para corregir automáticamente los errores de deployment. Sin embargo, hay varias estrategias para detectar y prevenir errores antes de que lleguen a Vercel.

## Estrategias Disponibles

### 1. ✅ Pre-push Check (Recomendado - Ya Implementado)

**Script**: `npm run pre-push`

Este script verifica:
- ✅ Imports con rutas relativas muy profundas (deberían usar alias `@/`)
- ✅ Errores de compilación de TypeScript
- ✅ Errores de sintaxis de Next.js

**Uso**:
```bash
# Antes de hacer push, ejecuta:
npm run pre-push

# O configúralo como git hook (ver abajo)
```

**Ventajas**:
- Detecta errores antes de hacer push
- Rápido (no hace build completo)
- Previene la mayoría de errores de imports

**Limitaciones**:
- No detecta todos los errores de runtime
- No verifica variables de entorno

### 2. Git Hooks (Opcional)

Puedes configurar un git hook para ejecutar el pre-push check automáticamente:

```bash
# Crear el hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/sh
npm run pre-push
EOF

# Dar permisos de ejecución
chmod +x .git/hooks/pre-push
```

**Nota**: Esto solo funciona localmente. Cada desarrollador debe configurarlo.

### 3. GitHub Actions (Para CI/CD)

Puedes crear un workflow de GitHub Actions que verifique el build antes de merge:

**Archivo**: `.github/workflows/pre-deploy-check.yml`

```yaml
name: Pre-Deploy Check

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run pre-push
      - run: npm run next:build
```

**Ventajas**:
- Verifica builds en cada PR
- Detecta errores antes de merge
- Funciona para todo el equipo

### 4. Vercel Webhooks (Monitoreo)

Vercel puede enviar webhooks cuando un deployment falla. Puedes configurar un endpoint que reciba estos webhooks:

**Configuración en Vercel**:
1. Ve a **Settings > Webhooks**
2. Agrega un webhook para "Deployment Error"
3. URL: Tu endpoint (ej: `https://tu-servidor.com/api/vercel-webhook`)

**Limitación**: Solo notifica, no corrige automáticamente.

### 5. Vercel CLI (Verificación Local)

Puedes usar Vercel CLI para verificar builds localmente:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Verificar build localmente (simula Vercel)
vercel build
```

**Ventajas**:
- Simula exactamente el build de Vercel
- Detecta problemas de entorno

**Desventajas**:
- Requiere configuración de Vercel CLI
- Más lento que pre-push check

### 6. Monitoreo Manual (Actual)

**Proceso actual**:
1. Haces push a GitHub
2. Vercel detecta el push automáticamente
3. Si falla, revisas los logs en Vercel Dashboard
4. Me reportas el error
5. Corrijo el error
6. Haces push nuevamente

**Mejora propuesta**: Ejecuta `npm run pre-push` antes de hacer push para detectar errores comunes.

## Recomendación

**Para desarrollo diario**:
1. ✅ Usa `npm run pre-push` antes de cada push
2. ✅ Configura git hook para automatizarlo (opcional)
3. ✅ Revisa los logs de Vercel si hay errores

**Para el equipo**:
1. ✅ Configura GitHub Actions para verificar builds en PRs
2. ✅ Usa Vercel CLI para builds locales cuando sea necesario

## Errores Comunes y Soluciones

### Error: "Module not found: Can't resolve '../../../../components/ui/card'"

**Causa**: Rutas relativas muy profundas que no funcionan en Vercel.

**Solución**: Usar alias `@/components` en lugar de rutas relativas.

**Prevención**: El script `pre-push` detecta estos casos.

### Error: "Cannot find module '@/src/domain/jobs'"

**Causa**: Alias no configurado correctamente en `next.config.js` o `tsconfig.json`.

**Solución**: Verificar que los alias estén en ambos archivos.

### Error: "Turbopack build failed"

**Causa**: Next.js 16 usa Turbopack por defecto, pero hay configuración de webpack.

**Solución**: Ya está configurado con `NEXT_PRIVATE_SKIP_TURBOPACK=1` en `package.json`.

## Próximos Pasos

1. ✅ **Ya implementado**: Script `pre-push` para verificación local
2. ⏳ **Opcional**: Configurar git hook para automatizar
3. ⏳ **Opcional**: Configurar GitHub Actions para CI/CD
4. ⏳ **Opcional**: Configurar Vercel webhooks para notificaciones

## Comandos Útiles

```bash
# Verificar antes de push
npm run pre-push

# Build local completo (más lento pero más completo)
npm run next:build

# Verificar variables de entorno
npm run check:env

# Ver logs de Vercel (requiere Vercel CLI)
vercel logs
```

## Conclusión

Aunque no puedo estar "conectado" directamente a Vercel para corregir automáticamente, el script `pre-push` detecta la mayoría de errores comunes (especialmente imports) antes de que lleguen a Vercel. Esto reduce significativamente los deployments fallidos.

**Flujo recomendado**:
1. Hacer cambios
2. Ejecutar `npm run pre-push`
3. Si pasa, hacer push
4. Si falla en Vercel, revisar logs y corregir

