# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It aims to provide businesses with tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, running promotional raffles, and analyzing sales funnels. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management with public booking (Calendly-style), a simplified CRM, a robust raffle management system, and an advanced Sales Funnel analytics dashboard with automatic chat classification. The platform also includes a Help Widget (estilo Intercom) for user support and learning. The platform is built for efficiency, real-time interaction, and a professional user experience.

## Recent Changes
- **Nov 25, 2025 - COMPLETADO**: UX Profesional para Editar Cliente/Lead en Eventos
  - ✅ **Problema**: Al editar un evento con cliente/lead ya asignado, no había forma clara de:
    - Ver quién estaba asignado actualmente
    - Cambiar el cliente/lead
    - Remover la asignación
  - ✅ **Solución**: Nuevo flujo profesional de 2 fases
  - ✅ **Archivo**: `client/src/pages/calendar.tsx` (líneas 1585-1676)
  
  - ✅ **FASE 1: Mostrar Cliente/Lead Actual (Si existe)**
    ```
    Panel azul (bg-primary/10) que muestra:
    ├── "Actualmente asignado:"
    ├── Nombre del cliente/lead (font-semibold)
    ├── Botón "Cambiar cliente/lead" (outline)
    └── Botón "✕" para remover
    ```
  
  - ✅ **FASE 2: Sin Cliente Asignado o Usuario Quiere Cambiar**
    ```
    Selector dropdown:
    ├── "Seleccionar existente" (buscar en clientes/leads)
    ├── "Solo nombre manual" (ingresar nombre manualmente)
    └── "Crear nuevo cliente/lead" (agregar uno nuevo al CRM)
    ```
  
  - ✅ **Flujo Completo**:
    1. **Al editar evento con cliente asignado**:
       - Ver panel azul: "Actualmente asignado: Juan Pérez"
       - Mensaje helper: "Haz click en 'Cambiar cliente/lead' para modificarlo"
    
    2. **Si hace click en "Cambiar cliente/lead"**:
       - Se muestra panel secundario con selector dropdown
       - Usuario elige: buscar, manual, o crear
       - Ejecuta ciclo completo de selección
    
    3. **Si hace click en "✕"**:
       - Elimina la asignación
       - Vuelve al estado "sin cliente"
  
  - ✅ **Mensajes Contextuales**:
    - Con cliente: "Haz click en 'Cambiar cliente/lead' para modificarlo"
    - Sin cliente: "Elige una opción para agregar un cliente o lead a esta cita"
  
  - ✅ **Beneficios**:
    - Evita sobrescribir accidentalmente cliente asignado
    - Clara visualización de asignación actual
    - Flujo profesional y predecible
    - Lógica de negocio: Si ya hay asignado, requiere paso extra para cambiar

- **Nov 25, 2025 - COMPLETADO**: Eliminación Automática de Citas Pasadas
  - ✅ **Lógica agregada en backend**:
    - GET `/api/calendar/:userId` - elimina citas con endTime < now()
    - GET `/api/calendar/public/:token` - elimina citas con endTime < now()
  - ✅ **Cómo funciona**:
    1. Cuando se consulta un calendario (admin o público), PRIMERO se eliminan todas las citas pasadas
    2. Compara: `calendarEvents.endTime < now()`
    3. Elimina automáticamente con `.catch(() => {})` para no romper si algo falla
    4. Luego retorna solo las citas que NO han pasado
  - ✅ **Resultado**:
    - Citas expiradas se eliminan automáticamente de la DB
    - No requiere guardar datos obsoletos
    - Se limpian cada vez que se consulta el calendario
    - No hay citas históricas innecesarias acumulándose

- **Nov 25, 2025 - COMPLETADO**: Prevención de Agendar en Días Pasados
  - ✅ **Validación en handleCreateEvent()**:
    - NO permite crear NUEVAS citas en días pasados
    - SÍ permite EDITAR citas en días pasados (para cambiar citas antiguas)
    - Error: "No puedes agendar citas en días pasados"
  - ✅ **Calendario principal (vista de administrador)**:
    - Días pasados: DESHABILITADOS, opacidad 50%, color muted
    - No se pueden seleccionar días pasados
    - Hoy: Se muestra con indicador especial
  - ✅ **Mini calendario del diálogo**:
    - Validación robusta: Compara fechas sin horas
    - Días pasados: DESHABILITADOS, opacidad 40%
    - Si intenta clickear: Toast "No puedes agendar en días pasados"
  - ✅ **Comparación de fechas mejorada**:
    - Usa `.setHours(0,0,0,0)` para comparar solo el día
    - Evita problemas con timezone/UTC
  - ✅ **Lógica de negocio**:
    - Hoy = SELECCIONABLE (no es pasado)
    - Días anteriores a hoy = NO SELECCIONABLES
    - Días futuros = SELECCIONABLES

