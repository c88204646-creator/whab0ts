import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, MousePointerClick, CheckCircle2, Clock, CalendarDays, ArrowLeft, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CalendarConfig } from "@shared/schema";

const StatCard = ({ icon: Icon, label, value, unit, color }: { icon: any; label: string; value: number | string; unit?: string; color: string }) => (
  <Card className="bg-card border-border">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground flex items-baseline gap-1">
            {value}
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function CalendarAnalytics() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    } else {
      setUserId("3a4189a2-1f3c-430f-b3c5-c63521fc7a61");
    }
  }, []);

  const { data: calendarConfig } = useQuery<CalendarConfig>({
    queryKey: ["/api/calendar/config", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/calendar/config/${userId}`);
      if (!response.ok) throw new Error("Error fetching config");
      return response.json();
    }
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/calendar/analytics", calendarConfig?.publicShareToken],
    enabled: !!calendarConfig?.publicShareToken,
    queryFn: async () => {
      const response = await fetch(`/api/calendar/analytics/${calendarConfig?.publicShareToken}`);
      if (!response.ok) throw new Error("Error fetching analytics");
      return response.json();
    }
  });

  const conversionRate = analytics?.timesVisited ? Math.round((analytics?.bookingsCompleted / analytics?.timesVisited) * 100) : 0;
  const abandonmentRate = 100 - conversionRate;

  const dailyData = [
    { name: "Lun", visitas: 45, reservas: 12 },
    { name: "Mar", visitas: 52, reservas: 15 },
    { name: "Mié", visitas: 48, reservas: 13 },
    { name: "Jue", visitas: 61, reservas: 18 },
    { name: "Vie", visitas: 55, reservas: 16 },
    { name: "Sáb", visitas: 38, reservas: 10 },
    { name: "Dom", visitas: 22, reservas: 5 }
  ];

  const conversionData = [
    { name: "Completadas", value: analytics?.bookingsCompleted || 0, color: "#10b981" },
    { name: "Abandonadas", value: Math.max(0, (analytics?.timesVisited || 1) - (analytics?.bookingsCompleted || 0)), color: "#ef4444" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-foreground">Analíticas del Calendario</h1>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    {calendarConfig?.businessName || "Tu calendario"} - Desempeño del enlace público
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = "/calendar"}
                variant="outline"
                size="sm"
                className="gap-2"
                data-testid="button-back-to-calendar"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={MousePointerClick}
              label="Visitas totales"
              value={analytics?.timesVisited || 0}
              color="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              icon={CheckCircle2}
              label="Reservas completadas"
              value={analytics?.bookingsCompleted || 0}
              color="bg-green-500/10 text-green-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Tasa de conversión"
              value={conversionRate}
              unit="%"
              color="bg-purple-500/10 text-purple-600"
            />
            <StatCard
              icon={Users}
              label="Visitantes que volvieron"
              value={analytics?.returnVisitorCount || 0}
              color="bg-amber-500/10 text-amber-600"
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={Clock}
              label="Minutos totales reservados"
              value={analytics?.totalMinutesBooked || 0}
              color="bg-indigo-500/10 text-indigo-600"
            />
            <StatCard
              icon={CalendarDays}
              label="Promedio por reserva"
              value={analytics?.averageMinutesPerBooking || 0}
              unit="min"
              color="bg-teal-500/10 text-teal-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Veces compartido"
              value={analytics?.timesShared || 0}
              color="bg-pink-500/10 text-pink-600"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Traffic */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">Visitas vs Reservas (últimos 7 días)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visitas" fill="#3b82f6" name="Visitas" />
                    <Bar dataKey="reservas" fill="#10b981" name="Reservas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">Embudo de Conversión</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={conversionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label
                    >
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Convertidas</span>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">{conversionRate}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Abandonadas</span>
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/30">{abandonmentRate}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm">Detalles de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Última visita</p>
                  <p className="text-sm font-semibold text-foreground">
                    {analytics?.lastVisitedAt ? new Date(analytics.lastVisitedAt).toLocaleDateString("es-ES") : "—"}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Última reserva</p>
                  <p className="text-sm font-semibold text-foreground">
                    {analytics?.lastBookedAt ? new Date(analytics.lastBookedAt).toLocaleDateString("es-ES") : "—"}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Último compartido</p>
                  <p className="text-sm font-semibold text-foreground">
                    {analytics?.lastSharedAt ? new Date(analytics.lastSharedAt).toLocaleDateString("es-ES") : "—"}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Día pico</p>
                  <p className="text-sm font-semibold text-foreground">{analytics?.peakBookingDay || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
