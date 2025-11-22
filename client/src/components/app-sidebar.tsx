import { useState } from "react";
import { MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, MessageCircle, ChevronDown, ChevronRight, ChevronLeft, BarChart3, Users, Target, Facebook, Calendar, Sparkles } from "lucide-react";
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
  {
    title: "Calendario",
    url: "/calendar",
    icon: Calendar,
    testId: "link-calendar",
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
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(true);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isSurveysOpen, setIsSurveysOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(false);
  const [isFacebookOpen, setIsFacebookOpen] = useState(false);

  const isWhatsAppActive = whatsappMenuItems.some((item) => location === item.url);
  const isSurveysActive = surveysMenuItems.some((item) => location === item.url);
  const isCRMActive = crmMenuItems.some((item) => location === item.url);
  const isFacebookActive = facebookMenuItems.some((item) => location === item.url);

  return (
    <Sidebar className="border-r border-border/60 bg-background">
      <SidebarContent className="gap-0 p-0">
        {/* Header */}
        <div className={`border-b border-border/40 flex items-center justify-center transition-all ${
          isMenuCollapsed ? 'p-3' : 'px-4 py-3'
        }`}>
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary/90 to-primary/70 flex items-center justify-center shadow-sm flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          {!isMenuCollapsed && (
            <div className="ml-3 flex-1 min-w-0">
              <h1 className="text-sm font-bold text-foreground">CRM WhatsApp</h1>
              <p className="text-xs text-muted-foreground/70">v1.0</p>
            </div>
          )}
        </div>

        {/* WhatsApp Section */}
        <div className={`px-2 py-2 space-y-1 ${isMenuCollapsed ? '' : 'border-b border-border/30'}`}>
          {!isMenuCollapsed && (
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase px-2 mb-2">Comunicación</p>
          )}
          <button
            onClick={() => {
              if (isMenuCollapsed) setIsMenuCollapsed(false);
              setIsWhatsAppOpen(!isWhatsAppOpen);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted/50 ${
              isWhatsAppActive ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'text-muted-foreground hover:text-foreground'
            } ${isMenuCollapsed ? 'justify-center px-2' : ''}`}
            data-testid="button-whatsapp-menu"
          >
            <MessageCircle className="w-5 h-5 flex-shrink-0" />
            {!isMenuCollapsed && (
              <>
                <span className="text-sm font-medium flex-1">WhatsApp</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isWhatsAppOpen ? 'rotate-0' : '-rotate-90'}`} />
              </>
            )}
          </button>
          {isWhatsAppOpen && !isMenuCollapsed && (
            <div className="ml-6 space-y-1 border-l border-border/40 pl-2">
              {whatsappMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    data-testid={item.testId}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
                      isActive
                        ? 'bg-primary/20 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Surveys Section */}
        <div className={`px-2 py-2 space-y-1 ${isMenuCollapsed ? '' : 'border-b border-border/30'}`}>
          {!isMenuCollapsed && (
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase px-2 mb-2">Análisis</p>
          )}
          <button
            onClick={() => {
              if (isMenuCollapsed) setIsMenuCollapsed(false);
              setIsSurveysOpen(!isSurveysOpen);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted/50 ${
              isSurveysActive ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'text-muted-foreground hover:text-foreground'
            } ${isMenuCollapsed ? 'justify-center px-2' : ''}`}
            data-testid="button-surveys-menu"
          >
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
            {!isMenuCollapsed && (
              <>
                <span className="text-sm font-medium flex-1">Encuestas</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isSurveysOpen ? 'rotate-0' : '-rotate-90'}`} />
              </>
            )}
          </button>
          {isSurveysOpen && !isMenuCollapsed && (
            <div className="ml-6 space-y-1 border-l border-border/40 pl-2">
              {surveysMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    data-testid={item.testId}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
                      isActive
                        ? 'bg-primary/20 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* CRM Section */}
        <div className="px-2 py-2 space-y-1">
          {!isMenuCollapsed && (
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase px-2 mb-2">Gestión</p>
          )}
          <button
            onClick={() => {
              if (isMenuCollapsed) setIsMenuCollapsed(false);
              setIsCRMOpen(!isCRMOpen);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted/50 ${
              isCRMActive ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'
            } ${isMenuCollapsed ? 'justify-center px-2' : ''}`}
            data-testid="button-crm-menu"
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {!isMenuCollapsed && (
              <>
                <span className="text-sm font-medium flex-1">CRM</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isCRMOpen ? 'rotate-0' : '-rotate-90'}`} />
              </>
            )}
          </button>
          {isCRMOpen && !isMenuCollapsed && (
            <div className="ml-6 space-y-1 border-l border-border/40 pl-2">
              {crmMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    data-testid={item.testId}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
                      isActive
                        ? 'bg-primary/20 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Facebook Menu - Hidden for now */}
        {/* 
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={isFacebookActive}
                onClick={() => setIsFacebookOpen(!isFacebookOpen)}
                className="flex items-center justify-between"
              >
                <span className="font-semibold">Facebook</span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isFacebookOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </SidebarMenuButton>
              {isFacebookOpen && (
                <SidebarMenuSub>
                  {facebookMenuItems.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={isActive}>
                          <Link href={item.url} data-testid={item.testId}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        */}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        {user && !isMenuCollapsed && (
          <div className="space-y-2">
            <button
              onClick={() => setIsMenuCollapsed(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              data-testid="button-collapse-menu"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Contraer</span>
            </button>
            
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary/90 to-primary/70 text-white font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <Link
                href="/settings"
                data-testid="link-settings"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Configuración</span>
              </Link>
              <button
                onClick={onLogout}
                data-testid="button-logout"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
        {isMenuCollapsed && (
          <button
            onClick={() => setIsMenuCollapsed(false)}
            className="w-full flex items-center justify-center py-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/40 transition-colors"
            data-testid="button-expand-menu"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
