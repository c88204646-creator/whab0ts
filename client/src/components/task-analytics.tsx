import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar, CheckCircle2, AlertCircle, Info } from "lucide-react";
import type { Task } from "@shared/schema";

interface TaskAnalyticsProps {
  tasks: Task[];
}

// Custom tooltip with better styling
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded px-2 py-1 shadow-lg">
        <p className="text-xs font-medium text-foreground">
          {payload[0].payload.name || payload[0].payload.hour || "Valor"}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// Custom label for pie charts
const renderLabel = (entry: any) => {
  return `${entry.value}`;
};

export function TaskAnalytics({ tasks }: TaskAnalyticsProps) {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Datos últimas 24 horas (por hora)
  const last24hData = useMemo(() => {
    const hourlyData: Record<string, { hour: string; completed: number }> = {};
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.getHours().toString().padStart(2, "0") + ":00";
      hourlyData[hourStr] = { hour: hourStr, completed: 0 };
    }
    
    tasks.forEach((task) => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : (task.createdAt ? new Date(task.createdAt) : null);
      if (taskDate && taskDate > last24h && task.status === "done") {
        const hour = taskDate.getHours().toString().padStart(2, "0") + ":00";
        if (hourlyData[hour]) hourlyData[hour].completed++;
      }
    });
    
    return Object.values(hourlyData);
  }, [tasks, now]);

  // Datos mes actual vs mes anterior
  const monthComparisonData = useMemo(() => {
    let currentMonth = 0, lastMonth = 0;
    
    tasks.forEach((task) => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : (task.createdAt ? new Date(task.createdAt) : null);
      if (taskDate) {
        if (taskDate >= monthStart && taskDate <= now && task.status === "done") currentMonth++;
        if (taskDate >= lastMonthStart && taskDate <= lastMonthEnd && task.status === "done") lastMonth++;
      }
    });
    
    return [
      { name: "Mes Actual", completed: currentMonth },
      { name: "Mes Anterior", completed: lastMonth },
    ];
  }, [tasks, now]);

  // Distribución por prioridad
  const priorityData = useMemo(() => {
    const counts = { low: 0, normal: 0, high: 0, urgent: 0 };
    tasks.forEach((task) => {
      counts[task.priority as keyof typeof counts]++;
    });
    
    return [
      { name: "Baja", value: counts.low, fill: "#22c55e" },
      { name: "Normal", value: counts.normal, fill: "#3b82f6" },
      { name: "Alta", value: counts.high, fill: "#f97316" },
      { name: "Urgente", value: counts.urgent, fill: "#ef4444" },
    ].filter(item => item.value > 0);
  }, [tasks]);

  // Distribución por estado
  const statusData = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 };
    tasks.forEach((task) => {
      counts[task.status as keyof typeof counts]++;
    });
    
    return [
      { name: "Por Hacer", value: counts.todo, fill: "#a1a5ab" },
      { name: "En Progreso", value: counts.in_progress, fill: "#3b82f6" },
      { name: "Completadas", value: counts.done, fill: "#22c55e" },
    ].filter(item => item.value > 0);
  }, [tasks]);

  const completedToday = tasks.filter((t) => {
    const taskDate = t.updatedAt ? new Date(t.updatedAt) : (t.createdAt ? new Date(t.createdAt) : null);
    const today = new Date();
    return taskDate && taskDate.toDateString() === today.toDateString() && t.status === "done";
  }).length;

  const completedThisMonth = tasks.filter((t) => {
    const taskDate = t.updatedAt ? new Date(t.updatedAt) : (t.createdAt ? new Date(t.createdAt) : null);
    return taskDate && taskDate >= monthStart && taskDate <= now && t.status === "done";
  }).length;

  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const urgentCount = tasks.filter((t) => t.priority === "urgent").length;

  return (
    <div className="space-y-4 pb-6">
      {/* Info Alert */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Análisis en Tiempo Real</p>
          <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
            Estos datos se actualizan automáticamente según cambios en tus tareas. Los gráficos muestran tendencias de los últimos 24 horas y mes actual.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border border-border/40 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">Completadas Hoy</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{completedToday}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/20 flex-shrink-0 ml-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">Mes Actual</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{completedThisMonth}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0 ml-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">En Progreso</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{inProgressCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0 ml-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">Urgentes</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{urgentCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/20 flex-shrink-0 ml-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Last 24h Chart */}
        <Card className="border border-border/40 bg-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Últimas 24 Horas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={last24hData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#22c55e" 
                  dot={false}
                  strokeWidth={2.5}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Month Comparison Chart */}
        <Card className="border border-border/40 bg-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Mes Actual vs Anterior</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthComparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="border border-border/40 bg-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Distribución por Prioridad</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border border-border/40 bg-card overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-border/40 bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total de Tareas</p>
            <p className="text-2xl font-bold text-foreground mt-2">{tasks.length}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Tasa de Finalización</p>
            <p className="text-2xl font-bold text-foreground mt-2">
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Por Completar</p>
            <p className="text-2xl font-bold text-foreground mt-2">
              {tasks.filter(t => t.status !== "done").length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
