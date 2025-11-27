# 📋 Base de Datos - Documentación Completa de Tablas

**Última actualización:** 27 de Noviembre de 2025  
**Total de tablas:** 59  
**Status:** Backup automático - Mantener sincronizado con `shared/schema.ts`

---

## 📑 Índice de Módulos

1. [🔐 Autenticación & Usuarios](#autenticación--usuarios)
2. [💬 WhatsApp & Mensajes](#whatsapp--mensajes)
3. [👥 CRM - Clientes & Leads](#crm---clientes--leads)
4. [📅 Calendario](#calendario)
5. [📊 Encuestas](#encuestas)
6. [🏪 E-Commerce & Tienda](#e-commerce--tienda)
7. [🎰 Rifas](#rifas)
8. [💰 Banca](#banca)
9. [👨‍💼 Equipos](#equipos)
10. [🤖 IA - Asistentes y Voz](#ia---asistentes-y-voz)
11. [📱 Chat Web](#chat-web)
12. [✅ Tareas & Kanban](#tareas--kanban)
13. [🎙️ Notas & Pizarra](#notas--pizarra)
14. [📢 Notificaciones & Roles](#notificaciones--roles)
15. [🔗 Clasificación de Chat](#clasificación-de-chat)
16. [👁️ Ayuda](#ayuda)

---

## 🔐 Autenticación & Usuarios

### `users`
```
Campos principales:
- id (UUID, PK)
- email (UNIQUE)
- password (encrypted)
- name
- createdAt

Relaciones: Has many whatsappAccounts, bankAccounts, aiProviders
Módulo: Autenticación
```

---

## 💬 WhatsApp & Mensajes

### `whatsapp_accounts`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- deviceName
- accountType ('normal' | 'business')
- phoneNumber
- status ('connected' | 'disconnected' | 'pending')
- isActive (boolean)
- qrCode
- authState (JSONB - Baileys)
- lastActive

Relaciones: Belongs to user, Has many conversations
Módulo: WhatsApp
Notas: Almacena credenciales de Baileys
```

### `conversations`
```
Campos principales:
- id (UUID, PK)
- whatsappAccountId (FK → whatsappAccounts)
- contactNumber
- contactName
- lastMessageText
- lastMessageTime
- unreadCount
- category ('general' | 'sales' | 'support' | 'vip' | 'other')
- tags (array)
- priority ('low' | 'normal' | 'high' | 'urgent')
- status ('active' | 'archived' | 'spam' | 'blocked')
- notes
- isPinned (boolean)
- isStarred (boolean)
- createdAt

Relaciones: Belongs to whatsappAccount, Has many messages
Módulo: WhatsApp & CRM
Uso: Gestión centralizada de conversaciones
```

### `messages`
```
Campos principales:
- id (UUID, PK)
- conversationId (FK → conversations)
- messageId (text - WhatsApp ID)
- direction ('incoming' | 'outgoing')
- content
- mediaType ('text' | 'image' | 'video' | 'audio' | 'document')
- mediaUrl
- transcription
- status ('sent' | 'delivered' | 'read')
- timestamp
- createdAt

Relaciones: Belongs to conversation
Módulo: WhatsApp
Notas: Incluye transcripción de audio
```

---

## 👥 CRM - Clientes & Leads

### `clients`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- firstName, lastName
- email, phone
- company, address, city
- postalCode, country
- notes
- status ('active' | 'inactive' | 'potential')
- currency ('MXN' | 'USD' | 'ARS' | 'EUR' | 'COP' | 'CLP' | 'PEN' | 'BRL')
- createdAt, updatedAt

Relaciones: Belongs to user
Módulo: CRM
Uso: Base de datos de clientes
```

### `leads`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- firstName, lastName
- email, phone
- company
- source ('website' | 'referral' | 'whatsapp' | 'other')
- notes
- status ('new' | 'contacted' | 'qualified' | 'lost')
- value (int - cents)
- currency (MXN por defecto)
- createdAt, updatedAt

Relaciones: Belongs to user
Módulo: CRM
Uso: Pipeline de ventas
```

---

## 📅 Calendario

### `calendar_events`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- clientId (FK → clients, nullable)
- leadId (FK → leads, nullable)
- title, description
- startTime, endTime
- contactName, contactPhone, email
- status ('pending' | 'confirmed' | 'cancelled')
- isActive (boolean)
- isPublicBooking (boolean)
- createdByUserId (FK → users)
- lastModifiedByUserId (FK → users)
- createdAt

Relaciones: Belongs to user, client, lead
Módulo: Calendario
Uso: Eventos y citas
```

### `calendar_availability`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- dayOfWeek (0-6)
- startTime ('HH:MM')
- endTime ('HH:MM')
- isActive (boolean)
- createdAt

Módulo: Calendario
Uso: Horarios disponibles para reservas
```

### `calendar_config`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- isPublicBookingEnabled (boolean)
- isActive (boolean)
- eventDurationMinutes (default: 60)
- publicShareToken (UNIQUE)
- businessName, businessDescription
- timeZone ('America/Mexico_City' por defecto)
- createdAt, updatedAt

Módulo: Calendario
Uso: Configuración de reservas públicas
```

### `calendar_link_stats`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- publicShareToken (UNIQUE)
- timesShared, timesVisited
- bookingsCompleted
- totalMinutesBooked
- averageMinutesPerBooking
- peakBookingDay
- returnVisitorCount
- conversionRate (0-100%)
- lastSharedAt, lastVisitedAt, lastBookedAt
- createdAt, updatedAt

Módulo: Calendario
Uso: Análisis de reservas públicas
```

### `calendar_analytics_history`
```
Campos principales:
- id (UUID, PK)
- publicShareToken
- date ('YYYY-MM-DD')
- visitas, reservas
- createdAt

Módulo: Calendario
Uso: Histórico de métricas (snapshots)
Notas: Auto-limpieza después de 60 días
```

---

## 📊 Encuestas

### `surveys`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- title, description
- isActive (boolean)
- whatsappConfig (JSONB - {enabled, senderId, message})
- customDomainId (FK → customDomains, nullable)
- createdAt

Relaciones: Belongs to user, Has many surveyQuestions
Módulo: Encuestas
```

### `survey_questions`
```
Campos principales:
- id (UUID, PK)
- surveyId (FK → surveys)
- question
- type ('text' | 'textarea' | 'number' | 'email' | 'date' | 'select' | 'checkbox' | 'radio')
- isRequired (boolean)
- options (JSONB)
- order
- createdAt

Módulo: Encuestas
Uso: Preguntas de encuesta
```

### `survey_responses`
```
Campos principales:
- id (UUID, PK)
- surveyId (FK → surveys)
- respondentName, respondentWhatsapp
- respondentCountry, respondentCity
- answers (JSONB - {questionId: answer})
- createdAt

Módulo: Encuestas
Uso: Respuestas de encuestas
```

### `custom_domains`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- domain (UNIQUE)
- status ('pending' | 'verified' | 'active' | 'failed')
- verificationToken
- lastVerifiedAt
- isActive (boolean)
- description
- linkedEmail
- emailVerified (boolean)
- emailVerificationToken
- createdAt

Módulo: Encuestas & E-Commerce
Uso: Dominios personalizados
```

---

## 🏪 E-Commerce & Tienda

### `stores`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- name, description
- logo (image URL)
- bannerImage (image URL)
- isActive (boolean)
- customUrl (UNIQUE)
- currency ('MXN' por defecto)
- createdAt

Relaciones: Belongs to user, Has many products, services
Módulo: E-Commerce
Uso: Tienda virtual
```

### `store_product_categories`
```
Campos principales:
- id (UUID, PK)
- storeId (FK → stores)
- name, description
- order
- isActive (boolean)
- createdAt

Módulo: E-Commerce
Uso: Categorías de productos
```

### `store_product_subcategories`
```
Campos principales:
- id (UUID, PK)
- categoryId (FK → storeProductCategories)
- name, description
- order
- isActive (boolean)
- createdAt

Módulo: E-Commerce
Uso: Subcategorías de productos
```

### `store_products`
```
Campos principales:
- id (UUID, PK)
- storeId (FK → stores)
- categoryId (FK → storeProductCategories, nullable)
- subcategoryId (FK → storeProductSubcategories, nullable)
- name, description
- image (URL)
- price (int - cents)
- originalPrice (int - para descuentos)
- stock
- isActive (boolean)
- order
- createdAt

Módulo: E-Commerce
Uso: Catálogo de productos
```

### `store_services`
```
Campos principales:
- id (UUID, PK)
- storeId (FK → stores)
- name, description
- image (URL)
- durationMinutes (default: 60)
- price (int - cents)
- originalPrice
- isActive (boolean)
- bookingLink
- order
- createdAt

Módulo: E-Commerce
Uso: Servicios ofrecidos
Notas: Vinculados a calendario
```

### `store_coupons`
```
Campos principales:
- id (UUID, PK)
- storeId (FK → stores)
- code (UNIQUE)
- discountType ('percentage' | 'fixed')
- discountValue
- maxUses (nullable = unlimited)
- currentUses
- isActive (boolean)
- expiresAt
- createdAt

Módulo: E-Commerce
Uso: Cupones de descuento
```

### `store_orders`
```
Campos principales:
- id (UUID, PK)
- storeId (FK → stores)
- clientId (FK → clients, nullable)
- customerName, customerEmail, customerPhone
- customerCity, customerCountry
- status ('pending' | 'processing' | 'completed' | 'cancelled')
- totalAmount (int - cents)
- discountAmount
- finalAmount
- couponCode
- notes
- createdAt

Módulo: E-Commerce
Uso: Pedidos
```

### `store_order_items`
```
Campos principales:
- id (UUID, PK)
- orderId (FK → storeOrders)
- productId (FK → storeProducts)
- productName, productPrice (snapshot)
- quantity
- subtotal
- createdAt

Módulo: E-Commerce
Uso: Items dentro de pedidos
```

### `store_custom_domains`
```
Campos principales:
- id (UUID, PK)
- storeId (FK → stores)
- customUrl (UNIQUE)
- domain (UNIQUE)
- status ('pending' | 'active' | 'failed')
- verificationToken
- createdAt

Módulo: E-Commerce
Uso: Dominios personalizados para tiendas
```

---

## 🎰 Rifas

### `raffles`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- title, description
- photoUrl, videoUrl
- totalTickets
- ticketPrice (int - cents)
- currency ('MXN' | 'USD')
- status ('draft' | 'active' | 'closed' | 'finished')
- drawDate
- isPublished (boolean)
- whatsappContactNumber
- createdAt, updatedAt

Relaciones: Belongs to user, Has many tickets
Módulo: Rifas
Uso: Sistema de rifas/sorteos
```

### `raffle_tickets`
```
Campos principales:
- id (UUID, PK)
- raffleId (FK → raffles)
- ticketNumber ('000001' - '999999')
- status ('available' | 'reserved' | 'sold')
- purchaseId (FK → rafflePurchases, nullable)
- createdAt

Módulo: Rifas
Uso: Boletos individuales
```

### `raffle_purchases`
```
Campos principales:
- id (UUID, PK)
- raffleId (FK → raffles)
- buyerName, buyerEmail, buyerPhone
- ticketNumbers (array)
- quantity
- totalAmount (int - cents)
- status ('pending' | 'paid' | 'cancelled')
- paymentProof (URL)
- paymentVerified (boolean)
- createdAt

Módulo: Rifas
Uso: Compras de boletos
```

### `raffle_stories`
```
Campos principales:
- id (UUID, PK)
- raffleId (FK → raffles)
- mediaUrl (photo/video URL)
- mediaType ('photo' | 'video')
- caption
- order
- createdAt

Módulo: Rifas
Uso: Historias/galería de rifa
```

### `raffle_bank_accounts`
```
Campos principales:
- id (UUID, PK)
- raffleId (FK → raffles)
- bankName, accountHolder
- accountNumber
- accountType ('checking' | 'savings')
- currency ('MXN' por defecto)
- isActive (boolean)
- createdAt

Módulo: Rifas
Uso: Cuentas bancarias para pagos
```

### `raffle_customers`
```
Campos principales:
- id (UUID, PK)
- raffleId (FK → raffles)
- customerId (identifier like RFC)
- firstName, lastName
- email, phone, whatsapp
- ticketNumbers (array)
- status ('pending' | 'verified' | 'paid' | 'cancelled')
- createdAt

Módulo: Rifas
Uso: Clientes participantes
```

---

## 💰 Banca

### `bank_accounts`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- accountName
- accountNumber
- bankName
- accountType ('corriente' | 'ahorro' | 'nomina')
- initialBalance (int - cents)
- currency ('MXN' por defecto)
- isActive (boolean)
- createdAt

Relaciones: Belongs to user, Has many transactions
Módulo: Banca
Uso: Cuentas bancarias del usuario
```

### `bank_transactions`
```
Campos principales:
- id (UUID, PK)
- accountId (FK → bankAccounts)
- type ('deposito' | 'gasto' | 'transferencia')
- category (e.g., 'salarios', 'servicios')
- description
- amount (int - cents)
- date
- reference (invoice #, check #, etc.)
- createdAt

Módulo: Banca
Uso: Transacciones bancarias
```

---

## 👨‍💼 Equipos

### `teams`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users, UNIQUE)
- description
- isActive (boolean)
- createdAt

Relaciones: Belongs to user, Has many teamMembers
Módulo: Equipos
Uso: Cuenta de equipo principal
Notas: Un usuario por equipo (1:1)
```

### `team_members`
```
Campos principales:
- id (UUID, PK)
- teamId (FK → teams)
- userId (FK → users)
- role ('admin' | 'member' | 'viewer')
- isActive (boolean)
- createdAt, updatedAt

Módulo: Equipos
Uso: Miembros del equipo
```

### `team_activity_logs`
```
Campos principales:
- id (UUID, PK)
- teamId (FK → teams)
- userId (FK → users)
- action ('login' | 'logout' | 'edit' | 'delete' | 'create')
- details
- ipAddress
- createdAt
- expiresAt (auto-delete después de 24hrs)

Módulo: Equipos
Uso: Auditoría de actividad
Notas: Auto-limpieza
```

### `team_module_access`
```
Campos principales:
- id (UUID, PK)
- teamId (FK → teams)
- memberId (FK → teamMembers, nullable)
- module ('whatsapp' | 'calendar' | 'surveys' | 'raffles' | 'crm' | 'facebook')
- canRead, canCreate, canEdit, canDelete (booleans)
- assignedResourceIds (array)
- createdAt

Módulo: Equipos
Uso: Permisos granulares por módulo
```

---

## 🤖 IA - Asistentes y Voz

### `ai_providers`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- name (e.g., "Mi OpenAI")
- provider ('openai' | 'gemini' | 'anthropic' | 'other')
- apiKey (encrypted)
- isActive (boolean)
- createdAt

Módulo: IA
Uso: Configuración de proveedores IA
```

### `assistants`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- name, description
- type ('general' | 'sales' | 'support' | 'custom')
- systemPrompt
- model ('gpt-4' | 'gpt-3.5-turbo' | 'gemini-pro' | 'claude-3')
- temperature (0-100)
- maxTokens (default: 2000)
- language ('es' | 'en' | 'pt' | 'fr')
- isActive (boolean)
- flowId (FK → flows, nullable)
- createdAt, updatedAt

Relaciones: Belongs to user, Has one flow, Has many assignments
Módulo: IA - Asistentes
Uso: Asistentes IA automáticos
Notas: Campos tipo, idioma, flowId agregados recientemente
```

### `flows`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- assistantId (FK → assistants, nullable)
- name, description
- flowData (JSONB - {nodes, edges})
- isActive (boolean)
- createdAt, updatedAt

Relaciones: Belongs to user, Belongs to assistant
Módulo: IA - Flujos
Uso: Editor visual de flujos con React Flow
```

### `assistant_assignments`
```
Campos principales:
- id (UUID, PK)
- assistantId (FK → assistants)
- whatsappAccountId (FK → whatsappAccounts)
- isActive (boolean)
- createdAt

Módulo: IA - Asistentes
Uso: Asignar asistentes a cuentas WhatsApp
```

### `ai_voice_agents`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- name, description
- systemPrompt
- voiceId, voiceName (Elevenlabs)
- language ('es' | 'en')
- allowLanguageAutoSwitch (boolean)
- fallbackLanguage
- isActive (boolean)
- flowNodes (JSONB)
- status ('draft' | 'published' | 'archived')
- callsCount
- companyProfile (JSONB - business info)
- linkedStoreId (FK → stores, nullable)
- products, services, faqs (JSONB - deprecated)
- calendarPolicy (JSONB)
- toolPermissions (JSONB)
- personality (JSONB)
- createdAt, updatedAt

Relaciones: Belongs to user, Linked to store
Módulo: IA - Voz
Uso: Agentes de voz con Twilio + ElevenLabs
```

### `ai_voice_calls`
```
Campos principales:
- id (UUID, PK)
- agentId (FK → aiVoiceAgents)
- userId (FK → users)
- agentName (cached)
- phoneNumber
- callSid (Twilio call ID)
- duration (seconds)
- status ('pending' | 'ringing' | 'in-progress' | 'completed' | 'failed')
- transcript
- summary (AI-generated)
- recordingUrl (Twilio)
- failureReason
- appointmentCreated, leadCreated (booleans)
- callerLanguage
- createdAt

Módulo: IA - Voz
Uso: Historial de llamadas
```

---

## 📱 Chat Web

### `web_chats`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- name, title, description
- websiteUrl
- embedCode (auto-generated)
- isActive (boolean)
- customColor (hex)
- position ('bottom-right' | 'bottom-left' | 'top-right' | 'top-left')
- productIds (array)
- acceptingBookings (boolean)
- availableHours (JSON)
- autoResponseTime (ms)
- createdAt, updatedAt

Relaciones: Belongs to user, Has many sessions
Módulo: Chat Web
Uso: Widget de chat embebido
```

### `web_chat_sessions`
```
Campos principales:
- id (UUID, PK)
- webChatId (FK → webChats)
- visitorName, visitorEmail, visitorPhone
- visitorIp, userAgent
- interestedProducts (array)
- appointmentDate
- appointmentStatus ('pending' | 'confirmed' | 'cancelled')
- isActive (boolean)
- createdAt

Módulo: Chat Web
Uso: Sesiones de visitantes
```

### `web_chat_messages`
```
Campos principales:
- id (UUID, PK)
- sessionId (FK → webChatSessions)
- message
- direction ('incoming' | 'outgoing')
- createdAt

Módulo: Chat Web
Uso: Mensajes del chat web
```

---

## ✅ Tareas & Kanban

### `tasks`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- title, description
- status ('todo' | 'in_progress' | 'done')
- priority ('low' | 'normal' | 'high' | 'urgent')
- dueDate
- assignedToUserId (FK → users, nullable)
- createdByUserId, lastModifiedByUserId (FK → users)
- conversationId (FK → conversations, nullable)
- clientId (FK → clients, nullable)
- leadId (FK → leads, nullable)
- order
- createdAt, updatedAt

Relaciones: Belongs to users (creator, assignee)
Módulo: Tareas
Uso: Sistema de tareas
```

### `task_status_changes`
```
Campos principales:
- id (UUID, PK)
- taskId (FK → tasks)
- oldStatus, newStatus
- changedByUserId (FK → users)
- createdAt

Módulo: Tareas
Uso: Auditoría de cambios de estado
```

### `kanban_boards`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- name, description
- createdAt

Módulo: Kanban
Uso: Tableros Kanban
```

### `kanban_columns`
```
Campos principales:
- id (UUID, PK)
- boardId (FK → kanbanBoards)
- name
- orderIndex
- createdAt

Módulo: Kanban
Uso: Columnas del tablero
```

### `kanban_cards`
```
Campos principales:
- id (UUID, PK)
- columnId (FK → kanbanColumns)
- taskId (FK → tasks, nullable)
- orderIndex
- createdAt

Módulo: Kanban
Uso: Tarjetas en Kanban
```

### `task_metrics`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- date ('YYYY-MM-DD')
- hour (0-23, nullable)
- totalTasks, completedTasks
- inProgressTasks, todoTasks
- lowPriority, normalPriority
- highPriority, urgentPriority
- createdAt

Módulo: Tareas
Uso: Métricas de tareas
Notas: Auto-limpieza después de 60 días
```

---

## 🎙️ Notas & Pizarra

### `board_notes`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- title, content
- color (hex)
- emoji
- date (nullable)
- positionX, positionY (canvas position)
- width, height
- rotation (-15 to 15 degrees)
- isPinned, isArchived (booleans)
- zIndex (layer order)
- createdById, lastEditedById (FK → users)
- createdByName, lastEditedByName (snapshots)
- createdAt, updatedAt

Módulo: Pizarra
Uso: Notas adhesivas en pizarra
```

### `chat_notes`
```
Campos principales:
- id (UUID, PK)
- conversationId (FK → conversations)
- content
- createdAt, updatedAt

Módulo: Chat
Uso: Notas en conversaciones
```

---

## 📢 Notificaciones & Roles

### `notifications`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- title, description
- type ('order' | 'message' | 'alert' | 'reminder' | 'info')
- relatedId (id of related entity)
- isViewed (boolean)
- createdAt

Módulo: Sistema
Uso: Notificaciones del usuario
```

### `roles`
```
Campos principales:
- id (UUID, PK)
- userId (FK → users)
- name
- color (tailwind class, default: 'bg-purple-500')
- permissions (JSONB)
- usersCount
- isDefault (boolean)
- createdAt, updatedAt

Módulo: Administración
Uso: Roles personalizados
```

---

## 🔗 Clasificación de Chat

### `chat_classification_rules`
```
Campos principales:
- id (UUID, PK)
- whatsappAccountId (FK → whatsappAccounts)
- category ('sales' | 'support' | 'vip' | 'inquiry' | 'complaint' | 'other')
- keywords (array)
- patterns (array - regex)
- priority
- isActive (boolean)
- createdAt

Módulo: Chat Classification
Uso: Reglas para clasificar chats
```

### `chat_classification_results`
```
Campos principales:
- id (UUID, PK)
- conversationId (FK → conversations)
- detectedCategory
- detectedPriority
- confidence (0-100%)
- matchedRuleId (FK → chatClassificationRules, nullable)
- lastClassifiedAt
- createdAt

Módulo: Chat Classification
Uso: Resultados de clasificación
```

---

## 👁️ Ayuda

### `help_articles`
```
Campos principales:
- id (UUID, PK)
- title, content
- category ('conversations' | 'calendar' | 'surveys' | 'raffles' | 'crm' | 'analytics' | 'general')
- keywords (array)
- order
- isActive (boolean)
- createdAt

Módulo: Help
Uso: Base de conocimientos
```

---

## 📊 Integración de Datos - Relaciones Principales

### Relaciones por Usuario
```
users (1) → many:
  ├─ whatsappAccounts
  ├─ conversations (via whatsappAccount)
  ├─ clients
  ├─ leads
  ├─ calendarEvents
  ├─ surveys
  ├─ stores
  ├─ raffles
  ├─ bankAccounts
  ├─ aiVoiceAgents
  ├─ assistants (NEW)
  ├─ flows (NEW)
  ├─ tasks
  ├─ webChats
  ├─ boardNotes
  └─ notifications
```

### Relaciones por Asistente (NUEVO - 2025-11-27)
```
assistants (1) → many:
  ├─ flows (one per assistant)
  ├─ assignmentAssignments (many WhatsApp accounts)
```

---

## 🔄 Últimas Actualizaciones

### 2025-11-27 - Módulo de Asistentes IA
- ✅ Agregados campos a tabla `assistants`:
  - `type`: ('general' | 'sales' | 'support' | 'custom')
  - `language`: ('es' | 'en' | 'pt' | 'fr')
- ✅ Creada tabla `flows` para editor visual
- ✅ Creada tabla `assistant_assignments` para vincular con WhatsApp

---

## 📝 Mantenimiento

**Importante:** Este documento se genera automáticamente desde `shared/schema.ts`.

Para mantenerlo actualizado:
1. Cuando agregues nuevas tablas, asegúrate de agregar la documentación aquí
2. Ejecuta `npm run db:push` después de cambios en `shared/schema.ts`
3. Revisa este archivo regularmente para cambios
4. Usa este documento como referencia antes de hacer queries complejas

---

**Actualizado:** 27 de Noviembre, 2025 23:09 UTC
