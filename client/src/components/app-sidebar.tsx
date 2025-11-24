import { useState } from "react";
import { Search, ChevronDown, MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, MessageCircle, BarChart3, Users, Target, Facebook, Calendar, Sparkles, Ticket, LayoutDashboard, Zap, Users2, ShoppingBag, CheckSquare, Package } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface AppSidebarProps {
  user?: { name: string; email: string };
  onLogout: () => void;
}

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  testId: string;
}

interface MenuSection {
  title: string;
  key: string;
  items: MenuItem[];
}

const sections: MenuSection[] = [
  {
    title: "WhatsApp",
    key: "whatsapp",
    items: [
      { title: "Conversaciones", url: "/conversations", icon: MessageSquare, testId: "link-conversations" },
      { title: "Conexiones", url: "/connections", icon: LinkIcon, testId: "link-connections" },
      { title: "Chatbots", url: "/chatbots", icon: Bot, testId: "link-chatbots" },
      { title: "Proveedores de IA", url: "/ai-providers", icon: Zap, testId: "link-ai-providers" },
      { title: "Análisis", url: "/sales-funnel", icon: BarChart3, testId: "link-sales-funnel" },
    ],
  },
  {
    title: "CRM",
    key: "crm",
    items: [
      { title: "Clientes", url: "/crm/clients", icon: Users, testId: "link-crm-clients" },
      { title: "Leads", url: "/crm/leads", icon: Target, testId: "link-crm-leads" },
    ],
  },
  {
    title: "Ventas",
    key: "sales",
    items: [
      { title: "Facebook", url: "/facebook", icon: Facebook, testId: "link-facebook" },
      { title: "Automatización", url: "/facebook-automation", icon: Sparkles, testId: "link-facebook-automation" },
      { title: "Rifas", url: "/raffles", icon: Ticket, testId: "link-raffles" },
    ],
  },
  {
    title: "Encuestas",
    key: "surveys",
    items: [
      { title: "Encuestas", url: "/surveys", icon: BarChart3, testId: "link-surveys" },
    ],
  },
  {
    title: "Comercio",
    key: "ecommerce",
    items: [
      { title: "Tiendas", url: "/stores", icon: ShoppingBag, testId: "link-stores" },
      { title: "Pedidos", url: "/orders", icon: Package, testId: "link-store-orders" },
    ],
  },
];

const singleItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-dashboard" },
  { title: "Calendario", url: "/calendar", icon: Calendar, testId: "link-calendar" },
  { title: "Tareas", url: "/tasks", icon: CheckSquare, testId: "link-tasks" },
  { title: "Productos", url: "/products", icon: ShoppingBag, testId: "link-products" },
  { title: "Teams", url: "/teams", icon: Users2, testId: "link-teams" },
];

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const { open } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    whatsapp: true,
    crm: true,
    sales: false,
    surveys: false,
    ecommerce: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredSections = sections.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  const filteredSingleItems = singleItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar className="border-r border-border/60 bg-background">
      <SidebarContent className="gap-0 px-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border/40">
          {open ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold text-foreground">WhatsApp CRM</h1>
                  <p className="text-xs text-muted-foreground">v1.0 Professional</p>
                </div>
              </div>
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs"
                data-testid="input-sidebar-search"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="py-2 px-2 space-y-1">
          {/* Single Items - Top */}
          {filteredSingleItems.map((item) => (
            <SidebarMenuItem key={item.url} item={item} location={location} open={open} />
          ))}

          {/* Sections */}
          {filteredSections.map((section) =>
            section.items.length > 0 ? (
              <div key={section.key}>
                {open && (
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between px-2.5 py-2 mt-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
                    data-testid={`button-toggle-${section.key}`}
                  >
                    <span className="group-hover:text-foreground">{section.title}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        expandedSections[section.key] ? "" : "-rotate-90"
                      }`}
                    />
                  </button>
                )}
                {expandedSections[section.key] && (
                  <div className="space-y-0.5 py-1">
                    {section.items.map((item) => (
                      <SidebarMenuItem
                        key={item.url}
                        item={item}
                        location={location}
                        open={open}
                        isNested
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null
          )}
        </div>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border/40 px-2 py-3">
        {user && (
          <>
            <Link
              href="/settings"
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors group ${
                open ? "text-xs" : ""
              }`}
              data-testid="link-settings"
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {open && <span className="font-medium truncate">Configuración</span>}
            </Link>
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors group ${
                open ? "text-xs" : ""
              }`}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {open && <span className="font-medium truncate">Cerrar Sesión</span>}
            </button>
            {open && (
              <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2.5">
                <Avatar className="w-8 h-8 flex-shrink-0 border border-border/40">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

interface SidebarMenuItemProps {
  item: MenuItem;
  location: string;
  open: boolean;
  isNested?: boolean;
}

function SidebarMenuItem({ item, location, open, isNested }: SidebarMenuItemProps) {
  const isActive = location === item.url;

  return (
    <Link
      href={item.url}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all group ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      } ${isNested ? "ml-1" : ""} ${open ? "text-xs" : ""}`}
      data-testid={item.testId}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {open && <span className="truncate flex-1">{item.title}</span>}
    </Link>
  );
}
