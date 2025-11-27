# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It provides tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, running promotional raffles, and analyzing sales funnels. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management with public booking (Calendly-style), a simplified CRM, a robust raffle management system, and an advanced Sales Funnel analytics dashboard with automatic chat classification. The platform also includes a Help Widget for user support and learning, built for efficiency, real-time interaction, and a professional user experience, aiming to optimize customer engagement and sales processes.

## User Preferences
- Lenguaje de desarrollo: **Spanish + English code**
- Estilo UI: **Consistencia visual centralizada**
- Arquitectura: **Componentes reutilizables, evita duplicación**
- Prioridad: **UX fluida, cambios en un lugar = aplica en todos**

## System Architecture

### Dynamic Module System
A centralized dynamic module system automatically detects new modules and synchronizes role-based permissions. The `shared/modules.ts` file acts as the single source of truth for all application modules, defining their ID, name, icon, route, and category. Permissions are generated dynamically based on user roles upon login, influencing sidebar navigation and role configuration.

### Core Architectural Principles
1.  **Centralization**: Components are the single source of truth for UI elements to ensure consistency.
2.  **Props-driven Development**: Component behavior is configured via props, minimizing code duplication.
3.  **Reusability**: Components are designed for reuse across multiple contexts.
4.  **Consistency**: Visual and functional changes propagate automatically from a single point of modification.

### UI/UX Decisions
*   **Responsive Design**: Adapts across mobile, tablet, and desktop devices.
*   **Professional and Compact Design**: UI elements are compact, professional, and visually appealing with consistent spacing and typography.
*   **Themed Elements**: Consistent use of theme colors, gradients, and hover states.
*   **SVG Iconography**: Modern and scalable icons.
*   **Custom Scrollbars**: Improved user experience in scrollable content areas.
*   **Real-time Feedback**: Visual feedback for validations and status changes.

### Technical Implementations
*   **Roles Management Module**: Comprehensive role-based access control with CRUD operations. Frontend optimization ensures only changed fields are sent, with UI/UX improvements for role cards and navigation. Backend sanitization strictly whitelists fields to prevent database errors, and default roles are protected from modification or deletion.
*   **Team Member Management**: System for creating, editing, pausing/activating team members and resetting passwords, with robust validation.
*   **Task Management Module**: Redesigned UI/UX for task analytics, Kanban board, and dynamic task cards.
*   **Calendar System**: Centralized `CalendarGrid` for consistent UI across all calendar instances, supporting public booking, availability management, and event display with timezone handling.
*   **Dynamic Banner Messaging**: Contextual banners that adjust messages based on the active tab or section.
*   **Form Validations**: Extensive frontend and backend validations for user inputs (e.g., email RFC, password strength).
*   **Error Handling**: Clear error messages and alerts for various scenarios.

### Feature Specifications
*   **WhatsApp Integration**: Core for streamlined customer interactions. Session persistence is improved to maintain connections across server restarts, with increased QR attempts, checks for valid credential files, and a keep-alive mechanism. **NEW:** Conversations now sync in real-time - new chats are automatically created when messages arrive and displayed instantly in the Centro de Conversaciones.
*   **Live Chat**: Redesigned for sales operations.
*   **Appointment Management**: Integrated WhatsApp calendar for scheduling and public booking.
*   **CRM Simplification**: Streamlined CRM functionalities.
*   **Raffle Management**: Robust system for promotional raffles.
*   **Sales Funnel Analytics**: Advanced dashboard with automatic chat classification.
*   **Help Widget**: Intercom-style widget for user support.
*   **AI Voice Calling System**: Intelligent voice agents for phone calls. The system leverages Twilio for TTS (Polly.Miguel) and STT (`Gather` with hints), processed by a custom `voice-flow-engine.ts` for intent detection, minimizing costs by avoiding OpenAI and optimizing Twilio TwiML configurations.

### System Design Choices
*   **Backend Validation**: Critical operations are validated server-side for data integrity and security.
*   **Frontend State Management**: Utilizes `react-query` for data fetching, caching, and UI synchronization.
*   **Component-Based Architecture**: Emphasizes reusable React components for consistency and reduced duplication.
*   **Timestamp Logic**: Careful consideration for timezones and preventing destructive operations on GET requests.

### Module Implementation Patterns
**Roles Module (Reference Implementation)**: Solves Drizzle ORM type conflicts and role duplication.
*   **Frontend Pattern**: Sends minimal payload (only changed fields) for updates.
*   **Backend Pattern**: Whitelists only allowed fields in PATCH endpoints to ensure Drizzle ORM receives valid data, preventing type conflicts and leveraging Drizzle's automatic `updatedAt` handling. This pattern should be applied to any PATCH endpoint updating resource fields.

## WhatsApp Conversations Sync - Implementation Details

### Real-Time Message Synchronization (VALIDATED & WORKING ✅)
The system automatically creates and updates conversations when WhatsApp messages arrive:

1. **Automatic Conversation Creation**: When a message arrives from a new contact, a conversation is automatically created in the database
2. **Real-Time Sync**: The Centro de Conversaciones frontend polls conversations every 5 seconds and displays new chats instantly
3. **Message Handling**: The `messages.upsert` event handler in `server/whatsapp.ts` captures all incoming messages and:
   - Creates new conversations for new contacts
   - Updates existing conversations with latest message and unread count
   - Maintains conversation metadata (status, category, priority, etc.)

### Manual Sync Endpoint
- **POST** `/api/conversations/sync/:accountId` - Manual sync trigger that updates all existing conversations (used by frontend auto-sync)
- Frontend auto-triggers this endpoint when a WhatsApp account is selected
- Backend returns count of newly created/updated conversations

### Current Status (Validated Nov 27, 2025)
✅ **2 conversations successfully synced in real-time:**
- Chat 1: +521334373491 (created automatically when message arrived)
- Chat 2: +521331320416 (original test chat with media messages)

✅ **System behavior validated:**
- New conversations created automatically when messages arrive
- Messages sync in real-time without manual intervention
- Frontend displays conversations instantly after sync
- Connection remains stable without disconnections
- Multiple contacts handled correctly

### Known Limitations
- Baileys `socket.store.chats.getAll()` returns empty array (device doesn't expose full chat list)
- Solution: System now relies on message-based conversation creation instead of device sync
- All new chats appear automatically as messages arrive, ensuring no chats are missed

## External Dependencies
*   **WhatsApp API**: For core CRM communication via @whiskeysockets/baileys library (QR code scanning with session persistence).
*   **Calendly (concept)**: Inspiration for public booking calendar.
*   **Intercom (concept)**: Inspiration for the help widget.
*   **Shadcn UI**: For UI components and styling.
*   **Drizzle ORM**: For database interactions.
*   **React Query**: For data fetching and state management.
*   **connect-pg-simple**: For persistent session storage in PostgreSQL.
*   **cron-job library**: For scheduling background tasks.
*   **Twilio**: For AI voice calling system (TTS and STT).
