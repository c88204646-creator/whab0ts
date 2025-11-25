# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It aims to provide businesses with tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, running promotional raffles, and analyzing sales funnels. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management with public booking (Calendly-style), a simplified CRM, a robust raffle management system, and an advanced Sales Funnel analytics dashboard with automatic chat classification. The platform also includes a Help Widget (estilo Intercom) for user support and learning. The platform is built for efficiency, real-time interaction, and a professional user experience.

## Recent Changes
- **Nov 25, 2025 - COMPLETADO**: Prevención de Agendar en Días Pasados
  - ✅ **Validación en handleCreateEvent()**:
    - NO permite crear NUEVAS citas en días pasados
    - SÍ permite EDITAR citas en días pasados (para cambiar citas antiguas)
    - Error: "No puedes agendar citas en días pasados"
  - ✅ **Calendario principal (vista de administrador)**:
    - Días pasados: DESHABILITADOS, opacidad 50%, color muted
    - No se pueden seleccionar días pasados
    - Hoy: Se muestra con indicador especial
  - ✅ **Mini calendario del diálogo**:
    - Validación robusta: Compara fechas sin horas
    - Días pasados: DESHABILITADOS, opacidad 40%
    - Si intenta clickear: Toast "No puedes agendar en días pasados"
  - ✅ **Comparación de fechas mejorada**:
    - Usa `.setHours(0,0,0,0)` para comparar solo el día
    - Evita problemas con timezone/UTC
  - ✅ **Lógica de negocio**:
    - Hoy = SELECCIONABLE (no es pasado)
    - Días anteriores a hoy = NO SELECCIONABLES
    - Días futuros = SELECCIONABLES

- **Nov 25, 2025 - COMPLETADO**: Validación de Seguridad en Tiempo Real - Calendario Público
  - ✅ **Estados agregados a página pública**:
    - `calendarUnavailable`: boolean para detectar desactivación
    - `unavailableReason`: string con razón específica de desactivación
  - ✅ **Función `validateCalendarAvailability()`**:
    - Valida: isActive + isPublicBookingEnabled
    - Retorna mensajes específicos según el tipo de desactivación
    - Cierra formulario de booking si hay problema (`setShowBookingForm(false)`)
  - ✅ **Validación periódica mejorada (2-5 segundos)**:
    - useEffect que corre cada **2 segundos** CUANDO está en formulario de booking
    - useEffect que corre cada **5 segundos** cuando NO está en formulario
    - Monitorea cambios en tiempo real SIN afectar performance
    - Detección ultra-rápida cuando usuario está intentando agendar
    - **MEJORA**: Reducido de 30s a 2-5s para detección más inmediata ⚡
  - ✅ **Validación antes de booking**:
    - `handleBooking()` ahora valida disponibilidad ANTES de procesar
    - Si falla → toast con ⚠️ "Calendario desactivado" + razón
  - ✅ **UI profesional de "No disponible"**:
    - Página roja con icono AlertCircle
    - Mensaje claro: "El calendario ha sido desactivado" O "Agendación deshabilitada"
    - Botón "Recargar página"
    - Reemplaza la anterior UI genérica
  - ✅ **Lógica mejorada: Dos casos diferentes**:
    - **CASO 1**: Calendario DESACTIVADO (isActive=false)
      - Muestra alerta roja "Calendario no disponible"
      - Oculta todo el calendario
      - No se ve nada
    - **CASO 2**: Calendario ACTIVO pero AGENDACIÓN PÚBLICA DESHABILITADA (isActive=true && isPublicBookingEnabled=false)
      - Muestra el calendario normalmente
      - Muestra banner AMARILLO: "El calendario está disponible para consulta, pero la agendación de citas no está habilitada en este momento"
      - Botón "Confirmar cita" deshabilitado
      - Usuario puede ver disponibilidad pero NO puede agendar
    - **CASO 3**: Todo OK (isActive=true && isPublicBookingEnabled=true)
      - Calendario funcional 100%
  - ✅ **Flujo de seguridad**:
    1. Usuario intenta agendar en calendario público
    2. Admin desactiva agendación pública (NO el calendario)
    3. Usuario ve banner amarillo + botón deshabilitado
    4. Usuario lo descubre **casi instantáneamente** (máximo 2-5 segundos)
    5. O: Admin desactiva calendario completamente → ver UI roja

