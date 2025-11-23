# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It aims to provide businesses with tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, and running promotional raffles. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management, a simplified CRM, and a robust raffle management system. The platform is built for efficiency, real-time interaction, and a professional user experience, with ambitions to expand automation and integration features.

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
- **Real-time Communication**: WebSocket for instant updates.
- **Data Fetching**: TanStack React Query.
- **Validation**: Zod for schema validation.
- **Custom Domains**: Real-time DNS verification for CNAME and TXT records, linking real emails to domains.
- **Live Chat Widget**: Independent chatbot system for sales funnels, featuring sequential conversation flow for lead capture, product selection, and real-time appointment booking with calendar availability checks.
- **Calendar Module**: Visual monthly grid, country selector with real-time WhatsApp number validation, event indicators, and detailed event management (create, edit, delete, status).
- **Surveys Module**: Public URLs for responding and viewing results, custom DatePicker, and real-time statistics.
- **Raffles Module**: Independent system for managing raffles with unique 6-digit tickets, public sales page, buyer data capture, bank account management, Instagram-style stories, and payment verification.

### Feature Specifications
- **WhatsApp Module**: Account management, conversations, AI chatbots, knowledge base, and integrated calendar.
- **CRM Module**: Simplified Clients and Leads management.
- **Facebook Module (Hidden)**: Account management and automation infrastructure (pending full automation implementation).

### System Design Choices
- **Backend**: Express.js.
- **ORM**: Drizzle ORM.
- **Database**: PostgreSQL (Neon) with established relationships and indexing for efficient queries.
- **Session Management**: Custom session system.

## External Dependencies
- **Database**: PostgreSQL (specifically Neon for cloud deployment).
- **Cloud Services**: No explicit cloud provider mentioned for general hosting, but Neon implies a cloud-hosted PostgreSQL.
- **Authentication**: Custom session-based authentication.
- **Third-party APIs**:
    - WhatsApp API (implied for integration and messaging).
    - Facebook Graph API (implied for Facebook module, currently pending deeper integration).
    - Payment Gateway (implied for Raffle module payment verification, but specific provider not named).