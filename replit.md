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
*   **WhatsApp Integration**: Core for streamlined customer interactions. Session persistence is improved to maintain connections across server restarts, with increased QR attempts, checks for valid credential files, and a keep-alive mechanism.
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

## External Dependencies
*   **WhatsApp API**: For core CRM communication.
*   **Calendly (concept)**: Inspiration for public booking calendar.
*   **Intercom (concept)**: Inspiration for the help widget.
*   **Shadcn UI**: For UI components and styling.
*   **Drizzle ORM**: For database interactions.
*   **React Query**: For data fetching and state management.
*   **connect-pg-simple**: For persistent session storage in PostgreSQL.
*   **cron-job library**: For scheduling background tasks.
*   **Twilio**: For AI voice calling system (TTS and STT).