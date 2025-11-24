# Sistema Completo de Flujo - WhatsApp QR Module

## 🎯 Diagrama General del Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICACIÓN COMPLETA                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────┐          ┌──────────────────────┐   │
│  │   Frontend (React) │          │   Backend (Express)  │   │
│  │                    │          │                      │   │
│  │ - connections.tsx  │◄────────►│ - routes.ts          │   │
│  │ - qr-modal.tsx     │  HTTP    │ - whatsapp.ts        │   │
│  │                    │ WebSocket│ - storage.ts         │   │
│  └────────────────────┘          └──────────────────────┘   │
│          ▲                                  ▲                │
│          │                                  │                │
│          │ TanStack Query                   │ Baileys        │
│          │ (Cache & Polling)                │ (WhatsApp)     │
│          │                                  │                │
└────────┼──────────────────────────────────┼─────────────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        │
              ┌─────────▼──────────┐
              │  PostgreSQL (BD)   │
              │  - users           │
              │  - whatsapp_acc.   │
              │  - conversations   │
              │  - messages        │
              └────────────────────┘
```

---

## 1️⃣ FLUJO: Crear Nueva Conexión (Generar QR)

### Paso 1: Usuario hace clic en "Agregar Cuenta"

```
UI: connections.tsx
  └─ handleAddAccount()
     └─ setQrStep("config")
     └─ setIsQRModalOpen(true)
     └─ Muestra QRModal con formulario
```

### Paso 2: Usuario llena formulario y clickea "Generar QR"

```
QRModal (qr-modal.tsx)
  └─ handleSubmit(data)
     ├─ deviceName: "WhatsApp Ventas"
     ├─ accountType: "normal"
     └─ onSubmit(data) → calls createAccountMutation
```

### Paso 3: Frontend envía POST a backend

```
Frontend: connections.tsx
  └─ createAccountMutation.mutateAsync({
       deviceName: "WhatsApp Ventas",
       accountType: "normal",
       userId: user.id
     })
     
HTTP POST /api/whatsapp-accounts
Body: {
  "deviceName": "WhatsApp Ventas",
  "accountType": "normal",
  "userId": "abc123"
}
```

### Paso 4: Backend crea cuenta y genera QR

```
Backend: routes.ts → POST /api/whatsapp-accounts
  └─ const account = await storage.createWhatsappAccount({
       userId,
       deviceName,
       accountType,
     })
     
     ├─ Crea registro en tabla 'whatsapp_accounts'
     └─ accountId = "xyz789"
     
  └─ const qrCode = await createWhatsAppConnection(accountId)
     
     ├─ whatsapp.ts → createWhatsAppConnection()
     │   ├─ Carga estado de: ./wa_sessions/xyz789/
     │   ├─ makeWASocket({ auth: state })
     │   │   └─ Inicializa socket Baileys
     │   │
     │   └─ socket.ev.on('connection.update', async (update) => {
     │       if (update.qr) {
     │         qrCode = await QRCode.toDataURL(update.qr)
     │         └─ Convierte a base64 PNG
     │         
     │         updateWhatsappAccount(accountId, {
     │           qrCode: "data:image/png;base64,iVBORw0...",
     │           status: "pending"
     │         })
     │       }
     │     })
     │
     └─ return qrCode (data URL)
     
Response: {
  "id": "xyz789",
  "deviceName": "WhatsApp Ventas",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "status": "pending"
}
```

### Paso 5: Frontend recibe QR y lo muestra

```
Frontend: connections.tsx
  └─ onSuccess: (data) => {
       setCurrentQR(data.qrCode)
       setQrStep("qr")  // Cambia a pantalla QR
       queryClient.invalidateQueries(...)  // Refresca lista
     }
     
     └─ QRModal cambia a step="qr"
        └─ <img src={qrCode} /> ← Muestra código QR
```

### Paso 6: Usuario escanea QR con WhatsApp

```
Usuario en teléfono:
  1. Abre WhatsApp
  2. Settings → Linked Devices → Link a Device
  3. Escanea QR con cámara
  4. WhatsApp envía credenciales a Baileys
```

### Paso 7: Baileys recibe confirmación

```
whatsapp.ts → socket.ev.on('connection.update', async (update) => {
  if (update.connection === 'open') {
    ✅ Conexión establecida
    
    const phoneNumber = socket.user?.id.split(':')[0]
    └─ Extrae número: "5491234567890"
    
    await storage.updateWhatsappAccount(accountId, {
      status: 'connected',
      phoneNumber: "5491234567890",
      qrCode: null,  // Limpia QR
      lastActive: new Date(),
    })
    
    activeSessions.set(accountId, {
      socket,
      isConnected: true,
    })
  }
})
```

### Paso 8: Frontend detecta cambio vía polling

```
Frontend: connections.tsx
  └─ useQuery({
       queryKey: [`/api/whatsapp-accounts?userId=${userId}`],
       refetchInterval: 5000,  ← Cada 5 segundos
     })
     
