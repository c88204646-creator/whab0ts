# Proyecto WhatsApp CRM - Plataforma de Integración

## Overview
This project is a comprehensive CRM platform designed to streamline customer interactions, sales funnels, and marketing efforts, primarily leveraging WhatsApp integration. It aims to provide businesses with tools for managing client relationships, automating communication, scheduling appointments, conducting surveys, running promotional raffles, and analyzing sales funnels. Key capabilities include a redesigned Live Chat for sales, an integrated WhatsApp calendar for appointment management with public booking (Calendly-style), a simplified CRM, a robust raffle management system, and an advanced Sales Funnel analytics dashboard with automatic chat classification. The platform also includes a Help Widget (estilo Intercom) for user support and learning. The platform is built for efficiency, real-time interaction, and a professional user experience.

## Recent Changes

- **Nov 26, 2025 - COMPLETADO**: Contenedor de Horarios Optimizado - Mostrar 6 Horas con Scroll
  - ✅ **PROBLEMA**: El contenedor de horarios disponibles ocupaba demasiado espacio
    - Mostraba todos los horarios del día
    - Hacía la tarjeta de detalles muy grande y difícil de navegar
    - Mala experiencia en dispositivos móviles
  
  - ✅ **SOLUCIÓN IMPLEMENTADA**:
    - Archivo: `client/src/pages/public-calendar.tsx` línea 1002-1004
    - Antes (INCORRECTO):
      ```jsx
      <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
        <div className="grid grid-cols-3 gap-2">
          {availableSlots.map((slot, idx) => {
      ```
    
    - Ahora (CORRECTO):
      ```jsx
      <div className="max-h-56 overflow-y-auto px-4 py-3 custom-scrollbar">
        <div className="grid grid-cols-3 gap-2">
          {availableSlots.slice(0, 6).map((slot, idx) => {
      ```
    - Cambios:
      - `flex-1` → `max-h-56` (Altura máxima de 224px)
      - `availableSlots.map()` → `availableSlots.slice(0, 6).map()` (Solo 6 primeras horas)
  
  - ✅ **RESULTADO**:
    - Contenedor compacto y bien dimensionado
    - Muestra solo 6 horarios inicialmente
    - Scroll vertical disponible para ver más opciones
    - Mejor UX en móviles y desktop
  
  - ✅ **REFERENCIA DE CÁLCULO**:
    ```
    Altura máxima: max-h-56 = 224px (14rem)
    Botones visibles: ~6 horarios (36px cada uno con padding)
    Scroll: Habilitado automáticamente para horarios adicionales
    Grid: 3 columnas × 2 filas = 6 slots visibles
    ```

- **Nov 26, 2025 - COMPLETADO**: Header Alignment Fix - Alineación Correcta con Panel UI
  - ✅ **PROBLEMA**: El header superior tenía `px-6` (padding 24px) mientras el contenido principal usaba `px-4` (padding 16px)
    - Header desalineado visualmente del contenido
    - Inconsistencia en espaciado horizontal
    - Afectaba la apariencia profesional del panel
  
  - ✅ **SOLUCIÓN IMPLEMENTADA**:
    - Archivo: `client/src/components/top-header.tsx` línea 38
    - Antes (INCORRECTO):
      ```html
      <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background flex-shrink-0 gap-4">
      ```
    
    - Ahora (CORRECTO):
      ```html
      <header className="flex items-center justify-between h-16 px-4 border-b border-border bg-background flex-shrink-0 gap-4">
      ```
    - Cambio: `px-6` → `px-4` (alineado con el estándar del panel UI)
  
  - ✅ **RESULTADO**: 
    - Header completamente alineado con contenido
    - Estilo y diseño del panel UI preservado
    - Consistencia visual 100%
    - **Archivos modificados**:
      - `client/src/components/top-header.tsx` línea 38: `px-6` → `px-4`
      - `client/src/pages/public-calendar.tsx` línea 824: `px-6` → `px-4`
  
  - ✅ **CHECKLIST PARA ESPACIADO EN COMPONENTES**:
    - [ ] ¿Todos los componentes principales usan `px-4`?
    - [ ] ¿El header tiene el mismo padding horizontal que main content?
    - [ ] ¿Hay inconsistencias visuales en alineación lateral?
    - [ ] ¿He revisado otros componentes flotantes (modales, popovers)?
  
  - ✅ **REFERENCIA DE PADDING ESTÁNDAR**:
    ```
    Panel UI Standard Spacing:
    ├── Header (top-header.tsx): px-4 (16px)
    ├── Main Content (pages/): px-4 (16px)
    ├── Cards: p-4 (16px internal)
    ├── Dialogs: p-4 (16px internal)
    └── Modals: p-6 (24px internal - pueden ser más grandes)
    
    REGLA: Si el componente es un "contenedor principal" en el layout,
    debe usar px-4 para alineación horizontal consistente.
    ```

