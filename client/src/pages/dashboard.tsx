import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Target, Calendar, BarChart3, Ticket, CheckSquare, Package, ShoppingBag } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Client, Lead, CalendarEvent } from "@shared/schema";

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
  <Card className="border-border/50 hover:border-primary/30 transition-colors">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const RecentActivityCard = ({ 
  title, 
  icon: Icon, 
  color, 
  items 
}: { 
  title: string; 
  icon: any; 
  color: string; 
  items: any[] 
}) => (
  <Card className="border-border/50">
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay datos</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((item: any, idx: number) => (
            <li key={idx} className="text-sm text-foreground/80 flex justify-between items-center">
              <span className="truncate">{item.name || item.title}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{item.badge}</span>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  // Clients Query
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", "userId", userId],
    enabled: !!userId,
  });

  // Leads Query
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", "userId", userId],
    enabled: !!userId,
  });

  // Calendar Events Query
  const { data: events = [], isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/calendar/${userId}`);
      if (!response.ok) throw new Error("Error fetching events");
      return response.json();
    }
  });

  // Surveys Query
  const { data: surveys = [], isLoading: surveysLoading } = useQuery<any[]>({
    queryKey: [`/api/surveys/${userId}`],
    enabled: !!userId,
  });

  // Tasks Query
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${userId}`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Products Query
  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/store-products", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/store-products?storeId=default-store`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Raffles Query
  const { data: raffles = [], isLoading: rafflesLoading } = useQuery<any[]>({
    queryKey: ["/api/raffles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/raffles`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  if (clientsLoading || leadsLoading || eventsLoading || surveysLoading || tasksLoading || productsLoading || rafflesLoading) {
    return <LoadingSpinner />;
  }

  const activeClients = clients.filter((c: any) => c.status === "active").length;
  const activeLeads = leads.filter((l: any) => l.status !== "closed").length;
  const upcomingEvents = events.filter((e: any) => new Date(e.startTime) >= new Date()).length;
  const activeSurveys = surveys.filter((s: any) => s.isActive).length;
  const openTasks = tasks.filter((t: any) => t.status === "todo" || t.status === "in_progress").length;
  const totalProducts = products.length;
  const activeRaffles = raffles.filter((r: any) => r.isActive).length;

  return (
    <div className="flex flex-col bg-background">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground/80">Resumen de tu actividad y módulos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 min-h-0">
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid - Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              label="Clientes Activos" 
              value={activeClients} 
              icon={Users}
              color="bg-blue-500/20 text-blue-600 dark:text-blue-400"
            />
            <StatCard 
              label="Leads Abiertos" 
              value={activeLeads} 
              icon={Target}
              color="bg-amber-500/20 text-amber-600 dark:text-amber-400"
            />
            <StatCard 
              label="Eventos Próximos" 
              value={upcomingEvents} 
              icon={Calendar}
              color="bg-green-500/20 text-green-600 dark:text-green-400"
            />
            <StatCard 
              label="Encuestas Activas" 
              value={activeSurveys} 
              icon={BarChart3}
              color="bg-purple-500/20 text-purple-600 dark:text-purple-400"
            />
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard 
              label="Tareas Pendientes" 
              value={openTasks} 
              icon={CheckSquare}
              color="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
            />
            <StatCard 
              label="Productos Totales" 
              value={totalProducts} 
              icon={Package}
              color="bg-pink-500/20 text-pink-600 dark:text-pink-400"
            />
            <StatCard 
              label="Rifas Activas" 
              value={activeRaffles} 
              icon={Ticket}
              color="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
            />
          </div>

          {/* Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Recent Clients */}
            <RecentActivityCard 
              title="Clientes Recientes"
              icon={Users}
              color="bg-blue-500/15"
              items={clients.slice(0, 5).map(c => ({
                name: `${c.firstName} ${c.lastName}`,
                badge: c.company || "Sin empresa"
              }))}
            />

            {/* Recent Leads */}
            <RecentActivityCard 
              title="Leads Recientes"
              icon={Target}
              color="bg-amber-500/15"
              items={leads.slice(0, 5).map(l => ({
                name: `${l.firstName} ${l.lastName}`,
                badge: l.status
              }))}
            />

            {/* Upcoming Events */}
            <RecentActivityCard 
              title="Próximos Eventos"
              icon={Calendar}
              color="bg-green-500/15"
              items={events
                .filter(e => new Date(e.startTime) >= new Date())
                .slice(0, 5)
                .map(e => ({
                  name: e.title,
                  badge: new Date(e.startTime).toLocaleDateString('es-ES')
                }))}
            />

            {/* Recent Tasks */}
            <RecentActivityCard 
              title="Tareas Abiertas"
              icon={CheckSquare}
              color="bg-cyan-500/15"
              items={tasks
                .filter(t => t.status === "todo" || t.status === "in_progress")
                .slice(0, 5)
                .map(t => ({
                  name: t.title,
                  badge: t.priority || "normal"
                }))}
            />

            {/* Recent Products */}
            <RecentActivityCard 
              title="Productos Recientes"
              icon={Package}
              color="bg-pink-500/15"
              items={products.slice(0, 5).map(p => ({
                name: p.name,
                badge: `$${(p.price / 100).toFixed(2)}`
              }))}
            />

            {/* Active Raffles */}
            <RecentActivityCard 
              title="Rifas Activas"
              icon={Ticket}
              color="bg-yellow-500/15"
              items={raffles
                .filter(r => r.isActive)
                .slice(0, 5)
                .map(r => ({
                  name: r.name,
                  badge: `${r.entries || 0} participantes`
                }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
