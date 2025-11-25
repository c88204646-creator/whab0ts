import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, MousePointerClick, CheckCircle2, Clock, CalendarDays, ArrowLeft, BarChart3, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const { data: dailyData = [] } = useQuery({
    queryKey: ["/api/calendar/analytics/last-7-days", calendarConfig?.publicShareToken],
    enabled: !!calendarConfig?.publicShareToken,
    queryFn: async () => {
      const response = await fetch(`/api/calendar/analytics/${calendarConfig?.publicShareToken}/last-7-days`);
      if (!response.ok) throw new Error("Error fetching daily analytics");
      return response.json();
    }
  });

  const conversionRate = analytics?.timesVisited ? Math.round((analytics?.bookingsCompleted / analytics?.timesVisited) * 100) : 0;
  const abandonmentRate = 100 - conversionRate;

  const conversionData = [
    { name: "Completadas", value: analytics?.bookingsCompleted || 0, color: "hsl(142 76% 55%)" },
    { name: "Abandonadas", value: Math.max(0, (analytics?.timesVisited || 1) - (analytics?.bookingsCompleted || 0)), color: "hsl(0 84% 60%)" }
  ];

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Analíticas del Calendario</h1>
                <p className="text-xs text-muted-foreground/80">{calendarConfig?.businessName || "Tu calendario"} - Desempeño en tiempo real</p>
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

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="px-4 py-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <MousePointerClick className="w-4 h-4 text-blue-400" />
                <p className="text-xs text-blue-300 font-medium">Visitas</p>
              </div>
              <p className="text-2xl font-bold text-blue-200">{analytics?.timesVisited || 0}</p>
            </div>

            <div className="px-4 py-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <p className="text-xs text-green-300 font-medium">Reservas</p>
              </div>
              <p className="text-2xl font-bold text-green-200">{analytics?.bookingsCompleted || 0}</p>
            </div>

            <div className="px-4 py-3 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <p className="text-xs text-purple-300 font-medium">Conversión</p>
              </div>
              <p className="text-2xl font-bold text-purple-200">{conversionRate}%</p>
            </div>

            <div className="px-4 py-3 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-orange-400" />
                <p className="text-xs text-orange-300 font-medium">Recurrentes</p>
              </div>
              <p className="text-2xl font-bold text-orange-200">{analytics?.returnVisitorCount || 0}</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mt-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Desempeño en tiempo real</p>
                <p className="text-xs text-foreground/70 mt-1">Todos los datos se actualizan automáticamente cada vez que alguien interactúa con tu calendario.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Additional Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="px-4 py-3 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 rounded-lg border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-indigo-400" />
                <p className="text-xs text-indigo-300 font-medium">Minutos Reservados</p>
              </div>
              <p className="text-2xl font-bold text-indigo-200">{analytics?.totalMinutesBooked || 0}</p>
            </div>

            <div className="px-4 py-3 bg-gradient-to-br from-teal-500/10 to-teal-500/5 rounded-lg border border-teal-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-4 h-4 text-teal-400" />
                <p className="text-xs text-teal-300 font-medium">Promedio/Reserva</p>
              </div>
              <p className="text-2xl font-bold text-teal-200">{analytics?.averageMinutesPerBooking || 0} <span className="text-xs text-teal-300">min</span></p>
            </div>

            <div className="px-4 py-3 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-lg border border-pink-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Share2 className="w-4 h-4 text-pink-400" />
                <p className="text-xs text-pink-300 font-medium">Veces Compartido</p>
              </div>
              <p className="text-2xl font-bold text-pink-200">{analytics?.timesShared || 0}</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Traffic */}
            <Card className="bg-card border-border/50 shadow-lg overflow-hidden">
              <CardHeader className="pb-2 border-b border-border/50 bg-card/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
                  <CardTitle className="text-xs font-semibold text-foreground">Visitas vs Reservas (últimos 7 días)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-3 pb-0">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -25, bottom: 35 }}>
                    <defs>
                      <linearGradient id="gradVisitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(217 91% 65%)" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="hsl(217 91% 65%)" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="gradReservas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142 76% 55%)" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="hsl(142 76% 55%)" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(0 0% 60%)" 
                      style={{ fontSize: '11px' }}
                      tick={{ fill: 'hsl(0 0% 60%)' }}
                    />
                    <YAxis 
                      stroke="hsl(0 0% 60%)" 
                      style={{ fontSize: '11px' }}
                      tick={{ fill: 'hsl(0 0% 60%)' }}
                      width={30}
                    />
                    <Bar 
                      dataKey="visitas" 
                      fill="url(#gradVisitas)" 
                      name="Visitas"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                    <Bar 
                      dataKey="reservas" 
                      fill="url(#gradReservas)" 
                      name="Reservas"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                    <span className="text-xs text-blue-300 font-medium">Visitas</span>
                    <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/40 text-xs px-2 py-0.5">{analytics?.timesVisited || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/30 rounded">
                    <span className="text-xs text-green-300 font-medium">Reservas</span>
                    <Badge className="bg-green-500/20 text-green-200 border-green-500/40 text-xs px-2 py-0.5">{analytics?.bookingsCompleted || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card className="bg-card border-border/50 shadow-lg overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/50 bg-card/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
                  <CardTitle className="text-xs font-semibold text-foreground">Embudo de Conversión</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={conversionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      label={({ value }) => value > 0 ? `${value}` : "0"}
                      labelLine={false}
                      isAnimationActive={true}
                      animationDuration={800}
                    >
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/30 rounded">
                    <span className="text-xs text-green-300 font-medium">Completadas</span>
                    <Badge className="bg-green-500/20 text-green-200 border-green-500/40 text-xs px-2 py-0.5">{conversionRate}%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/30 rounded">
                    <span className="text-xs text-red-300 font-medium">Abandonadas</span>
                    <Badge className="bg-red-500/20 text-red-200 border-red-500/40 text-xs px-2 py-0.5">{abandonmentRate}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <Card className="bg-card border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50 bg-card/50">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/60 rounded-full" />
                <CardTitle className="text-xs font-semibold text-foreground">Detalles de Actividad</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-300 font-medium mb-1">Última visita</p>
                  <p className="text-sm text-blue-100">
                    {analytics?.lastVisitedAt ? new Date(analytics.lastVisitedAt).toLocaleDateString("es-ES") : "—"}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-xs text-green-300 font-medium mb-1">Última reserva</p>
                  <p className="text-sm text-green-100">
                    {analytics?.lastBookedAt ? new Date(analytics.lastBookedAt).toLocaleDateString("es-ES") : "—"}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-xs text-purple-300 font-medium mb-1">Último compartido</p>
                  <p className="text-sm text-purple-100">
                    {analytics?.lastSharedAt ? new Date(analytics.lastSharedAt).toLocaleDateString("es-ES") : "—"}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-xs text-orange-300 font-medium mb-1">Día pico</p>
                  <p className="text-sm text-orange-100">{analytics?.peakBookingDay || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
