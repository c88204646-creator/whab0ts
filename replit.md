# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It aims to provide businesses with tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, running promotional raffles, and analyzing sales funnels. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management, a simplified CRM, a robust raffle management system, and an advanced Sales Funnel analytics dashboard with automatic chat classification. The platform also includes a Help Widget (estilo Intercom) for user support and learning. The platform is built for efficiency, real-time interaction, and a professional user experience.

## Recent Changes
- **Nov 23, 2025 - COMPLETADO**: Rediseño de Rifas a Tabla Profesional
  - ✅ Conversión de grid de cards compactos a tabla profesional (como encuestas)
  - ✅ Columnas: Título, Descripción, Boletos, Precio, Estado, Acciones
  - ✅ Avatar con iniciales de título para cada rifa
  - ✅ Estado con badges de color (Borrador, Activa, Cerrada, Finalizada)
  - ✅ Indicador "En línea" cuando rifa está publicada
  - ✅ Hover effects y alternancia de filas para mejor legibilidad
  - ✅ Acciones consistentes: Ver, Copiar, Publicar, Eliminar
  - ✅ Base de datos: Agregadas tablas raffle_customers + columna whatsapp_contact_number

- **Nov 23, 2025 - ANTERIOR**: Transcripción Automática de Audios + Fixes Críticos
  - ✅ Transcripción de audios con modelo Xenova/Whisper-Tiny (open source, sin IA, local)
  - ✅ Transcripción mostrada en el chat debajo del audio con formato limpio
  - ✅ Agregar columna `transcription` a tabla messages en PostgreSQL
  - ✅ Stickers ahora visibles en el chat (visibilidad correcta, tamaño reducido max-h-32)
  - ✅ Eliminación de mensajes automáticos duplicados del chatbot
  - ✅ Aumento de deduplicación de mensajes: 5s → 30s (evita re-procesar)
  - ✅ Chatbot NO envía respuesta automática si no hay regla o KB match (evita spam/detección)
  - ✅ Módulo: server/audio-transcription.ts
  - ✅ Integración en whatsapp.ts para procesar audioMessage

- **Nov 23, 2025 - ANTERIOR**: Help Widget estilo Intercom para soporte y documentación
  - ✅ Agregadas tablas PostgreSQL: chat_classification_rules y chat_classification_results
  - ✅ Motor de clasificación open source lightweight sin dependencias pesadas
  - ✅ Engine de análisis: detecta categorías (sales, support, complaint, vip, inquiry)
  - ✅ Scoring automático: palabras clave + patrones regex + confianza (0-100)

## User Preferences
- Idioma: Español
- Modo: Dark mode exclusivo
- Diseño: Compacto y profesional
- Fechas: Formato datetime para calendario
- Integración: WhatsApp con validación de números en tiempo real
- Validación: País selector + número manual + validación en tiempo real
- Funcionalidad: Real (sin simulaciones)
- CRM: Simplificado a Clientes y Leads
- Analytics: Sales Funnel con clasificación automática de chats
- Support: Help Widget sin IA para documentación

## System Architecture
The platform is structured around a modular design, enabling independent development and deployment of features like CRM, Calendar, Surveys, Raffles, Sales Funnel Analytics, and Help Widget.

### UI/UX Decisions
- **Frontend Framework**: React with TypeScript.
- **Routing**: Wouter.
- **Components**: Shadcn/UI for a consistent and professional look.
- **Styling**: Exclusive dark mode with a compact interface.
- **List Layouts**: Professional table design for Surveys, Raffles, and other management modules
- **Help Widget**: Floating Intercom-style widget with search and KB articles
- **Analytics**: Sales Funnel module with automatic chat classification and visualization

