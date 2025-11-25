import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, MousePointerClick, CheckCircle2, Clock, CalendarDays, ArrowLeft, BarChart3, Share2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CalendarConfig } from "@shared/schema";

export default function CalendarAnalytics() {
  const [, setLocation] = useLocation();
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
    <div className="flex flex-col bg-background">
      {/* Header - Same style as calendar.tsx */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Analíticas del Calendario</h1>
                <p className="text-xs text-muted-foreground/80">{calendarConfig?.businessName || "Tu calendario"} - Desempeño del enlace público</p>
              </div>
            </div>

            <Button
              onClick={() => setLocation("/calendar")}
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="button-back-to-calendar"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
          </div>

          {/* Metrics Row - Same style as calendar.tsx */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {/* Visitas Totales */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <MousePointerClick className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Visitas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.timesVisited || 0}</p>
            </div>

            {/* Reservas Completadas */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Reservas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.bookingsCompleted || 0}</p>
            </div>

            {/* Conversión */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Conversión</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
            </div>

            {/* Visitantes Recurrentes */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-amber-500" />
                <p className="text-xs text-muted-foreground font-medium">Recurrentes</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.returnVisitorCount || 0}</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mt-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Desempeño de tu enlace público</p>
                <p className="text-xs text-foreground/70 mt-1">Monitorea en tiempo real cuántas personas visitan tu calendario y cuántas agendan citas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-2 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Additional Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-indigo-500" />
                <p className="text-xs text-muted-foreground font-medium">Minutos Reservados</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.totalMinutesBooked || 0}</p>
            </div>

            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-4 h-4 text-teal-500" />
                <p className="text-xs text-muted-foreground font-medium">Promedio/Reserva</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.averageMinutesPerBooking || 0} <span className="text-xs text-muted-foreground">min</span></p>
            </div>

            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Share2 className="w-4 h-4 text-pink-500" />
                <p className="text-xs text-muted-foreground font-medium">Veces Compartido</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.timesShared || 0}</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            {/* Daily Traffic */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xs">Visitas vs Reservas (últimos 7 días)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={{ boxShadow: 'none' }} />
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
                <CardTitle className="text-xs">Embudo de Conversión</CardTitle>
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
              <CardTitle className="text-xs">Detalles de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
