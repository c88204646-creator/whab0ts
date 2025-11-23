# Proyecto WhatsApp CRM - Plataforma de Integración

## Estado Actual
- **Módulo Facebook**: 🚫 OCULTO DEL MENÚ - Pendiente de solución de automatización real
- **Módulo CRM**: ✅ 2 módulos principales: Clientes y Leads
- **Módulo Calendario**: ✅ Sistema completo de gestión de citas integrado con WhatsApp
- **Sistema de Encuestas**: ✅ Con mejoras de UI
- **Live Chat de Ventas**: 🆕 REDISEÑADO - Sistema independiente de chatbots para funnel de ventas

## 🆕 LIVE CHAT DE VENTAS - Sistema Independiente de Funnel de Ventas

### Características Implementadas
- ✅ Sistema independiente de chatbots (no requiere chatbot)
- ✅ Flujo de captura de leads (nombre, email, teléfono)
- ✅ Integración con productos/servicios del usuario
- ✅ Selección de productos por visitante
- ✅ Agendamiento de citas en tiempo real
- ✅ Verificación de disponibilidad en calendario
- ✅ Respuestas automatizadas sin IA
- ✅ Widget personalizable (color, título, descripción)
- ✅ Conversación secuencial: Bienvenida → Datos → Productos → Cita → Confirmación

### Ubicación en el Sistema
- **Ruta**: `/web-chat`
- **Menú**: Widgets > Live Chat Web
- **Tabla DB**: 
  - `web_chats` (userId, name, title, description, productIds, acceptingBookings, availableHours, customColor)
  - `web_chat_sessions` (webChatId, visitorName, visitorEmail, visitorPhone, interestedProducts, appointmentDate, appointmentStatus)
  - `web_chat_messages` (sessionId, message, direction)

### Flujo del Widget
1. **Bienvenida**: Mostrar título y descripción personalizada
2. **Captura de Datos**: Recolectar nombre, email, teléfono
3. **Selección de Productos**: Mostrar productos/servicios disponibles
4. **Agendamiento**: Elegir fecha y hora de cita
5. **Confirmación**: Confirmar detalles de la cita agendada

## 🆕 MÓDULO CALENDARIO - Gestión de Citas Integrado con WhatsApp

### Características Implementadas
- ✅ Vista visual de calendario con grid del mes actual
- ✅ Navegación entre meses
- ✅ Selector de país con banderas y códigos para más de 30 países
- ✅ Ingreso manual de número de WhatsApp con validación en tiempo real
- ✅ Indicadores visuales de días con eventos (puntos SVG)
- ✅ Panel lateral mostrando eventos del día seleccionado
- ✅ Creación de citas con titulo y descripción
- ✅ Estados de cita: Pendiente, Confirmada, Cancelada
- ✅ Edición y eliminación de eventos
- ✅ Toggle de Activo/Inactivo para el calendario
- ✅ Base de datos PostgreSQL para persistencia

### Ubicación en el Sistema
- **Ruta**: `/calendar`
- **Menú**: WhatsApp > Calendario
- **Tabla DB**: `calendar_events` (userId, title, description, startTime, endTime, contactName, contactPhone, status, isActive)

### Flujo de Uso

1. **Ver calendario:**
   - Click en "Calendario" en el menú WhatsApp
   - Se muestra grid del mes actual
   - Días con eventos tienen punto visual (●)

2. **Crear cita:**
   - Click en "Nueva cita" o selecciona un día
   - Ingresa nombre del contacto
   - Selecciona país y escribe número de WhatsApp (valida en tiempo real)
   - Completa: Título, descripción, inicio y fin
   - Confirmación automática

3. **Gestionar cita:**
   - Click en día para ver eventos
   - Botón 🗑️ para eliminar

### Endpoints API
- GET `/api/calendar/:userId` - Obtener citas del usuario
- POST `/api/calendar` - Crear cita
- PATCH `/api/calendar/:id` - Actualizar estado/detalles
- DELETE `/api/calendar/:id` - Eliminar cita