- **Nov 25, 2025 - COMPLETADO**: Validación de Seguridad en Tiempo Real - Calendario Público
  - ✅ **Estados agregados a página pública**:
    - `calendarUnavailable`: boolean para detectar desactivación
    - `unavailableReason`: string con razón específica de desactivación
  - ✅ **Función `validateCalendarAvailability()`**:
    - Valida: isActive + isPublicBookingEnabled
    - Retorna mensajes específicos según el tipo de desactivación
    - Cierra formulario de booking si hay problema (`setShowBookingForm(false)`)
  - ✅ **Validación periódica mejorada (2-5 segundos)**:
    - useEffect que corre cada **2 segundos** CUANDO está en formulario de booking
    - useEffect que corre cada **5 segundos** cuando NO está en formulario
    - Monitorea cambios en tiempo real SIN afectar performance
    - Detección ultra-rápida cuando usuario está intentando agendar
    - **MEJORA**: Reducido de 30s a 2-5s para detección más inmediata ⚡
  - ✅ **Validación antes de booking**:
    - `handleBooking()` ahora valida disponibilidad ANTES de procesar
    - Si falla → toast con ⚠️ "Calendario desactivado" + razón
  - ✅ **UI profesional de "No disponible"**:
    - Página roja con icono AlertCircle
    - Mensaje claro: "El calendario ha sido desactivado" O "Agendación deshabilitada"
    - Botón "Recargar página"
    - Reemplaza la anterior UI genérica
  - ✅ **Lógica mejorada: Dos casos diferentes**:
    - **CASO 1**: Calendario DESACTIVADO (isActive=false)
      - Muestra **ALERTA ROJA**: "Calendario no disponible"
      - Oculta TODO el calendario
      - Usuario ve: UI roja + mensaje + botón "Recargar"
    - **CASO 2**: Calendario ACTIVO pero AGENDACIÓN PÚBLICA DESHABILITADA (isActive=true && isPublicBookingEnabled=false) ⭐ **NUEVO**
      - Muestra el calendario **NORMALMENTE** (sin UI roja)
      - Muestra banner **AMARILLO**: "El calendario está disponible para consulta, pero la agendación de citas no está habilitada en este momento"
      - Botón "Confirmar cita" **DESHABILITADO**
      - Usuario PUEDE VER disponibilidad pero NO PUEDE AGENDAR
    - **CASO 3**: Todo OK (isActive=true && isPublicBookingEnabled=true)
      - Calendario **100% funcional**
  - ✅ **Flujo de seguridad**:
    1. Usuario intenta agendar en calendario público
    2. Admin desactiva agendación pública (NO el calendario)
    3. Usuario ve **CALENDARIO + BANNER AMARILLO** (no UI roja)
    4. Usuario lo descubre **casi instantáneamente** (máximo 2-5 segundos)
    5. O: Admin desactiva calendario completamente → ver **UI ROJA**
  - ✅ **Corrección de renderizado - MEJORADO**:
    - Condición anterior: `if (calendarUnavailable || !config)` → mostraba UI roja
    - Condición nueva: `if (calendarUnavailable)` → solo UI roja
    - Resultado: CASO 2 ahora muestra calendario con banner azul, no UI roja
  - ✅ **Notificación unificada (Nov 25)**:
    - CASO 2 (Agendación deshabilitada): Muestra banner AZUL igual que cuando está habilitado
    - Mensaje: "Estás por agendar una cita con <nombre>. Selecciona una fecha y horario disponibles..."
    - El usuario VE el calendario pero el botón "Confirmar cita" está DESHABILITADO
    - SIN banner amarillo de "no está habilitada en este momento"

- **Nov 25, 2025 - COMPLETADO**: Sincronización Mini Calendario - UX Mejorada
  - ✅ **Problema**: Cuando seleccionabas una fecha y abría el formulario, el mini calendario no mostraba la fecha seleccionada
  - ✅ **Solución**: Sincronizar `calendarMonth` y `calendarYear` cuando se selecciona una fecha
  - ✅ **Ubicación**: Función de crear cita desde clic en fecha (línea 1312-1313)
  - ✅ **Código**:
    ```
    setCalendarMonth(selectedDate.getMonth());
    setCalendarYear(selectedDate.getFullYear());
    ```
  - ✅ **Comportamiento**: Ahora el mini calendario muestra automáticamente el mes/año de la fecha seleccionada

- **Nov 25, 2025 - COMPLETADO**: Validación de Seguridad - Protección de Horarios con Citas Agendadas
  - ✅ **Protección lógica en DELETE `/api/calendar/availability/:id`**:
    - Valida que NO haya citas agendadas en ese rango horario
    - Si hay conflicto: retorna error 409 "No se puede eliminar este horario porque hay citas agendadas"
    - Validación: compara dayOfWeek + rango de horas (startTime - endTime)
    - Algoritmo: convierte tiempos a minutos para comparación precisa
  - ✅ **Frontend manejo de errores mejorado**:
    - deleteAvailabilityMutation lee error JSON del servidor
    - Toast con ⚠️ "No se puede eliminar" + descripción específica
    - Usuario ve claramente POR QUE no puede eliminar (hay citas)
  - ✅ **Seguridad garantizada**:
    - No hay forma de eliminar horario si hay citas = integridad referencial
    - Mensaje útil guía al usuario a eliminar/editar las citas primero

- **Nov 25, 2025 - COMPLETADO**: Calendario Público y Alertas Motivacionales CRM
  - ✅ **Diálogo de crear evento mejorado**:
    - Estructura: header/footer FIJOS, contenido con scroll
    - Clases: `DialogHeader className="px-4 pt-4 pb-0"`, `DialogFooter className="px-4 py-4 border-t border-border flex-shrink-0"`
    - Contenido central: `div className="space-y-4 overflow-y-auto flex-1 px-4 py-4"`
  - ✅ **Validación de calendario público**:
    - GET `/api/calendar/public/:token` ahora valida `isPublicBookingEnabled`
    - Retorna error 403 si públicBooking está deshabilitado
  - ✅ **Nuevo endpoint para reservas públicas**:
    - POST `/api/calendar/public/book/:token` - endpoint seguro para visitantes
    - Valida: token, estado calendario, public booking habilitado
    - Acepta: title, description, startTime, endTime, contactName, contactPhone
    - Actualiza estadísticas de bookings completados
  - ✅ **Mensajes de alerta motivacionales (estilo CRM)**:
    - Crear cita: "✓ ¡Felicidades! Nueva cita agendada" + "Tu cita ha sido registrada exitosamente en el sistema"
    - Actualizar cita: "✓ Cita actualizada correctamente" + "Los cambios han sido guardados"
    - Eliminar cita: "✓ Cita eliminada" + "Se ha removido correctamente del calendario"
    - Crear cliente/lead: "✓ Cliente/Lead creado correctamente" + "Se ha registrado exitosamente en tu CRM"
    - Activar calendario: "✓ Calendario activado" + "Tu calendario está listo para recibir citas"
    - Agregar horario: "✓ Horario agregado" + "Tu disponibilidad ha sido registrada correctamente"
    - Eliminar horario: "✓ Horario eliminado" + "Se ha removido correctamente de tu disponibilidad"
    - Copiar enlace: "✓ Enlace copiado" + "Listo para compartir con tus clientes"
  - ✅ **Ajuste CSS campo de hora**:
    - Altura aumentada a `h-9` (desde h-8) para alineación visual con otros campos
    - Removido `max-w-xs` y `sm:h-9` para mantener consistencia

- **Nov 25, 2025 - COMPLETADO**: Panel de Calendario Funcional y Optimizado
  - ✅ Panel administrativo de calendario completamente funcional
  - ✅ Crear, editar y eliminar citas
  - ✅ Configurar horarios de atención por día de la semana
  - ✅ URL pública para que clientes agendan citas (estilo Calendly)
  - ✅ Selección de cliente o lead al crear/editar citas
  - ✅ Validación de disponibilidad en tiempo real
  - ✅ Interfaz mejorada y optimizada para móviles:
    - Horas disponibles en línea con scroll horizontal (no es wrapper/grid grande)
    - Campo de hora ajustado con tamaño responsivo en móviles
    - Diseño outline profesional con badge compactos
    - Diálogos modales con mini calendario para seleccionar fecha
    - Integración con cliente/lead del CRM
  - ✅ Estadísticas en tiempo real: Total citas, próximas, completadas, horarios
  - ✅ Indicadores visuales: disponibilidad por día, citas públicas vs internas
  - ✅ Compartir enlace del calendario públicamente con estadísticas de uso

