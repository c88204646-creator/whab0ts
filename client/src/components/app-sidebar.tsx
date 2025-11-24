import { useState } from "react";
import { MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, MessageCircle, ChevronDown, BarChart3, Users, Target, Facebook, Calendar, Sparkles, Ticket, LayoutDashboard, Zap, Users2, ShoppingBag, CheckSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  {
    title: "Proveedores de IA",
    url: "/ai-providers",
    icon: Zap,
    testId: "link-ai-providers",
  },
  {
    title: "Análisis",
    url: "/sales-funnel",
    icon: BarChart3,
    testId: "link-sales-funnel",
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

const rafflesMenuItems = [
  {
    title: "Mis Rifas",
    url: "/raffles",
    icon: Ticket,
    testId: "link-raffles",
  },
];

const tasksItem = {
  title: "Tareas",
  url: "/tasks",
  icon: CheckSquare,
  testId: "link-tasks",
};

const storesItem = {
  title: "Tiendas",
  url: "/stores",
  icon: ShoppingBag,
  testId: "link-stores",
};

const teamsItem = {
  title: "Teams",
  url: "/teams",
  icon: Users2,
  testId: "link-teams",
};

const dashboardItem = {
  title: "Dashboard",
  url: "/",
  icon: LayoutDashboard,
  testId: "link-dashboard",
};

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const { open } = useSidebar();
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(true);
  const [isSurveysOpen, setIsSurveysOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(true);
  const [isFacebookOpen, setIsFacebookOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRafflesOpen, setIsRafflesOpen] = useState(false);

  const isDashboardActive = location === dashboardItem.url;
  const isWhatsAppActive = whatsappMenuItems.some((item) => location === item.url) || location === "/ai-providers";
  const isSurveysActive = surveysMenuItems.some((item) => location === item.url);
  const isCRMActive = crmMenuItems.some((item) => location === item.url);
  const isFacebookActive = facebookMenuItems.some((item) => location === item.url);
  const isCalendarActive = calendarMenuItems.some((item) => location === item.url);
  const isRafflesActive = rafflesMenuItems.some((item) => location === item.url) || location?.startsWith("/raffles");
  const isTasksActive = location === tasksItem.url;
  const isStoresActive = location === storesItem.url;
  const isTeamsActive = location === teamsItem.url;

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

        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isDashboardActive} data-testid={dashboardItem.testId}>
                <Link href={dashboardItem.url}>
                  <dashboardItem.icon className="w-4 h-4" />
                  <span>{dashboardItem.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* WhatsApp Section */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70">
            <button
              onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
              className="flex items-center gap-1 w-full hover:text-foreground transition-colors"
            >
              WhatsApp
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${isWhatsAppOpen ? "" : "-rotate-90"}`} />
            </button>
          </SidebarGroupLabel>
          {isWhatsAppOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {whatsappMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* CRM Section */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70">
            <button
              onClick={() => setIsCRMOpen(!isCRMOpen)}
              className="flex items-center gap-1 w-full hover:text-foreground transition-colors"
            >
              CRM
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${isCRMOpen ? "" : "-rotate-90"}`} />
            </button>
          </SidebarGroupLabel>
          {isCRMOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {crmMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Tasks */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isTasksActive}
                data-testid={tasksItem.testId}
              >
                <Link href={tasksItem.url}>
                  <tasksItem.icon className="w-4 h-4" />
                  <span>{tasksItem.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Calendar */}
        <SidebarGroup>
          <SidebarMenu>
            {calendarMenuItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={location === item.url}
                  data-testid={item.testId}
                >
                  <Link href={item.url}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Surveys */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70">
            <button
              onClick={() => setIsSurveysOpen(!isSurveysOpen)}
              className="flex items-center gap-1 w-full hover:text-foreground transition-colors"
            >
              Encuestas
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${isSurveysOpen ? "" : "-rotate-90"}`} />
            </button>
          </SidebarGroupLabel>
          {isSurveysOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {surveysMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Facebook Section */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70">
            <button
              onClick={() => setIsFacebookOpen(!isFacebookOpen)}
              className="flex items-center gap-1 w-full hover:text-foreground transition-colors"
            >
              Facebook
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${isFacebookOpen ? "" : "-rotate-90"}`} />
            </button>
          </SidebarGroupLabel>
          {isFacebookOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {facebookMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Raffles Section */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70">
            <button
              onClick={() => setIsRafflesOpen(!isRafflesOpen)}
              className="flex items-center gap-1 w-full hover:text-foreground transition-colors"
            >
              Rifas
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${isRafflesOpen ? "" : "-rotate-90"}`} />
            </button>
          </SidebarGroupLabel>
          {isRafflesOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {rafflesMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Stores & Teams */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isStoresActive}
                data-testid={storesItem.testId}
              >
                <Link href={storesItem.url}>
                  <storesItem.icon className="w-4 h-4" />
                  <span>{storesItem.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isTeamsActive}
                data-testid={teamsItem.testId}
              >
                <Link href={teamsItem.url}>
                  <teamsItem.icon className="w-4 h-4" />
                  <span>{teamsItem.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border/40">
        {user && (
          <div className="space-y-2">
            {open ? (
              <>
                <div className="flex items-center gap-2.5 px-2 py-2">
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