## Estructura del Menú Principal
```
Sidebar:
├── WhatsApp
│   ├── Conversaciones
│   ├── Conexiones
│   ├── Chatbots
│   └── Calendario 🆕
├── Encuestas
└── CRM
    ├── Clientes
    └── Leads

[Facebook module oculto por ahora]
```

## Módulos Implementados

### 1. WhatsApp Module
- Gestión de cuentas WhatsApp
- Conversaciones y mensajes
- Chatbots con inteligencia artificial
- Knowledge Base
- **Calendario para agendamiento de citas con validación de WhatsApp** 🆕

### 2. Encuestas (Surveys)
- Crear encuestas con preguntas
- Estado activo/pausado visible en tarjetas
- DatePicker personalizado con tema oscuro
- 🆕 **URLs públicas para responder y ver resultados**:
  - `/survey/:id` - Página pública para responder encuestas (sin autenticación)
  - `/survey/:id/results` - Página pública para ver resultados (sin autenticación)
  - Botón en tabla de encuestas para copiar enlace de resultados
  - Estadísticas en tiempo real: total de respuestas, respondentes, detalles por pregunta

### 3. CRM Module Simplificado
- **Clientes (Clients)**: Gestión de clientes
- **Leads**: Seguimiento de prospectos

### 4. Facebook Module (OCULTO DEL MENÚ - Pendiente)
- **Cuentas de Facebook**: Gestión de cuentas
  - Ruta: `/facebook` (acceso directo por URL)
  - Autenticación segura sin almacenar credenciales
  - Selector de cuentas con estado
  - UI intuitivo con popup de login
  - Token de sesión para operaciones futuras

- **Automatización de Posts**: Infraestructura lista
  - Ruta: `/facebook-automation` (acceso directo por URL)
  - UI para ejecutar acciones automáticas (comentarios, reacciones)
  - Seleccionar múltiples cuentas para ejecutar
  - Validación de URLs de posts de Facebook
  - **Status**: Esperando implementación real de automatización

## Características Técnicas

### Frontend
- React con TypeScript
- Wouter para routing
- Shadcn/UI components (incluye Select para país)
- TanStack React Query
- Dark mode exclusivo
- Interfaz compacta y profesional
- Selector de país con banderas (30+ países)
- Validación de números en tiempo real

### Backend
- Express.js
- Drizzle ORM
- PostgreSQL (Neon)
- WebSocket para comunicación real-time
- Validación Zod
- Sistema de sesiones

### Base de Datos
- Table: calendar_events
- Campos: userId, title, description, startTime, endTime, contactName, contactPhone, status, isActive, createdAt
- Relaciones establecidas con users
- Índices: userId para búsquedas eficientes

## Rutas Disponibles

### Encuestas (Surveys)
- `/surveys` - Página de gestión de encuestas (con autenticación)
- `/survey/:id` - Página pública para responder encuestas (sin autenticación)
- `/survey/:id/results` - Página pública para ver resultados (sin autenticación)
- `/survey-edit/:id` - Editor de encuesta (con autenticación)
- GET `/api/surveys/:userId` - Obtener encuestas del usuario
- GET `/api/surveys/detail/:id` - Obtener detalles de una encuesta
- GET `/api/survey-questions/:surveyId` - Obtener preguntas de una encuesta
- GET `/api/survey-responses/:surveyId` - Obtener respuestas de una encuesta
- POST `/api/surveys` - Crear nueva encuesta
- POST `/api/survey-responses` - Guardar respuesta de encuesta
- PATCH `/api/surveys/:id` - Actualizar encuesta
- DELETE `/api/surveys/:id` - Eliminar encuesta

### Calendario
- `/calendar` - Página principal de gestión de citas
- GET `/api/calendar/:userId` - Obtener citas del usuario
- POST `/api/calendar` - Crear nueva cita
- PATCH `/api/calendar/:id` - Actualizar cita (status, detalles)
- DELETE `/api/calendar/:id` - Eliminar cita

### Facebook Module
- `/facebook` - Página principal de cuentas de Facebook
- POST `/api/facebook-auth/start-login` - Iniciar sesión
- POST `/api/facebook-auth/complete-login` - Completar y guardar sesión
- GET `/api/facebook-accounts/:userId` - Obtener cuentas del usuario
- DELETE `/api/facebook-accounts/:id` - Eliminar cuenta

