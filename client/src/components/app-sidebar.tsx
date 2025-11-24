import { useState } from "react";
import { Search, ChevronDown, MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, MessageCircle, BarChart3, Users, Target, Facebook, Calendar, Sparkles, Ticket, LayoutDashboard, Zap, Users2, ShoppingBag, CheckSquare, Package, TrendingUp } from "lucide-react";
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
    title: "Rifas",
    key: "raffles",
    items: [
      { title: "Rifas", url: "/raffles", icon: Ticket, testId: "link-raffles" },
    ],
  },
  {
    title: "Social",
    key: "social",
    items: [
      { title: "Facebook", url: "/facebook", icon: Facebook, testId: "link-facebook" },
      { title: "Automatización", url: "/facebook-automation", icon: Sparkles, testId: "link-facebook-automation" },
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
      { title: "Productos", url: "/products/manage", icon: Package, testId: "link-products-manage" },
      { title: "Pedidos", url: "/orders", icon: ShoppingBag, testId: "link-store-orders" },
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
    raffles: true,
    surveys: true,
    ecommerce: true,
    social: true,
  });

  const sectionIcons: Record<string, any> = {
    whatsapp: MessageCircle,
    crm: Users,
    raffles: Ticket,
    surveys: TrendingUp,
    ecommerce: ShoppingBag,
    social: Facebook,
  };

  const sectionColors: Record<string, { bg: string; text: string }> = {
    whatsapp: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
    crm: { bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-400" },
    raffles: { bg: "bg-yellow-500/15", text: "text-yellow-600 dark:text-yellow-400" },
    surveys: { bg: "bg-green-500/15", text: "text-green-600 dark:text-green-400" },
    ecommerce: { bg: "bg-pink-500/15", text: "text-pink-600 dark:text-pink-400" },
    social: { bg: "bg-red-500/15", text: "text-red-600 dark:text-red-400" },
  };

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
              <div key={section.key} className="mt-1">
                {open && (
                  <button
                    onClick={() => toggleSection(section.key)}
                    className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2.5 rounded-lg transition-all hover:bg-muted/50 group ${
                      expandedSections[section.key] ? "bg-muted/30" : ""
                    }`}
                    data-testid={`button-toggle-${section.key}`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${sectionColors[section.key].bg} flex items-center justify-center flex-shrink-0 border border-border/40`}>
                        {(() => {
                          const IconComponent = sectionIcons[section.key];
                          return <IconComponent className={`w-4 h-4 ${sectionColors[section.key].text}`} />;
                        })()}
                      </div>
                      <span className="text-xs font-semibold text-foreground group-hover:text-foreground truncate">
                        {section.title}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform ${
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
