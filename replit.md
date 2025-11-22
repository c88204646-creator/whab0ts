# Proyecto WhatsApp CRM - Plataforma de Integración

## Estado Actual
- **Módulo Facebook**: 🚫 OCULTO DEL MENÚ - Pendiente de solución de automatización real
- **Módulo Banking**: ✅ Implementado en CRM
- **Módulo CRM**: ✅ 6 sub-módulos implementados
- **Módulo Calendario**: ✅ Sistema completo de gestión de citas integrado con WhatsApp
- **Sistema de Encuestas**: ✅ Con mejoras de UI

## 🆕 MÓDULO CALENDARIO - Gestión de Citas Integrado con WhatsApp

### Características Implementadas
- ✅ Creación de citas con titulo y descripción
- ✅ Selector inteligente de contactos WhatsApp existentes
- ✅ Auto-detección y guardado automático de nombre y número de WhatsApp
- ✅ Estados de cita: Pendiente, Confirmada, Cancelada
- ✅ Confirmación y cancelación de citas rápida
- ✅ Separación entre citas próximas y pasadas
- ✅ Listado automático ordenado por fecha
- ✅ Edición y eliminación de eventos
- ✅ Toggle de Activo/Inactivo para el calendario
- ✅ Base de datos PostgreSQL para persistencia

### Ubicación en el Sistema
- **Ruta**: `/calendar`
- **Menú**: WhatsApp > Calendario
- **Tabla DB**: `calendar_events` (userId, title, description, startTime, endTime, contactName, contactPhone, status, isActive)

### Flujo de Uso

1. **Ver citas próximas:**
   - Click en "Calendario" en el menú WhatsApp
   - Se muestran todas las citas ordenadas por fecha
   - Muestra nombre y número de WhatsApp de cada contacto

2. **Crear cita:**
   - Click en "Nueva cita"
   - Seleccionar contacto de WhatsApp (auto-rellena nombre y teléfono)
   - Completar: Título, descripción, inicio y fin
   - Confirmación automática de estado = "pending"

3. **Gestionar cita:**
   - Botón ✓ para confirmar
   - Botón ✗ para cancelar
   - Botón 🗑️ para eliminar

4. **Chatbot integración:**
   - Chatbot puede agendar citas automáticamente
   - Verifica disponibilidad del calendario
   - Registra información de la cita con datos de WhatsApp

### Endpoints API
- GET `/api/calendar/:userId` - Obtener citas del usuario
- POST `/api/calendar` - Crear cita (requiere title, startTime, endTime, contactName, contactPhone)
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
    ├── Proveedores
    ├── Leads
    ├── Proyectos
    ├── Cotizaciones
    ├── Facturación
    └── Sistema Bancario

[Facebook module oculto por ahora]
```

## Módulos Implementados

### 1. WhatsApp Module
- Gestión de cuentas WhatsApp
- Conversaciones y mensajes
- Chatbots con inteligencia artificial
- Knowledge Base
- **Calendario para agendamiento de citas con integración de contactos** 🆕

### 2. Encuestas (Surveys)
- Crear encuestas con preguntas
- Estado activo/pausado visible en tarjetas
- DatePicker personalizado con tema oscuro

### 3. CRM Module
- **Clientes (Clients)**: Gestión de clientes
- **Proveedores (Suppliers)**: Gestión de proveedores
- **Leads**: Seguimiento de prospectos
- **Proyectos (Projects)**: Gestión de proyectos
- **Cotizaciones (Quotes)**: Generación de cotizaciones
- **Facturación (Billing)**: Sistema de facturas
- **Sistema Bancario**: Cuentas, transacciones, balance

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
- Shadcn/UI components (incluye Select para contactos)
- TanStack React Query
- Dark mode exclusivo
- Interfaz compacta y profesional
- Modal para crear/editar citas
- Selector de contactos integrado
- Listado dinámico de eventos

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

### CRM Banking
- `/crm/banking` - Página de cuentas bancarias

## Preferencias del Usuario
- Idioma: Español
- Modo: Dark mode exclusivo
- Diseño: Compacto y profesional
- Fechas: Formato datetime para calendario
- Integración: Contactos de WhatsApp detectados automáticamente
- Funcionalidad: Real (sin simulaciones)

## Archivos Importantes

### Calendario
- `/client/src/pages/calendar.tsx` - Página de calendario con selector de contactos
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
- `/client/src/components/app-sidebar.tsx` - Menú lateral
- `/client/src/App.tsx` - Router

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
   - Duración automática de citas (ahora es manual)
   - Calendario visual (month/week view)
   - Disponibilidad automática para chatbot
   - Historial de cambios

### Facebook Automation Completa
1. **Implementación Puppeteer**: Conectar automatización real con sesiones guardadas
   - Usar sessionToken guardado para mantener sesión
   - Navegar a posts y ejecutar acciones automáticas
   - Manejar CAPTCHA y verificaciones de seguridad

2. **Mejoras de UI**:
   - Mostrar historial de automatizaciones
   - Logs en tiempo real de ejecución
   - Estadísticas de acciones exitosas

3. **Integraciones Futuras**:
   - API Graph de Facebook para obtener datos
   - Gestión de anuncios
   - Analytics de cuentas
   - Publicaciones programadas