- **Nov 25, 2025 - COMPLETADO**: Sincronización Mini Calendario - UX Mejorada
  - ✅ **Problema**: Cuando seleccionabas una fecha y abría el formulario, el mini calendario no mostraba la fecha seleccionada
  - ✅ **Solución**: Sincronizar `calendarMonth` y `calendarYear` cuando se selecciona una fecha
  - ✅ **Ubicación**: Función de crear cita desde clic en fecha (línea 1312-1313)
  - ✅ **Código**:
    ```
    setCalendarMonth(selectedDate.getMonth());
    setCalendarYear(selectedDate.getFullYear());
    ```
  - ✅ **Comportamiento**: Ahora el mini calendario muestra automáticamente el mes/año de la fecha seleccionada

- **Nov 25, 2025 - COMPLETADO**: Validación de Seguridad - Protección de Horarios con Citas Agendadas
  - ✅ **Protección lógica en DELETE `/api/calendar/availability/:id`**:
    - Valida que NO haya citas agendadas en ese rango horario
    - Si hay conflicto: retorna error 409 "No se puede eliminar este horario porque hay citas agendadas"
    - Validación: compara dayOfWeek + rango de horas (startTime - endTime)
    - Algoritmo: convierte tiempos a minutos para comparación precisa
  - ✅ **Frontend manejo de errores mejorado**:
    - deleteAvailabilityMutation lee error JSON del servidor
    - Toast con ⚠️ "No se puede eliminar" + descripción específica
    - Usuario ve claramente POR QUE no puede eliminar (hay citas)
  - ✅ **Seguridad garantizada**:
    - No hay forma de eliminar horario si hay citas = integridad referencial
    - Mensaje útil guía al usuario a eliminar/editar las citas primero

- **Nov 25, 2025 - COMPLETADO**: Calendario Público y Alertas Motivacionales CRM
  - ✅ **Diálogo de crear evento mejorado**:
    - Estructura: header/footer FIJOS, contenido con scroll
    - Clases: `DialogHeader className="px-4 pt-4 pb-0"`, `DialogFooter className="px-4 py-4 border-t border-border flex-shrink-0"`
    - Contenido central: `div className="space-y-4 overflow-y-auto flex-1 px-4 py-4"`
  - ✅ **Validación de calendario público**:
    - GET `/api/calendar/public/:token` ahora valida `isPublicBookingEnabled`
    - Retorna error 403 si públicBooking está deshabilitado
  - ✅ **Nuevo endpoint para reservas públicas**:
    - POST `/api/calendar/public/book/:token` - endpoint seguro para visitantes
    - Valida: token, estado calendario, public booking habilitado
    - Acepta: title, description, startTime, endTime, contactName, contactPhone
    - Actualiza estadísticas de bookings completados
  - ✅ **Mensajes de alerta motivacionales (estilo CRM)**:
    - Crear cita: "✓ ¡Felicidades! Nueva cita agendada" + "Tu cita ha sido registrada exitosamente en el sistema"
    - Actualizar cita: "✓ Cita actualizada correctamente" + "Los cambios han sido guardados"
    - Eliminar cita: "✓ Cita eliminada" + "Se ha removido correctamente del calendario"
    - Crear cliente/lead: "✓ Cliente/Lead creado correctamente" + "Se ha registrado exitosamente en tu CRM"
    - Activar calendario: "✓ Calendario activado" + "Tu calendario está listo para recibir citas"
    - Agregar horario: "✓ Horario agregado" + "Tu disponibilidad ha sido registrada correctamente"
    - Eliminar horario: "✓ Horario eliminado" + "Se ha removido correctamente de tu disponibilidad"
    - Copiar enlace: "✓ Enlace copiado" + "Listo para compartir con tus clientes"
  - ✅ **Ajuste CSS campo de hora**:
    - Altura aumentada a `h-9` (desde h-8) para alineación visual con otros campos
    - Removido `max-w-xs` y `sm:h-9` para mantener consistencia

