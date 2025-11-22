# Proyecto WhatsApp CRM - Plataforma de Integración

## Estado Actual
- **Módulo Facebook**: ✅ COMPLETADO - Menú independiente
- **Módulo Banking**: ✅ Implementado en CRM
- **Módulo CRM**: ✅ 6 sub-módulos implementados
- **Sistema de Encuestas**: ✅ Con mejoras de UI

## Estructura del Menú Principal
```
Sidebar:
├── WhatsApp
│   ├── Conversaciones
│   ├── Conexiones
│   └── Chatbots
├── Encuestas
├── CRM
│   ├── Clientes
│   ├── Proveedores
│   ├── Leads
│   ├── Proyectos
│   ├── Cotizaciones
│   ├── Facturación
│   └── Sistema Bancario
└── Facebook
    └── Cuentas de Facebook
```

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

### 4. Facebook Module (INDEPENDIENTE)
- **Cuentas de Facebook**: Menú propio en sidebar
- Ruta: `/facebook`
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
- Tables: facebook_accounts
- Relaciones establecidas con users
- Campos para sesión y estado

## Próximos Pasos Recomendados

1. **Integración Puppeteer**: Implementar autenticación en Facebook con Puppeteer
2. **Gestión de Sesiones**: Sistema de sesiones persistentes en base de datos
3. **iFrame/Navegador**: Mostrar Facebook dentro de un iframe o ventana modal
4. **WebSocket**: Actualizar estado de sesiones en tiempo real
5. **Selector de Cuentas**: Mejorar experiencia de cambio entre cuentas

## Rutas Disponibles

### Facebook Module
- `/facebook` - Página principal de cuentas de Facebook
- POST `/api/facebook-accounts` - Crear cuenta
- GET `/api/facebook-accounts/:userId` - Obtener cuentas del usuario
- GET `/api/facebook-accounts/detail/:id` - Detalle de cuenta
- PATCH `/api/facebook-accounts/:id` - Actualizar cuenta
- DELETE `/api/facebook-accounts/:id` - Eliminar cuenta

### CRM Banking
- `/crm/banking` - Página de cuentas bancarias
- `/crm/banking/:id` - Detalle de cuenta bancaria

## Preferencias del Usuario
- Idioma: Español
- Modo: Dark mode exclusivo
- Diseño: Compacto y profesional
- Fechas: Formato date-only (sin time)

## Convenciones de Código
- Componentes: `client/src/pages/` y `client/src/components/`
- Routes: `server/routes.ts`
- Storage: `server/storage.ts`
- Schema: `shared/schema.ts`
- Sidebar: `client/src/components/app-sidebar.tsx`

## Archivos Importantes
- `/client/src/pages/crm-facebook.tsx` - Página de Facebook
- `/shared/schema.ts` - FacebookAccount table y schemas
- `/server/storage.ts` - FacebookAccount CRUD methods
- `/server/routes.ts` - Facebook API endpoints
