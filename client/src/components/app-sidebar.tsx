import { useState } from "react";
import { MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, MessageCircle, ChevronDown, ChevronRight, BarChart3, Users, Target, Facebook, Calendar, Sparkles } from "lucide-react";
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
      <SidebarContent className="gap-0">
        {/* Professional Header with Toggle */}
        <div className="px-4 py-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            {!isMenuCollapsed && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-primary/90 to-primary/70 flex items-center justify-center shadow-sm flex-shrink-0">
                    <MessageCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xs font-bold leading-tight text-foreground">
                      CRM WhatsApp
                    </h1>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70 font-medium px-8">
                  v1.0
                </p>
              </div>
            )}
            {isMenuCollapsed && (
              <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-primary/90 to-primary/70 flex items-center justify-center shadow-sm flex-shrink-0 mx-auto">
                <MessageCircle className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Section */}
        <SidebarGroup className="py-1.5">
          {!isMenuCollapsed && (
            <SidebarGroupLabel className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Comunicación
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isWhatsAppActive}
                  onClick={() => {
                    if (isMenuCollapsed) setIsMenuCollapsed(false);
                    setIsWhatsAppOpen(!isWhatsAppOpen);
                  }}
                  className={`flex items-center justify-between px-2 py-2 h-9 rounded-lg transition-colors hover:bg-muted/40 ${
                    isMenuCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <div className={`flex items-center gap-2.5 ${isMenuCollapsed ? '' : 'flex-1'}`}>
                    <div className="p-1.5 rounded-md bg-green-500/10 flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    {!isMenuCollapsed && <span className="font-medium text-sm">WhatsApp</span>}
                  </div>
                  {!isMenuCollapsed && (
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-200 text-muted-foreground flex-shrink-0 ${
                        isWhatsAppOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  )}
                </SidebarMenuButton>
                {isWhatsAppOpen && !isMenuCollapsed && (
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
          {!isMenuCollapsed && (
            <SidebarGroupLabel className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Análisis
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isSurveysActive}
                  onClick={() => {
                    if (isMenuCollapsed) setIsMenuCollapsed(false);
                    setIsSurveysOpen(!isSurveysOpen);
                  }}
                  className={`flex items-center justify-between px-2 py-2 h-9 rounded-lg transition-colors hover:bg-muted/40 ${
                    isMenuCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <div className={`flex items-center gap-2.5 ${isMenuCollapsed ? '' : 'flex-1'}`}>
                    <div className="p-1.5 rounded-md bg-purple-500/10 flex-shrink-0">
                      <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    {!isMenuCollapsed && <span className="font-medium text-sm">Encuestas</span>}
                  </div>
                  {!isMenuCollapsed && (
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-200 text-muted-foreground flex-shrink-0 ${
                        isSurveysOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  )}
                </SidebarMenuButton>
                {isSurveysOpen && !isMenuCollapsed && (
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
          {!isMenuCollapsed && (
            <SidebarGroupLabel className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Gestión
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isCRMActive}
                  onClick={() => {
                    if (isMenuCollapsed) setIsMenuCollapsed(false);
                    setIsCRMOpen(!isCRMOpen);
                  }}
                  className={`flex items-center justify-between px-2 py-2 h-9 rounded-lg transition-colors hover:bg-muted/40 ${
                    isMenuCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <div className={`flex items-center gap-2.5 ${isMenuCollapsed ? '' : 'flex-1'}`}>
                    <div className="p-1.5 rounded-md bg-blue-500/10 flex-shrink-0">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    {!isMenuCollapsed && <span className="font-medium text-sm">CRM</span>}
                  </div>
                  {!isMenuCollapsed && (
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-200 text-muted-foreground flex-shrink-0 ${
                        isCRMOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  )}
                </SidebarMenuButton>
                {isCRMOpen && !isMenuCollapsed && (
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

      <SidebarFooter className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20">
        {user && (
          <div className={`px-3 py-3 space-y-2 ${isMenuCollapsed ? 'flex flex-col items-center' : ''}`}>
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
              className={`h-8 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-xs ${
                isMenuCollapsed ? 'w-8' : 'w-full justify-start'
              }`}
              data-testid="button-toggle-menu"
            >
              {isMenuCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4 mr-2" />
              )}
              {!isMenuCollapsed && <span className="font-medium">Contraer</span>}
            </Button>
            
            {/* User Profile Card */}
            {!isMenuCollapsed && (
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
            )}
            
            {/* Action Buttons */}
            {!isMenuCollapsed && (
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
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
