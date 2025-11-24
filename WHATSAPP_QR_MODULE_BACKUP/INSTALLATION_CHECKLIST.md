# ✅ Checklist Completo de Instalación del Módulo WhatsApp

## 📦 Archivos Incluidos en Backup

```
WHATSAPP_QR_MODULE_BACKUP/
├── README.md                      ← Documentación completa
├── DEPENDENCIES.md                ← Explicación de librerías
├── SYSTEM_FLOW.md                 ← Flujo del sistema detallado
├── QUICK_RESTORE.md               ← Restauración rápida (5-10 min)
├── INSTALLATION_CHECKLIST.md      ← Este archivo
├── whatsapp.ts                    ← Motor Baileys + gestión de conexión
├── qr-modal.tsx                   ← Modal de configuración y QR
├── connections.tsx                ← Página de conexiones
├── schema-whatsapp-minimal.ts    ← Esquema DB mínimo
├── package.json                   ← Dependencias necesarias
└── (routes.ts, storage.ts NO incluidos - son generados)
```

---

## 🎯 Pre-requisitos

- [ ] Node.js v18+ instalado
- [ ] PostgreSQL accesible (Neon recomendado)
- [ ] Git para control de versiones
- [ ] Terminal/consola disponible

---

## 🚀 Instalación Paso a Paso

### FASE 1: Preparación (5 minutos)

#### 1.1 Verificar entorno
```bash
node --version      # Debe ser v18 o superior
npm --version       # Debe ser v9 o superior
```

#### 1.2 Crear carpeta de sesiones
```bash
mkdir -p ./wa_sessions
chmod 755 ./wa_sessions
```

**Por qué**: Baileys guarda credenciales de WhatsApp aquí.

---

### FASE 2: Copiar Archivos (3 minutos)

#### 2.1 Backend - Motor WhatsApp
```bash
# Copiar el archivo principal de Baileys
cp WHATSAPP_QR_MODULE_BACKUP/whatsapp.ts server/whatsapp.ts
```

**Que hace**: Gestiona conexión a WhatsApp, QR, mensajes.

#### 2.2 Frontend - Componentes UI
```bash
# Modal para configuración y QR
cp WHATSAPP_QR_MODULE_BACKUP/qr-modal.tsx client/src/components/qr-modal.tsx

# Página de conexiones
cp WHATSAPP_QR_MODULE_BACKUP/connections.tsx client/src/pages/connections.tsx
```

**Que hace**: Interfaz para usuario vincular cuentas.

#### 2.3 Esquema de Base de Datos
```bash
# Copiar solo las tablas de WhatsApp (si aún no las tienes)
# Si ya tienes un schema.ts con otras tablas, MERGEALO manualmente
cp WHATSAPP_QR_MODULE_BACKUP/schema-whatsapp-minimal.ts shared/schema-whatsapp.ts
```

**Importante**: Si ya tienes `shared/schema.ts` con otros módulos, no sobrescribas. En su lugar:

```bash
# Abre shared/schema.ts y agrega las secciones:
# - whatsappAccounts table
# - conversations table  
# - messages table
# - Sus relaciones correspondientes
```

---

### FASE 3: Instalar Dependencias (5-10 minutos)

#### 3.1 Dependencias Críticas (MUST HAVE)

```bash
# WhatsApp - Baileys
npm install @whiskeysockets/baileys@7.0.0-rc.9

# QR Generator
npm install qrcode@1.5.4

# Frontend - State Management
npm install @tanstack/react-query@5.60.5

# Backend - ORM & DB
npm install drizzle-orm@0.39.1
npm install @neondatabase/serverless@0.10.4

# Validación
npm install zod@3.24.2

# Seguridad
npm install bcryptjs@3.0.3
```

#### 3.2 Dependencias Secundarias (YA DEBERÍAN ESTAR)

Si estas no están, instálalas:

```bash
npm install express@4.21.2         # Backend web server
npm install ws@8.18.0              # WebSockets
npm install react@18.3.1           # Frontend framework
npm install react-dom@18.3.1       # React DOM
npm install react-hook-form@7.55.0 # Formularios
npm install @hookform/resolvers@3.10.0  # Validación de formularios
```

#### 3.3 Instalación en Lote (RECOMENDADO)

```bash
npm install \
  @whiskeysockets/baileys@7.0.0-rc.9 \
  qrcode@1.5.4 \
  @tanstack/react-query@5.60.5 \
  drizzle-orm@0.39.1 \
  @neondatabase/serverless@0.10.4 \
  zod@3.24.2 \
  bcryptjs@3.0.3
```

---

### FASE 4: Configurar Rutas (2 minutos)

#### 4.1 Registrar ruta en App.tsx

Abre `client/src/App.tsx` y busca la función `Router`:

```tsx
// ANTES:
function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  )
}

// DESPUÉS:
import ConnectionsPage from "@/pages/connections";  // ← AGREGAR

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/connections" component={ConnectionsPage} />  {/* ← AGREGAR ESTA LÍNEA */}
      <Route component={NotFound} />
    </Switch>
  )
}
```