- **Nov 26, 2025 - CRÍTICO BUG FIX**: Citas desde Página Pública No Se Guardaban - Problema de Eliminación Automática
  - 🔴 **PROBLEMA CRÍTICO**: 
    - Citas creadas desde la página pública (URL compartible) desaparecían inmediatamente
    - No aparecían en el calendario del administrador
    - Se mostraban como creadas en logs pero no existían en BD
    - Afectaba TODOS los bookings públicos
  
  - 🔴 **ROOT CAUSE - LECCIÓN CRÍTICA**:
    - Ubicación: `server/routes.ts` línea 17-85 (función `saveAnalyticsSnapshotAndDeletePastEvents()`)
    - La función se llamaba en CADA GET del calendario
    - Eliminaba eventos con `endTime < now` (cualquier evento que ya terminó)
    - **PROBLEMA DE ZONA HORARIA**: Si frontend enviaba tiempo en zona local pero se guardaba en UTC con diferencia, el evento creado tenía `endTime` en el pasado
    - Ejemplo:
      ```
      Usuario en México crea cita: "13:15" (1:15 PM)
      Frontend calcula: 1:15 PM = 13:15 UTC-6 = 19:15 UTC  
      Si la diferencia de zona no se manejaba correctamente:
      → endTime guardado = 13:15 UTC (en el pasado)
      → Primer GET al calendario → saveAnalyticsSnapshotAndDeletePastEvents()
      → Condición: endTime < now? → ✅ SÍ (13:15 UTC < 00:47 UTC)
      → ELIMINADO INMEDIATAMENTE
      ```
  
  - ✅ **SOLUCIÓN IMPLEMENTADA**:
    - Cambiar lógica de eliminación: En lugar de `endTime < now`, usar `endTime < (now - 24 horas)`
    - Archivo: `server/routes.ts` línea 25
    - Código anterior (INCORRECTO):
      ```typescript
      const eventsToDelete = await db.select().from(calendarEvents)
        .where(lt(calendarEvents.endTime, now));
      ```
    - Código nuevo (CORRECTO):
      ```typescript
      const deletionThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const eventsToDelete = await db.select().from(calendarEvents)
        .where(lt(calendarEvents.endTime, deletionThreshold));
      ```
  
  - ✅ **BENEFICIOS DE LA FIX**:
    - Margen de 24 horas: Absorbe cualquier diferencia de zona horaria
    - Eventos recién creados permanecen visible por 24h+ después de terminar
    - Usuario puede ver historial de citas completadas
    - Solo se eliminan eventos "muy viejos" (más de 24h pasados)
  
  - ⚠️ **LECCIÓN PARA EVITAR EN FUTURO**:
    ```
    ANTIPATRÓN ❌:
    - Eliminar datos automáticamente basado en comparación simple de timestamps
    - Ejecutar operaciones destructivas en métodos GET
    - No considerar diferencias de zona horaria en lógica de timestamps
    
    PATRÓN CORRECTO ✅:
    - Para limpieza automática: agregar margen de tiempo (24h, 7 días, etc)
    - Operaciones destructivas: en cron jobs separados, no en requests
    - Timestamps: convertir a UTC explícitamente, documentar zonas
    - Testing: validar con eventos en zonas horarias diferentes
    ```
  
  - ✅ **CHECKLIST PARA CÓDIGO QUE MANIPULA EVENTOS DE TIEMPO**:
    - [ ] ¿Estoy eliminando/modificando basado en timestamps?
    - [ ] ¿Hay margen de error de zona horaria? → Agregar buffer de al menos 1-24h
    - [ ] ¿Esta operación se ejecuta en cada request? → Mover a cron job si es destructiva
    - [ ] ¿Estoy documentando la zona horaria esperada? → Agregar comentario
    - [ ] ¿He testeado con diferentes zonas horarias? → Simular en desarrollo