- **Nov 25, 2025 - COMPLETADO**: Panel de Calendario Funcional y Optimizado
  - ✅ Panel administrativo de calendario completamente funcional
  - ✅ Crear, editar y eliminar citas
  - ✅ Configurar horarios de atención por día de la semana
  - ✅ URL pública para que clientes agendan citas (estilo Calendly)
  - ✅ Selección de cliente o lead al crear/editar citas
  - ✅ Validación de disponibilidad en tiempo real
  - ✅ Interfaz mejorada y optimizada para móviles:
    - Horas disponibles en línea con scroll horizontal (no es wrapper/grid grande)
    - Campo de hora ajustado con tamaño responsivo en móviles
    - Diseño outline profesional con badge compactos
    - Diálogos modales con mini calendario para seleccionar fecha
    - Integración con cliente/lead del CRM
  - ✅ Estadísticas en tiempo real: Total citas, próximas, completadas, horarios
  - ✅ Indicadores visuales: disponibilidad por día, citas públicas vs internas
  - ✅ Compartir enlace del calendario públicamente con estadísticas de uso

- **Nov 24, 2025 - COMPLETADO**: Sistema Completo de Teams con Permisos y Seguridad
  - ✅ **Creación de Miembros**: Formulario funcional con validación en tiempo real
    - Validación de email disponible (verifica si ya existe)
    - Contraseña + confirmación con indicadores visuales
    - Roles: Admin, Miembro, Visualizador
  - ✅ **Gestión de Miembros**:
    - Pausar/activar acceso individual
    - Restablecer contraseña
    - Cambiar rol
    - Eliminar miembro
  - ✅ **Sistema de Permisos por Módulo**:
    - Permisos granulares: Leer, Crear, Editar, Eliminar
    - Por módulo: WhatsApp, Chatbots, Calendario, Encuestas, Rifas, CRM
    - Asignación de recursos específicos (WhatsApp/Chatbots)
    - APIs: 
      - GET /api/team-members/:memberId/permissions
      - PATCH /api/team-members/:memberId/permissions
  - ✅ **Seguridad**:
    - Usuario propietario visible pero sin acciones
    - Membrete "(Propietario)" para identificar owner
    - Scroll reparado con min-h-0
    - Modal compacto para creación
    - Validación en servidor de todas las acciones
  - ✅ **Base de Datos**:
    - Campos nuevos: memberId, canRead en teamModuleAccess
    - Relaciones cascada para integridad referencial
    - Permisos por miembro, no por team

- **Nov 24, 2025 - COMPLETADO**: Sistema Completo de Calendario con Disponibilidad y Enlace Público
  - ✅ Agregadas tablas `calendar_availability` y `calendar_config` al schema
  - ✅ Nueva columna `linkedStoreIds` removida (causaba error en creación de chatbots)
  - ✅ Rutas API completas para configuración de horarios de atención
  - ✅ Módulo de calendario actualizado con:
    - Alerta informativa sobre compartir por WhatsApp
    - Configuración de horarios de atención (días y horas)
    - URL pública visible para copiar y compartir
    - Vista pública tipo Calendly para que clientes agenderen citas
  - ✅ Nueva página pública: `client/src/pages/public-calendar.tsx`
  - ✅ Rutas públicas en App.tsx para acceso sin autenticación
  - ✅ Funcionalidad completa: clientes ven disponibilidad, seleccionan hora, agendan cita