#### 4.2 Agregar Navbar/Menu Link (OPCIONAL pero recomendado)

Si tienes navbar, agrega un link a `/connections`:

```tsx
<Link href="/connections">
  <Wifi className="w-4 h-4" />
  <span>Conexiones</span>
</Link>
```

---

### FASE 5: Base de Datos (3 minutos)

#### 5.1 Correr Migrations

```bash
npm run db:push
```

**Que hace**: Crea/actualiza tablas en PostgreSQL:
- `whatsapp_accounts`
- `conversations`
- `messages`

**Espera por**: Mensaje similar a:
```
✓ Migrations applied successfully
```

#### 5.2 Verificar Tablas (OPCIONAL)

```bash
# Conectar a tu BD PostgreSQL y correr:
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'whatsapp%';

# Debería mostrar:
# whatsapp_accounts
# conversations
# messages
```

---

### FASE 6: Iniciar Servidor (1 minuto)

#### 6.1 Desarrollo

```bash
npm run dev
```

**Espera por los logs**:
```
✓ Server running at http://0.0.0.0:5000
✓ Frontend ready at http://localhost:5000
```

#### 6.2 Producción (después)

```bash
npm run build
npm run start
```

---

### FASE 7: Prueba Funcional (5-10 minutos)

#### 7.1 Test 1: Acceso a página
```
1. Abre http://localhost:5000/connections
2. Debería cargar sin errores
3. Debería mostrar botón "Agregar Cuenta"
```

#### 7.2 Test 2: Crear conexión
```
1. Click en "Agregar Cuenta"
2. Modal aparece con formulario
3. Llena: deviceName = "Test", accountType = "normal"
4. Click "Generar QR"
```

#### 7.3 Test 3: QR Generation
```
1. Espera 2-3 segundos
2. QR debe aparecer en modal
3. Si no aparece, revisa logs en terminal
```

#### 7.4 Test 4: Verificar BD
```bash
curl -X GET "http://localhost:5000/api/whatsapp-accounts?userId=test"

Espera por respuesta:
[]  (array vacío es correcto para nuevo usuario)
```

---

## 🔍 Verificación Rápida

### Backend
```bash
# Verify routes
curl http://localhost:5000/api/whatsapp-accounts?userId=test
# Debería retornar: [] (sin errores)
```

### Frontend
```bash
# Debería cargar sin errores
curl http://localhost:5000/connections
```

### Database
```bash
npm run db:push
# Debería completarse sin errores
```

---

## 📊 Estructura Final

Después de restauración, tu proyecto debe tener:

```
proyecto/
├── client/
│   └── src/
│       ├── pages/
│       │   └── connections.tsx          ✓ Nuevo
│       └── components/
│           └── qr-modal.tsx             ✓ Nuevo
├── server/
│   └── whatsapp.ts                      ✓ Nuevo
├── shared/
│   └── schema.ts                        ✓ Actualizado
├── wa_sessions/                         ✓ Nueva carpeta
├── package.json                         ✓ Actualizado con deps
└── npm_modules/                         ✓ Updated
```

---

## ⚠️ Problemas & Soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| "Cannot find module @whiskeysockets/baileys" | Dependencia no instalada | `npm install @whiskeysockets/baileys@7.0.0-rc.9` |
| "whatsapp_accounts table not found" | Migrations no corridas | `npm run db:push` |
| QR no aparece | Socket Baileys error | Revisa logs, busca "connection error" |
| "route /connections not found" | Ruta no registrada en App.tsx | Agrega import y Route en App.tsx |
| Mensajes no se reciben | Account no conectado | Escanea QR nuevamente |
| "ENOENT: no such file or directory ./wa_sessions" | Carpeta no existe | `mkdir -p ./wa_sessions` |

---

## 🎯 Validación Final

Una vez completado todo, deberías poder:

1. ✅ Acceder a http://localhost:5000/connections sin errores
2. ✅ Ver botón "Agregar Cuenta"
3. ✅ Clickear el botón y ver formulario
4. ✅ Generar QR exitosamente
5. ✅ Escanear QR con WhatsApp en teléfono
6. ✅ Ver que cuenta cambió a "Conectada"
7. ✅ Enviar y recibir mensajes

---

## 📞 Soporte Rápido

Si algo falla:

1. **Lee los logs**: `npm run dev` muestra errores en tiempo real
2. **Revisa la BD**: `npm run db:push` para sincronizar
3. **Limpia sesiones**: `rm -rf ./wa_sessions` y escanea QR nuevamente
4. **Reinstala deps**: `rm -rf node_modules && npm install`

---

## 🎉 ¡Completado!

Si pasaste todos los checks, el módulo WhatsApp está completamente restaurado y funcional.

Próximos pasos:
- [ ] Configura antiddocumentation
- [ ] Agrega soporte para chatbots
- [ ] Implementa transcripción de audio
- [ ] Configura anti-detección

¡Éxito! 🚀