- **Nov 26, 2025 - COMPLETADO**: Componente CalendarGrid Centralizado - UI Consistente en Todos los Módulos
  - ✅ **PROBLEMA RESUELTO**: Cada módulo de calendario tenía su propio código HTML/CSS duplicado
    - Calendarios diferentes en admin, público y formularios
    - Cambios de diseño afectaban solo a algunos lugares
    - Inconsistencia visual y mantenimiento difícil
  
  - ✅ **SOLUCIÓN**: Componente reutilizable `CalendarGrid` en `client/src/components/calendar-grid.tsx`
    - **Props principales**:
      ```typescript
      interface CalendarGridProps {
        year: number;
        month: number;
        monthName: string;
        weekDays: string[];
        calendarDays: (Date | null)[];
        canNavigatePrevious: boolean;
        onPrevMonth: () => void;
        onNextMonth: () => void;
        selectedDate: Date | null;
        onSelectDate: (date: Date) => void;
        availability: Array<{ dayOfWeek: number; isActive: boolean }>;
        showEvents?: boolean;
        getEventsForDate?: (date: Date) => Array<any>;
        hideAvailabilityIndicators?: boolean;
        minimalSize?: boolean; // CLAVE: true=mini-calendar, false=full-calendar
      }
      ```
    
  - ✅ **USO EN TODOS LOS MÓDULOS**:
    
    1. **Calendario Admin Principal** (`client/src/pages/calendar.tsx` línea 828-851)
       - Usa CalendarGrid en modo full-size
       - Muestra eventos y disponibilidad
       - Navega entre meses del año actual y futuro
    
    2. **Calendario Público** (`client/src/pages/public-calendar.tsx` línea 741-759)
       - Usa CalendarGrid en modo full-size
       - Solo muestra disponibilidad (sin eventos admin)
       - Solo selecciona meses con disponibilidad
    
    3. **Mini Calendario en Crear/Editar Cita** (`client/src/pages/calendar.tsx` línea 1433-1474)
       - Usa CalendarGrid con `minimalSize={true}`
       - Renderizado compacto dentro del diálogo
       - Mismo look & feel que calendarios principales
  
  - ✅ **DOS MODOS DE RENDERIZADO**:
    ```
    minimalSize={false} (por defecto):
    ├── Card con CardHeader (fondo gris)
    ├── Navegación mes con botones
    ├── Grid 7x6 con días
    └── Estilos full tamaño

    minimalSize={true}:
    ├── Card idéntica (mismo fondo gris)
    ├── Navegación mes con botones
    ├── Grid 7x6 con días
    └── Estilos idénticos (no es "mini", es diseño adaptado)
    ```
  
  - ✅ **BENEFICIO CLAVE**: Al modificar CalendarGrid, los cambios se aplican automáticamente en:
    - Calendario admin (vista principal)
    - Mini-calendario (formulario crear/editar)
    - Calendario público
    - Consistencia visual 100% garantizada

