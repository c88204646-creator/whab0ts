import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Edit2, Zap, Eye, Activity, Power } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/loading-spinner";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

interface Assistant {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  model: string;
}

export default function AssistantsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", model: "gpt-4" });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) setUserId(user.id);
  }, []);

  const { data: assistants = [], isLoading, refetch } = useQuery<Assistant[]>({
    queryKey: ["/api/assistants", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch("/api/assistants");
      if (!response.ok) throw new Error("Error fetching assistants");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/assistants", formData);
    },
    onSuccess: () => {
      toast({ title: "Asistente creado" });
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      setShowForm(false);
      setFormData({ name: "", description: "", model: "gpt-4" });
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/assistants/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Asistente eliminado" });
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      refetch();
    },
  });

  const filteredAssistants = assistants.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: assistants.length,
    enabled: assistants.filter(a => a.enabled).length,
    disabled: assistants.filter(a => !a.enabled).length,
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full bg-background min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/50">
        <div className="px-6 py-4">
          {/* Title + Button */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground">Asistentes IA</h1>
                  <p className="text-xs text-muted-foreground">Automatiza respuestas inteligentes</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setFormData({ name: "", description: "", model: "gpt-4" });
                setEditingId(null);
                setShowForm(true);
              }}
              data-testid="button-new-assistant"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Asistente
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatCard label="Total" value={stats.total} icon={Zap} />
            <StatCard label="Activos" value={stats.enabled} icon={Power} />
            <StatCard label="Inactivos" value={stats.disabled} icon={Activity} />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar asistentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {filteredAssistants.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No hay asistentes</p>
                <p className="text-xs text-muted-foreground mt-1">Crea tu primer asistente IA para comenzar</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredAssistants.map((assistant) => (
              <Card 
                key={assistant.id} 
                data-testid={`card-assistant-${assistant.id}`}
                className="hover-elevate cursor-pointer transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-foreground truncate">{assistant.name}</h3>
                        <Badge 
                          variant={assistant.enabled ? "default" : "secondary"} 
                          className="text-xs flex-shrink-0"
                        >
                          {assistant.enabled ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{assistant.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {assistant.model}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setLocation(`/assistants/${assistant.id}/flow`)}
                        data-testid={`button-edit-${assistant.id}`}
                        className="h-8 w-8"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(assistant.id)}
                        data-testid={`button-delete-${assistant.id}`}
                        className="h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent data-testid="dialog-create-assistant">
          <DialogHeader>
            <DialogTitle>Nuevo Asistente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del asistente"
                data-testid="input-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción"
                data-testid="input-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !formData.name}
              data-testid="button-save"
            >
              {createMutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
