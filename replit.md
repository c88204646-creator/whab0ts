# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It aims to provide businesses with tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, and running promotional raffles. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management, a simplified CRM, and a robust raffle management system. The platform is built for efficiency, real-time interaction, and a professional user experience, with ambitions to expand automation and integration features.

## Recent Changes
- **Nov 23, 2025 - COMPLETADO**: Arquitectura RAG Segura para Chatbots con IA
  - ✅ Implementado sistema RAG (Retrieval Augmented Generation) para chatbots
  - ✅ **Flujo de respuestas**: Reglas → KB → IA (con contexto) → "No tengo información"
  - ✅ Arquitectura segura: La IA MEJORA respuestas KB, NO inventa información
  - ✅ Modificadas funciones de OpenAI y Gemini para aceptar contexto de KB
  - ✅ Cuando NO hay match en KB → responde "No tengo información" (previene alucinaciones)
  - ✅ Cuando SÍ hay match en KB + IA activa → reformula/mejora manteniendo información KB
  - ✅ Prompts de IA incluyen instrucción explícita: "Solo usa información proporcionada"
  - ✅ Seguridad legal: Toda respuesta es rastreable y basada en contenido verificado
  - ✅ Documentación: CHATBOT_AI_ARCHITECTURE.md con especificación completa
  - ✅ Logging: Actividades incluyen tipo: 'knowledge_matched', 'ai_response', 'no_match'

- **Nov 23, 2025 - ANTERIOR**: Sistema Profesional Integral de Rifas
  - ✅ Migrado storage.ts de Maps en memoria a PostgreSQL para persistencia real
  - ✅ Implementado schema completo: raffles, raffleTickets, rafflePurchases, raffleStories, raffleBankAccounts
  - ✅ Creado raffle-management.tsx y raffle-public.tsx funcionales
  - ✅ Sistema de compra, gestión bancaria, galería stories, estadísticas

## User Preferences
- Idioma: Español
- Modo: Dark mode exclusivo
- Diseño: Compacto y profesional
- Fechas: Formato datetime para calendario
- Integración: WhatsApp con validación de números en tiempo real
- Validación: País selector + número manual + validación en tiempo real
- Funcionalidad: Real (sin simulaciones)
- CRM: Simplificado a Clientes y Leads

## System Architecture
The platform is structured around a modular design, enabling independent development and deployment of features like CRM, Calendar, Surveys, and Raffles.

### UI/UX Decisions
- **Frontend Framework**: React with TypeScript.
- **Routing**: Wouter.
- **Components**: Shadcn/UI for a consistent and professional look.
- **Styling**: Exclusive dark mode with a compact interface.
- **Internationalization**: Country selector with flags for over 30 countries.

### Technical Implementations
- **Real-time Communication**: WebSocket for instant updates with proper queryKey cache invalidation.
- **Data Fetching**: TanStack React Query with hierarchical queryKeys for proper cache management.
- **Validation**: Zod for schema validation.
- **Custom Domains**: Real-time DNS verification for CNAME and TXT records, linking real emails to domains.
- **Live Chat Widget**: Independent chatbot system for sales funnels, featuring sequential conversation flow for lead capture, product selection, and real-time appointment booking with calendar availability checks.
- **Calendar Module**: Visual monthly grid, country selector with real-time WhatsApp number validation, event indicators, and detailed event management (create, edit, delete, status).
- **Surveys Module**: Public URLs for responding and viewing results, custom DatePicker, and real-time statistics.
- **Raffles Module**: 
  - Complete raffle management system with independent financial controls per raffle
  - 6-digit ticket system (000001 to user-defined maximum)
  - Public sales pages accessible without authentication
  - Buyer data capture with full contact information
  - Bank account management per raffle for payment collection
  - Instagram-style stories system for raffle promotion
  - Payment verification with ticket checking
  - Real-time statistics and analytics per raffle
  - Multiple purchase and payment status tracking

### Feature Specifications
- **WhatsApp Module**: Account management, conversations, AI chatbots, knowledge base, and integrated calendar.
- **CRM Module**: Simplified Clients and Leads management.
- **Raffles Module**: Complete with creation, management, public sales pages, and payment verification. Each raffle has:
  - General information (title, description, ticket count, price)
  - Media gallery (Instagram-style stories)
  - Bank account configuration for payments
  - Ticket inventory management
  - Purchase tracking with buyer information
  - Payment status management (pending, approved, rejected)
  - Statistics and analytics dashboard
  - Ticket verification system for buyers
- **Facebook Module (Hidden)**: Account management and automation infrastructure (pending full automation implementation).

### System Design Choices
- **Backend**: Express.js with proper error handling and validation.
- **ORM**: Drizzle ORM with TypeScript for type safety.
- **Database**: PostgreSQL (Neon) with established relationships and indexing for efficient queries.
- **Session Management**: Custom session system with real-time synchronization via WebSocket.
- **API Routes**: RESTful endpoints with public and authenticated variants for cross-platform access.

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
  - Architecture: Rules → KB → AI (with context) → "No info"
  - AI improves KB responses (doesn't generate from scratch)
  - Security: Prevents information hallucination in legal/sales contexts
- **Calendar**: Event management with date selection
- **Surveys**: Public survey creation and response collection with analytics
- **Custom Domains**: DNS verification for custom domain linking
- **Raffles**: Complete raffle system (fully implemented Nov 23)

### 🔄 In Progress Modules
- Facebook automation (infrastructure ready)

### 📋 Pending Modules
- Advanced payment gateway integration (Stripe recommended)
- Ticket fulfillment system
- Email notification system