- **Nov 26, 2025 - COMPLETADO**: Bug Fix - Mini Calendario No Regresaba a Meses Anteriores
  - ✅ **PROBLEMA**: Al navegar a un mes futuro y luego intentar regresar, el botón anterior no funcionaba
    - Clickeaba > (siguiente) y avanzaba correctamente
    - Clickeaba < (anterior) pero no hacía nada
    - El calendario quedaba "atrapado" en mes futuro
  
  - ✅ **ROOT CAUSE**: Lógica invertida en `canNavigatePrevious`
    - Ubicación: `client/src/pages/calendar.tsx` línea 1442
    - Antes (INCORRECTO):
      ```javascript
      canNavigatePrevious={calendarYear < new Date().getFullYear() || 
        (calendarYear === new Date().getFullYear() && calendarMonth <= new Date().getMonth())}
      ```
      → Esto deshabilitaba el botón < cuando debería estar habilitado
    
    - Ahora (CORRECTO):
      ```javascript
      canNavigatePrevious={calendarYear > new Date().getFullYear() || 
        (calendarYear === new Date().getFullYear() && calendarMonth > new Date().getMonth())}
      ```
      → El botón anterior se habilita solo cuando estás en futuro
      → Se deshabilita cuando llegas a mes actual
  
  - ✅ **LÓGICA CORRECTA**:
    - `canNavigatePrevious = true` → Botón habilitado (puedes ir atrás)
    - `canNavigatePrevious = false` → Botón deshabilitado (ya estás en mes actual)
    - Comparación: año > actual O (mismo año Y mes > actual)
  
  - ✅ **RESULTADO**: Navegación fluida en ambas direcciones en mini-calendario

- **Nov 26, 2025 - COMPLETADO**: Bug Fix - Diálogo Crear/Editar Cita No Reseteaba Calendario
  - ✅ **PROBLEMA**: Cuando cerraba el diálogo sin guardar, el mini-calendario se quedaba en el mes anterior
    - Navegabas a Diciembre 2025
    - Cerrabas sin guardar (click en X o fuera del diálogo)
    - Reopenías → Seguía en Diciembre en lugar de mes actual
  
  - ✅ **ROOT CAUSE**: El `onOpenChange` del Dialog solo hacía `setShowNewForm(false)`
    - No ejecutaba `resetForm()` que resetea `calendarMonth` y `calendarYear`
    - El estado quedaba "sucio" de la navegación anterior
  
  - ✅ **SOLUCIÓN**: Interceptar cierre y ejecutar resetForm()
    - Ubicación: `client/src/pages/calendar.tsx` línea 1396-1399
    - Antes:
      ```javascript
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
      ```
    
    - Ahora:
      ```javascript
      <Dialog open={showNewForm} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowNewForm(open);
      }}>
      ```
    
    - `resetForm()` contiene (líneas 376-398):
      ```javascript
      const resetForm = () => {
        // ... otros campos ...
        setCalendarMonth(new Date().getMonth());
        setCalendarYear(new Date().getFullYear());
      };
      ```
  
  - ✅ **FLUJO CORRECTO**:
    1. Abres diálogo → mini-calendario muestra mes actual
    2. Navegas a otro mes
    3. Cierras sin guardar → ejecuta resetForm()
    4. Reaabres diálogo → mini-calendario vuelve a mes actual
    5. Guardas evento → ejecuta resetForm() automáticamente en onSuccess
  
  - ✅ **BENEFICIO**: UX consistente, usuario no se confunde con calendarios "sucios"