### Facebook Automation
- `/facebook-automation` - Página de automatización de posts
- POST `/api/facebook-automation/execute` - Ejecutar automatización

## Preferencias del Usuario
- Idioma: Español
- Modo: Dark mode exclusivo
- Diseño: Compacto y profesional
- Fechas: Formato datetime para calendario
- Integración: WhatsApp con validación de números en tiempo real
- Validación: País selector + número manual + validación en tiempo real
- Funcionalidad: Real (sin simulaciones)
- CRM: Simplificado a Clientes y Leads

## 🆕 MÓDULO RIFAS - Sistema Completo de Sorteos y Rifas

### Características Implementadas
- ✅ Creación de rifas con tickets de 6 dígitos (000001 a 999999)
- ✅ Sistema independiente por rifa (financiero, boletos, historias, cuentas bancarias)
- ✅ Gestión de boletos (disponibles, reservados, vendidos)
- ✅ Compra y reserva de boletos desde página pública
- ✅ Captura de datos de compradores (nombre, email, teléfono)
- ✅ Sistema de cuentas bancarias para transferencias
- ✅ Historias estilo Instagram (fotos y videos)
- ✅ Página pública sin autenticación
- ✅ Verificador de boletos (público)
- ✅ Pagos pendientes y verificación de comprobantes
- ✅ Estados de rifa (borrador, activa, cerrada, finalizada)
- ✅ Dashboard de gestión de rifas

### Ubicación en el Sistema
- **Ruta admin**: `/raffles` - Dashboard de rifas
- **Ruta crear/editar**: `/raffles/create` y `/raffles/:id/manage`
- **Página pública**: `/raffles/:raffleId/public` - Sin autenticación
- **Menú**: Sidebar > Negocios > Rifas
- **Tablas DB**:
  - `raffles` (userId, title, description, photoUrl, videoUrl, totalTickets, ticketPrice, status, drawDate, isPublished)
  - `raffle_tickets` (raffleId, ticketNumber, status, purchaseId)
  - `raffle_purchases` (raffleId, buyerName, buyerEmail, buyerPhone, ticketNumbers, totalAmount, status, paymentProof, paymentVerified)
  - `raffle_stories` (raffleId, mediaUrl, mediaType, caption, order)
  - `raffle_bank_accounts` (raffleId, bankName, accountHolder, accountNumber, accountType, currency, isActive)

### Endpoints API
**Privados (con autenticación):**
- POST `/api/raffles` - Crear rifa
- GET `/api/raffles?userId=:userId` - Listar rifas del usuario
- GET `/api/raffles/:id` - Obtener detalles de rifa
- PATCH `/api/raffles/:id` - Actualizar rifa
- DELETE `/api/raffles/:id` - Eliminar rifa
- POST `/api/raffle-bank-accounts` - Agregar cuenta bancaria
- POST `/api/raffle-stories` - Agregar historia
- DELETE `/api/raffle-stories/:id` - Eliminar historia

**Públicos (sin autenticación):**
- GET `/api/raffles-public/:id` - Obtener detalles de rifa publicada
- POST `/api/raffle-purchases` - Crear compra/reserva
- GET `/api/raffle-purchases/:id` - Obtener detalles de compra
- PATCH `/api/raffle-purchases/:id` - Actualizar compra (agregar comprobante)
- POST `/api/verify-ticket` - Verificar boleto

### Flujo Completo de Usuario
1. **Crear Rifa** (Dashboard)
   - Ingresa título, descripción, cantidad de boletos, precio
   - Automáticamente genera boletos 000001 a N
   - Estado inicial: Borrador

2. **Configurar Rifa** (Página de gestión)
   - Cargar foto principal y video
   - Agregar historias (fotos/videos)
   - Agregar cuentas bancarias para recibir pagos
   - Publicar rifa (isPublished = true)

3. **Venta de Boletos** (Página pública)
   - Visitante ve galería de historias
   - Selecciona boletos (grid 000001, 000002, etc)
   - Ingresa datos personales (nombre, email, teléfono)
   - Ve cuentas bancarias para transferir
   - Aparta boletos (status = reserved)

