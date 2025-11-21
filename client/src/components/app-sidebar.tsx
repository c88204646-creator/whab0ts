import { MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, Zap, ChevronDown } from "lucide-react";
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

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();

  const isWhatsAppActive = whatsappMenuItems.some((item) => location === item.url);

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
              <SidebarMenuButton asChild isActive={isWhatsAppActive}>
                <div className="flex items-center justify-between cursor-pointer">
                  <span className="font-semibold">WhatsApp</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </SidebarMenuButton>
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
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
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