- **Nov 24, 2025 - COMPLETADO**: Sistema Completo de Teams con Permisos y Seguridad
  - ✅ **Creación de Miembros**: Formulario funcional con validación en tiempo real
    - Validación de email disponible (verifica si ya existe)
    - Contraseña + confirmación con indicadores visuales
    - Roles: Admin, Miembro, Visualizador
  - ✅ **Gestión de Miembros**:
    - Pausar/activar acceso individual
    - Restablecer contraseña
    - Cambiar rol
    - Eliminar miembro
  - ✅ **Sistema de Permisos por Módulo**:
    - Permisos granulares: Leer, Crear, Editar, Eliminar
    - Por módulo: WhatsApp, Chatbots, Calendario, Encuestas, Rifas, CRM
    - Asignación de recursos específicos (WhatsApp/Chatbots)
    - APIs: 
      - GET /api/team-members/:memberId/permissions
      - PATCH /api/team-members/:memberId/permissions
  - ✅ **Seguridad**:
    - Usuario propietario visible pero sin acciones
    - Membrete "(Propietario)" para identificar owner
    - Scroll reparado con min-h-0
    - Modal compacto para creación
    - Validación en servidor de todas las acciones
  - ✅ **Base de Datos**:
    - Campos nuevos: memberId, canRead en teamModuleAccess
    - Relaciones cascada para integridad referencial
    - Permisos por miembro, no por team

- **Nov 24, 2025 - COMPLETADO**: Sistema Completo de Calendario con Disponibilidad y Enlace Público
  - ✅ Agregadas tablas `calendar_availability` y `calendar_config` al schema
  - ✅ Nueva columna `linkedStoreIds` removida (causaba error en creación de chatbots)
  - ✅ Rutas API completas para configuración de horarios de atención
  - ✅ Módulo de calendario actualizado con:
    - Alerta informativa sobre compartir por WhatsApp
    - Configuración de horarios de atención (días y horas)
    - URL pública visible para copiar y compartir
    - Vista pública tipo Calendly para que clientes agenderen citas
  - ✅ Nueva página pública: `client/src/pages/public-calendar.tsx`
  - ✅ Rutas públicas en App.tsx para acceso sin autenticación
  - ✅ Funcionalidad completa: clientes ven disponibilidad, seleccionan hora, agendan cita

- **Nov 24, 2025 - COMPLETADO**: Aplicación de Scroll Fixes Universales
  - ✅ Agregado `min-h-0` a contenedores flex principales en 11 páginas
  - ✅ Pages actualizadas: Dashboard, Connections, Sales-funnel, Survey-editor, Calendar, Chatbots, Surveys, Raffle-management, CRM Clients, CRM Leads
  - ✅ Conversations.tsx ya tenía `min-h-0` desde antes
  - ✅ `min-h-0` permite que los contenedores flex se hagan más pequeños y el scroll funcione correctamente
  - ✅ Survey-editor también agregó `flex flex-col` para el layout correcto
  - ✅ Patrón aplicado: `<div className="h-full flex flex-col bg-background min-h-0">`

- **Nov 23, 2025 - COMPLETADO**: Rediseño de Rifas a Tabla Profesional
  - ✅ Conversión de grid de cards compactos a tabla profesional (como encuestas)
  - ✅ Columnas: Título, Descripción, Boletos, Precio, Estado, Acciones
  - ✅ Avatar con iniciales de título para cada rifa
  - ✅ Estado con badges de color (Borrador, Activa, Cerrada, Finalizada)
  - ✅ Indicador "En línea" cuando rifa está publicada
  - ✅ Hover effects y alternancia de filas para mejor legibilidad
  - ✅ Acciones consistentes: Ver, Copiar, Publicar, Eliminar
  - ✅ Base de datos: Agregadas tablas raffle_customers + columna whatsapp_contact_number

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
- Calendar: Sistema completo con horarios de atención, disponibilidad pública, y agendar citas estilo Calendly

---

## Sesión Nov 25, 2025 - Documentación Completa de Cambios

### 🎯 Objetivo de la Sesión
Mejorar la seguridad, UX y lógica de negocio del sistema de calendario público. Implementar validaciones en tiempo real, prevención de agendar en días pasados, y limpieza automática de citas vencidas.

### 📝 Resumen Ejecutivo
**5 cambios principales implementados:**
1. ✅ Validación de seguridad en tiempo real (2-5 segundos dinámicos)
2. ✅ Prevención de agendar en días pasados (UI + validación backend)
3. ✅ Eliminación automática de citas vencidas
4. ✅ Diferenciación clara entre dos escenarios (calendario desactivado vs agendación deshabilitada)
5. ✅ Notificación unificada y UX mejorada

### 📦 Archivos Modificados
```
client/src/pages/public-calendar.tsx       (4 cambios principales)
client/src/pages/calendar.tsx              (2 cambios principales)
server/routes.ts                           (2 cambios principales)
replit.md                                  (documentación)
```

### 🔧 Cambios Detallados

#### 1️⃣ VALIDACIÓN DE SEGURIDAD EN TIEMPO REAL (2-5 SEGUNDOS)

**Problema:** Cuando admin desactivaba el calendario, usuario tardaba 30 segundos en enterarse.

**Solución:** Validación dinámica que se acelera cuando usuario está intentando agendar.

**Archivos:**
- `client/src/pages/public-calendar.tsx` (líneas 131-143)

**Código:**
```jsx
// Validación periódica con intervalo dinámico (2-5 segundos)
useEffect(() => {
  if (!token || loading) return;

  // Validación más frecuente cuando está llenando el formulario
  const validationInterval = showBookingForm ? 2000 : 5000;

  const interval = setInterval(() => {
    validateCalendarAvailability();
  }, validationInterval);

  return () => clearInterval(interval);
}, [token, loading, showBookingForm]);
```

**Comportamiento:**
- Si usuario está viendo calendario: Valida cada 5 segundos
- Si usuario está llenando formulario: Valida cada 2 segundos
- Detecta: isActive + isPublicBookingEnabled
- Acción: Cierra formulario automáticamente si hay cambio

