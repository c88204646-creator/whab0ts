# Proyecto WhatsApp CRM - Plataforma de Integración

## Estado Actual
- **Módulo Facebook**: 🚫 OCULTO DEL MENÚ - Pendiente de solución de automatización real
- **Módulo CRM**: ✅ 2 módulos principales: Clientes y Leads
- **Módulo Calendario**: ✅ Sistema completo de gestión de citas integrado con WhatsApp
- **Sistema de Encuestas**: ✅ Con mejoras de UI

## 🆕 MÓDULO CALENDARIO - Gestión de Citas Integrado con WhatsApp

### Características Implementadas
- ✅ Vista visual de calendario con grid del mes actual
- ✅ Navegación entre meses
- ✅ Selector de país con banderas y códigos para más de 30 países
- ✅ Ingreso manual de número de WhatsApp con validación en tiempo real
- ✅ Indicadores visuales de días con eventos (puntos SVG)
- ✅ Panel lateral mostrando eventos del día seleccionado
- ✅ Creación de citas con titulo y descripción
- ✅ Estados de cita: Pendiente, Confirmada, Cancelada
- ✅ Edición y eliminación de eventos
- ✅ Toggle de Activo/Inactivo para el calendario
- ✅ Base de datos PostgreSQL para persistencia

### Ubicación en el Sistema
- **Ruta**: `/calendar`
- **Menú**: WhatsApp > Calendario
- **Tabla DB**: `calendar_events` (userId, title, description, startTime, endTime, contactName, contactPhone, status, isActive)

### Flujo de Uso

1. **Ver calendario:**
   - Click en "Calendario" en el menú WhatsApp
   - Se muestra grid del mes actual
   - Días con eventos tienen punto visual (●)

2. **Crear cita:**
   - Click en "Nueva cita" o selecciona un día
   - Ingresa nombre del contacto
   - Selecciona país y escribe número de WhatsApp (valida en tiempo real)
   - Completa: Título, descripción, inicio y fin
   - Confirmación automática

3. **Gestionar cita:**
   - Click en día para ver eventos
   - Botón 🗑️ para eliminar

### Endpoints API
- GET `/api/calendar/:userId` - Obtener citas del usuario
- POST `/api/calendar` - Crear cita
- PATCH `/api/calendar/:id` - Actualizar estado/detalles
- DELETE `/api/calendar/:id` - Eliminar cita

## Estructura del Menú Principal
```
Sidebar:
├── WhatsApp
│   ├── Conversaciones
│   ├── Conexiones
│   ├── Chatbots
│   └── Calendario 🆕
├── Encuestas
└── CRM
    ├── Clientes
    └── Leads

[Facebook module oculto por ahora]
```

## Módulos Implementados

### 1. WhatsApp Module
- Gestión de cuentas WhatsApp
- Conversaciones y mensajes
- Chatbots con inteligencia artificial
- Knowledge Base
- **Calendario para agendamiento de citas con validación de WhatsApp** 🆕

### 2. Encuestas (Surveys)
- Crear encuestas con preguntas
- Estado activo/pausado visible en tarjetas
- DatePicker personalizado con tema oscuro

### 3. CRM Module Simplificado
- **Clientes (Clients)**: Gestión de clientes
- **Leads**: Seguimiento de prospectos

### 4. Facebook Module (OCULTO DEL MENÚ - Pendiente)
- **Cuentas de Facebook**: Gestión de cuentas
  - Ruta: `/facebook` (acceso directo por URL)
  - Autenticación segura sin almacenar credenciales
  - Selector de cuentas con estado
  - UI intuitivo con popup de login
  - Token de sesión para operaciones futuras

- **Automatización de Posts**: Infraestructura lista
  - Ruta: `/facebook-automation` (acceso directo por URL)
  - UI para ejecutar acciones automáticas (comentarios, reacciones)
  - Seleccionar múltiples cuentas para ejecutar
  - Validación de URLs de posts de Facebook
  - **Status**: Esperando implementación real de automatización

## Características Técnicas

