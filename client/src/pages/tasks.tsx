import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, InsertTask } from "@shared/schema";

const STATUSES = [
  { id: "todo", label: "Por Hacer", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "in_progress", label: "En Progreso", color: "bg-blue-100 dark:bg-blue-900" },
  { id: "done", label: "Completado", color: "bg-green-100 dark:bg-green-900" },
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
    queryKey: ["/api/tasks"],
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTask) =>
      apiRequest("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      resetForm();
      toast({ title: "Tarea creada", description: "La tarea se creó correctamente" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Task> }) =>
      apiRequest(`/api/tasks/${data.id}`, { method: "PATCH", body: JSON.stringify(data.updates) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Tarea eliminada" });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", priority: "normal", dueDate: "" });
    setEditingId(null);
    setShowForm(false);
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
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        },
      });
    } else {
      createMutation.mutate({
        userId: userId!,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
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

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: string) => {
    if (draggedTask) {
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
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Tareas</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona tus tareas con un Kanban visual</p>
          </div>
          <Button onClick={() => setShowForm(true)} size="lg" className="gap-2" data-testid="button-new-task">
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-slate-500/10 to-slate-500/5">
            <CardContent className="p-3">
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">Total de Tareas</p>
            </CardContent>
          </Card>
          {STATUSES.map((status) => {
            const count = getTasksByStatus(status.id).length;
            return (
              <Card key={status.id} className={`${status.color} border-0`}>
                <CardContent className="p-3">
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground">{status.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="grid grid-cols-3 gap-4 min-w-full pb-4">
          {STATUSES.map((status) => (
            <div
              key={status.id}
              className={`flex flex-col min-h-full rounded-lg p-3 ${status.color}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(status.id)}
              data-testid={`kanban-column-${status.id}`}
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
                <h2 className="font-semibold text-sm">{status.label}</h2>
                <span className="text-xs text-muted-foreground ml-auto font-bold">
                  {getTasksByStatus(status.id).length}
                </span>
              </div>

              <div className="space-y-2 flex-1">
                {getTasksByStatus(status.id).map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="cursor-move hover:shadow-md transition-all border"
                    data-testid={`task-card-${task.id}`}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm flex-1">{task.title}</h3>
                        <Badge className={`${getPriorityBadgeColor(task.priority)} text-xs`}>
                          {PRIORITIES.find((p) => p.id === task.priority)?.label}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString("es-ES")}
                        </div>
                      )}

                      <div className="flex gap-1 pt-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleEdit(task)}
                          data-testid={`button-edit-task-${task.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(task.id)}
                          data-testid={`button-delete-task-${task.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New/Edit Task Modal */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
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
                  className="mt-1.5"
                  data-testid="input-task-title"
                />
              </div>

              <div>
                <Label htmlFor="task-desc" className="text-sm font-semibold">
                  Descripción
                </Label>
                <Input
                  id="task-desc"
                  placeholder="Detalles de la tarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1.5"
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
                    className="w-full mt-1.5 px-3 py-2 border border-border rounded-md text-sm"
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
                    Fecha de Vencimiento
                  </Label>
                  <Input
                    id="task-duedate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1.5"
                    data-testid="input-task-duedate"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={resetForm}
                className="flex-1"
                data-testid="button-cancel-task"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
                data-testid="button-save-task"
              >
                {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