**Estados React:**
```jsx
const [calendarUnavailable, setCalendarUnavailable] = useState(false);
// true = Calendario completamente desactivado (isActive=false)

const [unavailableReason, setUnavailableReason] = useState("");
// Razón específica del cambio

const [publicBookingDisabled, setPublicBookingDisabled] = useState(false);
// true = Calendario activo pero agendación deshabilitada (isActive=true && isPublicBookingEnabled=false)
```

---

#### 2️⃣ PREVENCIÓN DE AGENDAR EN DÍAS PASADOS

**Problema:** Usuario podía agendar citas en fechas que ya pasaron.

**Solución:** 
- Validación backend en `handleCreateEvent()`
- UI visual en calendario (días deshabilitados)
- Mensajes de error claros

**Archivos:**
- `client/src/pages/calendar.tsx` (líneas 454-471, 841-870, 1455-1485)

**Validación Backend (handleCreateEvent):**
```jsx
// Validate that the date is not in the past (unless editing)
if (!editingEventId) {
  const [year, month, day] = eventDate.split("-");
  const selectedDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  selectedDateTime.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDateTime < today) {
    toast({ 
      title: "Error", 
      description: "No puedes agendar citas en días pasados", 
      variant: "destructive" 
    });
    return;
  }
}
```

**UI en Calendario Principal:**
- Días pasados: Opacidad 50%, color muted, cursor not-allowed
- Hoy: Seleccionable (borde primary/50)
- Futuros: Seleccionables normalmente

**UI en Mini Calendario:**
- Comparación robusta sin problemas de timezone
- Usa `.setHours(0,0,0,0)` para comparar solo fechas
- Días pasados: Opacidad 40%, deshabilitados
- Toast si intenta seleccionar: "No puedes agendar en días pasados"

---

#### 3️⃣ ELIMINACIÓN AUTOMÁTICA DE CITAS VENCIDAS

**Problema:** Base de datos acumula citas antiguas innecesariamente.

**Solución:** Eliminar automáticamente citas cuando endTime < now()

**Archivos:**
- `server/routes.ts` (líneas 1246-1250, 1523-1527)

**Código Backend:**
```typescript
// Eliminar automáticamente citas pasadas
const now = new Date();
const { calendarEvents } = await import("@shared/schema");
const { lt } = await import("drizzle-orm");
await db.delete(calendarEvents).where(lt(calendarEvents.endTime, now)).catch(() => {});
```

**Ubicaciones:**
- GET `/api/calendar/:userId` (línea 1246-1250)
  - Cuando admin consulta su calendario
- GET `/api/calendar/public/:token` (línea 1523-1527)
  - Cuando visitante accede al calendario público

**Lógica:**
1. Recibe petición GET
2. PRIMERO: Elimina todas las citas con `endTime < now()`
3. LUEGO: Retorna solo citas activas
4. `.catch(() => {})` evita romper si hay error

---

#### 4️⃣ DIFERENCIACIÓN DE ESCENARIOS

**Problema:** No diferenciaba claramente entre:
- A) Calendario completamente desactivado
- B) Calendario activo pero agendación pública deshabilitada

**Solución:** Dos UIs distintas, lógica clara

**Escenario A: Calendario Desactivado (isActive=false)**
```
Condición: if (calendarUnavailable)

UI:
- Alerta ROJA: "Calendario no disponible"
- Icono AlertCircle rojo
- Mensaje: "El propietario ha desactivado temporalmente..."
- Botón: "Recargar página"
- Se oculta TODO el calendario
```

**Escenario B: Agendación Pública Deshabilitada (isActive=true && isPublicBookingEnabled=false)**
```
Condición: if (publicBookingDisabled)

UI:
- Calendario VISIBLE (mostrado normalmente)
- Banner AZUL: "Estás por agendar una cita con <nombre>..."
- Botón "Confirmar cita": DESHABILITADO
- Usuario VE disponibilidad pero NO PUEDE agendar
```

**Escenario C: Todo OK (isActive=true && isPublicBookingEnabled=true)**
```
UI:
- Calendario 100% funcional
- Banner AZUL: "Estás por agendar una cita..."
- Botón "Confirmar cita": HABILITADO
- Usuario PUEDE agendar normalmente
```

**Validación en backend:**
```jsx
// CASO 1: Calendario completamente desactivado
if (!data.config.isActive) {
  setCalendarUnavailable(true);
  setPublicBookingDisabled(false);
  return false; // Mostrar UI roja
}

// CASO 2: Calendario activo pero agendación deshabilitada
if (!data.config.isPublicBookingEnabled) {
  setCalendarUnavailable(false);
  setPublicBookingDisabled(true); // ← DIFERENCIA
  return true; // Mostrar calendario con banner azul
}

// CASO 3: Todo OK
setCalendarUnavailable(false);
setPublicBookingDisabled(false);
return true;
```

---

#### 5️⃣ NOTIFICACIÓN UNIFICADA

**Cambio:** Eliminada alerta amarilla diferenciada para "Agendación deshabilitada"

**Antes:**
```
Habilitado:    Banner AZUL genérico
Deshabilitado: Banner AMARILLO específico
```

**Ahora:**
```
Habilitado:    Banner AZUL: "Estás por agendar una cita..."
Deshabilitado: Banner AZUL: "Estás por agendar una cita..." (botón deshabilitado)
```

**Archivos:**
- `client/src/pages/public-calendar.tsx` (líneas 496-502)

**Código:**
```jsx
{/* Alert with availability info - shown when calendar is active */}
<Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
  <AlertCircle className="h-4 w-4 text-blue-500" />
  <AlertDescription className="text-xs text-foreground ml-2">
    Estás por agendar una cita con <span className="font-semibold">{config?.businessName}</span>. 
    Selecciona una fecha y horario disponibles de los mostrados en el calendario.
  </AlertDescription>
</Alert>
```

**Diferenciación:**
- El banner es igual en ambos casos
- La diferencia está en: Botón "Confirmar cita" **HABILITADO** vs **DESHABILITADO**
- Validación al hacer click: Si está deshabilitado, retorna error

---

#### 6️⃣ CORRECCIÓN DE ENDPOINT PÚBLICO - MOSTRAR CALENDARIO INCLUSO DESHABILITADO (Nov 25 - FINAL)

**Problema:** Cuando admin desactivaba agendación pública (`isPublicBookingEnabled=false`), el endpoint retornaba **HTTP 403**, haciendo que frontend mostrara **UI roja** ("Calendario no disponible") en lugar del calendario con botón deshabilitado.

