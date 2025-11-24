# WhatsApp QR Module Backup - Documentación Completa

Este directorio contiene el código fuente completo del módulo de vinculación de WhatsApp con QR, incluyendo todas las dependencias, librerías y configuración necesaria para mantener y restaurar el sistema si es necesario.

## 📋 Contenido de la Carpeta

- `whatsapp.ts` - Motor principal de WhatsApp (Baileys)
- `routes.ts` - Rutas API del backend
- `schema.ts` - Esquema de datos compartido (Frontend/Backend)
- `storage.ts` - Interfaz de almacenamiento
- `qr-modal.tsx` - Componente UI para modal QR (React)
- `connections.tsx` - Página de conexiones (React)
- `package.json` - Todas las dependencias necesarias
- `DEPENDENCIES.md` - Explicación detallada de cada librería
- `SYSTEM_FLOW.md` - Flujo completo del sistema

## 🔑 Dependencias Críticas

### Core WhatsApp (Baileys)
- `@whiskeysockets/baileys` v7.0.0-rc.9 - Motor WhatsApp sin navegador
- `qrcode` v1.5.4 - Generador de código QR

### Frontend (React + UI)
- `react` v18.3.1 - Framework React
- `react-hook-form` v7.55.0 - Manejo de formularios
- `@hookform/resolvers` v3.10.0 - Validación con Zod
- `@radix-ui/*` - Componentes UI accesibles

### Query & Estado
- `@tanstack/react-query` v5.60.5 - Gestión de datos y caché
- `zod` v3.24.2 - Validación de esquemas

### Backend
- `express` v4.21.2 - Servidor web
- `ws` v8.18.0 - WebSockets
- `socket.io` v4.8.1 - WebSockets mejorado

### Base de Datos
- `drizzle-orm` v0.39.1 - ORM SQL
- `@neondatabase/serverless` v0.10.4 - PostgreSQL

## 🔄 Flujo del Sistema

### 1. **Creación de Conexión** (QR Generation)
```
Usuario → "Agregar Cuenta" 
→ Modal Configuración (deviceName, accountType)
→ POST /api/whatsapp-accounts
→ Backend crea registro en BD
→ createWhatsAppConnection() genera socket Baileys
→ Socket genera evento QR
→ QRCode.toDataURL() convierte a imagen
→ Frontend recibe y muestra QR
```

### 2. **Escaneo QR**
```
Usuario escanea QR con WhatsApp
→ Baileys recibe confirmación
→ Event: connection.update → connection='open'
→ Extrae phoneNumber del socket.user.id
→ Actualiza estado a 'connected'
→ Guarda credentials en ./wa_sessions/${accountId}/
→ Inicia escucha de mensajes
```

### 3. **Recepción de Mensajes**
```
Socket Baileys recibe mensaje
→ Event: messages.upsert
→ Extrae contenido, tipo, números
→ Limpia números especiales de WhatsApp
→ Descarga medios si aplica (imagen, audio, video)
→ Transcriba audio si es necesario
→ Crea/actualiza conversación en BD
→ Crea registro de mensaje
→ Emite WebSocket para actualizaciones en tiempo real
```

### 4. **Envío de Mensajes**
```
Usuario envía mensaje
→ POST /api/messages
→ Aplica anti-detección (delays, límites diarios)
→ Llama sendWhatsAppMessage()
→ Socket Baileys envía por WhatsApp
→ WhatsApp devuelve confirmación
→ Guarda mensaje con estado 'sent'
```

### 5. **Reconexión Automática**
```
Servidor inicia
→ reconnectAllAccounts()
→ Itera sobre todas las cuentas
→ createWhatsAppConnection() para cada una
→ Carga credentials desde ./wa_sessions/
→ Reestablece conexiones activas
```

## 🛡️ Configuración de Almacenamiento

El módulo usa **file-based session storage** para mantener las credenciales:

```
./wa_sessions/
├── ${accountId}/
│   ├── creds.json (credenciales encriptadas)
│   ├── pre-keys/ (pre-keys de WhatsApp)
│   ├── sender-keys/
│   └── ... (otros estados de Baileys)
```

### ⚠️ CRÍTICO: Persistencia de Sessions
- Las credenciales DEBEN persistir entre reinicios
- La carpeta `./wa_sessions/` debe estar fuera de `/tmp/` 
- En caso de pérdida, el usuario debe escanear QR nuevamente
- Implementar respaldo periódico es altamente recomendado

## 🔌 Event Listeners Esenciales

### MUST NOT REMOVE:
1. **connection.update** - Detecta cambios de estado (QR, conexión, desconexión)
2. **connection.error** - Maneja errores de conexión
3. **creds.update** - Guarda credenciales actualizadas
4. **messages.upsert** - Recibe nuevos mensajes

### Otros Listeners:
- `message.update` - Cambios en estado de mensaje (entregado, leído)
- `group-participants.update` - Cambios en grupos
- `presence.update` - Estado de presencia del usuario

## 🐛 Errores Comunes & Soluciones

