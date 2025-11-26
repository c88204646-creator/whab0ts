import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import type { Task } from "@shared/schema";

interface TaskAnalyticsProps {
  tasks: Task[];
}

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
      if (task.updatedAt && new Date(task.updatedAt) > last24h && task.status === "done") {
        const hour = new Date(task.updatedAt).getHours().toString().padStart(2, "0") + ":00";
        if (hourlyData[hour]) hourlyData[hour].completed++;
      }
    });
    
    return Object.values(hourlyData);
  }, [tasks, now]);

  // Datos mes actual vs mes anterior
  const monthComparisonData = useMemo(() => {
    let currentMonth = 0, lastMonth = 0;
    
    tasks.forEach((task) => {
      const taskDate = new Date(task.updatedAt);
      if (taskDate >= monthStart && taskDate <= now && task.status === "done") currentMonth++;
      if (taskDate >= lastMonthStart && taskDate <= lastMonthEnd && task.status === "done") lastMonth++;
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
      { name: "Por Hacer", value: counts.todo, fill: "#6b7280" },
      { name: "En Progreso", value: counts.in_progress, fill: "#3b82f6" },
      { name: "Completadas", value: counts.done, fill: "#22c55e" },
    ].filter(item => item.value > 0);
  }, [tasks]);

  const completedToday = tasks.filter((t) => {
    const taskDate = new Date(t.updatedAt);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString() && t.status === "done";
  }).length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Completadas Hoy</p>
                <p className="text-2xl font-bold text-foreground mt-1">{completedToday}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/15">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Tareas</p>
                <p className="text-2xl font-bold text-foreground mt-1">{tasks.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/15">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">En Progreso</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {tasks.filter((t) => t.status === "in_progress").length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/15">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Urgentes</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {tasks.filter((t) => t.priority === "urgent").length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/15">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Last 24h Chart */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Últimas 24 Horas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={last24hData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                  cursor={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#22c55e" 
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Month Comparison Chart */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Mes Actual vs Anterior
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                  cursor={false}
                />
                <Bar dataKey="completed" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Distribución por Prioridad</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                  cursor={false}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                  cursor={false}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
