import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Edit2, Zap, Eye, Activity, Power, AlertCircle, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/loading-spinner";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
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
  isActive: boolean;
  flowId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AssistantsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
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
      const response = await fetch(`/api/assistants?userId=${userId}`);
      if (!response.ok) throw new Error("Error fetching assistants");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/assistants", { ...formData, userId });
    },
    onSuccess: () => {
      toast({ title: "Asistente creado" });
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      setShowForm(false);
      setFormData({ name: "", description: "" });
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
    enabled: assistants.filter(a => a.isActive).length,
    disabled: assistants.filter(a => !a.isActive).length,
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full bg-background min-h-0">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 sticky top-0 z-10 flex-shrink-0 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Add Button */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">Asistentes IA</h1>
                  <p className="text-xs text-muted-foreground/80">Automatiza respuestas inteligentes</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setFormData({ name: "", description: "" });
                setEditingId(null);
                setShowForm(true);
              }}
              data-testid="button-new-assistant"
              className="h-8 px-3 gap-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              Nuevo Asistente
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard label="Total" value={stats.total} icon={Zap} />
            <StatCard label="Activos" value={stats.enabled} icon={Power} />
            <StatCard label="Inactivos" value={stats.disabled} icon={Activity} />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar asistentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-8 text-xs"
              data-testid="input-search"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
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
          <div className="grid gap-2">
            {filteredAssistants.map((assistant) => (
              <Card 
                key={assistant.id} 
                data-testid={`card-assistant-${assistant.id}`}
                className="hover-elevate cursor-pointer transition-all"
              >
                <div className="p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-sm bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                        <Sparkles className="w-3 h-3 text-primary" />
                      </div>
                      <h3 className="font-semibold text-xs text-foreground truncate">{assistant.name}</h3>
                    </div>
                    <Badge 
                      variant={assistant.isActive ? "default" : "secondary"} 
                      className="text-[10px] flex-shrink-0 h-4"
                    >
                      {assistant.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2 line-clamp-1">{assistant.description || "Sin descripción"}</p>
                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground/70 mb-2">
                    <div className="flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      <span>Asistente IA</span>
                    </div>
                    <span>
                      {new Date(assistant.createdAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/assistants/${assistant.id}/flow`)}
                      data-testid={`button-edit-${assistant.id}`}
                      className="h-6 text-[10px] px-2"
                    >
                      <Eye className="w-2.5 h-2.5 mr-1" />
                      Configurar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(assistant.id)}
                      data-testid={`button-delete-${assistant.id}`}
                      className="h-6 w-6"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xs w-full p-4 gap-0 bg-card border-border" data-testid="dialog-create-assistant">
          <div className="pb-4 mb-4 border-b border-border/30">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Crear Nuevo Asistente
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground/80 mt-1">
                  Configura un asistente IA para automatizar respuestas
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/8 border border-blue-500/20 rounded-sm p-2.5 mb-4 flex gap-2 items-start">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground/80">
              <span className="font-medium text-foreground/80">Nota:</span> Los asistentes pueden configurarse con flujos personalizados en el editor de flujos.
            </p>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                Nombre del Asistente
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Asistente de Ventas"
                data-testid="input-name"
                className="h-8 text-xs bg-background border-border"
              />
            </div>

            <div>
              <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                Descripción
              </Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe qué hace este asistente"
                data-testid="input-description"
                className="h-8 text-xs bg-background border-border"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1 border-t border-border/30">
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              disabled={createMutation.isPending}
              data-testid="button-cancel"
              size="sm"
              className="h-8 text-[11px] px-3"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !formData.name}
              data-testid="button-save"
              size="sm"
              className="h-8 text-[11px] px-3 bg-primary hover:bg-primary/90"
            >
              {createMutation.isPending ? (
                <>
                  <Zap className="w-3 h-3 mr-1 animate-pulse" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  Crear
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
