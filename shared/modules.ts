// Registro Centralizado de Módulos del Sistema
// Este archivo es la ÚNICA fuente de verdad para los módulos disponibles
// Al agregar/eliminar módulos aquí, se actualizan automáticamente:
// - Sidebar navigation
// - Sistema de roles y permisos
// - Validación de acceso

export interface ModuleDefinition {
  id: string;           // Identificador único del módulo
  name: string;         // Nombre para mostrar
  description: string;  // Descripción del módulo
  icon: string;         // Nombre del icono de Lucide
  section: string;      // Sección en el sidebar (productivity, whatsapp, crm, etc.)
  routes: string[];     // Rutas asociadas a este módulo
  isActive: boolean;    // Si el módulo está activo en el sistema
  order: number;        // Orden de aparición
  subsection?: string;  // Subsección dentro de una sección (ej: "commerce" dentro de "whatsapp")
}

export interface SectionDefinition {
  id: string;           // Identificador único de la sección
  name: string;         // Nombre para mostrar
  icon: string;         // Nombre del icono de Lucide
  color: {              // Colores para el sidebar
    bg: string;
    text: string;
  };
  order: number;        // Orden de aparición
  ownerOnly?: boolean;  // Si solo el propietario puede ver esta sección
}

// Permisos disponibles para cada módulo
export const PERMISSIONS = [
  { id: "read", label: "Leer", description: "Ver información" },
  { id: "create", label: "Crear", description: "Crear nuevos registros" },
  { id: "edit", label: "Editar", description: "Modificar registros existentes" },
  { id: "delete", label: "Eliminar", description: "Eliminar registros" },
] as const;

export type PermissionType = typeof PERMISSIONS[number]["id"];

