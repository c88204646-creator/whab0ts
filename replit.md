# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It aims to provide businesses with tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, running promotional raffles, and analyzing sales funnels. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management with public booking (Calendly-style), a simplified CRM, a robust raffle management system, and an advanced Sales Funnel analytics dashboard with automatic chat classification. The platform also includes a Help Widget (estilo Intercom) for user support and learning. The platform is built for efficiency, real-time interaction, and a professional user experience.

## Recent Changes
- **Nov 24, 2025 - COMPLETADO**: Refactorización de Módulo de Teams
  - ✅ Cambio de enfoque: De "Teams Independientes" a "Gestión de Miembros del Equipo"
  - ✅ El usuario principal ahora puede invitar miembros que acceden al mismo panel
  - ✅ Página rediseñada: `client/src/pages/teams.tsx` con nueva UI
  - ✅ Roles implementados: Admin, Miembro, Visualizador
  - ✅ Endpoints de API refactorizados:
    - GET /api/team-members - obtiene miembros del equipo
    - POST /api/team-members/invite - invita nuevos miembros
    - PATCH /api/team-members/:memberId - actualiza rol
    - DELETE /api/team-members/:memberId - elimina miembro
  - ✅ Nuevos campos en formulario: email, rol, estado
  - ✅ Alerta informativa clara sobre propósito del módulo
  - ✅ Métricas: total, admin, miembros, visualizadores

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
- `GET /api/calendar/:userId` - Get all events for a user
- `POST /api/calendar` - Create new event
- `GET /api/calendar/availability/:userId` - Get availability slots
- `POST /api/calendar/availability` - Create availability slot
- `PATCH /api/calendar/availability/:id` - Update availability slot
- `DELETE /api/calendar/availability/:id` - Delete availability slot
- `GET /api/calendar/config/:userId` - Get calendar configuration
- `PATCH /api/calendar/config/:userId` - Update calendar configuration
- `GET /api/calendar/public/:token` - Get public calendar data (no auth required)