- **Nov 26, 2025 - COMPLETADO**: Documentación Centralizada - Referencia Rápida
  - ✅ **ARCHIVOS MODIFICADOS**:
    ```
    ✏️ client/src/components/calendar-grid.tsx (NUEVO - 252 líneas)
       └─ Componente UI centralizado para calendarios
    
    ✏️ client/src/pages/calendar.tsx (MODIFICADO)
       └─ Línea 22: Import CalendarGrid
       └─ Línea 831-851: Usa CalendarGrid para calendario principal
       └─ Línea 1396-1399: Fix dialog onOpenChange con resetForm
       └─ Línea 1433-1474: Usa CalendarGrid para mini-calendario
    
    ✏️ client/src/pages/public-calendar.tsx (MODIFICADO)
       └─ Línea 18: Import CalendarGrid
       └─ Línea 741-759: Usa CalendarGrid para calendario público
    ```
  
  - ✅ **CHECKLIST DE MANTENIMIENTO FUTURO**:
    - [ ] ¿Quiero cambiar colores del calendario?
      → Edita `client/src/components/calendar-grid.tsx`
      → Aplica en admin, público y formularios automáticamente
    
    - [ ] ¿Quiero cambiar espaciado o padding?
      → Edita `client/src/components/calendar-grid.tsx`
      → Todos los módulos se actualizan
    
    - [ ] ¿Quiero agregar una nueva funcionalidad al calendario?
      → Primero en CalendarGrid (prop nueva en interface)
      → Luego pasa la prop en los 3 lugares que lo usan
      → Garantiza consistencia
    
    - [ ] ¿Hay un bug visual en el calendario?
      → Busca en `calendar-grid.tsx` (código central)
      → Se arregla en todos lados a la vez
  
  - ✅ **ANTIPATRONES A EVITAR**:
    ```javascript
    ❌ NO HAGAS ESTO:
    - Modificar estilos del calendario en calendar.tsx directamente
    - Crear otro componente de calendario similar
    - Copiar/pegar HTML del calendario en varios lugares
    
    ✅ SIEMPRE HACED ESTO:
    - Edita CalendarGrid si necesitas cambios visuales
    - Pasa props nuevas si necesitas comportamiento adicional
    - Reutiliza CalendarGrid en nuevos módulos
    ```
  
  - ✅ **REFERENCIA RÁPIDA - PROPS COMUNES**:
    ```javascript
    // Calendar Principal - Admin
    <CalendarGrid
      year={year}
      month={month}
      monthName={monthName}
      weekDays={weekDays}
      calendarDays={calendarDays}
      canNavigatePrevious={condition}
      onPrevMonth={handler}
      onNextMonth={handler}
      selectedDate={date}
      onSelectDate={handler}
      availability={availability}
      showEvents={true}           // ← Admin ve eventos
      getEventsForDate={function}
      minimalSize={false}         // ← Tamaño completo
    />

    // Mini Calendar - Formulario
    <CalendarGrid
      // ... mismos props ...
      showEvents={false}          // ← No ve eventos
      minimalSize={true}          // ← Tamaño compacto
    />

    // Calendar Público
    <CalendarGrid
      // ... props base ...
      showEvents={false}
      minimalSize={false}
    />
    ```

---

## User Preferences (Documented)
- Lenguaje de desarrollo: **Spanish + English code**
- Estilo UI: **Consistencia visual centralizada**
- Arquitectura: **Componentes reutilizables, evita duplicación**
- Prioridad: **UX fluida, cambios en un lugar = aplica en todos**

---

## 🚨 Guías Generales de Desarrollo - Prevención de Errores Futuros

### 1. ESPACIADO Y ALINEACIÓN
**Problema típico**: Componentes desalineados, inconsistencias visuales

**Estándar a seguir**:
```
Componentes principales (contenedores del layout):
├── Header:        px-4 (16px horizontal)
├── Main content:  px-4 (16px horizontal)
├── Sidebar:       sin px (sidebar es contenedor)
└── Cards/panels:  p-4 (16px internal)

REGLA DE ORO:
Si el componente es un "contenedor principal en el layout", usa px-4
Si es un "sub-contenedor" (card, panel, dialog), usa p-4
```

**Checklist antes de commitear**:
- [ ] ¿Reviséa visualmente que todo esté alineado?
- [ ] ¿Verificá que header tiene el mismo px que main content?
- [ ] ¿Otros componentes flotantes están alineados?

---

### 2. LÓGICA DE TIMESTAMPS Y ZONAS HORARIAS
**Problema típico**: Datos se eliminan accidentalmente, eventos desaparecen

**Antipatrones ❌ a EVITAR**:
```javascript
// ❌ MALO: Eliminar basado en timestamp simple
const eventsToDelete = await db
  .select()
  .from(calendarEvents)
  .where(lt(calendarEvents.endTime, now));  // Puede eliminar eventos recientes

// ❌ MALO: Operaciones destructivas en métodos GET
app.get('/calendar', async (req, res) => {
  deleteOldEvents();  // ← ¡NO! Debería ser cron job
  return calendar;
});

// ❌ MALO: Comparación simple sin considerar zonas
const isExpired = eventDate < currentDate;  // ¿Qué zona horaria?
```

