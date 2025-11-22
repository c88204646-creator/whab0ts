# Proyecto WhatsApp CRM - Plataforma de Integración

## Estado Actual
- **Módulo Facebook**: ✅ COMPLETADO
- **Módulo Banking**: ✅ Implementado
- **Módulo CRM**: ✅ 6 sub-módulos implementados
- **Sistema de Encuestas**: ✅ Con mejoras de UI

## Módulos Implementados

### 1. WhatsApp Module
- Gestión de cuentas WhatsApp
- Conversaciones y mensajes
- Chatbots con inteligencia artificial
- Knowledge Base

### 2. Encuestas (Surveys)
- Crear encuestas con preguntas
- Rango de fechas (date-only)
- Estado activo/pausado visible en tarjetas
- DatePicker personalizado con tema oscuro
- Botón de pausa/reactivación en vista principal

### 3. CRM Module
- **Clientes (Clients)**: Gestión de clientes
- **Proveedores (Suppliers)**: Gestión de proveedores
- **Leads**: Seguimiento de prospectos
- **Proyectos (Projects)**: Gestión de proyectos
- **Cotizaciones (Quotes)**: Generación de cotizaciones
- **Facturación (Billing)**: Sistema de facturas
- **Sistema Bancario**: Cuentas, transacciones, balance

### 4. Facebook Accounts Module (NUEVO)
- Agregar múltiples cuentas de Facebook
- Almacenamiento seguro de credenciales
- Selector de cuentas con estado
- UI para agregar/eliminar cuentas
- Base para integración con Puppeteer
- Rastreo de última sesión activa

## Características Técnicas

### Frontend
- React con TypeScript
- Wouter para routing
- Shadcn/UI components
- TanStack React Query
- Dark mode exclusivo
- DatePicker personalizado
- Interfaz compacta y profesional

### Backend
- Express.js
- Drizzle ORM
- PostgreSQL (Neon)
- WebSocket para comunicación real-time
- Validación Zod

### Base de Datos
- Tables: facebook_accounts (nueva)
- Relaciones establecidas con users
- Campos para sesión y estado

## Próximos Pasos Recomendados

1. **Integración Puppeteer**: Implementar autenticación en Facebook con Puppeteer
2. **Gestión de Sesiones**: Sistema de sesiones persistentes en base de datos
3. **iFrame/Navegador**: Mostrar Facebook dentro de un iframe o ventana modal
4. **WebSocket**: Actualizar estado de sesiones en tiempo real
5. **Selector de Cuentas**: Mejorar experiencia de cambio entre cuentas

## Arquitectura del Módulo Facebook

```
/crm/facebook
├── Página Principal: Lista de cuentas
├── Formulario: Agregar nueva cuenta
├── Detalle: Información y acciones de cuenta
└── Acciones: Login, eliminar, selector
```

## API Endpoints

### Facebook Accounts
- `GET /api/facebook-accounts/:userId` - Obtener cuentas del usuario
- `GET /api/facebook-accounts/detail/:id` - Detalle de cuenta
- `POST /api/facebook-accounts` - Crear cuenta
- `PATCH /api/facebook-accounts/:id` - Actualizar cuenta
- `DELETE /api/facebook-accounts/:id` - Eliminar cuenta

## Preferencias del Usuario
- Idioma: Español
- Modo: Dark mode exclusivo
- Diseño: Compacto y profesional
- Fechas: Formato date-only (sin time)

## Convenciones de Código
- Componentes en client/src/pages/ y client/src/components/
- Routes en server/routes.ts
- Storage en server/storage.ts
- Schema en shared/schema.ts
- Sidebar items en client/src/components/app-sidebar.tsx
