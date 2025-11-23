import { useState } from "react";
import { MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, MessageCircle, ChevronDown, BarChart3, Users, Target, Facebook, Calendar, Sparkles, ShoppingBag, Globe, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppSidebarProps {
  user?: { name: string; email: string };
  onLogout: () => void;
}

const whatsappMenuItems = [
  {
    title: "Conversaciones",
    url: "/conversations",
    icon: MessageSquare,
    testId: "link-conversations",
  },
  {
    title: "Conexiones",
    url: "/connections",
    icon: LinkIcon,
    testId: "link-connections",
  },
  {
    title: "Chatbots",
    url: "/chatbots",
    icon: Bot,
    testId: "link-chatbots",
  },
];

const calendarMenuItems = [
  {
    title: "Calendario",
    url: "/calendar",
    icon: Calendar,
    testId: "link-calendar",
  },
];

const widgetsMenuItems = [
  {
    title: "Live Chat Web",
    url: "/web-chat",
    icon: Globe,
    testId: "link-web-chat",
  },
];

const surveysMenuItems = [
  {
    title: "Encuestas",
    url: "/surveys",
    icon: BarChart3,
    testId: "link-surveys",
  },
];

const crmMenuItems = [
  {
    title: "Clientes",
    url: "/crm/clients",
    icon: Users,
    testId: "link-crm-clients",
  },
  {
    title: "Leads",
    url: "/crm/leads",
    icon: Target,
    testId: "link-crm-leads",
  },
  {
    title: "Productos",
    url: "/products",
    icon: ShoppingBag,
    testId: "link-products",
  },
];

const facebookMenuItems = [
  {
    title: "Cuentas de Facebook",
    url: "/facebook",
    icon: Facebook,
    testId: "link-facebook",
  },
  {
    title: "Automatización",
    url: "/facebook-automation",
    icon: Sparkles,
    testId: "link-facebook-automation",
  },
];

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const { open } = useSidebar();
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(true);
  const [isSurveysOpen, setIsSurveysOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(true);
  const [isFacebookOpen, setIsFacebookOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isWidgetsOpen, setIsWidgetsOpen] = useState(false);

  const isWhatsAppActive = whatsappMenuItems.some((item) => location === item.url);
  const isSurveysActive = surveysMenuItems.some((item) => location === item.url);
  const isCRMActive = crmMenuItems.some((item) => location === item.url);
  const isFacebookActive = facebookMenuItems.some((item) => location === item.url);
  const isCalendarActive = calendarMenuItems.some((item) => location === item.url);
  const isWidgetsActive = widgetsMenuItems.some((item) => location === item.url);

  return (
    <Sidebar className="border-r border-border/60 bg-background">
      <SidebarContent className="gap-0">
        {/* Professional Header */}
        <div className={`px-4 py-4 border-b border-border/40 ${!open ? "flex items-center justify-center" : ""}`}>
          {open ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary/90 to-primary/70 flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-sm font-bold leading-tight text-foreground">
                    WhatsApp CRM
                  </h1>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70 font-medium px-10">
                v1.0 Profesional
              </p>
            </div>
          ) : (
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary/90 to-primary/70 flex items-center justify-center shadow-sm">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* WhatsApp Section */}
        <SidebarGroup className="py-1.5">
          {open && (
            <SidebarGroupLabel className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Comunicación
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isWhatsAppActive}
                  onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
                  className={`rounded-lg transition-colors hover:bg-muted/40 ${
                    open ? "flex items-center justify-between px-2 py-2 h-9" : "flex items-center justify-center h-9 w-full"
                  }`}
                >
                  {open ? (
                    <>
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 rounded-md bg-green-500/10">
                          <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-medium text-sm">WhatsApp</span>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 text-muted-foreground ${
                          isWhatsAppOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </>
                  ) : (
                    <div className="p-1.5 rounded-md bg-green-500/10">
                      <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </SidebarMenuButton>
                {open && isWhatsAppOpen && (
                  <SidebarMenuSub className="ml-0 border-l border-border/40 mt-1">
                    {whatsappMenuItems.map((item) => {
                      const isActive = location === item.url;
                      return (
                        <SidebarMenuSubItem key={item.title} className="my-0">
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={isActive}
                            className="rounded-md transition-colors"
                          >
                            <Link href={item.url} data-testid={item.testId}>
                              <div className={`p-1 rounded-md ${isActive ? 'bg-primary/20' : 'bg-transparent'}`}>
                                <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <span className="text-sm">{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Surveys Section */}
        <SidebarGroup className="py-1.5">
          {open && (
            <SidebarGroupLabel className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Análisis
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isSurveysActive}
                  onClick={() => setIsSurveysOpen(!isSurveysOpen)}
                  className={`rounded-lg transition-colors hover:bg-muted/40 ${
                    open ? "flex items-center justify-between px-2 py-2 h-9" : "flex items-center justify-center h-9 w-full"
                  }`}
                >
                  {open ? (
                    <>
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 rounded-md bg-purple-500/10">
                          <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="font-medium text-sm">Encuestas</span>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 text-muted-foreground ${
                          isSurveysOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </>
                  ) : (
                    <div className="p-1.5 rounded-md bg-purple-500/10">
                      <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                </SidebarMenuButton>
                {open && isSurveysOpen && (
                  <SidebarMenuSub className="ml-0 border-l border-border/40 mt-1">
                    {surveysMenuItems.map((item) => {
                      const isActive = location === item.url;
                      return (
                        <SidebarMenuSubItem key={item.title} className="my-0">
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={isActive}
                            className="rounded-md transition-colors"
                          >
                            <Link href={item.url} data-testid={item.testId}>
                              <div className={`p-1 rounded-md ${isActive ? 'bg-primary/20' : 'bg-transparent'}`}>
                                <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <span className="text-sm">{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CRM Section */}
        <SidebarGroup className="py-1.5">
          {open && (
            <SidebarGroupLabel className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Gestión
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isCRMActive}
                  onClick={() => setIsCRMOpen(!isCRMOpen)}
                  className={`rounded-lg transition-colors hover:bg-muted/40 ${
                    open ? "flex items-center justify-between px-2 py-2 h-9" : "flex items-center justify-center h-9 w-full"
                  }`}
                >
                  {open ? (
                    <>
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 rounded-md bg-blue-500/10">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium text-sm">CRM</span>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 text-muted-foreground ${
                          isCRMOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </>
                  ) : (
                    <div className="p-1.5 rounded-md bg-blue-500/10">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </SidebarMenuButton>
                {open && isCRMOpen && (
                  <SidebarMenuSub className="ml-0 border-l border-border/40 mt-1">
                    {crmMenuItems.map((item) => {
                      const isActive = location === item.url;
                      return (
                        <SidebarMenuSubItem key={item.title} className="my-0">
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={isActive}
                            className="rounded-md transition-colors"
                          >
                            <Link href={item.url} data-testid={item.testId}>
                              <div className={`p-1 rounded-md ${isActive ? 'bg-primary/20' : 'bg-transparent'}`}>
                                <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <span className="text-sm">{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Calendar Section */}
        <SidebarGroup className="py-1.5">
          {open && (
            <SidebarGroupLabel className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Organización
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={isCalendarActive}
                  className={`rounded-lg transition-colors ${
                    open ? "px-2 py-2 h-9" : "flex items-center justify-center h-9 w-full"
                  }`}
                >
                  <Link href="/calendar" data-testid="link-calendar">
                    <div className="p-1.5 rounded-md bg-red-500/10">
                      <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    {open && <span className="text-sm">Calendario</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Widgets Section */}
        <SidebarGroup className="py-1.5">
          {open && (
            <SidebarGroupLabel className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Widgets
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isWidgetsActive}
                  onClick={() => setIsWidgetsOpen(!isWidgetsOpen)}
                  className={`rounded-lg transition-colors hover:bg-muted/40 ${
                    open ? "flex items-center justify-between px-2 py-2 h-9" : "flex items-center justify-center h-9 w-full"
                  }`}
                >
                  {open ? (
                    <>
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="p-1.5 rounded-md bg-cyan-500/10">
                          <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <span className="font-medium text-sm">Integraciones</span>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 text-muted-foreground ${
                          isWidgetsOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </>
                  ) : (
                    <div className="p-1.5 rounded-md bg-cyan-500/10">
                      <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                  )}
                </SidebarMenuButton>
                {open && isWidgetsOpen && (
                  <SidebarMenuSub className="ml-0 border-l border-border/40 mt-1">
                    {widgetsMenuItems.map((item) => {
                      const isActive = location === item.url;
                      return (
                        <SidebarMenuSubItem key={item.title} className="my-0">
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={isActive}
                            className="rounded-md transition-colors"
                          >
                            <Link href={item.url} data-testid={item.testId}>
                              <div className={`p-1 rounded-md ${isActive ? 'bg-primary/20' : 'bg-transparent'}`}>
                                <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <span className="text-sm">{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20">
        {user && (
          <div className={`px-3 py-3 space-y-2 ${!open ? "flex items-center justify-center" : ""}`}>
            {open ? (
              <>
                {/* User Profile Card */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
                  <Avatar className="w-8 h-8 flex-shrink-0 border border-border/40">
                    <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary/70 text-white font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate leading-tight">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-7 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-xs"
                    asChild
                  >
                    <Link href="/settings" data-testid="link-settings">
                      <Settings className="w-3.5 h-3.5 mr-2" />
                      <span className="font-medium">Configuración</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-7 px-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-xs"
                    onClick={onLogout}
                    data-testid="button-logout"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </Button>
                </div>
              </>
            ) : (
              <Avatar className="w-8 h-8 flex-shrink-0 border border-border/40">
                <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary/70 text-white font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
