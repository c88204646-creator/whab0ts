# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It aims to provide businesses with tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, running promotional raffles, and analyzing sales funnels. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management, a simplified CRM, a robust raffle management system, and an advanced Sales Funnel analytics dashboard with automatic chat classification. The platform also includes a Help Widget (estilo Intercom) for user support and learning. The platform is built for efficiency, real-time interaction, and a professional user experience.

## Recent Changes
- **Nov 23, 2025 - COMPLETADO**: Help Widget estilo Intercom para soporte y documentación
  - ✅ Widget flotante en bottom-right corner (estilo Intercom)
  - ✅ 12 artículos de ayuda sobre uso de todos los módulos
  - ✅ Búsqueda en tiempo real por título, contenido y palabras clave
  - ✅ Categorización de artículos (conversations, chatbots, calendar, surveys, raffles, crm, analytics, general)
  - ✅ UI limpia con navegación back/forward entre artículos
  - ✅ 100% client-side (sin dependencias de servidor)
  - ✅ Dark mode integrado con tema de la plataforma
  - ✅ Componente: client/src/components/help-widget.tsx
  - ✅ Sin IA - solo base de conocimiento documentada

- **Nov 23, 2025 - ANTERIOR**: Sistema de Clasificación de Chats - Embudo de Ventas (Sales Funnel)
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
- **Help Widget**: Floating Intercom-style widget with search and KB articles
- **Analytics**: Sales Funnel module with automatic chat classification and visualization

### Technical Implementations
- **Real-time Communication**: WebSocket for instant updates with proper queryKey cache invalidation.
- **Data Fetching**: TanStack React Query with hierarchical queryKeys for proper cache management.
- **Validation**: Zod for schema validation.
- **Help/Support**: Client-side widget with hardcoded KB articles (no server calls needed)
- **Live Chat Widget**: Independent chatbot system for sales funnels, featuring sequential conversation flow for lead capture, product selection, and real-time appointment booking with calendar availability checks.
- **Calendar Module**: Visual monthly grid, country selector with real-time WhatsApp number validation, event indicators, and detailed event management (create, edit, delete, status).
- **Surveys Module**: Public URLs for responding and viewing results, custom DatePicker, and real-time statistics.
- **Raffles Module**: Complete raffle management system with independent financial controls per raffle
- **Sales Funnel Module**: 
  - Automatic chat classification using lightweight open source NLP patterns
  - Default categories: sales, support, complaint, vip, inquiry, other
  - Keyword matching and regex pattern recognition
  - Confidence scoring (0-100)
  - Visualization: funnel chart showing chat distribution by category
  - Real-time classification as messages arrive

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
