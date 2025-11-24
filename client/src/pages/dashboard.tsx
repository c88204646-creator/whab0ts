import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Target, Calendar, BarChart3, Ticket } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Client } from "@shared/schema";
import type { Lead } from "@shared/schema";
import type { CalendarEvent } from "@shared/schema";
import type { Survey } from "@shared/schema";

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
  <Card className="border-border/50">
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

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", "userId", userId],
    enabled: !!userId,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", "userId", userId],
    enabled: !!userId,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/calendar/${userId}`);
      if (!response.ok) throw new Error("Error fetching events");
      return response.json();
    }
  });

  const { data: surveys = [], isLoading: surveysLoading } = useQuery<any[]>({
    queryKey: [`/api/surveys/${userId}`],
    enabled: !!userId,
  });

  if (clientsLoading || leadsLoading || eventsLoading || surveysLoading) {
    return <LoadingSpinner />;
  }

  const activeClients = clients.filter((c: any) => c.status === "active").length;
  const activeLeads = leads.filter((l: any) => l.status !== "closed").length;
  const upcomingEvents = events.filter((e: any) => new Date(e.startTime) >= new Date()).length;
  const activeSurveys = surveys.filter((s: any) => s.isActive).length;

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Resumen de tu actividad</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 min-h-0">
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid */}
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

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Clients */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Clientes Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay clientes aún</p>
                ) : (
                  <ul className="space-y-2">
                    {clients.slice(0, 5).map((client: any) => (
                      <li key={client.id} className="text-sm text-foreground/80 flex justify-between">
                        <span>{client.firstName} {client.lastName}</span>
                        <span className="text-xs text-muted-foreground">{client.company || "-"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Recent Leads */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Leads Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay leads aún</p>
                ) : (
                  <ul className="space-y-2">
                    {leads.slice(0, 5).map((lead: any) => (
                      <li key={lead.id} className="text-sm text-foreground/80 flex justify-between">
                        <span>{lead.firstName} {lead.lastName}</span>
                        <span className="text-xs text-muted-foreground">{lead.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
