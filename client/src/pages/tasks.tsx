import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Calendar, CheckSquare, AlertCircle, Activity } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
    dueDate: "",
  });
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);
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
      updateMutation.mutate({
        id: editingId,
        updates: {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        },
      });
    } else {
      createMutation.mutate({
        userId: userId!,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
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

  return (
    <div className="flex flex-col bg-background">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Add Button */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Tareas</h1>
                <p className="text-xs text-muted-foreground/80">Gestiona tus tareas con un Kanban visual</p>
              </div>
            </div>

            <Button onClick={handleOpenNewTaskForm} data-testid="button-new-task" className="gap-2 h-9">
              <Plus className="w-4 h-4" />
              <span>Nueva Tarea</span>
            </Button>
          </div>

          {/* Metrics Row */}
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            {/* Alert Banner */}
            <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 mb-6">
              <p className="text-sm font-semibold text-foreground">Organiza tus tareas visualmente</p>
              <p className="text-xs text-foreground/70 mt-0.5">Arrastra y suelta las tareas entre columnas para cambiar su estado. Crea nuevas tareas o edita las existentes</p>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-3 gap-4 pb-6">
              {STATUSES.map((status) => (
                <div
                  key={status.id}
                  className={`flex flex-col rounded-lg border-2 ${status.borderColor} ${status.color} p-4 min-h-[500px]`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(status.id)}
                  data-testid={`kanban-column-${status.id}`}
                >
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/30">
                    <span className="text-lg font-bold text-muted-foreground/60">{status.icon}</span>
                    <h2 className="font-semibold text-sm text-foreground">{status.label}</h2>
                    <span className="text-xs text-muted-foreground ml-auto font-bold bg-muted/50 px-2 py-0.5 rounded-full">
                      {getTasksByStatus(status.id).length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                    {getTasksByStatus(status.id).length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-center">
                        <p className="text-xs text-muted-foreground/60">No hay tareas aquí</p>
                      </div>
                    ) : (
                      getTasksByStatus(status.id).map((task) => (
                        <Card
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          className="cursor-move hover-elevate transition-all border bg-card hover:border-primary/30"
                          data-testid={`task-card-${task.id}`}
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-sm flex-1 text-foreground line-clamp-2">{task.title}</h3>
                              <Badge className={`${getPriorityBadgeColor(task.priority)} text-xs flex-shrink-0`}>
                                {PRIORITIES.find((p) => p.id === task.priority)?.label}
                              </Badge>
                            </div>

                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                            )}

                            {task.dueDate && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString("es-ES")}
                              </div>
                            )}

                            <div className="flex gap-1 pt-2 border-t border-border/20">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleEdit(task)}
                                data-testid={`button-edit-task-${task.id}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(task)}
                                data-testid={`button-delete-task-${task.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Tarea</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas eliminar la tarea "{taskToDelete?.title}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 h-10"
              data-testid="button-cancel-delete"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 h-10"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New/Edit Task Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Actualiza los detalles de la tarea" : "Crea una nueva tarea para gestionar"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title" className="text-sm font-semibold">
                Título *
              </Label>
              <Input
                id="task-title"
                placeholder="Ej: Llamar al cliente"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                autoFocus
                className="mt-2 h-10"
                data-testid="input-task-title"
              />
            </div>

            <div>
              <Label htmlFor="task-desc" className="text-sm font-semibold">
                Descripción
              </Label>
              <textarea
                id="task-desc"
                placeholder="Detalles de la tarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2 w-full h-24 px-3 py-2 border border-border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-task-desc"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="task-priority" className="text-sm font-semibold">
                  Prioridad
                </Label>
                <select
                  id="task-priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full mt-2 px-3 py-2 h-10 border border-border rounded-md text-sm bg-background"
                  data-testid="select-task-priority"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="task-duedate" className="text-sm font-semibold">
                  Vencimiento
                </Label>
                <Input
                  id="task-duedate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-2 h-10"
                  data-testid="input-task-duedate"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={resetForm}
              className="flex-1 h-10"
              data-testid="button-cancel-task"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 h-10"
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
