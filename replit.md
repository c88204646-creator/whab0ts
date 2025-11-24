# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It provides businesses with tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, running promotional raffles, and analyzing sales funnels. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management, a simplified CRM, a robust raffle management system, and an advanced Sales Funnel analytics dashboard with automatic chat classification. The platform also includes a Help Widget (estilo Intercom) for user support and learning. The platform is built for efficiency, real-time interaction, and a professional user experience, aiming for market potential through enhanced customer engagement and sales process optimization.

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
- **Frontend Framework**: React with TypeScript, using Wouter for routing.
- **Components**: Shadcn/UI for a consistent and professional dark-mode aesthetic.
- **List Layouts**: Professional table design for management modules (Surveys, Raffles).
- **Help Widget**: Floating Intercom-style widget with search and knowledge base articles.
- **Analytics**: Sales Funnel module with automatic chat classification and visualization.

### Technical Implementations
- **Real-time Communication**: WebSocket for instant updates with TanStack React Query for data fetching and cache invalidation.
- **Validation**: Zod for schema validation.
- **Audio Transcription**: Utilizes Xenova/Whisper-Tiny (open source, local execution, no external AI API calls) for transcribing WhatsApp audio messages.
- **Live Chat Widget**: Independent chatbot system supporting sequential conversation flows for lead capture, product selection, and real-time appointment booking.
- **Calendar Module**: Features a visual monthly grid, real-time WhatsApp number validation, and comprehensive event management.
- **Surveys Module**: Supports public URLs for responses, custom DatePicker, and real-time statistics.
- **Raffles Module**: Includes a professional table-based management interface, financial controls per raffle, and automated WhatsApp confirmations.
- **Sales Funnel Module**: Implements automatic chat classification using lightweight open-source NLP patterns, keyword matching, regex, and confidence scoring, visualized through a funnel chart.
- **Media Support**: Handles stickers, images, audio, video, and documents with size constraints.
- **WhatsApp QR Generation**: Involves a detailed flow from frontend UI interaction to backend Baileys integration, database persistence, and WebSocket polling for real-time status updates. Each account uses unique session directories for persistence across server restarts.

### Feature Specifications
- **WhatsApp Module**: Account management, conversations, AI chatbots, knowledge base, and integrated calendar.
- **CRM Module**: Simplified Clients and Leads management.
- **Raffles Module**: Complete creation, management, public sales pages, and payment verification.
- **Sales Funnel Module**: Analytics dashboard for classifying and analyzing customer interactions.
- **Help Widget Module**: Intercom-style floating widget with pre-loaded articles, real-time search, and categorization, fully client-side with no server dependency.

### System Design Choices
- **Backend**: Express.js with robust error handling and validation.
- **ORM**: Drizzle ORM with TypeScript for type safety.
- **Database**: PostgreSQL (Neon) with established relationships and indexing.
- **Session Management**: Custom session system with real-time WebSocket synchronization.
- **API Routes**: RESTful endpoints with public and authenticated access.

## External Dependencies
- **Database**: PostgreSQL (Neon for cloud deployment).
- **Third-party APIs**:
    - WhatsApp API (Baileys for local WhatsApp connection simulation and message handling).
    - Facebook Graph API (for Facebook module, pending deeper integration).
    - Payment Gateway (implied for Raffle module payment verification, specific provider not named).
- **Libraries**: `@whiskeysockets/baileys` (WhatsApp connection), `qrcode` (QR to Data URL conversion), `drizzle-orm` (Database access), `@tanstack/react-query` (Frontend caching and polling), `react-hook-form` (Form validation).