**Patrones correctos ✅ a USAR**:
```javascript
// ✅ BUENO: Agregar margen de seguridad (buffer)
const deletionThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);  // 24h de buffer
const eventsToDelete = await db
  .select()
  .from(calendarEvents)
  .where(lt(calendarEvents.endTime, deletionThreshold));

// ✅ BUENO: Operaciones destructivas en cron jobs separados
// Cron job (se ejecuta cada hora, no en cada request)
cronJob.schedule('0 * * * *', async () => {
  deleteOldEvents();
});

// ✅ BUENO: Documentar zona horaria esperada
const calculateDeadline = (date: Date) => {
  // date expected in UTC
  // returns Date in UTC
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
};
```

**Checklist para timestamp code**:
- [ ] ¿Estoy eliminando datos basado en timestamps? → Agregar 24h de buffer
- [ ] ¿Esta es una operación destructiva? → Mover a cron job, no en GET
- [ ] ¿He documentado la zona horaria esperada? → Agregar comentarios
- [ ] ¿He testeado con diferentes zonas horarias? → Validar en desarrollo

---

### 3. ESTADO "SUCIO" EN FORMULARIOS Y DIÁLOGOS
**Problema típico**: Usuario navega → cierra sin guardar → reabre → estado sucio

**Antipatrones ❌ a EVITAR**:
```javascript
// ❌ MALO: Dialog sin resetear estado
<Dialog open={showForm} onOpenChange={setShowForm}>
  {/* El mes anterior se queda guardado si cierras sin guardar */}
</Dialog>

// ❌ MALO: Cambios de estado no se revierten
const [month, setMonth] = useState(new Date().getMonth());
// Usuario lo cambia pero no hay reset al cerrar
```

**Patrones correctos ✅ a USAR**:
```javascript
// ✅ BUENO: Interceptar cierre y ejecutar resetForm
<Dialog open={showForm} onOpenChange={(open) => {
  if (!open) resetForm();  // Reset antes de cerrar
  setShowForm(open);
}}>

// ✅ BUENO: Función resetForm completa
const resetForm = () => {
  setMonth(new Date().getMonth());
  setYear(new Date().getFullYear());
  setSelectedDate(null);
  // ... otros campos ...
};

// ✅ BUENO: También resetear en onSuccess
mutation.mutate(data, {
  onSuccess: () => {
    resetForm();  // Limpiar después de guardar
    setShowForm(false);
  }
});
```

**Checklist para formularios**:
- [ ] ¿Hay un Dialog o Modal? → Debe tener resetForm en onOpenChange
- [ ] ¿Los datos cambian durante interacción? → Resetear al cerrar
- [ ] ¿Hay calendario/date picker adentro? → Especialmente resetear mes/año

---

### 4. LÓGICA INVERTIDA EN CONDICIONALES
**Problema típico**: Botones deshabilitados cuando deberían estar habilitados

**Antipatrones ❌ a EVITAR**:
```javascript
// ❌ MALO: Lógica invertida
canNavigatePrevious = year < today || (year === today && month <= today)
// Esto desabilita cuando debería habilitar

// ❌ MALO: Comparación confusa
const isDisabled = isEnabled;  // ¿Qué significa esto?
```

**Patrones correctos ✅ a USAR**:
```javascript
// ✅ BUENO: Lógica clara y documentada
canNavigatePrevious = year > today || (year === today && month > today)
// true = botón habilitado (puedes ir atrás)
// false = botón deshabilitado (ya estás en mes actual)

// ✅ BUENO: Nombres claros
const isDisabledByUser = !isEnabled;
const shouldShowButton = canNavigate && hasPermission;
```

