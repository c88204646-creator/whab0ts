import { useState, useMemo } from "react";
import { Search, ChevronDown, MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, MessageCircle, BarChart3, Users, Target, Facebook, Calendar, Sparkles, Ticket, LayoutDashboard, Zap, Users2, ShoppingBag, CheckSquare, Package, TrendingUp, Flame, X, Phone } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { WhatsBot } from "@/components/whatsbot-logo";
import { 
  SECTIONS, 
  MODULES, 
  getActiveModules, 
  getModulesBySection, 
  getActiveSections,
  type UserModuleAccess 
} from "@shared/modules";

interface AppSidebarProps {
  user?: { 
    name: string; 
    email: string; 
    role?: string; 
    teamInfo?: any; 
    moduleAccess?: UserModuleAccess[] | null;
  };
  onLogout: () => void;
}

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  testId: string;
  isHot?: boolean;
  moduleId?: string;
  subItems?: MenuItem[];
  subsection?: string;
}

interface MenuSection {
  title: string;
  key: string;
  items: MenuItem[];
  badge?: string;
}

const iconMap: Record<string, any> = {
  Calendar,
  CheckSquare,
  Users2,
  Zap,
  MessageSquare,
  Link: LinkIcon,
  Bot,
  BarChart3,
  Users,
  Target,
  Ticket,
  Facebook,
  Sparkles,
  ShoppingBag,
  Package,
  MessageCircle,
  TrendingUp,
  Phone,
};

const hotModules = ["conversations", "connections", "chatbots", "orders"];

const singleItems: MenuItem[] = [
  { title: "Inicio", url: "/", icon: LayoutDashboard, testId: "link-dashboard" },
];

