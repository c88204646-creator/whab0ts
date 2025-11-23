# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It aims to provide businesses with tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, running promotional raffles, and analyzing sales funnels. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management, a simplified CRM, a robust raffle management system, and an advanced Sales Funnel analytics dashboard with automatic chat classification. The platform is built for efficiency, real-time interaction, and a professional user experience, with ambitions to expand automation and integration features.

## Recent Changes
- **Nov 23, 2025 - COMPLETADO**: Sistema de Clasificación de Chats - Embudo de Ventas (Sales Funnel)
  - ✅ Agregadas tablas PostgreSQL: chat_classification_rules y chat_classification_results
  - ✅ Motor de clasificación open source lightweight sin dependencias pesadas
  - ✅ Engine de análisis: detecta categorías (sales, support, complaint, vip, inquiry)
  - ✅ Scoring automático: palabras clave + patrones regex + confianza (0-100)
  - ✅ Métodos de storage para CRUD de clasificación
  - ✅ API endpoint: /api/conversations/funnel
  - ✅ Nueva página UI: Sales Funnel con visualización tipo embudo
  - ✅ Integración en sidebar: nueva sección "Analytics" con enlace a Embudo de Ventas
  - ✅ Flujo: Mensajes clasificados automáticamente en tiempo real
  - ✅ Archivo: server/chat-classifier.ts con clasificación open source

- **Nov 23, 2025 - ANTERIOR**: Arquitectura RAG Segura para Chatbots con IA
  - ✅ Implementado sistema RAG (Retrieval Augmented Generation) para chatbots
  - ✅ **Flujo de respuestas**: Reglas → KB → IA (con contexto) → "No tengo información"
  - ✅ Arquitectura segura: La IA MEJORA respuestas KB, NO inventa información

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

## System Architecture
The platform is structured around a modular design, enabling independent development and deployment of features like CRM, Calendar, Surveys, Raffles, and Sales Funnel Analytics.

### UI/UX Decisions
- **Frontend Framework**: React with TypeScript.
- **Routing**: Wouter.
- **Components**: Shadcn/UI for a consistent and professional look.
- **Styling**: Exclusive dark mode with a compact interface.
- **Internationalization**: Country selector with flags for over 30 countries.
- **Analytics**: Sales Funnel module with automatic chat classification and visualization

### Technical Implementations
- **Real-time Communication**: WebSocket for instant updates with proper queryKey cache invalidation.
- **Data Fetching**: TanStack React Query with hierarchical queryKeys for proper cache management.
- **Validation**: Zod for schema validation.
- **Custom Domains**: Real-time DNS verification for CNAME and TXT records, linking real emails to domains.
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
  - Customizable classification rules per WhatsApp account

### Feature Specifications
- **WhatsApp Module**: Account management, conversations, AI chatbots, knowledge base, and integrated calendar.
- **CRM Module**: Simplified Clients and Leads management.
- **Raffles Module**: Complete with creation, management, public sales pages, and payment verification. Each raffle has financial controls and ticket management.
- **Sales Funnel Module**: Analytics dashboard for analyzing customer interactions by type
  - Automatic chat categorization (sales prospects, support tickets, complaints, VIP customers, inquiries)
  - Confidence-based classification
  - Funnel visualization showing conversion stages
  - Real-time chat flow analysis
  - Default keyword patterns for instant classification (no ML models)
- **Facebook Module (Hidden)**: Account management and automation infrastructure (pending full automation implementation).

### System Design Choices
- **Backend**: Express.js with proper error handling and validation.
- **ORM**: Drizzle ORM with TypeScript for type safety.
- **Database**: PostgreSQL (Neon) with established relationships and indexing for efficient queries.
- **Session Management**: Custom session system with real-time synchronization via WebSocket.
- **API Routes**: RESTful endpoints with public and authenticated variants for cross-platform access.
- **NLP Classification**: Lightweight open source patterns (no heavy ML libraries) using keyword matching and regex

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
  - Open source lightweight NLP using keywords and patterns
  - Funnel visualization with distribution analysis
  - Default categories configured and ready for use

### 🔄 In Progress Modules
- Facebook automation (infrastructure ready)

### 📋 Pending Modules
- Advanced payment gateway integration (Stripe recommended)
- Ticket fulfillment system
- Email notification system
- Sales Funnel: Customizable rules UI (backend ready)