**Checklist para condicionales**:
- [ ] ¿Esto es una negación? → Verificar la lógica dos veces
- [ ] ¿Hay múltiples condiciones? → Usar comentarios explicativos
- [ ] ¿Lo testeé invirtiendo la lógica? → Validar que funciona al revés

---

### 5. REUTILIZACIÓN DE COMPONENTES VS DUPLICACIÓN
**Problema típico**: Código duplicado en 3 lugares, cambios no se propagan

**Antipatrones ❌ a EVITAR**:
```javascript
// ❌ MALO: HTML de calendario copiado en calendar.tsx
<div className="grid grid-cols-7 gap-1">
  {/* código del calendario repetido */}
</div>

// ❌ MALO: Mismo HTML en public-calendar.tsx
<div className="grid grid-cols-7 gap-1">
  {/* código copiado otra vez */}
</div>

// ❌ MALO: Y otra vez en raffle-details.tsx
<div className="grid grid-cols-7 gap-1">
  {/* código triplicado */}
</div>
// Cuando necesitas cambiar estilos, ¡cambiar en 3 lugares!
```

**Patrones correctos ✅ a USAR**:
```javascript
// ✅ BUENO: Componente centralizado
// client/src/components/calendar-grid.tsx
export function CalendarGrid({ year, month, ...props }) {
  return <div className="grid grid-cols-7 gap-1">{/* ÚNICA fuente de verdad */}</div>
}

// ✅ BUENO: Reutilizar en todos lados
// client/src/pages/calendar.tsx
import { CalendarGrid } from '@/components/calendar-grid';
<CalendarGrid year={year} month={month} />

// client/src/pages/public-calendar.tsx
import { CalendarGrid } from '@/components/calendar-grid';
<CalendarGrid year={year} month={month} minimalSize={true} />

// client/src/pages/raffle-details.tsx
import { CalendarGrid } from '@/components/calendar-grid';
<CalendarGrid year={year} month={month} />
```

**Checklist para código duplicado**:
- [ ] ¿He copiado código de otro lugar? → STOP, hacer componente
- [ ] ¿Este componente existe en 2+ lugares? → Extraer a archivo shared
- [ ] ¿Necesito cambiar estilos? → ¿Afecta 1 o 3 archivos?

---

### 6. ORDEN Y ESTRUCTURA DE CÓDIGO
**Mejor organización en componentes**:
```javascript
export function MyComponent() {
  // 1. Hooks (useState, useQuery, etc)
  const [state, setState] = useState();
  const { data } = useQuery();
  
  // 2. Funciones locales (handlers, utils)
  const handleClick = () => { /* ... */ };
  
  // 3. Efectos
  useEffect(() => { /* ... */ }, []);
  
  // 4. Condicionales previos al render
  if (isLoading) return <Skeleton />;
  
  // 5. Render
  return (
    <div>
      {/* Estructura clara y legible */}
    </div>
  );
}
```

---

### 7. DOCUMENTACIÓN DE BUGS Y FIXES
**Formato a seguir cuando reportes issues**:
```markdown
- **[FECHA] - [STATUS]**: [Título descriptivo]
  - 🔴 **PROBLEMA**: [Síntomas observados]
  - 🔴 **ROOT CAUSE**: [Dónde está el bug y por qué]
  - ✅ **SOLUCIÓN**: [Qué se cambió]
  - ✅ **CHECKLIST FUTURO**: [Cómo evitarlo]
```

Este formato está en `replit.md` para referencia rápida.

---

### 8. REGLA DE ORO: CAMBIOS EN UN LUGAR = APLICA EN TODOS
Si necesitas hacer un cambio visual/funcional que afecta múltiples módulos:

1. **Identificar**: ¿Qué componentes se afectan?
2. **Extraer**: ¿Existe componente shared? Si no, crearlo
3. **Centralizar**: Hacer cambio en UN lugar
4. **Verificar**: Confirmar que se aplicó en todos lados

**NO HACER**: Cambiar en calendar.tsx, olvidar public-calendar.tsx, resulta en inconsistencia

---

## Archivos Críticos a Recordar