- **Nov 24, 2025 - COMPLETADO**: Aplicación de Scroll Fixes Universales
  - ✅ Agregado `min-h-0` a contenedores flex principales en 11 páginas
  - ✅ Pages actualizadas: Dashboard, Connections, Sales-funnel, Survey-editor, Calendar, Chatbots, Surveys, Raffle-management, CRM Clients, CRM Leads
  - ✅ Conversations.tsx ya tenía `min-h-0` desde antes
  - ✅ `min-h-0` permite que los contenedores flex se hagan más pequeños y el scroll funcione correctamente
  - ✅ Survey-editor también agregó `flex flex-col` para el layout correcto
  - ✅ Patrón aplicado: `<div className="h-full flex flex-col bg-background min-h-0">`

- **Nov 23, 2025 - COMPLETADO**: Rediseño de Rifas a Tabla Profesional
  - ✅ Conversión de grid de cards compactos a tabla profesional (como encuestas)
  - ✅ Columnas: Título, Descripción, Boletos, Precio, Estado, Acciones
  - ✅ Avatar con iniciales de título para cada rifa
  - ✅ Estado con badges de color (Borrador, Activa, Cerrada, Finalizada)
  - ✅ Indicador "En línea" cuando rifa está publicada
  - ✅ Hover effects y alternancia de filas para mejor legibilidad
  - ✅ Acciones consistentes: Ver, Copiar, Publicar, Eliminar
  - ✅ Base de datos: Agregadas tablas raffle_customers + columna whatsapp_contact_number

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
- Calendar: Sistema completo con horarios de atención, disponibilidad pública, y agendar citas estilo Calendly

## Deployment & Access Configuration

### Server Configuration
- **Frontend Port**: 5000 (bound to 0.0.0.0:5000)
- **Backend**: Express.js running on same port with Vite proxy (port 5000)
- **Database**: PostgreSQL via Neon (connection string via DATABASE_URL env var)
- **Workflow**: "Start application" runs `npm run dev`

### URL Access
- **Local Development**: http://localhost:5000 or http://127.0.0.1:5000
- **Public URL** (once deployed): Auto-generated .replit.app domain
- **Public Calendar Access**: `/public-calendar/{publicShareToken}` (no auth required)
- **Public Survey Access**: `/survey/{surveyId}` (no auth required)
- **Public Raffle Access**: `/raffle-public/{raffleId}` (no auth required)

### Authentication & Session
- Custom session-based authentication
- Session stored in PostgreSQL
- Requires login for protected routes
- Public pages accessible without authentication

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
- **Calendar**: Complete system with admin interface for configuration, and public booking view for customers

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
- **Calendar Module**: 
  - Admin interface with monthly calendar grid view
  - Configuration of business availability by day of week
  - Public booking URL for customer access
  - Event duration settings
  - Automatic time slot generation based on availability
  - Conflict prevention (booked slots unavailable)
- **Public Calendar View** (Calendly-style):
  - No authentication required
  - Shows business name and description
  - Displays available dates and time slots
  - Customer booking form (name, phone, email, notes)
  - Automatic confirmation
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
- **Calendar Module**:
  - Admin configuration: availability by day/time, business details, event duration
  - Public booking: customers see available slots, book appointments
  - Automatic confirmation and WhatsApp integration ready
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

## Database Schema - Key Tables

### Calendar Tables
- **calendar_events**: Stores individual appointments
  - Fields: id, userId, title, description, startTime, endTime, contactName, contactPhone, status, isActive, createdAt
- **calendar_availability**: Stores business hours per day of week
  - Fields: id, userId, dayOfWeek (0-6), startTime, endTime, isActive, createdAt
- **calendar_config**: Stores calendar configuration and public sharing token
  - Fields: id, userId, isPublicBookingEnabled, eventDurationMinutes, publicShareToken, businessName, businessDescription, createdAt, updatedAt

