import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash, Pencil, Calendar, CheckSquare, AlertCircle, Activity, BarChart3, GripVertical, CheckCircle2, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TaskAnalytics } from "@/components/task-analytics";
import type { Task, InsertTask } from "@shared/schema";

const STATUSES = [
  { id: "todo", label: "Por Hacer", color: "bg-muted/30", icon: "○", borderColor: "border-muted/40" },
  { id: "in_progress", label: "En Progreso", color: "bg-blue-500/10", icon: "⟳", borderColor: "border-blue-500/20" },
  { id: "done", label: "Completado", color: "bg-green-500/10", icon: "✓", borderColor: "border-green-500/20" },
];

const PRIORITIES = [
  { id: "low", label: "Baja", color: "bg-green-500" },
  { id: "normal", label: "Normal", color: "bg-blue-500" },
  { id: "high", label: "Alta", color: "bg-orange-500" },
  { id: "urgent", label: "Urgente", color: "bg-red-500" },
];

export default function TasksPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<"kanban" | "analytics">("kanban");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
    dueDate: "",
  });
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", "userId", userId],
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTask) =>
      apiRequest("POST", "/api/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", "userId", userId] });
      resetForm();
      toast({ title: "Tarea creada", description: "La tarea se creó correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Task> }) =>
      apiRequest("PATCH", `/api/tasks/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", "userId", userId] });
      resetForm();
      toast({ title: "Tarea actualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/tasks/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", "userId", userId] });
      toast({ title: "Tarea eliminada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getFormattedTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", priority: "normal", dueDate: getFormattedTodayDate() });
    setEditingId(null);
    setShowForm(false);
  };

  const handleOpenNewTaskForm = () => {
    setFormData({ title: "", description: "", priority: "normal", dueDate: getFormattedTodayDate() });
    setEditingId(null);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
      return;
    }

    if (editingId) {
      const updates: any = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      };
      
      if (formData.dueDate) {
        updates.dueDate = formData.dueDate;
      }
      
      updateMutation.mutate({
        id: editingId,
        updates,
      });
    } else {
      createMutation.mutate({
        userId: userId!,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate ? formData.dueDate : undefined,
        status: "todo",
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id);
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (status: string) => {
    if (draggedTask && draggedTask.status !== status) {
      updateMutation.mutate({
        id: draggedTask.id,
        updates: { status },
      });
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status: string) =>
    tasks.filter((t) => t.status === status);

  const getPriorityBadgeColor = (priority: string) => {
    const p = PRIORITIES.find((pr) => pr.id === priority);
    return p?.color || "bg-gray-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "border-amber-500/50";
      case "in_progress":
        return "border-blue-500/50";
      case "done":
        return "border-green-500/50";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col bg-background">
      {/* Header Banner */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Add Button */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                {activeTab === "kanban" ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <BarChart3 className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">
                  {activeTab === "kanban" ? "Tareas" : "Análisis de Tareas"}
                </h1>
                <p className="text-xs text-muted-foreground/80">
                  {activeTab === "kanban" ? "Gestiona y organiza tu trabajo" : "Visualiza métricas y estadísticas"}
                </p>
              </div>
            </div>

            {activeTab === "kanban" && (
              <Button onClick={handleOpenNewTaskForm} data-testid="button-new-task" className="gap-2 flex-shrink-0" size="sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Tarea</span>
              </Button>
            )}
          </div>

          {/* Metrics Row - Kanban Tab */}
          {activeTab === "kanban" && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {/* Total Tasks */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            </div>

            {/* Todo Count */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-xs text-muted-foreground font-medium">Por Hacer</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{getTasksByStatus("todo").length}</p>
            </div>

            {/* In Progress Count */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">En Progreso</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{getTasksByStatus("in_progress").length}</p>
            </div>

            {/* Done Count */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Completadas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{getTasksByStatus("done").length}</p>
            </div>
          </div>
          )}

          {/* Metrics Row - Analytics Tab */}
          {activeTab === "analytics" && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {/* Total Tasks */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            </div>

            {/* Completed Today */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Hoy</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {tasks.filter((t) => {
                  const taskDate = new Date(t.updatedAt);
                  const today = new Date();
                  return taskDate.toDateString() === today.toDateString() && t.status === "done";
                }).length}
              </p>
            </div>

            {/* This Month */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-amber-500" />
                <p className="text-xs text-muted-foreground font-medium">Este Mes</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {tasks.filter((t) => {
                  const taskDate = new Date(t.updatedAt);
                  const monthStart = new Date(taskDate.getFullYear(), taskDate.getMonth(), 1);
                  const now = new Date();
                  return taskDate >= monthStart && taskDate <= now && t.status === "done";
                }).length}
              </p>
            </div>

            {/* Completion Rate */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Tasa %</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0}%
              </p>
            </div>
          </div>
          )}

          {/* Info Banner */}
          {activeTab === "kanban" ? (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-3">
                <CheckSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Gestiona tu flujo de trabajo</p>
                  <p className="text-xs text-foreground/70 mt-1">Arrastra tareas entre columnas para actualizar su estado. Organiza tu trabajo de manera visual y eficiente.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Desempeño en tiempo real</p>
                  <p className="text-xs text-foreground/70 mt-1">Visualiza tus métricas y estadísticas. Todos los datos se actualizan automáticamente conforme cambies el estado de tus tareas.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-4 py-6 pb-20">
          <div className="max-w-7xl mx-auto space-y-3">
            {/* Menu Section - Professional Card Style */}
            <div className="bg-card border border-border/50 rounded-xl p-2.5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vistas</h2>
                <div className="h-px flex-1 ml-3 bg-gradient-to-r from-border/50 to-transparent"></div>
              </div>
              
              {/* Tabs - Professional Menu Style */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("kanban")}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg border-2 transition-all flex items-center gap-2 ${
                    activeTab === "kanban"
                      ? "border-primary bg-primary/10 text-foreground shadow-md"
                      : "border-transparent text-muted-foreground bg-muted/30 hover:bg-muted/50"
                  }`}
                  data-testid="tab-kanban"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span className="font-semibold">Kanban</span>
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg border-2 transition-all flex items-center gap-2 ${
                    activeTab === "analytics"
                      ? "border-primary bg-primary/10 text-foreground shadow-md"
                      : "border-transparent text-muted-foreground bg-muted/30 hover:bg-muted/50"
                  }`}
                  data-testid="tab-analytics"
                >
                  <BarChart3 className="w-3 h-3" />
                  <span className="font-semibold">Análisis</span>
                </button>
              </div>
            </div>

            {/* Kanban Tab */}
            {activeTab === "kanban" && (
            <>
            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
              {STATUSES.map((status) => (
                <div
                  key={status.id}
                  className={`flex flex-col rounded-lg border border-border/40 bg-muted/10 p-4 min-h-[500px] lg:min-h-[600px]`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(status.id)}
                  data-testid={`kanban-column-${status.id}`}
                >
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
                    <span className="text-lg font-bold text-muted-foreground/60">{status.icon}</span>
                    <h2 className="font-semibold text-sm text-foreground">{status.label}</h2>
                    <span className="text-xs text-muted-foreground ml-auto font-bold bg-muted/50 px-2 py-0.5 rounded-full">
                      {getTasksByStatus(status.id).length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {getTasksByStatus(status.id).length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-center">
                        <p className="text-xs text-muted-foreground/60">No hay tareas aquí</p>
                      </div>
                    ) : (
                      getTasksByStatus(status.id).map((task) => (
                        <Card
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          className={`cursor-grab active:cursor-grabbing hover-elevate transition-all border-2 bg-card/50 backdrop-blur-sm group overflow-hidden flex flex-col ${getStatusColor(task.status)}`}
                          data-testid={`task-card-${task.id}`}
                        >
                          <CardContent className="p-1.5 space-y-1 relative flex flex-col overflow-hidden">
                            {/* Top Row: Icon and Priority - Fixed */}
                            <div className="flex items-start justify-between gap-1.5 flex-shrink-0">
                              <div className={`p-1 rounded-md flex-shrink-0 ${
                                task.status === "todo" ? "bg-amber-500/20" :
                                task.status === "in_progress" ? "bg-blue-500/20" :
                                "bg-green-500/20"
                              }`}>
                                {task.status === "todo" ? (
                                  <AlertCircle className={`w-3 h-3 ${task.status === "todo" ? "text-amber-500" : ""}`} />
                                ) : task.status === "in_progress" ? (
                                  <Activity className="w-3 h-3 text-blue-500" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                )}
                              </div>
                              <Badge className={`${getPriorityBadgeColor(task.priority)} text-[8px] flex-shrink-0 py-0 px-1 h-4`}>
                                {PRIORITIES.find((p) => p.id === task.priority)?.label}
                              </Badge>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 space-y-1">
                              {/* Title */}
                              <div>
                                <h3 className="font-semibold text-[10px] text-foreground leading-tight whitespace-pre-wrap break-words">{task.title}</h3>
                              </div>

                              {/* Description */}
                              {task.description && (
                                <p className="text-[9px] text-muted-foreground leading-tight whitespace-pre-wrap break-words">{task.description}</p>
                              )}
                            </div>

                            {/* Footer: Due Date and Actions - Fixed */}
                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/20 flex-shrink-0">
                              {task.dueDate && (
                                <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground/70">
                                  <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span className="truncate">{new Date(task.dueDate).toLocaleDateString("es-ES")}</span>
                                </div>
                              )}
                              {!task.dueDate && <div></div>}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => handleEdit(task)}
                                  data-testid={`button-edit-task-${task.id}`}
                                  title="Editar tarea"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => handleDeleteClick(task)}
                                  data-testid={`button-delete-task-${task.id}`}
                                  title="Eliminar tarea"
                                >
                                  <Trash className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
            </>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
            <TaskAnalytics tasks={tasks} />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-xs max-h-[90vh] flex flex-col bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-base">Eliminar Tarea</DialogTitle>
            <DialogDescription className="text-xs">
              ¿Estás seguro que deseas eliminar la tarea "{taskToDelete?.title}"?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 pt-4 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 h-9 text-sm"
              data-testid="button-cancel-delete"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 h-9 text-sm"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New/Edit Task Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[95vw] max-w-sm max-h-[90vh] flex flex-col bg-card border border-border overflow-hidden p-0 rounded-lg">
          <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-border/40">
            <DialogTitle className="text-base font-semibold text-foreground">{editingId ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {editingId ? "Actualiza los detalles" : "Crea una nueva"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-3.5 px-5 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="task-title" className="text-xs font-semibold text-foreground">
                  Título *
                </Label>
                <Input
                  id="task-title"
                  placeholder="Ej: Llamar al cliente"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  autoFocus
                  className="h-9 text-sm"
                  data-testid="input-task-title"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-desc" className="text-xs font-semibold text-foreground">
                  Descripción
                </Label>
                <textarea
                  id="task-desc"
                  placeholder="Detalles de la tarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-20 px-3 py-2 border border-border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="input-task-desc"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="task-priority" className="text-xs font-semibold text-foreground">
                    Prioridad
                  </Label>
                  <select
                    id="task-priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full h-9 px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="select-task-priority"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="task-duedate" className="text-xs font-semibold text-foreground">
                    Vencimiento
                  </Label>
                  <Input
                    id="task-duedate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="h-9 text-sm"
                    data-testid="input-task-duedate"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex gap-2 border-t border-border/40 px-5 py-3">
            <Button
              variant="outline"
              onClick={resetForm}
              className="flex-1 h-9 text-xs font-medium"
              data-testid="button-cancel-task"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 h-9 text-xs font-medium"
              data-testid="button-save-task"
            >
              {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
