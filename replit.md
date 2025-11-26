# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It provides tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, running promotional raffles, and analyzing sales funnels. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management with public booking (Calendly-style), a simplified CRM, a robust raffle management system, and an advanced Sales Funnel analytics dashboard with automatic chat classification. The platform also includes a Help Widget for user support and learning, built for efficiency, real-time interaction, and a professional user experience.

## User Preferences
- Lenguaje de desarrollo: **Spanish + English code**
- Estilo UI: **Consistencia visual centralizada**
- Arquitectura: **Componentes reutilizables, evita duplicación**
- Prioridad: **UX fluida, cambios en un lugar = aplica en todos**

## System Architecture

### Dynamic Module System
A centralized dynamic module system automatically detects new modules and synchronizes role-based permissions. The `shared/modules.ts` file acts as the single source of truth for all application modules, defining their ID, name, icon, route, and category. Permissions are generated dynamically based on user roles upon login, influencing sidebar navigation and role configuration.

### Core Architectural Principles
1.  **Centralization**: Components like `CalendarGrid` are the single source of truth for UI elements to ensure consistency across the application.
2.  **Props-driven Development**: Component behavior is configured via props, minimizing code duplication.
3.  **Reusability**: Components are designed for reuse across multiple contexts (e.g., admin, public, and form views).
4.  **Consistency**: Visual and functional changes propagate automatically across the application from a single point of modification.

### UI/UX Decisions
*   **Responsive Design**: The application is designed to be responsive across mobile, tablet, and desktop devices, adapting layouts and element sizes dynamically.
*   **Professional and Compact Design**: UI elements like modals, task cards, and views are designed to be compact, professional, and visually appealing, utilizing consistent padding, spacing, and typography.
*   **Themed Elements**: Consistent use of theme colors, gradients, and hover states across the application, especially in dashboards, metrics, and interactive elements.
*   **SVG Iconography**: Modern and scalable SVG icons are used for clarity and visual appeal.
*   **Custom Scrollbars**: Implemented for better user experience in scrolleable content areas.
*   **Real-time Feedback**: Visual feedback for validations, password strength, and status changes.

### Technical Implementations
*   **Team Member Management**: Comprehensive system for managing team members including creation, editing, pausing/activating, and password resets, with robust frontend and backend validation. Includes secure login and admin access validation.
*   **Task Management Module**: Redesigned UI/UX for task analytics, Kanban board, and task cards. Features include dynamic task cards with internal scrolling, compact view menus, and integrated analytics with gradient-based metrics.
*   **Calendar System**: Centralized `CalendarGrid` component ensures consistent UI for all calendar instances (admin, public, mini-calendar in forms). Features include:
    *   Public booking page (Calendly-style) with responsive time slot displays.
    *   Availability management for scheduling appointments.
    *   Dynamic display of events and availability based on context.
    *   Handling of timezones and prevention of accidental deletion of newly created events.
*   **Dynamic Banner Messaging**: Contextual banners adjust messages based on the active tab or section.
*   **Form Validations**: Extensive frontend and backend validations for user inputs, including email RFC, password strength, and required fields.
*   **Error Handling**: Clear error messages and alerts for various scenarios, such as deactivated accounts or invalid inputs.

### Feature Specifications
*   **WhatsApp Integration**: Core of the CRM for streamlined customer interactions and communication.
*   **Live Chat**: Redesigned for sales operations.
*   **Appointment Management**: Integrated WhatsApp calendar for scheduling, public booking, and availability display.
*   **CRM Simplification**: Streamlined CRM functionalities.
*   **Raffle Management**: Robust system for promotional raffles.
*   **Sales Funnel Analytics**: Advanced dashboard with automatic chat classification.
*   **Help Widget**: Intercom-style widget for user support.
*   **AI Voice Calling System**: Intelligent voice agents for phone calls.

### AI Voice System Architecture (NO OpenAI)
El sistema de llamadas de voz IA está diseñado para minimizar costos y NO utiliza OpenAI:

**Componentes principales:**
1. **Transcripción Local (Xenova/Whisper-Tiny)** - `server/audio-transcription.ts`
   - Modelo open source que corre localmente
   - Soporta español e inglés
   - Sin costos de API por transcripción

2. **Motor de Flujo Conversacional** - `server/voice-flow-engine.ts`
   - Detección de intenciones con patrones regex (sin API de IA)
   - Flujos predefinidos para citas, precios, servicios, ubicación, etc.
   - Extracción de slots (fecha, hora, nombre, teléfono)
   - No requiere OpenAI ni ninguna API de IA externa

3. **Twilio Media Stream** - `server/twilio-media-stream.ts`
   - WebSocket bidireccional para audio en tiempo real
   - Conversión mulaw → WAV para transcripción
   - Caché de respuestas TTS para reducir llamadas a ElevenLabs
   - Pre-generación de respuestas comunes al iniciar el servidor

4. **ElevenLabs TTS** - Único servicio de pago (texto a voz)
   - Formato de salida: ulaw_8000 (compatible con Twilio)
   - Modelo: eleven_multilingual_v2 (español de alta calidad)
   - Optimizado con caché para reducir costos

**Flujo de audio:**
```
Usuario habla → Twilio (mulaw 8kHz) → WAV → Xenova/Whisper → Texto
Texto → voice-flow-engine (regex, sin API) → Respuesta
Respuesta → ElevenLabs (ulaw_8000) → Twilio → Usuario escucha
```

**Optimización de costos:**
- Pre-carga de 10 respuestas comunes al iniciar servidor
- Caché de respuestas TTS (máximo 100 entradas)
- Transcripción 100% local (sin costo)
- Detección de intenciones con regex (sin costo)
- Solo ElevenLabs tiene costo (TTS)

### System Design Choices
*   **Backend Validation**: Critical operations are validated on the server-side (`server/routes.ts`) to ensure data integrity and security, especially for user authentication and team member management.
*   **Frontend State Management**: Utilizes `react-query` for data fetching and caching, ensuring UI updates are synchronized with backend changes. `onSuccess` callbacks are used for form resets and UI invalidations.
*   **Component-Based Architecture**: Emphasis on creating reusable React components to maintain consistency and reduce code duplication.
*   **Timestamp Logic**: Implemented with careful consideration for timezones and potential issues, using buffers for deletions and ensuring destructive operations are not performed on GET requests.

## Environment Configuration
The system automatically detects the environment (development/production/staging) using:
- **Server-side**: `NODE_ENV` + `APP_URL` environment variables
- **Client-side**: `window.location.origin`

**Production Environment Variables:**
- `NODE_ENV=production` - Required for proper session handling and security headers
- `APP_URL` - The production URL (e.g., https://whatsbot.lat)
- `SESSION_SECRET` - Secret for session encryption
- `DATABASE_URL` - PostgreSQL connection string

**Session Storage:**
- Development: In-memory (MemoryStore)
- Production: PostgreSQL via `connect-pg-simple` (creates `session` table automatically)

## External Dependencies
*   **WhatsApp API**: For core CRM communication and integration.
*   **Calendly (concept)**: Inspiration for the public booking calendar functionality.
*   **Intercom (concept)**: Inspiration for the help widget.
*   **Shadcn UI**: For UI components and styling.
*   **Drizzle ORM**: For database interactions.
*   **React Query**: For data fetching and state management.
*   **connect-pg-simple**: For persistent session storage in PostgreSQL.
*   **cron-job library**: For scheduling background tasks.