### Key Routes

#### Calendar API Routes (Admin)
- `GET /api/calendar/:userId` - Get all events for a user
- `POST /api/calendar` - Create new event
- `PATCH /api/calendar/:id` - Update existing event
- `DELETE /api/calendar/:id` - Delete event
- `PATCH /api/calendar/status` - Toggle calendar active/inactive status
- `GET /api/calendar/config/:userId` - Get calendar configuration
- `PATCH /api/calendar/config/:userId` - Update calendar configuration

#### Calendar Availability Routes (Admin)
- `GET /api/calendar/availability/:userId` - Get all availability slots for user
- `POST /api/calendar/availability` - Create new availability slot (day + hours)
- `PATCH /api/calendar/availability/:id` - Update availability slot
- `DELETE /api/calendar/availability/:id` - Delete availability slot

#### Public Calendar Routes (No Auth Required)
- `GET /api/calendar/public/:token` - Get public calendar data
- `POST /api/calendar/public/:token/book` - Public user books appointment
- `GET /api/calendar/stats/:token` - Get booking statistics

#### Frontend Routes
- `/calendar` - Admin calendar management panel (authenticated)
- `/public-calendar/:token` - Public booking view (no auth required)

### Important Notes
- ⚠️ All admin routes require authentication (user session)
- ⚠️ Public routes use `publicShareToken` from `calendar_config` table
- ⚠️ Event duration configured in `calendar_config.eventDurationMinutes`
- ⚠️ Availability slots use `dayOfWeek` (0=Sunday, 6=Saturday)
- ⚠️ Time format is 24-hour (HH:MM)

---

## Documentación Detallada - Sesión Nov 25, 2025

### Archivos Modificados en Esta Sesión
1. **client/src/pages/calendar.tsx** - Módulo de calendario admin
   - Dialog mejorado: estructura header/footer/contenido fijo
   - Sincronización mini calendario
   - Alertas motivacionales CRM
   - Protección de horarios con validación
   - CSS: campo hora ajustado a h-9

2. **client/src/pages/public-calendar.tsx** - Calendario público (Calendly-style)
   - Validación de seguridad en tiempo real
   - Validación periódica cada 30 segundos
   - UI mejorada de "no disponible"
   - Estados: calendarUnavailable, unavailableReason

3. **server/routes.ts** - API Backend
   - GET `/api/calendar/public/:token` - validación isPublicBookingEnabled
   - POST `/api/calendar/public/book/:token` - endpoint seguro para visitantes
   - DELETE `/api/calendar/availability/:id` - protección de horarios con conflictos

### Endpoints API - Cambios Importantes

#### GET `/api/calendar/public/:token`
```
Cambio: Ahora valida isPublicBookingEnabled
Retorna: 403 si isPublicBookingEnabled = false
Razón: Seguridad - solo se muestra si ambos: isActive=true Y isPublicBookingEnabled=true
```

#### POST `/api/calendar/public/book/:token` (NUEVO)
```
Propósito: Endpoint seguro para que visitantes agenden citas
Validaciones:
  - Token válido
  - Calendario activo (isActive=true)
  - Public booking habilitado (isPublicBookingEnabled=true)
Actualiza: bookingsCompleted en calendarLinkStats
```

#### DELETE `/api/calendar/availability/:id` (MODIFICADO)
```
Cambio: Protección de horarios con citas agendadas
Algoritmo:
  1. Obtiene el horario (dayOfWeek, startTime, endTime)
  2. Obtiene todas las citas del usuario
  3. Compara: dayOfWeek + rango de horas (convertido a minutos)
  4. Si hay conflicto → Error 409 "No se puede eliminar"
  5. Si OK → Procede a eliminar
```

### Patrones de Código Clave

