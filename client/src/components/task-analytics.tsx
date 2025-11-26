import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar, CheckCircle2, AlertCircle, Activity, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@shared/schema";

interface TaskAnalyticsProps {
  tasks: Task[];
}

export function TaskAnalytics({ tasks }: TaskAnalyticsProps) {
  // Calcular fechas una sola vez
  const dates = useMemo(() => {
    const now = new Date();
    return {
      now,
      last24h: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      monthStart: new Date(now.getFullYear(), now.getMonth(), 1),
      lastMonthStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      lastMonthEnd: new Date(now.getFullYear(), now.getMonth(), 0),
    };
  }, []);

  // Datos últimas 24 horas (por hora)
  const last24hData = useMemo(() => {
    const hourlyData: Record<string, { hour: string; completed: number }> = {};
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(dates.now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.getHours().toString().padStart(2, "0") + ":00";
      hourlyData[hourStr] = { hour: hourStr, completed: 0 };
    }
    
    tasks.forEach((task) => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : (task.createdAt ? new Date(task.createdAt) : null);
      if (taskDate && taskDate > dates.last24h && task.status === "done") {
        const hour = taskDate.getHours().toString().padStart(2, "0") + ":00";
        if (hourlyData[hour]) hourlyData[hour].completed++;
      }
    });
    
    return Object.values(hourlyData);
  }, [tasks, dates]);

  // Datos mes actual vs mes anterior
  const monthComparisonData = useMemo(() => {
    let currentMonth = 0, lastMonth = 0;
    
    tasks.forEach((task) => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : (task.createdAt ? new Date(task.createdAt) : null);
      if (taskDate) {
        if (taskDate >= dates.monthStart && taskDate <= dates.now && task.status === "done") currentMonth++;
        if (taskDate >= dates.lastMonthStart && taskDate <= dates.lastMonthEnd && task.status === "done") lastMonth++;
      }
    });
    
    return [
      { name: "Mes Actual", completed: currentMonth },
      { name: "Mes Anterior", completed: lastMonth },
    ];
  }, [tasks, dates]);

  // Distribución por prioridad
  const priorityData = useMemo(() => {
    const counts = { low: 0, normal: 0, high: 0, urgent: 0 };
    tasks.forEach((task) => {
      counts[task.priority as keyof typeof counts]++;
    });
    
    return [
      { name: "Baja", value: counts.low, fill: "hsl(142 76% 55%)" },
      { name: "Normal", value: counts.normal, fill: "hsl(217 91% 65%)" },
      { name: "Alta", value: counts.high, fill: "hsl(38 92% 50%)" },
      { name: "Urgente", value: counts.urgent, fill: "hsl(0 84% 60%)" },
    ].filter(item => item.value > 0);
  }, [tasks]);

  // Distribución por estado
  const statusData = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 };
    tasks.forEach((task) => {
      counts[task.status as keyof typeof counts]++;
    });
    
    return [
      { name: "Por Hacer", value: counts.todo, fill: "hsl(0 0% 65%)" },
      { name: "En Progreso", value: counts.in_progress, fill: "hsl(217 91% 65%)" },
      { name: "Completadas", value: counts.done, fill: "hsl(142 76% 55%)" },
    ].filter(item => item.value > 0);
  }, [tasks]);

  const completedToday = tasks.filter((t) => {
    const taskDate = t.updatedAt ? new Date(t.updatedAt) : (t.createdAt ? new Date(t.createdAt) : null);
    const today = new Date();
    return taskDate && taskDate.toDateString() === today.toDateString() && t.status === "done";
  }).length;

  const completedThisMonth = tasks.filter((t) => {
    const taskDate = t.updatedAt ? new Date(t.updatedAt) : (t.createdAt ? new Date(t.createdAt) : null);
    return taskDate && taskDate >= dates.monthStart && taskDate <= dates.now && t.status === "done";
  }).length;

  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const urgentCount = tasks.filter((t) => t.priority === "urgent").length;
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0;
  const pendingCount = tasks.filter(t => t.status !== "done").length;

  return (
    <div className="space-y-4 pb-6">
      {/* Main KPIs - with gradient backgrounds like Calendar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Completadas Hoy */}
        <div className="px-4 py-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <p className="text-xs text-green-300 font-medium">Completadas Hoy</p>
          </div>
          <p className="text-2xl font-bold text-green-200">{completedToday}</p>
        </div>

        {/* Mes Actual */}
        <div className="px-4 py-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-blue-300 font-medium">Este Mes</p>
          </div>
          <p className="text-2xl font-bold text-blue-200">{completedThisMonth}</p>
        </div>

        {/* En Progreso */}
        <div className="px-4 py-3 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-purple-300 font-medium">En Progreso</p>
          </div>
          <p className="text-2xl font-bold text-purple-200">{inProgressCount}</p>
        </div>

        {/* Urgentes */}
        <div className="px-4 py-3 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <p className="text-xs text-orange-300 font-medium">Urgentes</p>
          </div>
          <p className="text-2xl font-bold text-orange-200">{urgentCount}</p>
        </div>
      </div>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="px-4 py-3 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 rounded-lg border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-indigo-400" />
            <p className="text-xs text-indigo-300 font-medium">Total de Tareas</p>
          </div>
          <p className="text-2xl font-bold text-indigo-200">{tasks.length}</p>
        </div>

        <div className="px-4 py-3 bg-gradient-to-br from-teal-500/10 to-teal-500/5 rounded-lg border border-teal-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <p className="text-xs text-teal-300 font-medium">Tasa Finalización</p>
          </div>
          <p className="text-2xl font-bold text-teal-200">{completionRate}<span className="text-xs text-teal-300">%</span></p>
        </div>

        <div className="px-4 py-3 bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-lg border border-pink-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-pink-400" />
            <p className="text-xs text-pink-300 font-medium">Por Completar</p>
          </div>
          <p className="text-2xl font-bold text-pink-200">{pendingCount}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Last 24h Chart */}
        <Card className="bg-card border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/50 bg-card/50">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
              <CardTitle className="text-xs font-semibold text-foreground">Completadas (últimas 24h)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3 pb-0">
            {last24hData.every(d => d.completed === 0) ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <p className="text-sm">Sin actividad en las últimas 24 horas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={last24hData} margin={{ top: 5, right: 5, left: -25, bottom: 35 }}>
                  <defs>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142 76% 55%)" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="hsl(142 76% 55%)" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" opacity={0.3} />
                  <XAxis 
                    dataKey="hour" 
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
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(142 76% 55%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142 76% 55%)', r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                    name="Completadas"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/30 rounded">
                <span className="text-xs text-green-300 font-medium">Hoy</span>
                <Badge className="bg-green-500/20 text-green-200 border-green-500/40 text-xs px-2 py-0.5">{completedToday}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Month Comparison Chart */}
        <Card className="bg-card border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/50 bg-card/50">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
              <CardTitle className="text-xs font-semibold text-foreground">Comparativa Mensual</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3 pb-0">
            {monthComparisonData.every(d => d.completed === 0) ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <p className="text-sm">Sin datos disponibles</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthComparisonData} margin={{ top: 5, right: 5, left: -25, bottom: 35 }}>
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
                  <Bar dataKey="completed" fill="hsl(217 91% 65%)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                <span className="text-xs text-blue-300 font-medium">Mes Actual</span>
                <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/40 text-xs px-2 py-0.5">{completedThisMonth}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="bg-card border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/50 bg-card/50">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full" />
              <CardTitle className="text-xs font-semibold text-foreground">Distribución por Prioridad</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3 pb-0">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    label={(entry) => entry.value > 0 ? `${entry.value}` : ""}
                    labelLine={false}
                    isAnimationActive={false}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="bg-card border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/50 bg-card/50">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full" />
              <CardTitle className="text-xs font-semibold text-foreground">Distribución por Estado</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3 pb-0">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    label={(entry) => entry.value > 0 ? `${entry.value}` : ""}
                    labelLine={false}
                    isAnimationActive={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Details */}
      <Card className="bg-card border-border/50 shadow-lg overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/50 bg-card/50">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/60 rounded-full" />
            <CardTitle className="text-xs font-semibold text-foreground">Detalles de Actividad</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300 font-medium mb-1">Total Tareas</p>
              <p className="text-sm text-blue-100">{tasks.length}</p>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-300 font-medium mb-1">Completadas</p>
              <p className="text-sm text-green-100">{tasks.filter(t => t.status === "done").length}</p>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-xs text-purple-300 font-medium mb-1">En Progreso</p>
              <p className="text-sm text-purple-100">{inProgressCount}</p>
            </div>
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-xs text-orange-300 font-medium mb-1">Últimas 24h</p>
              <p className="text-sm text-orange-100">{completedToday}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