| Archivo | Responsabilidad | Nota |
|---------|-----------------|------|
| `top-header.tsx` | Header superior del layout | Debe tener `px-4` |
| `calendar-grid.tsx` | ÚNICA fuente de verdad para calendarios | Centralizado |
| `app-sidebar.tsx` | Sidebar del layout | No cambiar padding |
| `replit.md` | Este archivo - documentación | Mantener actualizado |

---

## Project Architecture

### Frontend Structure
```
client/src/
├── pages/
│   ├── calendar.tsx           (Panel admin - usar CalendarGrid)
│   ├── public-calendar.tsx    (Calendario público - usar CalendarGrid)
│   └── calendar-analytics.tsx
├── components/
│   ├── calendar-grid.tsx      (⭐ COMPONENTE CENTRAL - Todos los calendarios)
│   └── ui/ (shadcn components)
└── lib/
    └── queryClient.ts
```

### Key Principles
1. **Centralización**: CalendarGrid es la ÚNICA fuente de verdad para UI de calendarios
2. **Props-driven**: Comportamiento configurado via props, no código duplicado
3. **Reutilización**: Mismo componente en 3 contextos diferentes (admin, público, formulario)
4. **Consistencia**: Cambios visuales se propagan automáticamente a todos lados

---

### Notas Importantes para Futuro Desarrollo

1. **CalendarGrid - Componente Central**
   - UBICACIÓN: `client/src/components/calendar-grid.tsx`
   - NUNCA duplicar código de calendario en otros lugares
   - SIEMPRE usar CalendarGrid para cualquier calendario
   - Props `minimalSize={true/false}` controla tamaño

2. **Mini Calendario en Diálogos**
   - SIEMPRE resetear mes/año cuando se cierra el diálogo
   - Código correcto: `onOpenChange={(open) => { if (!open) resetForm(); ... }}`
   - La función `resetForm()` debe incluir reseteo de calendar state

3. **Lógica de Navegación - canNavigatePrevious**
   - `canNavigatePrevious = true` → Botón habilitado (puedes ir atrás)
   - `canNavigatePrevious = false` → Botón deshabilitado (mes actual o pasado)
   - Comparación correcta: `year > today OR (year === today AND month > today)`
   - EVITA: `year < today` (lógica invertida, deshabilita cuando debería habilitar)

4. **Estado Sucio en Calendarios**
   - Problema: Usuario navega meses → cierra sin guardar → reabre → quedó en mes anterior
   - Solución: Resetear estados de mes/año al cerrar diálogos
   - Implementación: Hook en `onOpenChange` que ejecuta `resetForm()`

5. **Testing CalendarGrid**
   - ✅ Funciona con `minimalSize={true}` y `minimalSize={false}`
   - ✅ Respeta `canNavigatePrevious` para deshabilitar botón
   - ✅ Llama callbacks `onPrevMonth` / `onNextMonth` correctamente
   - ✅ Renderiza eventos cuando `showEvents={true}` + `getEventsForDate` provided

---

### Changelog Completo - Nov 26, 2025

| Archivo | Línea | Cambio | Motivo |
|---------|-------|--------|--------|
| `calendar-grid.tsx` | NEW | Componente CalendarGrid creado | Centralizar UI de calendarios |
| `calendar.tsx` | 22 | Import CalendarGrid | Usar componente nuevo |
| `calendar.tsx` | 831-851 | Reemplaza HTML calendar por CalendarGrid | Usar componente centralizado |
| `calendar.tsx` | 1396-1399 | Fix onOpenChange con resetForm | Resetear state al cerrar |
| `calendar.tsx` | 1442 | Fix canNavigatePrevious logic | Botón anterior funciona |
| `calendar.tsx` | 1433-1474 | Mini calendar usa CalendarGrid | Mismo UI que principal |
| `public-calendar.tsx` | 18 | Import CalendarGrid | Usar componente nuevo |
| `public-calendar.tsx` | 741-759 | Reemplaza HTML calendar por CalendarGrid | Usar componente centralizado |