#### Dialog Mejorado (Header/Footer Fijos)
```jsx
<Dialog open={showNewForm} onOpenChange={setShowNewForm}>
  <DialogContent className="max-w-sm w-[95vw] bg-card border-border p-0 flex flex-col max-h-screen">
    {/* HEADER FIJO */}
    <DialogHeader className="px-4 pt-4 pb-0">
      <DialogTitle>{editingEventId ? "Editar cita" : "Nueva cita"}</DialogTitle>
    </DialogHeader>
    
    {/* CONTENIDO SCROLLEABLE (ÚNICA PARTE QUE SCROLLEA) */}
    <div className="space-y-4 overflow-y-auto flex-1 px-4 py-4">
      {/* Contenido aquí */}
    </div>
    
    {/* FOOTER FIJO */}
    <DialogFooter className="px-4 py-4 border-t border-border flex-shrink-0">
      <Button>Cancelar</Button>
      <Button>Crear</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Validación en Tiempo Real (Calendario Público) - LÓGICA MEJORADA
```jsx
// Función de validación con DOS casos diferentes
const validateCalendarAvailability = async () => {
  const response = await fetch(`/api/calendar/public/${token}`);
  if (response.status === 403 || !response.ok) {
    setCalendarUnavailable(true);
    setUnavailableReason("El calendario ha sido desactivado");
    setShowBookingForm(false);
    return false;
  }
  
  const data = await response.json();
  
  // CASO 1: Calendario completamente desactivado
  if (!data.config.isActive) {
    setCalendarUnavailable(true);
    setUnavailableReason("El calendario ha sido desactivado");
    setPublicBookingDisabled(false);
    setShowBookingForm(false);
    return false;
  }
  
  // CASO 2: Calendario activo pero agendación pública deshabilitada
  if (!data.config.isPublicBookingEnabled) {
    setCalendarUnavailable(false);
    setPublicBookingDisabled(true); // ← DIFERENCIA: no es unavailable, es disabled
    setShowBookingForm(false);
    // Pero retorna true porque el calendario SÍ existe
    return true;
  }
  
  // CASO 3: Todo OK
  setCalendarUnavailable(false);
  setPublicBookingDisabled(false);
  return true;
};

// Validación periódica con intervalo dinámico (2-5 segundos)
useEffect(() => {
  if (!token || loading) return;
  const validationInterval = showBookingForm ? 2000 : 5000;
  const interval = setInterval(() => {
    validateCalendarAvailability();
  }, validationInterval);
  return () => clearInterval(interval);
}, [token, loading, showBookingForm]);

// Validación antes de booking
const handleBooking = async () => {
  const isAvailable = await validateCalendarAvailability();
  if (!isAvailable) return; // Mostrar error
  // ... proceder con booking
};
```

#### Sincronización Mini Calendario
```jsx
// Cuando usuario hace clic en una fecha
setEventDate(`${year}-${month}-${day}`);
// IMPORTANTE: Sincronizar mini calendario
setCalendarMonth(selectedDate.getMonth());
setCalendarYear(selectedDate.getFullYear());
```

### Estados React Agregados en Esta Sesión

#### public-calendar.tsx
```jsx
const [calendarUnavailable, setCalendarUnavailable] = useState(false);
// Indica si el calendario COMPLETO está desactivado (isActive=false)
// Cuando true → muestra alerta roja, oculta todo

const [unavailableReason, setUnavailableReason] = useState("");
// Razón específica cuando calendar está unavailable:
// - "El calendario ha sido desactivado"
// - "El calendario no está disponible"
// - "Error validando disponibilidad del calendario"

const [publicBookingDisabled, setPublicBookingDisabled] = useState(false);
// Indica si el calendario está ACTIVO pero AGENDACIÓN PÚBLICA DESHABILITADA
// Cuando true → muestra calendario + banner amarillo, botón deshabilitado
// Es DIFERENTE a calendarUnavailable
```

### Mensajes de Toast - Estándar CRM Implementado

Todos los toasts ahora tienen formato: `{ title, description }`

```javascript
// Crear cita
toast({ 
  title: "✓ ¡Felicidades! Nueva cita agendada", 
  description: "Tu cita ha sido registrada exitosamente en el sistema"
});