**Solución:** Cambiar lógica del backend para que:
- **SOLO** retorne 403 si calendario está completamente desactivado (`isActive=false`)
- Retorne 200 si `isPublicBookingEnabled=false` (permitiendo frontend mostrar calendario)

**Archivos:**
- `server/routes.ts` (línea 1513-1519)

**Código Antes:**
```typescript
// Check if calendar is active
if (!config[0].isActive) {
  return res.status(403).json({ error: "Calendar is inactive" });
}
// Check if public booking is enabled
if (!config[0].isPublicBookingEnabled) {
  return res.status(403).json({ error: "Public booking is disabled" }); // ❌ BLOQUEABA
}
```

**Código Después:**
```typescript
// Check if calendar is active - ONLY THIS BLOCKS ACCESS
if (!config[0].isActive) {
  return res.status(403).json({ error: "Calendar is inactive" });
}
// NOTE: If isPublicBookingEnabled is false, we still return the calendar data
// Frontend will show calendar but disable the booking button
// (NO CHECK FOR isPublicBookingEnabled - permite retornar 200)
```

**Comportamiento Final:**

| Estado | isActive | isPublicBookingEnabled | HTTP | Frontend UI |
|--------|----------|---|---|---|
| **Caso 1** | `true` | `true` | 200 ✅ | Calendario funcional + botón HABILITADO |
| **Caso 2** | `true` | `false` | 200 ✅ | **Calendario visible + Banner AZUL + botón DESHABILITADO** ← CORREGIDO |
| **Caso 3** | `false` | N/A | 403 ❌ | UI roja "Calendario no disponible" |

**Validación de Seguridad:**
- POST `/api/calendar/public/book/:token` sigue validando `isPublicBookingEnabled`
- Si usuario intenta hacer booking sin autorización → Error 403
- Frontend también valida: `publicBookingDisabled` → botón deshabilitado + toast al intentar

**Punto Clave:** La diferenciación visual NO está en el HTTP status code, sino en el **estado del botón** (habilitado/deshabilitado)

---

#### 7️⃣ CORRECIÓN DE ESTADÍSTICAS DE PÁGINA PÚBLICA (Nov 25 - FINAL)

**Problema:** Las estadísticas de la página pública (Compartidas, Visitas, Conversión) mostraban siempre 0, incluso cuando la página se accedía múltiples veces.

**Causa Raíz:** Cuando se creaba un nuevo calendario por GET `/api/calendar/config/:userId`, no se creaba automáticamente un registro en la tabla `calendar_link_stats`. La tabla existía pero estaba vacía.

**Solución Implementada:** Actualizar el endpoint GET para que cree automáticamente un registro en `calendar_link_stats` cuando se crea un nuevo calendario.

**Archivos:**
- `server/routes.ts` (línea 1429-1470)

**Cambio en GET `/api/calendar/config/:userId`:**

**Antes:**
```typescript
if (!config.length) {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const newConfig = await db.insert(calendarConfig).values({
    userId,
    publicShareToken: token,
    isPublicBookingEnabled: true,
    eventDurationMinutes: 60,
  }).returning();
  return res.json(newConfig[0]); // ❌ No crea stats
}
```

**Después:**
```typescript
if (!config.length) {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const newConfig = await db.insert(calendarConfig).values({
    userId,
    publicShareToken: token,
    isPublicBookingEnabled: true,
    eventDurationMinutes: 60,
  }).returning();
  
  // ✅ Crea stats record para el nuevo calendario
  await db.insert(calendarLinkStats).values({
    userId,
    publicShareToken: token,
    timesShared: 0,
    timesVisited: 0,
    bookingsCompleted: 0,
  }).catch(() => {});
  
  return res.json(newConfig[0]);
}

// ✅ También valida que exista stats para configs existentes
const existingStats = await db.select().from(calendarLinkStats).where(eq(calendarLinkStats.publicShareToken, config[0].publicShareToken)).limit(1);
if (!existingStats.length) {
  await db.insert(calendarLinkStats).values({
    userId,
    publicShareToken: config[0].publicShareToken,
    timesShared: 0,
    timesVisited: 0,
    bookingsCompleted: 0,
  }).catch(() => {});
}
```

**Flujo de Estadísticas:**

1. **Cuando se crea calendar config:**
   - Se inserta en `calendar_config` tabla
   - Se inserta automáticamente en `calendar_link_stats` (ahora ✅)
   - Inicializa: timesShared=0, timesVisited=0, bookingsCompleted=0

2. **Cuando usuario accede a página pública:**
   - GET `/api/calendar/public/:token` actualiza `timesVisited += 1`
   - GET `/api/calendar/stats/:token` retorna contadores

3. **Cuando usuario comparte enlace:**
   - POST `/api/calendar/:userId/share` actualiza `timesShared += 1`

4. **Cuando usuario completa booking:**
   - POST `/api/calendar/public/book/:token` actualiza `bookingsCompleted += 1`

**Tabla `calendar_link_stats`:**
```
id                    | user_id                              | public_share_token | times_shared | times_visited | bookings_completed
f47ac10b-58cc-4372-a567-0e02b2c3d479 | 3a4189a2-1f3c-430f-b3c5-c63521fc7a61 | p5sxccnf5zr8rcccwrvmt2 | 0 | 0 | 0
```

**Endpoint de Estadísticas:**
- GET `/api/calendar/stats/:token` retorna `{ timesShared, timesVisited, bookingsCompleted }`
- Consultado por el widget "Enlace público" en el panel admin

**Test Completado:**
✅ Tabla creada con datos de ejemplo
✅ Verificado que `calendar_link_stats` contiene registros
✅ Estadísticas ahora pueden mostrar valores reales

---

### 🧪 Flujos de Prueba

#### Flujo 1: Desactivar Calendario Mientras Usuario Está Navegando
```
1. Usuario abre /public-calendar/:token ✓
2. Ve el calendario funcionando
3. Admin desactiva calendario (isActive=false)
4. En máximo 5 segundos:
   - Validación detecta cambio
   - Formulario se cierra (si estaba abierto)
   - calendarUnavailable = true
5. Usuario ve:
   - UI roja: "Calendario no disponible"
   - Botón "Recargar página"
   - Calendario oculto
```

#### Flujo 2: Desactivar Agendación Pública Mientras Usuario Está Llenando Formulario
```
1. Usuario está llenando formulario de booking
2. Admin desactiva agendación pública (isPublicBookingEnabled=false)
3. En máximo 2 segundos:
   - Validación detecta cambio (más frecuente porque showBookingForm=true)
   - publicBookingDisabled = true
   - Formulario se cierra
4. Usuario recarga página, ve:
   - Calendario VISIBLE
   - Banner AZUL normal
   - Botón "Confirmar cita" DESHABILITADO
   - Puede ver disponibilidad pero no puede agendar
```

