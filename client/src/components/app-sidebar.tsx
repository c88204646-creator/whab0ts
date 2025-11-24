import { useState, useEffect } from "react";
import { Search, ChevronDown, MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, MessageCircle, BarChart3, Users, Target, Facebook, Calendar, Sparkles, Ticket, LayoutDashboard, Zap, Users2, ShoppingBag, CheckSquare, Package, TrendingUp, Flame, X } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { WhatsBot } from "@/components/whatsbot-logo";

interface AppSidebarProps {
  user?: { name: string; email: string };
  onLogout: () => void;
}

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  testId: string;
  isHot?: boolean;
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
      { title: "Chats", url: "/conversations", icon: MessageSquare, testId: "link-conversations", isHot: true },
      { title: "Conexiones", url: "/connections", icon: LinkIcon, testId: "link-connections", isHot: true },
      { title: "Chatbots", url: "/chatbots", icon: Bot, testId: "link-chatbots", isHot: true },
      { title: "Proveedores IA", url: "/ai-providers", icon: Zap, testId: "link-ai-providers" },
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
      { title: "Auto Posts", url: "/facebook-automation", icon: Sparkles, testId: "link-facebook-automation" },
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
      { title: "Categorías y Productos", url: "/products", icon: Package, testId: "link-products" },
      { title: "Pedidos", url: "/orders", icon: ShoppingBag, testId: "link-store-orders", isHot: true },
    ],
  },
];

const singleItems: MenuItem[] = [
  { title: "Inicio", url: "/", icon: LayoutDashboard, testId: "link-dashboard" },
  { title: "Calendario", url: "/calendar", icon: Calendar, testId: "link-calendar" },
  { title: "Tareas", url: "/tasks", icon: CheckSquare, testId: "link-tasks" },
  { title: "Equipo", url: "/teams", icon: Users2, testId: "link-teams" },
];

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const { open, setOpen } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    whatsapp: false,
    crm: false,
    raffles: false,
    surveys: false,
    ecommerce: false,
    social: false,
  });

  // Cerrar sidebar en móvil cuando cambia la ubicación
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && open) {
      setOpen(false);
    }
  }, [location, open, setOpen]);

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
        <div className="px-3 py-4 border-b border-border/40">
          {open ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex-shrink-0 transition-transform duration-300 hover:scale-110">
                  <WhatsBot />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500 bg-clip-text text-transparent">WhatsBot</h1>
                  <p className="text-xs text-muted-foreground">Professional</p>
                </div>
              </div>
              <div className={`relative flex items-center transition-all duration-300 ${
                searchFocus 
                  ? "bg-primary/10 border-primary/50" 
                  : "bg-muted/30 border-border/40 hover:bg-muted/50 hover:border-border/60"
              } border rounded-lg px-3 py-2.5 group`}>
                <Search className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-300 ${
                  searchFocus ? "text-primary" : "text-muted-foreground"
                }`} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocus(true)}
                  onBlur={() => setSearchFocus(false)}
                  className="flex-1 bg-transparent border-0 outline-none px-2 py-0 text-xs placeholder:text-muted-foreground/60 text-foreground caret-primary"
                  data-testid="input-sidebar-search"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 rounded hover:bg-muted/50 transition-colors duration-200 text-muted-foreground hover:text-foreground"
                    data-testid="button-clear-search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-110">
              <WhatsBot />
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="py-1 px-2 space-y-0.5">
          {/* Single Items - Top */}
          {filteredSingleItems.map((item) => (
            <SidebarMenuItem key={item.url} item={item} location={location} open={open} />
          ))}

          {/* Sections Divider */}
          {filteredSingleItems.length > 0 && filteredSections.some(s => s.items.length > 0) && (
            <div className="h-px bg-border/40 my-0.5" />
          )}

          {/* Sections */}
          {filteredSections.map((section) =>
            section.items.length > 0 ? (
              <div key={section.key}>
                {open && (
                  <button
                    onClick={() => toggleSection(section.key)}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md transition-all hover:bg-muted/40 group text-xs ${
                      expandedSections[section.key] ? "bg-muted/20" : ""
                    }`}
                    data-testid={`button-toggle-${section.key}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-7 h-7 rounded-md ${sectionColors[section.key].bg} flex items-center justify-center flex-shrink-0 border border-border/30`}>
                        {(() => {
                          const IconComponent = sectionIcons[section.key];
                          return <IconComponent className={`w-3.5 h-3.5 ${sectionColors[section.key].text}`} />;
                        })()}
                      </div>
                      <span className="font-medium text-foreground group-hover:text-foreground truncate">
                        {section.title}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform ${
                        expandedSections[section.key] ? "" : "-rotate-90"
                      }`}
                    />
                  </button>
                )}
                {expandedSections[section.key] && (
                  <div className="space-y-0 py-0.5 pl-1">
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
            {/* User Card - Professional Style */}
            {open && (
              <div className="mb-2 p-3 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-border/50 transition-all duration-300 hover:border-border/80 hover:from-muted/60 hover:to-muted/30">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-8 h-8 flex-shrink-0 border-2 border-primary/40 ring-2 ring-primary/20 transition-all duration-300">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-amber-500 text-white font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-1">
              <Link
                href="/settings"
                onClick={() => {
                  const isMobile = window.innerWidth < 768;
                  if (isMobile) {
                    setOpen(false);
                  }
                }}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 group text-xs font-medium`}
                data-testid="link-settings"
              >
                <Settings className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 group-hover:rotate-90" />
                {open && <span>Ajustes</span>}
              </Link>
              <button
                onClick={() => {
                  const isMobile = window.innerWidth < 768;
                  if (isMobile) {
                    setOpen(false);
                  }
                  onLogout();
                }}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group text-xs font-medium`}
                data-testid="button-logout"
              >
                <LogOut className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                {open && <span>Salir</span>}
              </button>
            </div>
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
  const { setOpen } = useSidebar();

  const handleClick = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <Link
      href={item.url}
      onClick={handleClick}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all group text-xs ${
        isActive
          ? "bg-primary/15 text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      } ${isNested ? "pl-7" : ""} ${open ? "" : ""}`}
      data-testid={item.testId}
    >
      <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
      {open && (
        <>
          <span className="truncate flex-1">{item.title}</span>
          {item.isHot && (
            <Flame className="w-2.5 h-2.5 flex-shrink-0 text-orange-500 animate-pulse" />
          )}
        </>
      )}
    </Link>
  );
}
