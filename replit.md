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
*   **Roles Management Module (Nov 2025 - Estable)**: Comprehensive role-based access control system with complete CRUD operations. Key features:
    *   **Frontend Optimization** (`client/src/pages/roles-creator.tsx`):
        - Mutation sends ONLY changed fields (id + name/permissions/color) to prevent role duplication
        - Separate handlers for name updates vs permission updates
        - Form validation before API calls to prevent unnecessary requests
    *   **Backend Sanitization** (`server/routes.ts` PATCH endpoint):
        - Strict field whitelisting: only `name`, `permissions`, and `color` allowed
        - Prevents passing invalid fields (like `id`) to Drizzle ORM's `update()` method
        - Avoids type conflicts and database errors from unexpected fields
    *   **Database Operations** (`server/storage.ts`):
        - `createRole()` - Creates new role, returns with auto-generated id and timestamps
        - `updateRole()` - Safely updates only specified fields, automatically sets `updatedAt`
        - `deleteRole()` - Only allowed when `usersCount === 0` and not default role
    *   **Default Role Protection**:
        - Every user gets immutable "Administrador" role via PostgreSQL trigger
        - Cannot be deleted or modified (only custom roles are editable)
    *   **Common Pitfalls Avoided**:
        - ❌ Sending full role object causes field conflicts with Drizzle
        - ❌ Missing field whitelisting allows unintended database mutations
        - ❌ Not validating frontend state leads to role duplication on rapid updates
        - ✅ Explicit field selection prevents ORM type errors
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

**IMPORTANTE - Lecciones Aprendidas (Actualizado Nov 2025):**
1. ❌ Xenova/Whisper-Tiny FALLA en Replit (error protobuf, modelo no soportado)
2. ❌ Twilio `<Record transcribe="true">` solo soporta inglés
3. ❌ `numDigits` en Gather con `input="speech"` - INCOMPATIBLES, causa que no capture voz
4. ❌ Gather sin `<Say>` interno puede fallar en reconocimiento
5. ✅ Twilio `<Say voice="Polly.Miguel">` funciona perfectamente para TTS en español
6. ✅ Gather con `input="speech dtmf"` + hints + Say interno = FUNCIONA

**Arquitectura Actual (Funcional - Nov 2025):**
1. **TTS (Texto a Voz)**: Polly.Miguel via TwiML `<Say>` - gratis, incluido en Twilio
2. **Motor de Flujo**: `server/voice-flow-engine.ts` - regex para detección de intenciones
3. **STT (Voz a Texto)**: Twilio Gather con `input="speech dtmf"`, `speechTimeout="3"`, y `hints`

**Flujo de Llamada:**
```
1. Twilio hace POST a /api/voice/twiml con CallSid
2. Server genera saludo profesional y TwiML con Gather
3. Usuario escucha saludo + prompt "¿En qué puedo ayudarle?"
4. Usuario habla → Twilio STT → POST a /api/voice/gather con SpeechResult
5. voice-flow-engine procesa intención → genera respuesta
6. Respuesta via TwiML <Say> → Usuario escucha
7. Loop continúa hasta despedida o timeout
```

**Configuración TwiML que FUNCIONA (ACTUAL):**
```xml
<Response>
  <Say voice="Polly.Miguel" language="es-MX">Saludo inicial aquí</Say>
  <Gather input="speech dtmf" language="es-MX" timeout="10" speechTimeout="3" 
         action="/api/voice/gather" method="POST" 
         hints="hola,sí,no,quiero,cita,precio,información,gracias,adiós,ayuda">
    <Say voice="Polly.Miguel" language="es-MX">¿En qué puedo ayudarle?</Say>
  </Gather>
  <Say voice="Polly.Miguel" language="es-MX">Mensaje si no hay respuesta.</Say>
  <Hangup/>
</Response>
```

**Configuración que FALLA:**
- `<Record transcribe="true">` - Solo inglés, no usar
- Xenova/Whisper - Error de protobuf en runtime
- TwiML vacío o malformado - Causa "Application Error"
- `numDigits="X"` junto con `input="speech"` - Conflicto, no captura voz
- Gather sin `<Say>` interno - Reconocimiento inconsistente

**Optimizaciones de Costo Implementadas:**
- `record: false` en llamadas - Ahorra ~$0.0025/min
- `timeout: 30` segundos máximo de ring
- Status callbacks para tracking sin polling excesivo

**Archivos clave:**
- `server/routes.ts` - Endpoints /api/voice/twiml, /api/voice/gather, /api/voice/status
- `server/voice-flow-engine.ts` - Lógica conversacional con regex + manejo de estados
- `server/ai-voice-service.ts` - Servicio para iniciar llamadas con Twilio

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

## Module Implementation Patterns

### Roles Module (Reference Implementation)
**Problem Solved**: Preventing Drizzle ORM type conflicts and role duplication errors

**Frontend Pattern** (client/src/pages/roles-creator.tsx):
```typescript
// CORRECT: Send ONLY changed fields
updateRoleMutation.mutate({ 
  id: roleId, 
  name: editingRoleName  // Only this field
});

// Or for permissions:
updateRoleMutation.mutate({ 
  id: selectedRole.id, 
  permissions: selectedRole.permissions  // Only this field
});
```

**Backend Pattern** (server/routes.ts PATCH endpoint):
```typescript
// CORRECT: Whitelist only allowed fields
const updateData: any = {};
if (incomingData.name !== undefined) updateData.name = incomingData.name;
if (incomingData.permissions !== undefined) updateData.permissions = incomingData.permissions;
if (incomingData.color !== undefined) updateData.color = incomingData.color;

// WRONG: Passing full object or id to Drizzle
// await db.update(roles).set(incomingData)  // ❌ May include invalid fields
// await db.update(roles).set({...incomingData, updatedAt: new Date()})  // ❌ Type error
```

**Why This Works**:
1. Frontend sends minimal payload = less data, faster updates
2. Backend whitelisting = Drizzle ORM only gets valid fields
3. Drizzle's `.set()` method automates `updatedAt` - no need to manually set
4. Type safety: Only known fields = no Drizzle type conflicts

**Apply This Pattern To**: Any PATCH endpoint in `server/routes.ts` that updates resource fields

## External Dependencies
*   **WhatsApp API**: For core CRM communication and integration.
*   **Calendly (concept)**: Inspiration for the public booking calendar functionality.
*   **Intercom (concept)**: Inspiration for the help widget.
*   **Shadcn UI**: For UI components and styling.
*   **Drizzle ORM**: For database interactions.
*   **React Query**: For data fetching and state management.
*   **connect-pg-simple**: For persistent session storage in PostgreSQL.
*   **cron-job library**: For scheduling background tasks.