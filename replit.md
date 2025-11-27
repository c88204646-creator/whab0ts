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

## Session Updates - November 27, 2025

### Major Refactoring: Module Elimination
**Objective**: Streamline the application by removing AI-related modules to focus on essential business functionality.

#### 1. Complete Removal of Chatbots & AI Providers Modules ✅ COMPLETED
**Scope**: Systematically eliminated all chatbot automation features from the entire codebase.

**Removed Components**:
- AI Providers module (database schema, backend routes, frontend pages)
- Chatbots main module
- Chatbot Rules sub-module
- Knowledge Base (categories, subcategories, items)
- Chatbot Activities tracking
- Chatbot Statistics
- All associated type definitions and database relations

**Files Modified**:
- `shared/modules.ts`: Removed module registrations from MODULES array
- `shared/schema.ts`: Removed all chatbot table definitions, relations, and type exports
- `server/routes.ts`: Removed all API endpoints related to chatbots and AI providers
- `server/storage.ts`: Removed all storage interface methods for chatbot operations
- `client/src/App.tsx`: Removed chatbot page routes from navigation
- Various component files: Cleaned up orphaned references

**Bugs Found & Fixed During Removal**:

1. **Compilation Error - Undefined Table References** ❌ → ✅
   - **Issue**: After deleting chatbot tables, schema.ts still referenced `chatbotStats`, `chatbots`, `chatbotRules`, etc.
   - **Error**: `ReferenceError: chatbotStats is not defined` at line 358
   - **Solution**: 
     - Removed `chatbotStatsRelations` export
     - Removed all chatbot-related insert schemas (insertChatbotSchema, insertChatbotRuleSchema, insertKnowledgeBaseSchema, etc.)
     - Removed all chatbot type exports (Chatbot, ChatbotRule, ChatbotStats, KnowledgeBase*, etc.)
     - Updated comments to remove references to removed modules

2. **Import Statement Cleanup** ✅
   - Removed unused Select components imports in sales-funnel.tsx
   - Added DropdownMenu imports where needed for new designs

### UI Improvements: Análisis de Conversión Module

#### 2. Header Redesign - Teams-Style Panel ✅ COMPLETED
**Objective**: Modernize the "Análisis de Conversión" header to match the professional style of the Teams module.

**Changes**:
- **Icon Update**: Changed from generic trending icon to cyan-themed design (bg-cyan-500/15, border-cyan-500/20)
- **Alert Banner**: Added informative banner with cyan theme explaining the funnel analysis functionality
- **Metrics Row**: Added 4 KPI cards in the header displaying:
  - Total Contactos (Blue icon)
  - Tasa Conversión (Cyan icon)
  - Conversiones Completadas (Green icon)
  - En Negociación (Orange icon)
- **Consistent Styling**: All elements use the same gradient backgrounds, borders, and spacing as the Teams module

**File Modified**: `client/src/pages/sales-funnel.tsx` (lines 207-283)

#### 3. Account Selector Redesign - Conversaciones Module ❌ → ✅
**Bug**: Selector de cuenta was misaligned with squished text
- **Issue**: SelectItem had `p-0` (no padding) while content inside had conflicting `py-2 px-2`
- **Root Cause**: Inconsistent padding structure causing visual misalignment
- **Solution**: Adjusted SelectItem to use `py-1.5 pl-2 pr-2` and removed redundant inner padding

**File Modified**: `client/src/pages/conversations.tsx` (line 576)

#### 4. Account Selector Redesign - Conversaciones Module ✅ COMPLETED
**Objective**: Replace large Select dropdown with compact, professional dropdown menu.

**Changes**:
- **Replaced**: Large Select component (w-60 h-9) with button + DropdownMenu
- **Button Style**: Small, compact button (h-7) showing current account with status indicator and chevron
- **Dropdown Content**: 
  - Header with "Cuentas disponibles" label
  - List of all available accounts with phone numbers
  - Active account highlighted with cyan background
  - Status badges showing "Conectado"
  - Max height with scroll for many accounts
- **Integration**: Tooltip added to sync button for better UX

**Files Modified**: 
- `client/src/pages/conversations.tsx` (lines 543-640)
- Added import for `ChevronDown` icon

**Result**: More professional, compact design that matches overall application aesthetic

#### 5. Account Selector Redesign - Sales Funnel ✅ COMPLETED
**Objective**: Make the account selector in Análisis de Conversión elegant and consistent with the panel design.

**Changes**:
- **Replaced**: Standard Select with dropdown menu button
- **Button Style**: Elegant button with:
  - Card background (`bg-card`)
  - Border styling (`border-border/60`)
  - Hover elevation effect
  - Chevron indicator
- **Dropdown Features**:
  - Professional header with "Cuentas disponibles"
  - Account list with device names and phone numbers
  - Cyan highlight for active account
  - Emerald status indicators
  - "Activa" status badges
- **Consistency**: Matches the professional style of the right panel (Indicadores Clave)

**Files Modified**: `client/src/pages/sales-funnel.tsx`
- Replaced Select imports with DropdownMenu imports (lines 1-13)
- Redesigned account selector component (lines 221-272)

**Result**: Seamless integration with the Sales Funnel design language

### Verification & Testing ✅

**Module Status**: 
- ✅ Análisis de Conversión fully functional
- ✅ All sections working correctly:
  - Header with metrics KPIs
  - Alert banner displaying context
  - Funnel stages visualization
  - Right panel with detailed analytics
  - Account selector responsive and elegant
  - Interactive stage cards
  - Details modal with conversation listing
- ✅ Account switching works smoothly
- ✅ No console errors in application functionality
- ✅ WhatsApp sync endpoint responding correctly
- ✅ Real-time data updates functioning

**API Endpoints Verified**:
- GET `/api/conversations` - Working (returns 6 conversations)
- GET `/api/whatsapp-accounts` - Working (returns connected account)
- POST `/api/conversations/sync/:accountId` - Working (processes sync successfully)
- GET `/api/leads`, `/api/clients`, `/api/tasks`, etc. - All operational

**Known Minor Issues**:
- Babel/Cartographer warning in contact-profile-panel.tsx (non-critical, doesn't affect functionality)
- PostCSS plugin warning (framework-level, doesn't impact application)

### Architecture Notes

**Module Elimination Methodology**:
1. Frontend layer: Remove UI pages and routes first
2. API layer: Remove backend endpoints
3. Database layer: Remove schema tables and relations
4. Type system: Remove type definitions and exports
5. Module registry: Remove from modules.ts registration

**This approach ensures**:
- No orphaned references
- Clean compilation
- Proper dependency chain resolution
- Maintainable codebase

### Design System Notes

**UI Pattern Consistency**:
- Dropdown menus now standardized across modules using DropdownMenu component
- Account selectors follow the same pattern (compact button + dropdown)
- Headers use consistent gradient backgrounds
- KPI cards use unified styling (bg-muted/20, border-border/40)
- Alert banners use semantic color coding (cyan for primary actions)

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