4. **Confirmación de Pago**
   - Comprador sube comprobante de pago
   - Admin verifica y confirma pago
   - Boletos cambian status a vendido

5. **Verificación de Boleto** (Página pública)
   - Visitante ingresa número de boleto
   - Ve si está disponible, reservado o vendido
   - Si vendido, ve nombre del comprador

### Tecnología
- **Backend**: Express.js + Drizzle ORM
- **BD**: PostgreSQL con 5 tablas relacionadas
- **Frontend**: React + TanStack Query + Shadcn/UI
- **Integración**: Sistema independiente por rifa, sin dependencias de otros módulos

## Cambios Recientes
- ✅ REDISEÑO COMPLETO: Live Chat Web ahora es un funnel de ventas independiente
- ✅ Eliminación de dependencia de chatbots en Live Chat
- ✅ Nuevo flujo: Bienvenida → Datos → Productos → Cita → Confirmación
- ✅ Integración con productos/servicios del usuario
- ✅ Capacidad de agendamiento automático con verificación de calendario
- ✅ Widget reescrito con flujo de conversación secuencial
- ✅ Página admin actualizada para gestionar widgets sin chatbots
- ✅ Schema actualizado: chatbotId ahora opcional en webChats
- ✅ **LIMITACIÓN DE DOMINIOS**: Solo 1 dominio personalizado por usuario (por seguridad)
  - Validación en backend rechaza múltiples dominios
  - Interfaz deshabilita botón cuando hay 1 dominio
  - Dominio se vincula automáticamente a encuestas al verificarse
- ✅ Endpoints públicos para resultados de encuestas:
  - GET `/api/survey-questions/:surveyId` - Obtener preguntas de encuesta
  - GET `/api/survey-responses/:surveyId` - Obtener respuestas de encuesta
- ✅ **SISTEMA REAL DE DOMINIOS PERSONALIZADOS**:
  - Verificación DNS real en tiempo real
  - Vinculación de emails reales a dominios
  - 2 nuevos endpoints: POST `/api/custom-domains/:id/link-email` y GET `/api/custom-domains/:id/status`
  - UI mejorada con campos de email, estado de DNS, y verificación real
  - Campo linkedEmail para vincular correos
  - Verificación de dominios via CNAME y TXT records reales

## Archivos Importantes

### Calendario
- `/client/src/pages/calendar.tsx` - Página de calendario con selector de país y validación
- `/client/src/lib/countries.ts` - Datos de países, banderas y validación
- `/server/storage.ts` - Métodos CRUD para eventos
- `/server/routes.ts` - Endpoints /api/calendar
- `/shared/schema.ts` - Tabla calendarEvents, InsertCalendarEvent

### Facebook
- `/client/src/pages/crm-facebook.tsx` - Página de gestión de cuentas
- `/client/src/pages/facebook-automation.tsx` - Página de automatización
- `/server/facebook-auth.ts` - Lógica de autenticación
- `/server/facebook-automation.ts` - Servicio de automatización
- `/shared/schema.ts` - Tabla FacebookAccount

### Componentes Compartidos
- `/client/src/components/app-sidebar.tsx` - Menú lateral (actualizado)
- `/client/src/App.tsx` - Router (actualizado)

## Próximos Pasos Recomendados

### Mejoras al Calendario
1. **Sincronización con WhatsApp**
   - El chatbot envía recordatorios en la fecha/hora de la cita
   - Envía confirmación cuando usuario confirma

2. **Notificaciones**
   - Toast cuando se crea/actualiza cita
   - Recordatorios 24h antes
   - Notificación cuando chatbot agenda cita

3. **Funcionalidades Avanzadas**
   - Duración automática de citas
   - Calendario visual (month/week/day view)
   - Disponibilidad automática para chatbot
   - Historial de cambios

### Facebook Automation Completa
1. **Implementación Puppeteer**: Conectar automatización real con sesiones guardadas
2. **Mejoras de UI**: Historial de automatizaciones, logs en tiempo real
3. **Integraciones Futuras**: API Graph de Facebook, gestión de anuncios, analytics