### Frontend
- React con TypeScript
- Wouter para routing
- Shadcn/UI components (incluye Select para país)
- TanStack React Query
- Dark mode exclusivo
- Interfaz compacta y profesional
- Selector de país con banderas (30+ países)
- Validación de números en tiempo real

### Backend
- Express.js
- Drizzle ORM
- PostgreSQL (Neon)
- WebSocket para comunicación real-time
- Validación Zod
- Sistema de sesiones

### Base de Datos
- Table: calendar_events
- Campos: userId, title, description, startTime, endTime, contactName, contactPhone, status, isActive, createdAt
- Relaciones establecidas con users
- Índices: userId para búsquedas eficientes

## Rutas Disponibles

### Calendario
- `/calendar` - Página principal de gestión de citas
- GET `/api/calendar/:userId` - Obtener citas del usuario
- POST `/api/calendar` - Crear nueva cita
- PATCH `/api/calendar/:id` - Actualizar cita (status, detalles)
- DELETE `/api/calendar/:id` - Eliminar cita

### Facebook Module
- `/facebook` - Página principal de cuentas de Facebook
- POST `/api/facebook-auth/start-login` - Iniciar sesión
- POST `/api/facebook-auth/complete-login` - Completar y guardar sesión
- GET `/api/facebook-accounts/:userId` - Obtener cuentas del usuario
- DELETE `/api/facebook-accounts/:id` - Eliminar cuenta

### Facebook Automation
- `/facebook-automation` - Página de automatización de posts
- POST `/api/facebook-automation/execute` - Ejecutar automatización

## Preferencias del Usuario
- Idioma: Español
- Modo: Dark mode exclusivo
- Diseño: Compacto y profesional
- Fechas: Formato datetime para calendario
- Integración: WhatsApp con validación de números en tiempo real
- Validación: País selector + número manual + validación en tiempo real
- Funcionalidad: Real (sin simulaciones)
- CRM: Simplificado a Clientes y Leads

## Cambios Recientes
- ✅ Rediseño de calendario a vista visual con grid del mes
- ✅ Cambio de selector de contactos a entrada manual de número WhatsApp
- ✅ Implementación de selector de país con banderas y códigos
- ✅ Validación en tiempo real de números telefónicos
- ✅ Eliminación de módulos CRM: Proveedores, Proyectos, Facturación, Cotizaciones, Sistema Bancario
- ✅ CRM ahora solo contiene: Clientes y Leads

## Archivos Importantes

### Calendario
- `/client/src/pages/calendar.tsx` - Página de calendario con selector de país y validación
- `/client/src/lib/countries.ts` - Datos de países, banderas y validación
- `/server/storage.ts` - Métodos CRUD para eventos
- `/server/routes.ts` - Endpoints /api/calendar
- `/shared/schema.ts` - Tabla calendarEvents, InsertCalendarEvent

### Facebook
- `/client/src/pages/crm-facebook.tsx` - Página de gestión de cuentas
- `/client/src/pages/facebook-automation.tsx` - Página de automatización
- `/server/facebook-auth.ts` - Lógica de autenticación
- `/server/facebook-automation.ts` - Servicio de automatización
- `/shared/schema.ts` - Tabla FacebookAccount

### Componentes Compartidos
- `/client/src/components/app-sidebar.tsx` - Menú lateral (actualizado)
- `/client/src/App.tsx` - Router (actualizado)

## Próximos Pasos Recomendados

### Mejoras al Calendario
1. **Sincronización con WhatsApp**
   - El chatbot envía recordatorios en la fecha/hora de la cita
   - Envía confirmación cuando usuario confirma

2. **Notificaciones**
   - Toast cuando se crea/actualiza cita
   - Recordatorios 24h antes
   - Notificación cuando chatbot agenda cita

3. **Funcionalidades Avanzadas**
   - Duración automática de citas
   - Calendario visual (month/week/day view)
   - Disponibilidad automática para chatbot
   - Historial de cambios

### Facebook Automation Completa
1. **Implementación Puppeteer**: Conectar automatización real con sesiones guardadas
2. **Mejoras de UI**: Historial de automatizaciones, logs en tiempo real
3. **Integraciones Futuras**: API Graph de Facebook, gestión de anuncios, analytics