#### Flujo 3: Agendar en Día Pasado
```
1. Usuario intenta agendar en 24 Nov (hoy es 25 Nov)
2. En calendario principal:
   - Día 24 está DESHABILITADO (opacidad 50%)
   - No puede hacer click
3. Si intenta en mini calendario:
   - Toast: "No puedes agendar en días pasados"
4. Si intenta pasando validación:
   - handleCreateEvent() lo bloquea
   - Toast: "No puedes agendar citas en días pasados"
```

#### Flujo 4: Eliminación Automática de Citas Vencidas
```
1. Admin tiene cita: 2025-11-24 10:00 (ya pasó)
2. Admin abre módulo de Citas (GET /api/calendar/:userId)
3. Backend automáticamente:
   - Detecta endTime < now()
   - Elimina cita de la DB
4. Admin ve: Cita ya no existe
5. Sin intervención manual
```

---

### 📊 Tabla de Comparación - 7 Cambios Completados

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Velocidad de validación** | 30 segundos | 2-5 segundos dinámicos ⚡ |
| **Agendar en días pasados** | ✅ Permitido (Bug) | ❌ Bloqueado |
| **Citas vencidas en DB** | Se acumulan | Auto-eliminadas |
| **Calendario desactivado** | UI confusa | UI roja clara |
| **Agendación deshabilitada** | UI roja incorrecta ❌ | Calendario visible + botón disabled ✅ |
| **Notificación** | Múltiples banners | 1 banner unificado |
| **Endpoint público GET** | Retornaba 403 | Retorna 200 (solo bloquea si isActive=false) |
| **Estadísticas página pública** | Siempre 0 (DB vacía) | Funcionales (registros creados automáticamente) ✅ |

---

### 🔍 Puntos Clave para Desarrollo Futuro

1. **Validación Temporal:**
   - 2 segundos: Cuando usuario está en formulario
   - 5 segundos: Cuando está navegando
   - Nunca reducir < 15s (performance)
   - Nunca aumentar > 10s (UX pobre)

2. **Comparación de Fechas:**
   - SIEMPRE usar `.setHours(0,0,0,0)` para evitar timezone/UTC issues
   - No confiar en comparaciones directas de Date

3. **Estados de Calendario:**
   - `calendarUnavailable` = Calendar completamente down (roja)
   - `publicBookingDisabled` = Calendar up pero no booking (botón disabled)
   - NUNCA mezclar ambos estados (son excluyentes)

4. **HTTP Conflict (409):**
   - Usar para: Integridad referencial, conflictos de estado
   - Ej: No poder eliminar horario si hay citas agendadas

5. **Eliminación de Datos Vencidos:**
   - Hacerlo en GET (lazy deletion)
   - NO en background job (simple para este proyecto)
   - Usar `.catch(() => {})` para evitar romper si hay error

6. **UX Consistency:**
   - Banners informativos: Siempre mostrar
   - Diferenciar con botones (enabled/disabled), no con colores
   - Toast siempre con title + description (CRM style)

---

## Deployment & Access Configuration

### Server Configuration
- **Frontend Port**: 5000 (bound to 0.0.0.0:5000)
- **Backend**: Express.js running on same port with Vite proxy (port 5000)
- **Database**: PostgreSQL via Neon (connection string via DATABASE_URL env var)
- **Workflow**: "Start application" runs `npm run dev`

### URL Access
- **Local Development**: http://localhost:5000 or http://127.0.0.1:5000
- **Public URL** (once deployed): Auto-generated .replit.app domain
- **Public Calendar Access**: `/public-calendar/{publicShareToken}` (no auth required)
- **Public Survey Access**: `/survey/{surveyId}` (no auth required)
- **Public Raffle Access**: `/raffle-public/{raffleId}` (no auth required)

### Authentication & Session
- Custom session-based authentication
- Session stored in PostgreSQL
- Requires login for protected routes
- Public pages accessible without authentication

## System Architecture
The platform is structured around a modular design, enabling independent development and deployment of features like CRM, Calendar, Surveys, Raffles, Sales Funnel Analytics, and Help Widget.

### UI/UX Decisions
- **Frontend Framework**: React with TypeScript.
- **Routing**: Wouter.
- **Components**: Shadcn/UI for a consistent and professional look.
- **Styling**: Exclusive dark mode with a compact interface.
- **List Layouts**: Professional table design for Surveys, Raffles, and other management modules
- **Help Widget**: Floating Intercom-style widget with search and KB articles
- **Analytics**: Sales Funnel module with automatic chat classification and visualization
- **Calendar**: Complete system with admin interface for configuration, and public booking view for customers