### Technical Implementations
- **Real-time Communication**: WebSocket for instant updates with proper queryKey cache invalidation.
- **Data Fetching**: TanStack React Query with hierarchical queryKeys for proper cache management.
- **Validation**: Zod for schema validation.
- **Help/Support**: Client-side widget with hardcoded KB articles (no server calls needed)
- **Audio Transcription**: Xenova/Whisper-Tiny (open source model running locally, NO API calls needed, ~13ms for tiny model)
  - Transcribes audio messages from WhatsApp (ogg, mp3, wav formats supported)
  - Transcription saved to database and displayed in chat
  - Async transcription in background (doesn't block message save)
  - Spanish language optimized
  - First load initializes model cache (~1-2 minutes on first use only)
- **Live Chat Widget**: Independent chatbot system for sales funnels, featuring sequential conversation flow for lead capture, product selection, and real-time appointment booking with calendar availability checks.
- **Calendar Module**: Visual monthly grid, country selector with real-time WhatsApp number validation, event indicators, and detailed event management (create, edit, delete, status).
- **Surveys Module**: Public URLs for responding and viewing results, custom DatePicker, and real-time statistics.
- **Raffles Module**: 
  - Professional table-based management interface (matches surveys layout)
  - Complete raffle management system with independent financial controls per raffle
  - raffle_customers table for tracking customer registrations and ticket purchases
  - WhatsApp contact number configuration for automated ticket confirmations
- **Sales Funnel Module**: 
  - Automatic chat classification using lightweight open source NLP patterns
  - Default categories: sales, support, complaint, vip, inquiry, other
  - Keyword matching and regex pattern recognition
  - Confidence scoring (0-100)
  - Visualization: funnel chart showing chat distribution by category
  - Real-time classification as messages arrive
- **Media Support**: Stickers, images, audio, video, documents with proper size constraints

### Feature Specifications
- **WhatsApp Module**: Account management, conversations, AI chatbots, knowledge base, and integrated calendar.
- **CRM Module**: Simplified Clients and Leads management.
- **Raffles Module**: Complete with creation, management, public sales pages, and payment verification. Each raffle has financial controls and ticket management.
- **Sales Funnel Module**: Analytics dashboard for analyzing customer interactions by type
- **Help Widget Module**: 
  - Intercom-style floating widget (bottom-right corner)
  - 12 pre-loaded help articles
  - Real-time search across article content, titles, and keywords
  - Categorized by module (conversations, chatbots, calendar, surveys, raffles, crm, analytics, general)
  - Responsive and mobile-friendly
  - No server dependency (fully client-side)
- **Facebook Module (Hidden)**: Account management and automation infrastructure (pending full automation implementation).

### System Design Choices
- **Backend**: Express.js with proper error handling and validation.
- **ORM**: Drizzle ORM with TypeScript for type safety.
- **Database**: PostgreSQL (Neon) with established relationships and indexing for efficient queries.
- **Session Management**: Custom session system with real-time synchronization via WebSocket.
- **API Routes**: RESTful endpoints with public and authenticated variants for cross-platform access.
- **Help/KB System**: Embeddable widgets with hardcoded content for zero-latency user support

## External Dependencies
- **Database**: PostgreSQL (specifically Neon for cloud deployment).
- **Cloud Services**: No explicit cloud provider mentioned for general hosting, but Neon implies a cloud-hosted PostgreSQL.
- **Authentication**: Custom session-based authentication.
- **Third-party APIs**:
    - WhatsApp API (Baileys for local WhatsApp connection simulation and message handling).
    - Facebook Graph API (implied for Facebook module, currently pending deeper integration).
    - Payment Gateway (implied for Raffle module payment verification, but specific provider not named).

## WhatsApp QR Generation & Device Linking - Complete Technical Flow

### Overview
This is a critical feature that allows users to add new WhatsApp accounts via QR code scanning. The flow involves frontend UI interaction, backend Baileys integration, database persistence, and WebSocket polling for real-time status updates.

### Complete Flow Diagram

```
User clicks "Agregar Cuenta"
  ↓
QRModal opens (step: "config")
  ↓
User fills: deviceName, accountType (normal/business)
  ↓
User clicks "Generar QR"
  ↓
Frontend: POST /api/whatsapp-accounts {deviceName, accountType, userId}
  ↓
Backend: Creates WhatsappAccount in DB with status='pending'
  ↓
Backend: Calls createWhatsAppConnection(accountId)
  ↓
Baileys: useMultiFileAuthState(`./wa_sessions/${accountId}`) loads/creates session
  ↓
Baileys: makeWASocket() creates WebSocket connection
  ↓
Baileys: Generates QR and emits 'connection.update' event with qr data
  ↓
Backend: Converts QR to Data URL using qrcode.toDataURL(qr)
  ↓
Backend: Updates WhatsappAccount with qrCode, status='pending'
  ↓
Backend: Returns account to frontend with qrCode in response
  ↓
Frontend: QRModal switches to step "qr", displays QR image
  ↓
User: Scans QR with WhatsApp on phone
  ↓
Baileys: Emits 'connection.update' with connection='open'
  ↓
Backend: Updates WhatsappAccount with status='connected', phoneNumber
  ↓
Frontend: Polls /api/whatsapp-accounts every 5 seconds (refetchInterval)
  ↓
Frontend: Detects status change to 'connected'
  ↓
UI: Shows connected status with phone number
```

### Key Files & Their Roles

#### 1. **Frontend - Device Connection UI**
- **File**: `client/src/pages/connections.tsx`
- **Lines**: 1-345
- **Key Functions**:
  - `handleAddAccount()`: Opens QR modal with step='config'
  - `handleConfigSubmit()`: Calls `createAccountMutation.mutateAsync()`
  - `createAccountMutation`: POST to `/api/whatsapp-accounts`, gets back account with qrCode
  - Query polling: `refetchInterval: 5000` checks for status changes every 5 seconds
- **Critical Code**:
  ```typescript
  const { data: accounts = [], isLoading } = useQuery<WhatsappAccount[]>({
    queryKey: [`/api/whatsapp-accounts?userId=${userId}`],
    enabled: !!userId,
    refetchInterval: 5000,  // CRITICAL: Polls for connection status
    retry: 1,
  });
  
  const createAccountMutation = useMutation({
    mutationFn: async (data) => {
      return apiRequest("POST", "/api/whatsapp-accounts", {
        ...data,
        userId: user.id,
      });
    },
    onSuccess: (data) => {
      setCurrentQR(data.qrCode);  // Store QR to display
      setQrStep("qr");             // Switch to QR display step
      queryClient.invalidateQueries({ 
        queryKey: [`/api/whatsapp-accounts?userId=${userId}`] 
      });
    },
  });
  ```
- **What Can Go Wrong**:
  - If `refetchInterval` is removed or set too high, status won't update quickly
  - If `queryClient.invalidateQueries()` is removed, frontend won't refresh the account list

#### 2. **Frontend - QR Modal Component**
- **File**: `client/src/components/qr-modal.tsx`
- **Lines**: 1-210
- **Key Props**:
  - `open`: Controls if modal is visible
  - `step`: "config" (form) or "qr" (display QR code)
  - `qrCode`: Data URL string of QR image to display
  - `onSubmit`: Callback when user submits device config
- **Critical Code**:
  ```typescript
  {step === "config" ? (
    // Device name + account type selection form
  ) : (
    // QR code display
    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
  )}
  ```
- **What Can Go Wrong**:
  - If `qrCode` is not passed as Data URL string, image won't render
  - If modal doesn't clear when closed, cached QR might show in next session

#### 3. **Backend - API Route Handler**
- **File**: `server/routes.ts`
- **Lines**: 222-239
- **Endpoint**: `POST /api/whatsapp-accounts`
- **Critical Code**:
  ```typescript
  app.post("/api/whatsapp-accounts", async (req: Request, res: Response) => {
    const { deviceName, accountType, userId } = req.body;
    
    // 1. Create account in database with initial status
    const account = await storage.createWhatsappAccount({
      userId: userId || "demo-user-id",
      deviceName,
      accountType,
    });
    
    // 2. Start WhatsApp connection and generate QR
    const qrCode = await createWhatsAppConnection(account.id);
    
    // 3. Return account with QR immediately
    res.json({ ...account, qrCode });
  });
  ```
- **Flow**:
  1. Creates WhatsappAccount entry in database (status defaults to "disconnected")
  2. Calls `createWhatsAppConnection()` which updates status to "pending" when QR is generated
  3. Returns account object with QR code to frontend
- **What Can Go Wrong**:
  - If account creation fails, entire request fails
  - If `createWhatsAppConnection()` throws error, user doesn't get QR
  - If response is sent before QR is generated, frontend gets `qrCode: undefined`

#### 4. **Backend - Baileys Connection Manager**
- **File**: `server/whatsapp.ts`
- **Lines**: 171-266
- **Main Function**: `createWhatsAppConnection(accountId: string): Promise<string>`
- **Critical Code Flow**:
  ```typescript
  export async function createWhatsAppConnection(accountId: string): Promise<string> {
    // 1. Load Baileys auth state from file system
    const { state, saveCreds } = await useMultiFileAuthState(`./wa_sessions/${accountId}`);
    
    // 2. Create Baileys socket
    let socket: WASocket;
    socket = makeWASocket({ auth: state, printQRInTerminal: false });
    
    // 3. Handle connection errors - clean up corrupted session
    socket.ev.on('connection.error', async (error) => {
      try {
        const fs = require('fs').promises;
        await fs.rm(`./wa_sessions/${accountId}`, { recursive: true, force: true });
      } catch (fsError) {
        console.error(`Error deleting session directory: ${fsError}`);
      }
      await storage.updateWhatsappAccount(accountId, {
        status: 'disconnected',
        qrCode: null,
      });
      activeSessions.delete(accountId);
    });
    
    // 4. Handle QR generation
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        // Convert to Data URL
        qrCodeData = await QRCode.toDataURL(qr);
        
        // Update database
        await storage.updateWhatsappAccount(accountId, {
          qrCode: qrCodeData,
          status: 'pending',
        });
      }
      
      if (connection === 'open') {
        const phoneNumber = socket.user?.id.split(':')[0];
        
        // Connected successfully
        await storage.updateWhatsappAccount(accountId, {
          status: 'connected',
          phoneNumber: phoneNumber || null,
          qrCode: null,  // Clear QR after successful connection
          lastActive: new Date(),
        });
        
        activeSessions.set(accountId, {
          socket,
          isConnected: true,
        });
      }
    });
    
    // 5. Save credentials whenever they update
    socket.ev.on('creds.update', saveCreds);
    
    return qrCodeData;
  }
  ```
- **Session Storage** (`./wa_sessions/${accountId}/`):
  - `creds.json`: Baileys authentication credentials
  - `app-state-sync-*.json`: WhatsApp app state files
  - `pre-key-*.json`: Cryptographic pre-keys
  - `device-list-*.json`: Device list from WhatsApp
  - `lid-mapping-*.json`: WhatsApp ID mappings
- **Critical Behaviors**:
  - Session must persist on disk or connection is lost on server restart
  - If session is corrupted, it's deleted and user must scan QR again
  - Credentials are auto-saved on `creds.update` event
  - Only status='connected' accounts remain in `activeSessions` Map
- **What Can Go Wrong**:
  - If `saveCreds` callback is removed, credentials won't persist and connection breaks
  - If session directory gets deleted, account must re-scan QR
  - If socket error handling doesn't clean up, corrupted session might persist
  - If `QRCode.toDataURL()` fails, QR won't be generated

#### 5. **Database Schema**
- **File**: `shared/schema.ts`
- **Lines**: 15-27
- **Critical Fields**:
  ```typescript
  export const whatsappAccounts = pgTable("whatsapp_accounts", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    deviceName: text("device_name").notNull(),
    accountType: text("account_type").notNull(), // 'normal' | 'business'
    phoneNumber: text("phone_number"),           // Populated after connection
    status: text("status").notNull().default("disconnected"), // 'connected' | 'disconnected' | 'pending'
    isActive: boolean("is_active").default(true),
    qrCode: text("qr_code"),                     // Data URL of QR image
    authState: jsonb("auth_state"),              // Baileys auth state (rarely used)
    lastActive: timestamp("last_active"),        // Last time account was active
    createdAt: timestamp("created_at").defaultNow(),
  });
  ```
- **Status Values**:
  - `disconnected`: Initial state or manually disconnected
  - `pending`: QR generated, waiting for user to scan
  - `connected`: Successfully connected to WhatsApp
- **What Can Go Wrong**:
  - If `qrCode` field stores incorrect format, image won't render
  - If `status` is not updated correctly, frontend polling won't detect connection
  - If `phoneNumber` is null after connection, UI won't show it

#### 6. **Storage Interface**
- **File**: `server/storage.ts`
- **Lines**: 215-220
- **Key Methods**:
  ```typescript
  async getWhatsappAccount(id: string)
  async getWhatsappAccountsByUserId(userId: string)
  async createWhatsappAccount(account: InsertWhatsappAccount)
  async updateWhatsappAccount(id: string, data: Partial<WhatsappAccount>)
  async deleteWhatsappAccount(id: string)
  ```
- **Implementation** (DatabaseStorage):
  ```typescript
  async createWhatsappAccount(account: InsertWhatsappAccount) {
    const [a] = await db.insert(whatsappAccounts).values(account).returning();
    return a;
  }
  
  async updateWhatsappAccount(id: string, data: Partial<WhatsappAccount>) {
    const [a] = await db.update(whatsappAccounts).set(data).where(eq(whatsappAccounts.id, id)).returning();
    return a;
  }
  ```

### Critical Points to Avoid Future Errors

#### 1. **Session Directory Management**
- Sessions are stored in `./wa_sessions/${accountId}/` on the server
- Must persist across server restarts (stored on file system, not in-memory)
- If directory is missing/corrupted, delete it and user must scan QR again
- Session directory is automatically created by `useMultiFileAuthState()`

#### 2. **QR Code Data Format**
- QR is generated by Baileys as a string
- MUST be converted to Data URL using `QRCode.toDataURL(qr)` for display
- Stored in database as text (Data URL string)
- Frontend displays as: `<img src={qrCode} />` where qrCode is the Data URL

#### 3. **Status Transitions**
- **disconnected** → **pending**: When QR is generated (automatic in createWhatsAppConnection)
- **pending** → **connected**: When user scans QR and Baileys emits 'open' event
- **connected** → **disconnected**: When user deletes account or connection fails
- Frontend ONLY shows QR in "pending" state
- Frontend detects connection via polling with `refetchInterval: 5000`

#### 4. **Database Consistency**
- `createWhatsappAccount()` creates entry with default status='disconnected'
- `createWhatsAppConnection()` updates status to 'pending' when QR is generated
- Status MUST be updated in DB for frontend polling to work
- If `updateWhatsappAccount()` is not called, status stays "disconnected" and connection won't be detected

#### 5. **Event Listeners**
- `socket.ev.on('connection.update', ...)`: Handles QR, connection open/close
- `socket.ev.on('connection.error', ...)`: Handles connection errors, cleans up
- `socket.ev.on('creds.update', saveCreds)`: MUST be registered or credentials are lost
- `socket.ev.on('messages.upsert', ...)`: Handles incoming messages

#### 6. **Error Recovery**
- If Baileys socket fails to create (corrupted session), catch it and delete directory
- If connection.error is emitted, delete session and update status to 'disconnected'
- If QR generation fails, update account with status='disconnected', qrCode=null

#### 7. **Frontend Polling**
- Must set `refetchInterval: 5000` to check for status changes
- Must invalidate query cache after mutation: `queryClient.invalidateQueries()`
- Must switch modal step from "config" to "qr" only after QRCode is received
- Must handle qrCode being undefined while generating

#### 8. **Multi-Account Handling**
- Each account gets unique UUID `accountId`
- Each account has separate session directory: `./wa_sessions/${accountId}/`
- Each account gets separate Baileys socket
- All sockets stored in `activeSessions` Map keyed by accountId

### Common Failure Scenarios & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| QR never appears | `createWhatsAppConnection()` not awaited or fails | Ensure POST returns qrCode, check server logs |
| QR appears but doesn't connect | QR is old/expired or socket error | QR expires ~60s, user needs to re-scan |
| Connection shows pending forever | Frontend polling disabled or status not updated | Check `refetchInterval: 5000` is set |
| Phone number not showing after connection | `phoneNumber` field not populated | Ensure `socket.user?.id.split(':')[0]` is extracted and saved |
| Session persists after disconnect | `./wa_sessions/` directory not deleted | Manually delete directory if needed |
| Multiple QRs generated for one account | Socket created multiple times | Ensure account creation is atomic, socket not recreated |

### Dependencies & Libraries

- **Baileys**: `@whiskeysockets/baileys` - WhatsApp connection library
- **QR Code**: `qrcode` - Converts QR data to Data URL
- **Drizzle ORM**: `drizzle-orm` - Database access
- **TanStack Query**: `@tanstack/react-query` - Frontend caching and polling
- **React Hook Form**: `react-hook-form` - Form validation and submission

### Testing the Feature

1. **Add Account**:
   - Click "Agregar Cuenta"
   - Enter device name, select account type
   - Click "Generar QR"
   - QR should appear in modal

2. **Scan QR**:
   - Scan QR with WhatsApp on phone
   - Watch server logs for 'connection.update' events
   - Wait for 'open' connection status

3. **Verify Connection**:
   - Check phone number appears in account card
   - Check status shows "Conectada"
   - Verify `phoneNumber` column in database is populated

4. **Session Persistence**:
   - Restart server
   - Account should still show "Conectada"
   - Session directory should still exist in `./wa_sessions/`

### Important: What NOT to Change

- **NEVER** remove `socket.ev.on('creds.update', saveCreds)` line
- **NEVER** change session path from `./wa_sessions/${accountId}`
- **NEVER** remove the `connection.error` event listener and cleanup
- **NEVER** set `refetchInterval` to null or very high value (>30000)
- **NEVER** change how QRCode.toDataURL() is used for encoding
- **NEVER** store QR as base64 without 'data:image/png;base64,' prefix

---

## Module Status

### ✅ Completed Modules
- **WhatsApp Conversations**: Real-time message sync, full conversation management
- **Chatbots**: Rule-based chatbot system with knowledge base + RAG AI enhancement
- **Calendar**: Event management with date selection
- **Surveys**: Public survey creation and response collection with analytics
- **Custom Domains**: DNS verification for custom domain linking
- **Raffles**: Complete raffle system with financial controls
- **Sales Funnel**: Automatic chat classification and funnel analytics
- **Help Widget**: Intercom-style floating support widget with KB articles

### 🔄 In Progress Modules
- Facebook automation (infrastructure ready)

### 📋 Pending Modules
- Advanced payment gateway integration (Stripe recommended)
- Ticket fulfillment system
- Email notification system
- Sales Funnel: Customizable rules UI (backend ready)
