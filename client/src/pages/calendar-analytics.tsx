import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { TrendingUp, Users, MousePointerClick, CheckCircle2, Clock, CalendarDays, ArrowLeft, BarChart3, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CalendarConfig } from "@shared/schema";

// Custom gradient definitions
const ChartGradients = () => (
  <svg width="0" height="0">
    <defs>
      <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
      </linearGradient>
      <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
        <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
      </linearGradient>
    </defs>
  </svg>
);

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
      <ChartGradients />
      
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

          {/* Metrics Row - Enhanced styling */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {/* Visitas Totales */}
            <div className="px-4 py-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <MousePointerClick className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Visitas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.timesVisited || 0}</p>
            </div>

            {/* Reservas Completadas */}
            <div className="px-4 py-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Reservas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.bookingsCompleted || 0}</p>
            </div>

            {/* Conversión */}
            <div className="px-4 py-3 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Conversión</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
            </div>

            {/* Visitantes Recurrentes */}
            <div className="px-4 py-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-lg border border-amber-500/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-amber-500" />
                <p className="text-xs text-muted-foreground font-medium">Recurrentes</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.returnVisitorCount || 0}</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mt-4 shadow-sm">
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
      <div className="flex-1 px-4 py-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Additional Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="px-4 py-3 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 rounded-lg border border-indigo-500/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-indigo-500" />
                <p className="text-xs text-muted-foreground font-medium">Minutos Reservados</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.totalMinutesBooked || 0}</p>
            </div>

            <div className="px-4 py-3 bg-gradient-to-br from-teal-500/10 to-teal-500/5 rounded-lg border border-teal-500/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-4 h-4 text-teal-500" />
                <p className="text-xs text-muted-foreground font-medium">Promedio/Reserva</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.averageMinutesPerBooking || 0} <span className="text-xs text-muted-foreground">min</span></p>
            </div>

            <div className="px-4 py-3 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-lg border border-pink-500/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Share2 className="w-4 h-4 text-pink-500" />
                <p className="text-xs text-muted-foreground font-medium">Veces Compartido</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics?.timesShared || 0}</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Traffic - Enhanced with gradients and animations */}
            <Card className="bg-card border-border shadow-lg overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-500/50 rounded-full" />
                  <CardTitle className="text-sm font-semibold">Visitas vs Reservas (últimos 7 días)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="barVisitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="barReservas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--muted-foreground)" 
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <YAxis 
                      stroke="var(--muted-foreground)" 
                      style={{ fontSize: '12px' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Bar 
                      dataKey="visitas" 
                      fill="url(#barVisitas)" 
                      name="Visitas"
                      radius={[8, 8, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    />
                    <Bar 
                      dataKey="reservas" 
                      fill="url(#barReservas)" 
                      name="Reservas"
                      radius={[8, 8, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Funnel - Enhanced with animations */}
            <Card className="bg-card border-border shadow-lg overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-500/50 rounded-full" />
                  <CardTitle className="text-sm font-semibold">Embudo de Conversión</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <defs>
                      <linearGradient id="pieGreen" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.7}/>
                      </linearGradient>
                      <linearGradient id="pieRed" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <Pie
                      data={conversionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    >
                      <Cell fill="url(#pieGreen)" />
                      <Cell fill="url(#pieRed)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground">Convertidas</span>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-sm">{conversionRate}%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground">Abandonadas</span>
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-sm">{abandonmentRate}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats - Enhanced design */}
          <Card className="bg-card border-border shadow-lg overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                <CardTitle className="text-sm font-semibold">Detalles de Actividad</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/2 rounded-lg border border-blue-500/20 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Última visita</p>
                  <p className="text-sm font-semibold text-foreground">
                    {analytics?.lastVisitedAt ? new Date(analytics.lastVisitedAt).toLocaleDateString("es-ES") : "—"}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500/5 to-green-500/2 rounded-lg border border-green-500/20 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Última reserva</p>
                  <p className="text-sm font-semibold text-foreground">
                    {analytics?.lastBookedAt ? new Date(analytics.lastBookedAt).toLocaleDateString("es-ES") : "—"}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/2 rounded-lg border border-purple-500/20 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Último compartido</p>
                  <p className="text-sm font-semibold text-foreground">
                    {analytics?.lastSharedAt ? new Date(analytics.lastSharedAt).toLocaleDateString("es-ES") : "—"}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-500/5 to-amber-500/2 rounded-lg border border-amber-500/20 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Día pico</p>
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