GET /api/whatsapp-accounts?userId=abc123

Response:
[
  {
    "id": "xyz789",
    "status": "connected",  ← Cambió de "pending" a "connected"
    "phoneNumber": "5491234567890",
    "qrCode": null,
    "isActive": true
  }
]

UI actualiza automáticamente:
  - QRModal se cierra
  - Tarjeta de cuenta ahora muestra "Conectada"
  - Número de teléfono visible
```

---

## 2️⃣ FLUJO: Recibir Mensajes

### Paso 1: Usuario envía mensaje a WhatsApp

```
Usuario en teléfono:
  1. Abre chat con número vinculado
  2. Escribe: "Hola, necesito ayuda"
  3. Presiona enviar
```

### Paso 2: WhatsApp envía a Baileys

```
socket.ev.on('messages.upsert', async ({ messages, type }) => {
  ├─ Recibe array de mensajes
  ├─ type: "notify" (nuevo mensaje)
  └─ messages: [
       {
         key: {
           remoteJid: "5491234567890@s.whatsapp.net",
           id: "ABC123XYZ",
           fromMe: false
         },
         message: {
           conversation: "Hola, necesito ayuda"
         },
         pushName: "Juan Pérez",
         messageTimestamp: 1234567890
       }
     ]
})
```

### Paso 3: Backend procesa mensaje

```
whatsapp.ts → messages.upsert handler
  
  1. LIMPIEZA DE DATOS
     ├─ cleanNumber = "5491234567890@s.whatsapp.net"
     │                    .replace('@s.whatsapp.net', '')
     │                    .replace('@g.us', '')
     │  = "5491234567890"
     │
     └─ messageContent = "Hola, necesito ayuda"
  
  2. DEDUPLICACIÓN
     ├─ messageKey = "xyz789:ABC123XYZ"
     ├─ if (recentlyProcessedMessages.has(messageKey)) {
     │    skip  // Evita procesar duplicados
     │  }
     └─ recentlyProcessedMessages.set(messageKey, Date.now())
  
  3. OBTENER O CREAR CONVERSACIÓN
     ├─ const conversations = await storage.getConversationsByAccountId(accountId)
     ├─ let conversation = conversations.find(
     │    c => c.contactNumber === "5491234567890"
     │  )
     │
     ├─ if (!conversation) {
     │    conversation = await storage.createConversation({
     │      whatsappAccountId: "xyz789",
     │      contactNumber: "5491234567890",
     │      contactName: "Juan Pérez",
     │      lastMessageText: "Hola, necesito ayuda",
     │      lastMessageTime: new Date(1234567890 * 1000),
     │    })
     │    └─ BD genera conversation.id = "conv456"
     │  }
     │
     └─ else {
        await storage.updateConversation(conversation.id, {
          lastMessageText: "Hola, necesito ayuda",
          lastMessageTime: new Date(...),
          unreadCount: (conversation.unreadCount || 0) + 1,
        })
      }
  
  4. GUARDAR MENSAJE
     └─ await storage.createMessage({
          conversationId: "conv456",
          messageId: "ABC123XYZ",
          direction: "incoming",
          content: "Hola, necesito ayuda",
          mediaType: "text",
          timestamp: new Date(...),
        })
        └─ BD inserta en tabla 'messages'
           id = "msg789"
```

### Paso 4: Frontend obtiene mensajes vía polling

```
Frontend: En página de conversación
  └─ useQuery({
       queryKey: [`/api/messages/:conversationId`],
       refetchInterval: 3000,
     })
     
GET /api/messages/conv456

Response:
[
  {
    "id": "msg789",
    "content": "Hola, necesito ayuda",
    "direction": "incoming",
    "timestamp": "2024-01-15T10:30:00Z"
  }
]

UI:
  └─ Muestra mensaje en chat:
     ┌──────────────────────────┐
     │ Hola, necesito ayuda     │
     │ 10:30 AM                 │
     └──────────────────────────┘
```

---

## 3️⃣ FLUJO: Enviar Mensajes

### Paso 1: Usuario escribe y envía

```
Frontend: Componente de chat
  └─ Escribe: "¿En qué puedo ayudarte?"
     └─ Click en botón "Enviar"