### Problema: QR no aparece
- **Causa**: Socket no inicializa correctamente
- **Solución**: Verificar que no hay error en `connection.error` handler
- **Debug**: Revisar logs de `console.error()` en whatsapp.ts:177-196

### Problema: Mensajes no se reciben
- **Causa**: Socket desconectado o polling detenido
- **Solución**: Verificar polling cada 5 segundos en connections.tsx:33
- **Debug**: Comprobar status='connected' en BD

### Problema: Sesión corrupta
- **Causa**: Credenciales inválidas o parciales
- **Solución**: Auto-detectado, elimina carpeta ./wa_sessions/${accountId}
- **Debug**: Logs en whatsapp.ts:183-196

### Problema: QR expira cada 60 segundos
- **Causa**: Es normal, Baileys regenera QR automáticamente
- **Solución**: No es un error, usuario debe escanear antes de expiración
- **Improvement**: Aumentar refetchInterval en connections.tsx

## 🔐 Seguridad

- ✅ Credenciales guardadas localmente (file-based)
- ✅ Contraseñas hasheadas con bcrypt en BD de usuarios
- ✅ API con validación Zod en todos los endpoints
- ⚠️ IMPORTANTE: En producción, usar variables de entorno para paths

## 📡 API Endpoints del Módulo

```bash
# Crear conexión (genera QR)
POST /api/whatsapp-accounts
Body: { deviceName: string, accountType: 'normal'|'business', userId: string }

# Obtener cuentas del usuario
GET /api/whatsapp-accounts?userId={userId}

# Cambiar estado (activar/pausar)
PATCH /api/whatsapp-accounts/{accountId}
Body: { isActive: boolean }

# Desconectar y eliminar
DELETE /api/whatsapp-accounts/{accountId}

# Obtener conversaciones
GET /api/conversations?accountId={accountId}

# Enviar mensaje
POST /api/messages
Body: { accountId, toNumber, content, chatbotId?, isManual? }
```

## 📝 Esquema de Base de Datos

### whatsapp_accounts
```sql
id (UUID)
user_id (FK → users)
device_name (string)
account_type ('normal' | 'business')
phone_number (string, nullable)
status ('connected' | 'disconnected' | 'pending')
is_active (boolean)
qr_code (text, nullable - base64 data URL)
auth_state (JSON - Baileys auth state)
last_active (timestamp)
created_at (timestamp)
```

### conversations
```sql
id (UUID)
whatsapp_account_id (FK → whatsapp_accounts)
contact_number (string - limpio)
contact_name (string, nullable)
last_message_text (string)
last_message_time (timestamp)
unread_count (integer)
created_at (timestamp)
```

### messages
```sql
id (UUID)
conversation_id (FK → conversations)
message_id (string - ID único de WhatsApp)
direction ('incoming' | 'outgoing')
content (string)
media_type ('text' | 'image' | 'video' | 'audio' | 'document')
media_url (string, nullable - base64 o URL)
transcription (string, nullable - audio transcription)
status ('sent' | 'delivered' | 'read')
timestamp (timestamp)
created_at (timestamp)
```

## 🚀 Pasos para Restaurar el Módulo

1. **Copiar archivos fuente**:
   ```bash
   cp whatsapp.ts → server/
   cp routes.ts → server/
   cp schema.ts → shared/
   cp storage.ts → server/
   ```

2. **Copiar componentes UI**:
   ```bash
   cp qr-modal.tsx → client/src/components/
   cp connections.tsx → client/src/pages/
   ```

3. **Instalar dependencias**:
   ```bash
   npm install @whiskeysockets/baileys qrcode @tanstack/react-query
   npm install express ws drizzle-orm @neondatabase/serverless
   ```

4. **Configurar rutas en App.tsx**:
   ```tsx
   import ConnectionsPage from "@/pages/connections";
   // Agregar route: <Route path="/connections" component={ConnectionsPage} />
   ```

5. **Verificar almacenamiento de sessions**:
   - Crear carpeta: `mkdir -p ./wa_sessions`
   - Asegurar permisos de lectura/escritura

6. **Reiniciar servidor**:
   ```bash
   npm run dev
   ```

## 🔍 Testing

Para verificar que el módulo funciona:

```bash
# 1. Ir a /connections
# 2. Click "Agregar Cuenta"
# 3. Llenar formulario (deviceName = "Test")
# 4. Click "Generar QR"
# 5. Escanear con WhatsApp en teléfono
# 6. Verificar que aparece "Conectada" en lista
# 7. Enviar mensaje de prueba al número
```

## 📊 Monitoreo

Revisar logs en consola para:
- `WhatsApp connection error for ${accountId}` - Problemas de conexión
- `Received X messages for account ${accountId}` - Mensajes recibidos
- `WhatsApp account ready for receiving messages` - Conexión exitosa

## 📞 Contacto para Issues

Si hay problemas específicos:
1. Revisar logs en consola del servidor
2. Verificar que `./wa_sessions/${accountId}` existe
3. Comprobar que la BD tiene registros en `whatsapp_accounts`
4. Verificar polling en frontend (refetchInterval)