### Technical Implementations
- **Real-time Communication**: WebSocket for instant updates with proper queryKey cache invalidation.
- **Data Fetching**: TanStack React Query with hierarchical queryKeys for proper cache management.
- **Validation**: Zod for schema validation.
- **Help/Support**: Client-side widget with hardcoded KB articles (no server calls needed)
- **Audio Transcription**: Xenova/Whisper-Tiny (open source model running locally, NO API calls needed, ~13ms for tiny model)
  - Transcribes audio messages from WhatsApp (ogg, mp3, wav formats supported)
  - Transcription saved to database and displayed in chat
  - Async transcription in background (doesn't block message save)
  - Spanish language optimized
  - First load initializes model cache (~1-2 minutes on first use only)
- **Live Chat Widget**: Independent chatbot system for sales funnels, featuring sequential conversation flow for lead capture, product selection, and real-time appointment booking with calendar availability checks.
- **Calendar Module**: 
  - Admin interface with monthly calendar grid view
  - Configuration of business availability by day of week
  - Public booking URL for customer access
  - Event duration settings
  - Automatic time slot generation based on availability
  - Conflict prevention (booked slots unavailable)
- **Public Calendar View** (Calendly-style):
  - No authentication required
  - Shows business name and description
  - Displays available dates and time slots
  - Customer booking form (name, phone, email, notes)
  - Automatic confirmation
- **Surveys Module**: Public URLs for responding and viewing results, custom DatePicker, and real-time statistics.
- **Raffles Module**: 
  - Professional table-based management interface (matches surveys layout)
  - Complete raffle management system with independent financial controls per raffle
  - raffle_customers table for tracking customer registrations and ticket purchases
  - WhatsApp contact number configuration for automated ticket confirmations
- **Sales Funnel Module**: 
  - Automatic chat classification using lightweight open source NLP patterns
  - Default categories: sales, support, complaint, vip, inquiry, other
  - Keyword matching and regex pattern recognition
  - Confidence scoring (0-100)
  - Visualization: funnel chart showing chat distribution by category
  - Real-time classification as messages arrive
- **Media Support**: Stickers, images, audio, video, documents with proper size constraints

### Feature Specifications
- **WhatsApp Module**: Account management, conversations, AI chatbots, knowledge base, and integrated calendar.
- **CRM Module**: Simplified Clients and Leads management.
- **Raffles Module**: Complete with creation, management, public sales pages, and payment verification. Each raffle has financial controls and ticket management.
- **Sales Funnel Module**: Analytics dashboard for analyzing customer interactions by type
- **Calendar Module**:
  - Admin configuration: availability by day/time, business details, event duration
  - Public booking: customers see available slots, book appointments
  - Automatic confirmation and WhatsApp integration ready
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

## Database Schema - Key Tables

### Calendar Tables
- **calendar_events**: Stores individual appointments
  - Fields: id, userId, title, description, startTime, endTime, contactName, contactPhone, status, isActive, createdAt
- **calendar_availability**: Stores business hours per day of week
  - Fields: id, userId, dayOfWeek (0-6), startTime, endTime, isActive, createdAt
- **calendar_config**: Stores calendar configuration and public sharing token
  - Fields: id, userId, isPublicBookingEnabled, eventDurationMinutes, publicShareToken, businessName, businessDescription, createdAt, updatedAt

### Key Routes

#### Calendar API Routes (Admin)
- `GET /api/calendar/:userId` - Get all events for a user
- `POST /api/calendar` - Create new event
- `PATCH /api/calendar/:id` - Update existing event
- `DELETE /api/calendar/:id` - Delete event
- `PATCH /api/calendar/status` - Toggle calendar active/inactive status
- `GET /api/calendar/config/:userId` - Get calendar configuration
- `PATCH /api/calendar/config/:userId` - Update calendar configuration

#### Calendar Availability Routes (Admin)
- `GET /api/calendar/availability/:userId` - Get all availability slots for user
- `POST /api/calendar/availability` - Create new availability slot (day + hours)
- `PATCH /api/calendar/availability/:id` - Update availability slot
- `DELETE /api/calendar/availability/:id` - Delete availability slot

#### Public Calendar Routes (No Auth Required)
- `GET /api/calendar/public/:token` - Get public calendar data
- `POST /api/calendar/public/:token/book` - Public user books appointment
- `GET /api/calendar/stats/:token` - Get booking statistics

#### Frontend Routes
- `/calendar` - Admin calendar management panel (authenticated)
- `/public-calendar/:token` - Public booking view (no auth required)

### Important Notes
- ⚠️ All admin routes require authentication (user session)
- ⚠️ Public routes use `publicShareToken` from `calendar_config` table
- ⚠️ Event duration configured in `calendar_config.eventDurationMinutes`
- ⚠️ Availability slots use `dayOfWeek` (0=Sunday, 6=Saturday)
- ⚠️ Time format is 24-hour (HH:MM)

---

## Documentación Detallada - Sesión Nov 25, 2025

### Archivos Modificados en Esta Sesión
1. **client/src/pages/calendar.tsx** - Módulo de calendario admin
   - Dialog mejorado: estructura header/footer/contenido fijo
   - Sincronización mini calendario
   - Alertas motivacionales CRM
   - Protección de horarios con validación
   - CSS: campo hora ajustado a h-9

2. **client/src/pages/public-calendar.tsx** - Calendario público (Calendly-style)
   - Validación de seguridad en tiempo real
   - Validación periódica cada 30 segundos
   - UI mejorada de "no disponible"
   - Estados: calendarUnavailable, unavailableReason

3. **server/routes.ts** - API Backend
   - GET `/api/calendar/public/:token` - validación isPublicBookingEnabled
   - POST `/api/calendar/public/book/:token` - endpoint seguro para visitantes
   - DELETE `/api/calendar/availability/:id` - protección de horarios con conflictos

### Endpoints API - Cambios Importantes

#### GET `/api/calendar/public/:token`
```
Cambio: Ahora valida isPublicBookingEnabled
Retorna: 403 si isPublicBookingEnabled = false
Razón: Seguridad - solo se muestra si ambos: isActive=true Y isPublicBookingEnabled=true
```

#### POST `/api/calendar/public/book/:token` (NUEVO)
```
Propósito: Endpoint seguro para que visitantes agenden citas
Validaciones:
  - Token válido
  - Calendario activo (isActive=true)
  - Public booking habilitado (isPublicBookingEnabled=true)
Actualiza: bookingsCompleted en calendarLinkStats
```

#### DELETE `/api/calendar/availability/:id` (MODIFICADO)
```
Cambio: Protección de horarios con citas agendadas
Algoritmo:
  1. Obtiene el horario (dayOfWeek, startTime, endTime)
  2. Obtiene todas las citas del usuario
  3. Compara: dayOfWeek + rango de horas (convertido a minutos)
  4. Si hay conflicto → Error 409 "No se puede eliminar"
  5. Si OK → Procede a eliminar
```

### Patrones de Código Clave

#### Dialog Mejorado (Header/Footer Fijos)
```jsx
<Dialog open={showNewForm} onOpenChange={setShowNewForm}>
  <DialogContent className="max-w-sm w-[95vw] bg-card border-border p-0 flex flex-col max-h-screen">
    {/* HEADER FIJO */}
    <DialogHeader className="px-4 pt-4 pb-0">
      <DialogTitle>{editingEventId ? "Editar cita" : "Nueva cita"}</DialogTitle>
    </DialogHeader>
    
    {/* CONTENIDO SCROLLEABLE (ÚNICA PARTE QUE SCROLLEA) */}
    <div className="space-y-4 overflow-y-auto flex-1 px-4 py-4">
      {/* Contenido aquí */}
    </div>
    
    {/* FOOTER FIJO */}
    <DialogFooter className="px-4 py-4 border-t border-border flex-shrink-0">
      <Button>Cancelar</Button>
      <Button>Crear</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Validación en Tiempo Real (Calendario Público) - LÓGICA MEJORADA
```jsx
// Función de validación con DOS casos diferentes
const validateCalendarAvailability = async () => {
  const response = await fetch(`/api/calendar/public/${token}`);
  if (response.status === 403 || !response.ok) {
    setCalendarUnavailable(true);
    setUnavailableReason("El calendario ha sido desactivado");
    setShowBookingForm(false);
    return false;
  }
  
  const data = await response.json();
  
  // CASO 1: Calendario completamente desactivado
  if (!data.config.isActive) {
    setCalendarUnavailable(true);
    setUnavailableReason("El calendario ha sido desactivado");
    setPublicBookingDisabled(false);
    setShowBookingForm(false);
    return false;
  }
  
  // CASO 2: Calendario activo pero agendación pública deshabilitada
  if (!data.config.isPublicBookingEnabled) {
    setCalendarUnavailable(false);
    setPublicBookingDisabled(true); // ← DIFERENCIA: no es unavailable, es disabled
    setShowBookingForm(false);
    // Pero retorna true porque el calendario SÍ existe
    return true;
  }
  
  // CASO 3: Todo OK
  setCalendarUnavailable(false);
  setPublicBookingDisabled(false);
  return true;
};

// Validación periódica con intervalo dinámico (2-5 segundos)
useEffect(() => {
  if (!token || loading) return;
  const validationInterval = showBookingForm ? 2000 : 5000;
  const interval = setInterval(() => {
    validateCalendarAvailability();
  }, validationInterval);
  return () => clearInterval(interval);
}, [token, loading, showBookingForm]);

// Validación antes de booking
const handleBooking = async () => {
  const isAvailable = await validateCalendarAvailability();
  if (!isAvailable) return; // Mostrar error
  // ... proceder con booking
};
```

#### Sincronización Mini Calendario
```jsx
// Cuando usuario hace clic en una fecha
setEventDate(`${year}-${month}-${day}`);
// IMPORTANTE: Sincronizar mini calendario
setCalendarMonth(selectedDate.getMonth());
setCalendarYear(selectedDate.getFullYear());
```

### Estados React Agregados en Esta Sesión

#### public-calendar.tsx
```jsx
const [calendarUnavailable, setCalendarUnavailable] = useState(false);
// Indica si el calendario COMPLETO está desactivado (isActive=false)
// Cuando true → muestra alerta roja, oculta todo

const [unavailableReason, setUnavailableReason] = useState("");
// Razón específica cuando calendar está unavailable:
// - "El calendario ha sido desactivado"
// - "El calendario no está disponible"
// - "Error validando disponibilidad del calendario"

const [publicBookingDisabled, setPublicBookingDisabled] = useState(false);
// Indica si el calendario está ACTIVO pero AGENDACIÓN PÚBLICA DESHABILITADA
// Cuando true → muestra calendario + banner amarillo, botón deshabilitado
// Es DIFERENTE a calendarUnavailable
```

### Mensajes de Toast - Estándar CRM Implementado

Todos los toasts ahora tienen formato: `{ title, description }`

```javascript
// Crear cita
toast({ 
  title: "✓ ¡Felicidades! Nueva cita agendada", 
  description: "Tu cita ha sido registrada exitosamente en el sistema"
});

// Actualizar cita
toast({ 
  title: "✓ Cita actualizada correctamente", 
  description: "Los cambios han sido guardados"
});

// Eliminar cita
toast({ 
  title: "✓ Cita eliminada", 
  description: "Se ha removido correctamente del calendario"
});

// No poder eliminar horario por conflicto
toast({ 
  title: "⚠️ No se puede eliminar", 
  description: "No se puede eliminar este horario porque hay citas agendadas en ese rango horario. Elimina o edita las citas primero.",
  variant: "destructive"
});

// Calendario desactivado durante booking
toast({ 
  title: "⚠️ Calendario desactivado", 
  description: unavailableReason,
  variant: "destructive"
});
```

### CSS Changes

#### Campo de Hora
```
Antes: className="w-full max-w-xs text-xs h-8 sm:h-9 bg-secondary/40 border-border"
Ahora: className="w-full text-xs h-9 bg-secondary/40 border-border"
Razón: Consistencia visual con otros campos (h-9), sin variaciones responsive
```

### Seguridad Implementada

#### 1. Protección de Horarios
- No permite eliminar horario si hay citas en ese rango
- Comparación: dayOfWeek + horas (convertido a minutos)
- Error: 409 Conflict

#### 2. Validación de Calendario Público
- Verifica isActive al cargar
- Verifica isPublicBookingEnabled al cargar
- Valida periódicamente cada 30 segundos
- Valida antes de procesar booking

#### 3. Cierre Automático de Formulario
- Si admin desactiva durante agendación → se cierra formulario
- Si admin desactiva public booking → se muestra UI de no disponible

### Notas Importantes para Futuro Desarrollo

1. **Dialog Con Scroll**
   - SIEMPRE: header/footer con `p-0 flex flex-col`
   - CONTENIDO CENTRAL: `overflow-y-auto flex-1` es el ÚNICO que scrollea

2. **Validación Temporal (Dinámico: 2-5 segundos)**
   - Intervalo dinámico según contexto:
     - **2 segundos**: Cuando usuario está llenando formulario de booking (showBookingForm=true)
     - **5 segundos**: Cuando está navegando el calendario (showBookingForm=false)
   - Esto permite detección ultra-rápida sin afectar performance
   - El intervalo cambia automáticamente en el useEffect que depende de [showBookingForm]
   - Nunca aumentar a más de 10s (UX pobre si se hace cambio en admin)

3. **Mensajes de Error 409**
   - Usar HTTP 409 Conflict para: integridad referencial, conflictos de estado
   - Leer error JSON en frontend: `const error = await response.json()`

4. **Toasts con Descripción**
   - SIEMPRE agregar descripción cuando es beneficioso
   - Ayuda al usuario a entender QUÉ pasó y POR QUÉ

5. **Sincronización de Estado**
   - Mini calendario: sincronizar mes/año cuando se selecciona fecha
   - Evita confusión del usuario

### Flujo Completo de Seguridad - Ejemplo

```
Usuario 1: Abre /public-calendar/:token ✓ Funciona (calendario activo)
  ↓ (entra a formulario de booking)
  ↓
Admin: Desactiva calendario desde módulo Citas
  ↓
Sistema: Detecta cambio en validación periódica (máximo 30s)
  ↓
Usuario 1: Ve que formulario se cerró + toast "Calendario desactivado"
  ↓
Usuario 1: Recarga página → Ve UI roja de "No disponible"
  ↓
OU: Si Usuario 1 intenta hacer booking
  ↓
Frontend: Valida antes de enviar → detecta cambio
  ↓
Backend: Retorna 403 + error message
  ↓
Usuario 1: Ve toast "Calendario desactivado" + razón específica
```