// Definición de todas las secciones del sidebar
export const SECTIONS: SectionDefinition[] = [
  {
    id: "productivity",
    name: "Productividad",
    icon: "CheckSquare",
    color: { bg: "bg-cyan-500/15", text: "text-cyan-600 dark:text-cyan-400" },
    order: 1,
  },
  {
    id: "teams",
    name: "Teams",
    icon: "Users2",
    color: { bg: "bg-violet-500/15", text: "text-violet-600 dark:text-violet-400" },
    order: 2,
    ownerOnly: true, // Solo el propietario puede gestionar el equipo
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "MessageCircle",
    color: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
    order: 3,
  },
  {
    id: "crm",
    name: "CRM",
    icon: "Users",
    color: { bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-400" },
    order: 4,
  },
  {
    id: "raffles",
    name: "Rifas",
    icon: "Ticket",
    color: { bg: "bg-yellow-500/15", text: "text-yellow-600 dark:text-yellow-400" },
    order: 5,
  },
  {
    id: "surveys",
    name: "Encuestas",
    icon: "BarChart3",
    color: { bg: "bg-green-500/15", text: "text-green-600 dark:text-green-400" },
    order: 6,
  },
  {
    id: "ai-voice",
    name: "AI-VOICE",
    icon: "Phone",
    color: { bg: "bg-orange-500/15", text: "text-orange-600 dark:text-orange-400" },
    order: 7,
  },
];

// Definición de todos los módulos del sistema
export const MODULES: ModuleDefinition[] = [
  // Productividad
  {
    id: "calendar",
    name: "Calendario",
    description: "Gestión de citas y disponibilidad",
    icon: "Calendar",
    section: "productivity",
    routes: ["/calendar", "/calendar/analytics"],
    isActive: true,
    order: 1,
  },
  {
    id: "tasks",
    name: "Tareas",
    description: "Gestión de tareas y kanban",
    icon: "CheckSquare",
    section: "productivity",
    routes: ["/tasks"],
    isActive: true,
    order: 2,
  },
  // Teams (solo propietario)
  {
    id: "team-members",
    name: "Miembros",
    description: "Gestión de miembros del equipo",
    icon: "Users2",
    section: "teams",
    routes: ["/teams"],
    isActive: true,
    order: 1,
  },
  {
    id: "team-roles",
    name: "Roles",
    description: "Configuración de roles y permisos",
    icon: "Zap",
    section: "teams",
    routes: ["/teams/roles"],
    isActive: true,
    order: 2,
  },
  // WhatsApp
  {
    id: "conversations",
    name: "Chats",
    description: "Conversaciones de WhatsApp",
    icon: "MessageSquare",
    section: "whatsapp",
    routes: ["/conversations"],
    isActive: true,
    order: 1,
  },
  {
    id: "connections",
    name: "Conexiones",
    description: "Cuentas de WhatsApp conectadas",
    icon: "Link",
    section: "whatsapp",
    routes: ["/connections"],
    isActive: true,
    order: 2,
  },
  {
    id: "chatbots",
    name: "Chatbots",
    description: "Bots de respuestas automáticas",
    icon: "Bot",
    section: "whatsapp",
    routes: ["/chatbots", "/chatbots/:id"],
    isActive: true,
    order: 3,
  },
  {
    id: "ai-providers",
    name: "Proveedores IA",
    description: "Configuración de proveedores de IA",
    icon: "Zap",
    section: "whatsapp",
    routes: ["/ai-providers"],
    isActive: true,
    order: 4,
  },
  {
    id: "sales-funnel",
    name: "Análisis",
    description: "Análisis de embudo de ventas",
    icon: "BarChart3",
    section: "whatsapp",
    routes: ["/sales-funnel"],
    isActive: true,
    order: 5,
  },
  {
    id: "stores",
    name: "Tiendas",
    description: "Gestión de tiendas online",
    icon: "ShoppingBag",
    section: "whatsapp",
    subsection: "commerce",
    routes: ["/stores", "/stores/:id/products", "/stores/:id/orders"],
    isActive: true,
    order: 6,
  },
  {
    id: "products",
    name: "Productos",
    description: "Catálogo de productos",
    icon: "Package",
    section: "whatsapp",
    subsection: "commerce",
    routes: ["/products", "/products/manage"],
    isActive: true,
    order: 7,
  },
  {
    id: "orders",
    name: "Pedidos",
    description: "Gestión de pedidos",
    icon: "ShoppingBag",
    section: "whatsapp",
    subsection: "commerce",
    routes: ["/orders"],
    isActive: true,
    order: 8,
  },
  // Agentes de IA para Llamadas
  {
    id: "ai-voice-agents",
    name: "Agentes",
    description: "Crear y gestionar agentes de IA",
    icon: "CheckSquare",
    section: "ai-voice",
    routes: ["/ai-voice-agents"],
    isActive: true,
    order: 1,
  },
  {
    id: "ai-voice-calls",
    name: "Panel de Llamadas",
    description: "Hacer llamadas con agentes de IA",
    icon: "Phone",
    section: "ai-voice",
    routes: ["/ai-voice-calls"],
    isActive: true,
    order: 2,
  },
  // CRM
  {
    id: "clients",
    name: "Clientes",
    description: "Gestión de clientes",
    icon: "Users",
    section: "crm",
    routes: ["/crm/clients"],
    isActive: true,
    order: 1,
  },
  {
    id: "leads",
    name: "Leads",
    description: "Gestión de prospectos",
    icon: "Target",
    section: "crm",
    routes: ["/crm/leads"],
    isActive: true,
    order: 2,
  },
  // Rifas
  {
    id: "raffles",
    name: "Rifas",
    description: "Gestión de rifas y sorteos",
    icon: "Ticket",
    section: "raffles",
    routes: ["/raffles", "/raffle/create", "/raffles/:id"],
    isActive: true,
    order: 1,
  },
  // Encuestas
  {
    id: "surveys",
    name: "Encuestas",
    description: "Creación y gestión de encuestas",
    icon: "BarChart3",
    section: "surveys",
    routes: ["/surveys", "/survey-edit/:id"],
    isActive: true,
    order: 1,
  },
];

// Funciones de utilidad

// Obtiene todos los módulos activos
export function getActiveModules(): ModuleDefinition[] {
  return MODULES.filter(m => m.isActive);
}

// Obtiene módulos por sección
export function getModulesBySection(sectionId: string): ModuleDefinition[] {
  return MODULES.filter(m => m.section === sectionId && m.isActive).sort((a, b) => a.order - b.order);
}

// Obtiene todas las secciones activas (que tienen al menos un módulo activo)
export function getActiveSections(): SectionDefinition[] {
  const activeSectionIds = new Set(MODULES.filter(m => m.isActive).map(m => m.section));
  return SECTIONS.filter(s => activeSectionIds.has(s.id)).sort((a, b) => a.order - b.order);
}

// Obtiene los nombres de módulos para usar en el sistema de permisos
export function getModuleNamesForPermissions(): string[] {
  // Agrupa por sección y devuelve nombres únicos de secciones para permisos
  const sectionNames = new Set<string>();
  MODULES.filter(m => m.isActive).forEach(m => {
    const section = SECTIONS.find(s => s.id === m.section);
    if (section && !section.ownerOnly) {
      sectionNames.add(section.name);
    }
  });
  return Array.from(sectionNames);
}

// Verifica si una ruta pertenece a un módulo específico
export function getModuleForRoute(route: string): ModuleDefinition | undefined {
  // Normaliza la ruta (elimina parámetros dinámicos para comparación)
  const normalizedRoute = route.split('/').map(part => 
    part.startsWith(':') ? ':param' : part
  ).join('/');
  
  return MODULES.find(m => {
    return m.routes.some(r => {
      const normalizedModuleRoute = r.split('/').map(part =>
        part.startsWith(':') ? ':param' : part
      ).join('/');
      return normalizedModuleRoute === normalizedRoute || route.startsWith(r.replace(/:\w+/g, ''));
    });
  });
}

// Obtiene la sección para una ruta dada
export function getSectionForRoute(route: string): SectionDefinition | undefined {
  const module = getModuleForRoute(route);
  if (!module) return undefined;
  return SECTIONS.find(s => s.id === module.section);
}

// Permisos por defecto para cada rol predefinido
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, PermissionType[]>> = {
  admin: Object.fromEntries(
    getModuleNamesForPermissions().map(name => [name, ["read", "create", "edit", "delete"] as PermissionType[]])
  ),
  member: Object.fromEntries(
    getModuleNamesForPermissions().map(name => [name, ["read", "create", "edit"] as PermissionType[]])
  ),
  viewer: Object.fromEntries(
    getModuleNamesForPermissions().map(name => [name, ["read"] as PermissionType[]])
  ),
};

// Tipo para permisos de usuario
export interface UserModuleAccess {
  moduleId: string;
  sectionId: string;
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Genera el acceso a módulos basado en un rol
export function generateModuleAccessFromRole(role: string): UserModuleAccess[] {
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.viewer;
  const access: UserModuleAccess[] = [];
  
  for (const module of getActiveModules()) {
    const section = SECTIONS.find(s => s.id === module.section);
    if (!section || section.ownerOnly) continue;
    
    const sectionPerms = rolePerms[section.name] || [];
    access.push({
      moduleId: module.id,
      sectionId: section.id,
      canRead: sectionPerms.includes("read"),
      canCreate: sectionPerms.includes("create"),
      canEdit: sectionPerms.includes("edit"),
      canDelete: sectionPerms.includes("delete"),
    });
  }
  
  return access;
}

// Verifica si un usuario tiene acceso a una sección
export function hasAccessToSection(sectionId: string, moduleAccess: UserModuleAccess[] | null | undefined, isOwner: boolean): boolean {
  // El propietario siempre tiene acceso
  if (isOwner) return true;
  
  // Si no hay moduleAccess, no tiene acceso
  if (!moduleAccess || moduleAccess.length === 0) return false;
  
  // Verifica si tiene al menos lectura en algún módulo de la sección
  return moduleAccess.some(access => 
    access.sectionId === sectionId && access.canRead
  );
}

// Verifica si un usuario tiene acceso a un módulo específico
export function hasAccessToModule(moduleId: string, moduleAccess: UserModuleAccess[] | null | undefined, isOwner: boolean): boolean {
  if (isOwner) return true;
  if (!moduleAccess || moduleAccess.length === 0) return false;
  
  const access = moduleAccess.find(a => a.moduleId === moduleId);
  return access?.canRead || false;
}

// Verifica permisos específicos en un módulo
export function hasPermissionInModule(
  moduleId: string, 
  permission: PermissionType,
  moduleAccess: UserModuleAccess[] | null | undefined, 
  isOwner: boolean
): boolean {
  if (isOwner) return true;
  if (!moduleAccess || moduleAccess.length === 0) return false;
  
  const access = moduleAccess.find(a => a.moduleId === moduleId);
  if (!access) return false;
  
  switch (permission) {
    case "read": return access.canRead;
    case "create": return access.canCreate;
    case "edit": return access.canEdit;
    case "delete": return access.canDelete;
    default: return false;
  }
}