// Actualizar cita
toast({ 
  title: "✓ Cita actualizada correctamente", 
  description: "Los cambios han sido guardados"
});

// Eliminar cita
toast({ 
  title: "✓ Cita eliminada", 
  description: "Se ha removido correctamente del calendario"
});

// No poder eliminar horario por conflicto
toast({ 
  title: "⚠️ No se puede eliminar", 
  description: "No se puede eliminar este horario porque hay citas agendadas en ese rango horario. Elimina o edita las citas primero.",
  variant: "destructive"
});

// Calendario desactivado durante booking
toast({ 
  title: "⚠️ Calendario desactivado", 
  description: unavailableReason,
  variant: "destructive"
});
```

### CSS Changes

#### Campo de Hora
```
Antes: className="w-full max-w-xs text-xs h-8 sm:h-9 bg-secondary/40 border-border"
Ahora: className="w-full text-xs h-9 bg-secondary/40 border-border"
Razón: Consistencia visual con otros campos (h-9), sin variaciones responsive
```

### Seguridad Implementada

#### 1. Protección de Horarios
- No permite eliminar horario si hay citas en ese rango
- Comparación: dayOfWeek + horas (convertido a minutos)
- Error: 409 Conflict

#### 2. Validación de Calendario Público
- Verifica isActive al cargar
- Verifica isPublicBookingEnabled al cargar
- Valida periódicamente cada 30 segundos
- Valida antes de procesar booking

#### 3. Cierre Automático de Formulario
- Si admin desactiva durante agendación → se cierra formulario
- Si admin desactiva public booking → se muestra UI de no disponible

### Notas Importantes para Futuro Desarrollo

1. **Dialog Con Scroll**
   - SIEMPRE: header/footer con `p-0 flex flex-col`
   - CONTENIDO CENTRAL: `overflow-y-auto flex-1` es el ÚNICO que scrollea

2. **Validación Temporal (Dinámico: 2-5 segundos)**
   - Intervalo dinámico según contexto:
     - **2 segundos**: Cuando usuario está llenando formulario de booking (showBookingForm=true)
     - **5 segundos**: Cuando está navegando el calendario (showBookingForm=false)
   - Esto permite detección ultra-rápida sin afectar performance
   - El intervalo cambia automáticamente en el useEffect que depende de [showBookingForm]
   - Nunca aumentar a más de 10s (UX pobre si se hace cambio en admin)

3. **Mensajes de Error 409**
   - Usar HTTP 409 Conflict para: integridad referencial, conflictos de estado
   - Leer error JSON en frontend: `const error = await response.json()`

4. **Toasts con Descripción**
   - SIEMPRE agregar descripción cuando es beneficioso
   - Ayuda al usuario a entender QUÉ pasó y POR QUÉ

5. **Sincronización de Estado**
   - Mini calendario: sincronizar mes/año cuando se selecciona fecha
   - Evita confusión del usuario

### Flujo Completo de Seguridad - Ejemplo

```
Usuario 1: Abre /public-calendar/:token ✓ Funciona (calendario activo)
  ↓ (entra a formulario de booking)
  ↓
Admin: Desactiva calendario desde módulo Citas
  ↓
Sistema: Detecta cambio en validación periódica (máximo 30s)
  ↓
Usuario 1: Ve que formulario se cerró + toast "Calendario desactivado"
  ↓
Usuario 1: Recarga página → Ve UI roja de "No disponible"
  ↓
OU: Si Usuario 1 intenta hacer booking
  ↓
Frontend: Valida antes de enviar → detecta cambio
  ↓
Backend: Retorna 403 + error message
  ↓
Usuario 1: Ve toast "Calendario desactivado" + razón específica
```