```

### Paso 2: Frontend envía POST

```
Frontend: Componente de chat
  └─ apiRequest("POST", "/api/messages", {
       accountId: "xyz789",
       toNumber: "5491234567890",
       content: "¿En qué puedo ayudarte?",
       isManual: true
     })

POST /api/messages
Body: {
  "accountId": "xyz789",
  "toNumber": "5491234567890",
  "content": "¿En qué puedo ayudarte?",
  "isManual": true
}
```

### Paso 3: Backend valida y envía

```
Backend: routes.ts → POST /api/messages
  
  1. VALIDACIÓN
     └─ if (!accountId || !toNumber || !content) error
  
  2. ANTI-DETECCIÓN (si es chatbot)
     ├─ if (!isManual && chatbotId) {
     │    delayMs = calculateTypingTime(content.length)
     │    └─ Simula tiempo de tipeo
     │    
     │    await addRandomDelay(minDelay, maxDelay)
     │    └─ Espera 2-8 segundos aleatoriamente
     │  }
  
  3. ENVIAR MENSAJE VÍA BAILEYS
     └─ await sendWhatsAppMessage(accountId, toNumber, content)
        
        whatsapp.ts:
          const session = activeSessions.get(accountId)
          const jid = "5491234567890@s.whatsapp.net"
          await session.socket.sendMessage(jid, {
            text: "¿En qué puedo ayudarte?"
          })
        
        Baileys envía a WhatsApp
  
  4. CREAR CONVERSACIÓN SI NO EXISTE
     ├─ let conversation = conversations.find(...)
     └─ if (!conversation) {
          await storage.createConversation(...)
        }
  
  5. ACTUALIZAR CONVERSACIÓN
     └─ await storage.updateConversation(conversation.id, {
          lastMessageText: "¿En qué puedo ayudarte?",
          lastMessageTime: new Date(),
        })

