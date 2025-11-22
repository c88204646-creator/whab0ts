# Proyecto WhatsApp CRM - Plataforma de Integración

## Estado Actual
- **Módulo Facebook**: ✅ COMPLETADO - Autenticación mejorada sin credenciales
- **Módulo Banking**: ✅ Implementado en CRM
- **Módulo CRM**: ✅ 6 sub-módulos implementados
- **Sistema de Encuestas**: ✅ Con mejoras de UI

## 🆕 CAMBIO IMPORTANTE - Sistema de Autenticación Facebook

### Solución Implementada
El flujo de login ha sido **rediseñado completamente** para evitar errores y manejar CAPTCHA/2FA:

**Antes:**
- ❌ Usuario ingresaba credenciales manualmente
- ❌ Riesgo de error al ingresar datos
- ❌ No manejaba CAPTCHA ni 2FA

**Ahora:**
- ✅ Facebook se abre en un iframe directo
- ✅ Usuario inicia sesión naturalmente en Facebook
- ✅ Maneja CAPTCHA y 2FA automáticamente
- ✅ Solo requiere confirmar cuando termina
- ✅ Las credenciales NO se almacenan (más seguro)

### Flujo de Uso

1. **Inicia proceso:**
   - Usuario hace clic en "Nueva Cuenta"
   - Ingresa nombre para la cuenta
   - Hace clic en "Abrir Facebook"

2. **Inicia sesión:**
   - Se abre modal con Facebook
   - Usuario inicia sesión normalmente
   - Completa CAPTCHA si aparece
   - Completa 2FA si está habilitada
   - Autoriza el acceso si se pide

3. **Confirma sesión:**
   - Después de iniciar sesión, hace clic en "Confirmar Sesión"
   - El sistema valida y guarda
   - Recibe confirmación de éxito

### Seguridad
- ✅ Las credenciales **NO se guardan** en la BD
- ✅ Se guarda un **token de sesión** seguro
- ✅ El usuario mantiene el control total
- ✅ Sin riesgo de credenciales expuestas

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
    ├── Cuentas de Facebook
    └── Automatización
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
  - Autenticación segura sin almacenar credenciales
  - Selector de cuentas con estado
  - UI intuitivo con popup de login
  - Token de sesión para operaciones futuras

- **Automatización de Posts**: Nueva funcionalidad
  - Ruta: `/facebook-automation`
  - Ejecutar acciones automáticas (likes, comentarios, reacciones)
  - Seleccionar múltiples cuentas para ejecutar
  - Procesar URLs de posts de Facebook
  - Soporte para Puppeteer (preparado para automatización futura)

## Características Técnicas

### Frontend
- React con TypeScript
- Wouter para routing
- Shadcn/UI components
- TanStack React Query
- Dark mode exclusivo
- iframe para Facebook login
- Interfaz compacta y profesional

### Backend
- Express.js
- Drizzle ORM
- PostgreSQL (Neon)
- WebSocket para comunicación real-time
- Validación Zod
- Sistema de sesiones de Facebook

### Base de Datos
- Table: facebook_accounts
- Campos: userId, accountName, sessionToken, status, facebookId
- Las credenciales NO se guardan
- Relaciones establecidas con users

## Rutas Disponibles

### Facebook Module
- `/facebook` - Página principal de cuentas de Facebook
- POST `/api/facebook-auth/start-login` - Iniciar sesión
- POST `/api/facebook-auth/complete-login` - Completar y guardar sesión
- GET `/api/facebook-accounts/:userId` - Obtener cuentas del usuario
- DELETE `/api/facebook-accounts/:id` - Eliminar cuenta

### Facebook Automation
- `/facebook-automation` - Página de automatización de posts
- POST `/api/facebook-automation/execute` - Ejecutar automatización
  - Parámetros: postUrl, selectedAccounts[], actionType (like|comment|react), commentText?
  - Retorna: results[] con estado de ejecución por cuenta

### CRM Banking
- `/crm/banking` - Página de cuentas bancarias

## Preferencias del Usuario
- Idioma: Español
- Modo: Dark mode exclusivo
- Diseño: Compacto y profesional
- Fechas: Formato date-only (sin time)
- Autenticación: Browser-based (no manual)

## Archivos Importantes
- `/client/src/pages/crm-facebook.tsx` - Página de gestión de cuentas
- `/client/src/pages/facebook-automation.tsx` - Página de automatización
- `/server/facebook-auth.ts` - Lógica de autenticación
- `/server/facebook-automation.ts` - Servicio de automatización (con soporte Puppeteer)
- `/shared/schema.ts` - Tabla FacebookAccount
- `/server/storage.ts` - Métodos CRUD Facebook
- `/server/routes.ts` - Endpoints de Facebook
- `/client/src/components/app-sidebar.tsx` - Menú lateral

## Próximos Pasos - Automatización Completa
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
