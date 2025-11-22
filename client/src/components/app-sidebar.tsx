import { useState } from "react";
import { MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, Zap, ChevronDown, BarChart3, Users, Package, Target, Briefcase, FileText, Receipt, CreditCard, Facebook } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
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
    title: "Proveedores",
    url: "/crm/suppliers",
    icon: Package,
    testId: "link-crm-suppliers",
  },
  {
    title: "Leads",
    url: "/crm/leads",
    icon: Target,
    testId: "link-crm-leads",
  },
  {
    title: "Proyectos",
    url: "/crm/projects",
    icon: Briefcase,
    testId: "link-crm-projects",
  },
  {
    title: "Cotizaciones",
    url: "/crm/quotes",
    icon: FileText,
    testId: "link-crm-quotes",
  },
  {
    title: "Facturación",
    url: "/crm/billing",
    icon: Receipt,
    testId: "link-crm-billing",
  },
  {
    title: "Sistema Bancario",
    url: "/crm/banking",
    icon: CreditCard,
    testId: "link-crm-banking",
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
    icon: Zap,
    testId: "link-facebook-automation",
  },
];

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isSurveysOpen, setIsSurveysOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(false);
  const [isFacebookOpen, setIsFacebookOpen] = useState(false);

  const isWhatsAppActive = whatsappMenuItems.some((item) => location === item.url);
  const isSurveysActive = surveysMenuItems.some((item) => location === item.url);
  const isCRMActive = crmMenuItems.some((item) => location === item.url);
  const isFacebookActive = facebookMenuItems.some((item) => location === item.url);

  return (
    <Sidebar>
      <SidebarContent>
        {/* Header Section */}
        <SidebarGroup className="pb-2">
          <div className="px-4 py-6 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-lg font-bold text-sidebar-foreground">
                WhatsApp CRM
              </h1>
            </div>
            <p className="text-xs text-muted-foreground pl-10">
              v1.0 • Profesional
            </p>
          </div>
        </SidebarGroup>

        {/* WhatsApp Menu with Submenus */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={isWhatsAppActive}
                onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
                className="flex items-center justify-between"
              >
                <span className="font-semibold">WhatsApp</span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isWhatsAppOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </SidebarMenuButton>
              {isWhatsAppOpen && (
                <SidebarMenuSub>
                  {whatsappMenuItems.map((item) => {
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

        {/* Surveys Menu */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={isSurveysActive}
                onClick={() => setIsSurveysOpen(!isSurveysOpen)}
                className="flex items-center justify-between"
              >
                <span className="font-semibold">Encuestas</span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isSurveysOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </SidebarMenuButton>
              {isSurveysOpen && (
                <SidebarMenuSub>
                  {surveysMenuItems.map((item) => {
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

        {/* CRM Menu */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={isCRMActive}
                onClick={() => setIsCRMOpen(!isCRMOpen)}
                className="flex items-center justify-between"
              >
                <span className="font-semibold">CRM</span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isCRMOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </SidebarMenuButton>
              {isCRMOpen && (
                <SidebarMenuSub>
                  {crmMenuItems.map((item) => {
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

      <SidebarFooter>
        <SidebarSeparator className="mb-3 mx-0" />
        {user && (
          <div className="px-3 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/settings" data-testid="link-settings">
                <Settings className="w-4 h-4 mr-2" />
                <span>Configuración</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