Response:
{
  "id": "temp-1234567890",
  "conversationId": "conv456",
  "content": "¿En qué puedo ayudarte?",
  "direction": "outgoing",
  "status": "sending",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### Paso 4: WhatsApp devuelve confirmación

```
Baileys recibe confirmación de WhatsApp:
  └─ socket.ev.on('message.update', (update) => {
       ├─ message.id = "ABC123XYZ"
       ├─ status = "read"
       └─ Update BD con nuevo estado
     })
```

### Paso 5: Frontend actualiza estado

```
Frontend: useQuery polling
  └─ Detecta que mensaje ahora tiene status: "delivered" o "read"
     └─ UI muestra checkmark ✓✓ (doble tilde)
```

---

## 4️⃣ FLUJO: Reconexión Automática

### En el arranque del servidor:

```
Backend: server/routes.ts
  └─ registerRoutes(app)
     └─ reconnectAllAccounts()
        
        whatsapp.ts:
          async function reconnectAllAccounts() {
            const allAccounts = await storage.getAllWhatsappAccounts()
            
            allAccounts.forEach(account => {
              if (account.status === 'connected') {
                await createWhatsAppConnection(account.id)
                └─ Carga ./wa_sessions/${account.id}/
                └─ Reconecta automáticamente
              }
            })
          }
```

---

## 🔄 FLUJO: Actualizar Estado (Pausar/Activar)

### Usuario pausar una cuenta:

```
Frontend: connections.tsx
  └─ onClick={() => toggleAccountMutation.mutate(accountId)}
     └─ PATCH /api/whatsapp-accounts/xyz789
        Body: { isActive: false }

Backend: routes.ts
  └─ await storage.updateWhatsappAccount(accountId, { isActive: false })
  
  ├─ Socket Baileys sigue conectado
  ├─ Pero frontend no enviará mensajes
  └─ Mensajes recibidos se guardan pero no se procesan
```

---

## 🗑️ FLUJO: Desconectar Completamente

### Usuario elimina una cuenta:

```
Frontend: connections.tsx
  └─ onClick={() => disconnectMutation.mutate(accountId)}
     └─ DELETE /api/whatsapp-accounts/xyz789

Backend: routes.ts → DELETE /api/whatsapp-accounts/:id
  
  1. DESCONECTAR BAILEYS
     └─ await disconnectWhatsApp(accountId)
        whatsapp.ts:
          const session = activeSessions.get(accountId)
          await session.socket.logout()
          activeSessions.delete(accountId)
  
  2. ELIMINAR CREDENCIALES
     └─ rm -rf ./wa_sessions/xyz789/
  
  3. ELIMINAR DE BD
     └─ await storage.deleteWhatsappAccount(accountId)
        ├─ Elimina conversations (cascada)
        ├─ Elimina messages (cascada)
        └─ Elimina whatsapp_accounts

Response: { "success": true }
```

---

## 🗄️ Estructura de Datos en Base de Datos

### Tabla: whatsapp_accounts
```
id: uuid (xyz789)
user_id: uuid (abc123)
device_name: string ("WhatsApp Ventas")
account_type: string ("normal" | "business")
phone_number: string ("5491234567890")
status: string ("connected" | "disconnected" | "pending")
is_active: boolean (true)
qr_code: text (base64 URL)
auth_state: json (credenciales encriptadas)
last_active: timestamp (2024-01-15 10:35:00)
created_at: timestamp (2024-01-15 10:00:00)
```

### Tabla: conversations
```
id: uuid (conv456)
whatsapp_account_id: uuid (xyz789)
contact_number: string ("5491234567890")
contact_name: string ("Juan Pérez")
last_message_text: string ("¿En qué puedo ayudarte?")
last_message_time: timestamp (2024-01-15 10:35:00)
unread_count: integer (0)
created_at: timestamp (2024-01-15 10:25:00)
```

### Tabla: messages
```
id: uuid (msg789)
conversation_id: uuid (conv456)
message_id: string ("ABC123XYZ")
direction: string ("incoming" | "outgoing")
content: string ("¿En qué puedo ayudarte?")
media_type: string ("text" | "image" | "video" | "audio")
media_url: text (null | base64)
status: string ("sent" | "delivered" | "read")
timestamp: timestamp (2024-01-15 10:35:00)
created_at: timestamp (2024-01-15 10:35:00)
```

---

## ⚡ Performance & Optimizaciones

### Polling en Frontend
```
refetchInterval: 5000  // Cada 5 segundos
retry: 1              // Solo 1 reintento

Beneficio: Detecta cambios casi en tiempo real
Costo: +1 request cada 5 segundos por usuario
```

### Deduplicación en Backend
```
recentlyProcessedMessages = Map<string, number>
TTL: 30 segundos

Beneficio: Evita procesar mensajes duplicados
Costo: ~1KB de memoria por 100 mensajes
```

### Session Storage File-based
```
./wa_sessions/${accountId}/
  ├─ creds.json
  ├─ pre-keys/
  └─ sender-keys/

Beneficio: Persiste credenciales entre reinicios
Costo: ~10-50KB por sesión en disco
```

---

## 🚨 Flujo de Manejo de Errores

```
Error: "WhatsApp connection error for xyz789"
  ├─ socket.ev.on('connection.error', async (error) => {
  │    ├─ Elimina carpeta ./wa_sessions/xyz789/
  │    ├─ Actualiza BD: status = 'disconnected'
  │    └─ Usuario debe escanear QR nuevamente
  │  })
  
Error: "Socket creation failed"
  ├─ try-catch en createWhatsAppConnection()
  │    ├─ Elimina sesión corrupta
  │    ├─ Actualiza BD: status = 'disconnected'
  │    └─ Retorna error al frontend
  │  })

Error: "Message send failed"
  ├─ catch en sendWhatsAppMessage()
     ├─ Verifica que socket esté activo
     ├─ Retorna error detallado
     └─ Frontend muestra toast error
```

---

## 📊 Relaciones en Base de Datos

```
users (1) ──────────> (N) whatsapp_accounts
          userId

whatsapp_accounts (1) ──────────> (N) conversations
                      accountId

conversations (1) ──────────> (N) messages
             conversationId
```

---

## 🎯 Resumen de Endpoints Utilizados

```
POST   /api/whatsapp-accounts          → Crear conexión
GET    /api/whatsapp-accounts          → Obtener cuentas (polling)
PATCH  /api/whatsapp-accounts/:id      → Pausar/Activar
DELETE /api/whatsapp-accounts/:id      → Desconectar

GET    /api/conversations              → Obtener conversaciones
GET    /api/messages/:conversationId   → Obtener mensajes (polling)
POST   /api/messages                   → Enviar mensaje
```

---

## 💾 Almacenamiento de Archivos

```
./wa_sessions/
├── xyz789/                          ← accountId
│   ├── creds.json                  (credenciales)
│   ├── pre-keys/
│   │   └── 1.json
│   ├── sender-keys/
│   │   ├── 5491234567890@s.w...
│   │   └── ...
│   └── app-state-sync-key-encoded/
│       └── ...
│
└── abc456/                          ← otra cuenta
    └── creds.json
```

**Importancia**: Si se pierden estos archivos, el usuario debe escanear QR nuevamente. Hacer backup regularmente es recomendado.

---

Fin del documento de flujo completo del sistema.