const singleItemColors: Record<string, { bg: string; text: string }> = {
  "dashboard": { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
};

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const { open } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    productivity: false,
    whatsapp: false,
    crm: false,
    raffles: false,
    surveys: false,
    ecommerce: false,
    social: false,
    teams: false,
    "ai-voice": false,
  });

  const isOwner = !user?.role || user?.role === "owner";
  const moduleAccess = user?.moduleAccess;

  const hasAccessToSection = (sectionId: string): boolean => {
    if (isOwner) return true;
    
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section) return false;
    
    if (section.ownerOnly) return false;
    
    if (!moduleAccess || !Array.isArray(moduleAccess) || moduleAccess.length === 0) {
      return false;
    }
    
    return moduleAccess.some(access => 
      access.sectionId === sectionId && access.canRead
    );
  };

  const hasAccessToModule = (moduleId: string): boolean => {
    if (isOwner) return true;
    
    if (!moduleAccess || !Array.isArray(moduleAccess) || moduleAccess.length === 0) {
      return false;
    }
    
    const access = moduleAccess.find(a => a.moduleId === moduleId);
    return access?.canRead || false;
  };

  const dynamicSections: MenuSection[] = useMemo(() => {
    const activeSections = getActiveSections();
    
    return activeSections.map(section => {
      const sectionModules = getModulesBySection(section.id);
      const items: MenuItem[] = sectionModules
        .filter(mod => hasAccessToModule(mod.id))
        .map(mod => ({
          title: mod.name,
          url: mod.routes[0],
          icon: iconMap[mod.icon] || CheckSquare,
          testId: `link-${mod.id}`,
          moduleId: mod.id,
          isHot: hotModules.includes(mod.id),
          subsection: (mod as any).subsection,
        }));
      
      return {
        title: section.name,
        key: section.id,
        items,
        badge: (section as any).badge,
      };
    }).filter(section => hasAccessToSection(section.key) && section.items.length > 0);
  }, [isOwner, moduleAccess]);

  const sectionIcons: Record<string, any> = {
    productivity: CheckSquare,
    whatsapp: MessageCircle,
    crm: Users,
    raffles: Ticket,
    surveys: TrendingUp,
    ecommerce: ShoppingBag,
    social: Facebook,
    teams: Users2,
    "ai-voice": Phone,
  };

  const sectionColors: Record<string, { bg: string; text: string }> = useMemo(() => {
    const colors: Record<string, { bg: string; text: string }> = {};
    SECTIONS.forEach(s => {
      colors[s.id] = s.color;
    });
    return colors;
  }, []);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredSections = dynamicSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(section => section.items.length > 0);

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
                  : "bg-background border-border/40 hover:bg-background hover:border-border/60"
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
            <div key={item.url}>
              {open ? (
                <Link
                  href={item.url}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md transition-all hover:bg-muted/40 group text-xs ${
                    location === item.url ? "bg-muted/20" : ""
                  }`}
                  data-testid={item.testId}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-md ${singleItemColors[item.url.slice(1)] ? singleItemColors[item.url.slice(1)].bg : singleItemColors.dashboard.bg} flex items-center justify-center flex-shrink-0 border border-border/30`}>
                      <item.icon className={`w-3.5 h-3.5 ${singleItemColors[item.url.slice(1)] ? singleItemColors[item.url.slice(1)].text : singleItemColors.dashboard.text}`} />
                    </div>
                    <span className="font-medium text-foreground group-hover:text-foreground truncate">
                      {item.title}
                    </span>
                  </div>
                  <ChevronDown
                    className="w-3 h-3 text-muted-foreground flex-shrink-0 rotate-90"
                  />
                </Link>
              ) : (
                <SidebarMenuItem key={item.url} item={item} location={location} open={open} />
              )}
            </div>
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
                  <div>
                    <button
                      onClick={() => toggleSection(section.key)}
                      className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md transition-all hover:bg-muted/40 group text-xs ${
                        expandedSections[section.key] ? "bg-muted/20" : ""
                      }`}
                      data-testid={`button-toggle-${section.key}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-7 h-7 rounded-md ${sectionColors[section.key]?.bg || "bg-gray-500/15"} flex items-center justify-center flex-shrink-0 border border-border/30`}>
                          {(() => {
                            const IconComponent = sectionIcons[section.key];
                            return IconComponent ? <IconComponent className={`w-3.5 h-3.5 ${sectionColors[section.key]?.text || "text-gray-500"}`} /> : null;
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
                  </div>
                )}
                {expandedSections[section.key] && (
                  <div className="space-y-0 py-0.5 pl-1">
                    {(() => {
                      const subsections = new Map<string, MenuItem[]>();
                      const noSubsection: MenuItem[] = [];
                      section.items.forEach(item => {
                        if (item.subsection) {
                          if (!subsections.has(item.subsection)) {
                            subsections.set(item.subsection, []);
                          }
                          subsections.get(item.subsection)!.push(item);
                        } else {
                          noSubsection.push(item);
                        }
                      });
                      
                      return (
                        <>
                          {noSubsection.map((item) => (
                            <div key={item.url}>
                              <SidebarMenuItem
                                item={item}
                                location={location}
                                open={open}
                                isNested
                                onToggleSubItems={item.subItems ? () => toggleSection(`${section.key}-${item.title}`) : undefined}
                                isSubItemsExpanded={item.subItems ? expandedSections[`${section.key}-${item.title}`] : false}
                              />
                            </div>
                          ))}
                          {subsections.size > 0 && noSubsection.length > 0 && (
                            <div className="h-px bg-border/20 my-1" />
                          )}
                          {Array.from(subsections.entries()).map(([subsectionName, items]) => (
                            <div key={subsectionName}>
                              <div className="px-2 py-1 mt-1">
                                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                  {subsectionName === "commerce" ? "Comercio" : subsectionName === "ai-voice" ? "Agentes" : subsectionName}
                                </span>
                              </div>
                              {items.map((item) => (
                                <div key={item.url} className="pl-2">
                                  <SidebarMenuItem
                                    item={item}
                                    location={location}
                                    open={open}
                                    isNested
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </>
                      );
                    })()}
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
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 group text-xs font-medium`}
                data-testid="link-settings"
              >
                <Settings className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 group-hover:rotate-90" />
                {open && <span>Ajustes</span>}
              </Link>
              <button
                onClick={onLogout}
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
  onToggleSubItems?: () => void;
  isSubItemsExpanded?: boolean;
}

function SidebarMenuItem({ item, location, open, isNested, onToggleSubItems, isSubItemsExpanded }: SidebarMenuItemProps) {
  const isActive = location === item.url;
  const hasSubItems = !!item.subItems && item.subItems.length > 0;

  if (hasSubItems && open) {
    return (
      <button
        onClick={onToggleSubItems}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all group text-xs ${
          isSubItemsExpanded ? "bg-muted/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        } ${isNested ? "pl-7" : ""}`}
        data-testid={item.testId}
      >
        <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate flex-1">{item.title}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform ${isSubItemsExpanded ? "" : "-rotate-90"}`} />
      </button>
    );
  }

  return (
    <Link
      href={item.url}
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
