# 🚀 Guía Rápida de Restauración - WhatsApp QR Module

Si algo se rompe o necesitas restaurar el módulo rápidamente, sigue estos pasos:

## ⏱️ Tiempo estimado: 5-10 minutos

---

## PASO 1: Copiar Archivos Fuente (2 minutos)

```bash
# Backend - Motor WhatsApp
cp WHATSAPP_QR_MODULE_BACKUP/whatsapp.ts server/

# Backend - Rutas API
cp WHATSAPP_QR_MODULE_BACKUP/routes.ts server/

# Base de Datos - Esquemas
cp WHATSAPP_QR_MODULE_BACKUP/schema-whatsapp-minimal.ts shared/schema.ts

# Frontend - UI Components
cp WHATSAPP_QR_MODULE_BACKUP/qr-modal.tsx client/src/components/
cp WHATSAPP_QR_MODULE_BACKUP/connections.tsx client/src/pages/
```

---

## PASO 2: Instalar Dependencias (3 minutos)

```bash
# Core WhatsApp
npm install @whiskeysockets/baileys@7.0.0-rc.9
npm install qrcode@1.5.4

# Frontend State Management
npm install @tanstack/react-query@5.60.5

# Backend Database
npm install drizzle-orm@0.39.1 @neondatabase/serverless@0.10.4

# WebSockets (opcional, si no está instalado)
npm install ws@8.18.0

# Otros
npm install zod bcryptjs
```

O instala todo de una vez:

```bash
npm install @whiskeysockets/baileys@7.0.0-rc.9 qrcode@1.5.4 \
  @tanstack/react-query@5.60.5 drizzle-orm@0.39.1 \
  @neondatabase/serverless@0.10.4 ws@8.18.0 zod bcryptjs
```

---

## PASO 3: Registrar Rutas en App.tsx (2 minutos)

Abre `client/src/App.tsx` y agrega:

```tsx
import ConnectionsPage from "@/pages/connections";

// En el Router component, agrega:
<Route path="/connections" component={ConnectionsPage} />

// Ejemplo completo:
function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/connections" component={ConnectionsPage} />  {/* ← AGREGAR ESTO */}
      <Route path="/conversations/:id" component={ConversationPage} />
      <Route component={NotFound} />
    </Switch>
  )
}
```

---

## PASO 4: Crear Carpeta de Sesiones (30 segundos)

```bash
mkdir -p ./wa_sessions
chmod 755 ./wa_sessions
```

**¿Por qué?** Baileys necesita guardar las credenciales aquí.

---

## PASO 5: Migrations de Base de Datos (1 minuto)

```bash
npm run db:push
```

Esto crea/actualiza las tablas:
- `whatsapp_accounts`
- `conversations`
- `messages`

---

## PASO 6: Iniciar Servidor (1 minuto)

```bash
npm run dev
```

Deberías ver en los logs:
```
✓ Backend listening on http://0.0.0.0:5000
✓ Frontend ready at http://localhost:5000
```

---

## PASO 7: Probar Módulo (2 minutos)

1. Abre http://localhost:5000
2. Ve a `/connections`
3. Click en "Agregar Cuenta"
4. Llena formulario y clickea "Generar QR"
5. Escanea QR con WhatsApp
6. Verifica que aparece "Conectada"

---

## 🔍 Verificación Rápida

### ✅ Backend correcto
```bash
curl http://localhost:5000/api/whatsapp-accounts?userId=test
# Debería retornar: []  (array vacío es OK)
```

### ✅ Frontend cargado
```
http://localhost:5000/connections
# Debería mostrar página con botón "Agregar Cuenta"
```

### ✅ BD conectada
```bash
npm run db:push
# Debería no mostrar errores
```

---

## 🚨 Problemas Comunes

### ❌ "Cannot find module @whiskeysockets/baileys"
```bash
npm install @whiskeysockets/baileys@7.0.0-rc.9
npm run dev  # Reinicia
```

### ❌ "whatsapp_accounts table not found"
```bash
npm run db:push
```

### ❌ "QR no aparece"
Revisa logs en consola:
```bash
# Si ves "connection error", la sesión está corrupta
rm -rf ./wa_sessions
# Intenta crear nueva conexión
```

### ❌ "Module not found: storage"
Asegurate que copiaste `server/storage.ts` (no incluido aquí porque es generado)

---

## 📋 Checklist de Restauración

- [ ] Copié whatsapp.ts a server/
- [ ] Copié routes.ts a server/
- [ ] Copié schema a shared/schema.ts
- [ ] Copié qr-modal.tsx y connections.tsx
- [ ] Instalé dependencias (@whiskeysockets/baileys, qrcode, @tanstack/react-query)
- [ ] Agregué ruta en App.tsx
- [ ] Creé carpeta ./wa_sessions
- [ ] Corrí npm run db:push
- [ ] Inicié npm run dev
- [ ] Probé en /connections

---

## 💾 Backup Completo

Esto restaura el módulo a su estado funcional mínimo. Si necesitas el código completo de otros módulos (chatbots, CRM, etc), cópialos desde los archivos fuente originales.

---

## 📞 Validación Final

```bash
# Abre terminal y corre:
npm run dev

# En otra terminal, corre:
curl -X GET "http://localhost:5000/api/whatsapp-accounts?userId=test"

# Deberías obtener:
# []

# ✓ Si ves un array vacío, todo está correcto
# ✓ Si ves un error, revisa los logs en npm run dev
```

---

## 🎯 Próximos Pasos

1. **Usuarios existentes**: Sus cuentas de WhatsApp deben reconectarse automáticamente
2. **Nueva instalación**: Los usuarios pueden vincular cuentas a través de `/connections`
3. **Monitoreo**: Revisa logs para mensajes de "WhatsApp connected"

¡Listo! El módulo está restaurado. 🎉
