import { useState } from "react";
import { MessageSquare, Link as LinkIcon, Bot, Settings, LogOut, MessageCircle, ChevronDown, BarChart3, Users, Target, Facebook, Calendar, Sparkles, Ticket, LayoutDashboard, Zap, Users2, ShoppingBag, CheckSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

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

const CategoryCard = ({ title, items, isOpen, onToggle, bgColor, location }: {
  title: string;
  items: any[];
  isOpen: boolean;
  onToggle: () => void;
  bgColor: string;
  location: string;
}) => (
  <Card className={`${bgColor} border-0 overflow-hidden`}>
    <button
      onClick={onToggle}
      className="w-full px-3 py-2.5 flex items-center justify-between hover:opacity-90 transition-opacity"
    >
      <span className="font-semibold text-sm text-foreground">{title}</span>
      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
    </button>
    
    {isOpen && (
      <div className="border-t border-border/20 space-y-1 px-2 py-2">
        {items.map((item) => (
          <Link
            key={item.url}
            href={item.url}
            data-testid={item.testId}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all ${
              location === item.url
                ? "bg-foreground/20 text-foreground font-semibold"
                : "text-foreground/70 hover:text-foreground hover:bg-foreground/10"
            }`}
          >
            <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        ))}
      </div>
    )}
  </Card>
);

const SingleItemCard = ({ item, bgColor, isActive, location }: {
  item: any;
  bgColor: string;
  isActive: boolean;
  location: string;
}) => (
  <Link
    href={item.url}
    data-testid={item.testId}
  >
    <Card className={`${bgColor} border-0 p-0 cursor-pointer transition-all hover-elevate`}>
      <div className={`px-3 py-2.5 flex items-center gap-2 ${
        location === item.url ? "opacity-100" : "opacity-90"
      }`}>
        <item.icon className="w-4 h-4 flex-shrink-0 text-foreground" />
        <span className="text-sm font-semibold text-foreground truncate">{item.title}</span>
      </div>
    </Card>
  </Link>
);

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const { open } = useSidebar();
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(true);
  const [isSurveysOpen, setIsSurveysOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(true);
  const [isFacebookOpen, setIsFacebookOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRafflesOpen, setIsRafflesOpen] = useState(false);

  return (
    <Sidebar className="border-r border-border/60 bg-background">
      <SidebarContent className="gap-3 p-3">
        {/* Professional Header */}
        <div className={`px-4 py-4 border border-border/40 rounded-lg bg-muted/30 ${!open ? "flex items-center justify-center" : ""}`}>
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
              <p className="text-xs text-muted-foreground/70 font-medium px-8">
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
        <SingleItemCard 
          item={dashboardItem} 
          bgColor="bg-blue-500/15 border-blue-500/20"
          isActive={location === dashboardItem.url}
          location={location}
        />

        {/* WhatsApp Module */}
        <CategoryCard
          title="WhatsApp"
          items={whatsappMenuItems}
          isOpen={isWhatsAppOpen}
          onToggle={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
          bgColor="bg-green-500/15 border-green-500/20"
          location={location}
        />

        {/* CRM Module */}
        <CategoryCard
          title="CRM"
          items={crmMenuItems}
          isOpen={isCRMOpen}
          onToggle={() => setIsCRMOpen(!isCRMOpen)}
          bgColor="bg-purple-500/15 border-purple-500/20"
          location={location}
        />

        {/* Tasks */}
        <SingleItemCard 
          item={tasksItem}
          bgColor="bg-orange-500/15 border-orange-500/20"
          isActive={location === tasksItem.url}
          location={location}
        />

        {/* Calendar */}
        <SingleItemCard 
          item={calendarMenuItems[0]}
          bgColor="bg-cyan-500/15 border-cyan-500/20"
          isActive={location === calendarMenuItems[0].url}
          location={location}
        />

        {/* Surveys */}
        <CategoryCard
          title="Encuestas"
          items={surveysMenuItems}
          isOpen={isSurveysOpen}
          onToggle={() => setIsSurveysOpen(!isSurveysOpen)}
          bgColor="bg-pink-500/15 border-pink-500/20"
          location={location}
        />

        {/* Facebook Module */}
        <CategoryCard
          title="Facebook"
          items={facebookMenuItems}
          isOpen={isFacebookOpen}
          onToggle={() => setIsFacebookOpen(!isFacebookOpen)}
          bgColor="bg-blue-600/15 border-blue-600/20"
          location={location}
        />

        {/* Raffles */}
        <CategoryCard
          title="Rifas"
          items={rafflesMenuItems}
          isOpen={isRafflesOpen}
          onToggle={() => setIsRafflesOpen(!isRafflesOpen)}
          bgColor="bg-yellow-500/15 border-yellow-500/20"
          location={location}
        />

        {/* Stores & Teams */}
        <div className="space-y-2">
          <SingleItemCard 
            item={storesItem}
            bgColor="bg-rose-500/15 border-rose-500/20"
            isActive={location === storesItem.url}
            location={location}
          />
          <SingleItemCard 
            item={teamsItem}
            bgColor="bg-indigo-500/15 border-indigo-500/20"
            isActive={location === teamsItem.url}
            location={location}
          />
        </div>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border/40 p-3">
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
