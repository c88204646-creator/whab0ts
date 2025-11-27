import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Edit2, Zap, AlertCircle, Sparkles, Layers, Power, PowerOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Textarea } from "@/components/ui/textarea";

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
  type: string;
  systemPrompt: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  language: string;
  isActive: boolean;
  flowId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Flow {
  id: string;
  name: string;
}

export default function AssistantsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "general",
    systemPrompt: "",
    model: "gpt-4",
    temperature: 70,
    maxTokens: 2000,
    language: "es",
    flowId: "",
  });
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

  const { data: flows = [] } = useQuery<Flow[]>({
    queryKey: ["/api/flows", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/flows?userId=${userId}`);
      if (!response.ok) return [];
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
      setFormData({
        name: "",
        description: "",
        type: "general",
        systemPrompt: "",
        model: "gpt-4",
        temperature: 70,
        maxTokens: 2000,
        language: "es",
        flowId: "",
      });
      refetch();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/assistants/${id}`, formData);
    },
    onSuccess: () => {
      toast({ title: "Asistente actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        type: "general",
        systemPrompt: "",
        model: "gpt-4",
        temperature: 70,
        maxTokens: 2000,
        language: "es",
        flowId: "",
      });
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

  const getFlowName = (flowId: string | null) => {
    if (!flowId) return "Sin flujo";
    return flows.find(f => f.id === flowId)?.name || "Flujo eliminado";
  };

  const getModelLabel = (model: string) => {
    const models: Record<string, string> = {
      "gpt-4": "GPT-4",
      "gpt-3.5-turbo": "GPT-3.5",
      "gemini-pro": "Gemini",
      "claude-3": "Claude",
    };
    return models[model] || model;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      general: "General",
      sales: "Ventas",
      support: "Soporte",
      custom: "Personalizado",
    };
    return types[type] || type;
  };

  const toggleActive = useMutation({
    mutationFn: async (id: string) => {
      const assistant = assistants.find(a => a.id === id);
      if (!assistant) return;
      return apiRequest("PATCH", `/api/assistants/${id}`, { isActive: !assistant.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      refetch();
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full bg-background min-h-0">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 sticky top-0 z-10 flex-shrink-0 px-4 py-6">
        <div className="max-w-7xl mx-auto">
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
                setEditingId(null);
                setFormData({
                  name: "",
                  description: "",
                  systemPrompt: "",
                  model: "gpt-4",
                  temperature: 70,
                  maxTokens: 2000,
                });
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
            <StatCard label="Activos" value={stats.enabled} icon={Zap} />
            <StatCard label="Inactivos" value={AlertCircle} />
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
      <div className="flex-1 overflow-hidden px-4 py-6">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
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
            <div className="grid gap-2 overflow-y-auto">
              {filteredAssistants.map((assistant) => (
                <Card 
                  key={assistant.id} 
                  data-testid={`card-assistant-${assistant.id}`}
                  className="hover-elevate cursor-pointer transition-all"
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-sm bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                          <Sparkles className="w-3 h-3 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xs text-foreground truncate">{assistant.name}</h3>
                          <p className="text-[10px] text-muted-foreground/70 truncate">{assistant.description || "Sin descripción"}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={assistant.isActive ? "default" : "secondary"} 
                        className="text-[10px] flex-shrink-0 h-4"
                      >
                        {assistant.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2 text-[10px]">
                      <div className="bg-muted/40 rounded px-2 py-1">
                        <span className="text-muted-foreground/70">Tipo:</span> {getTypeLabel(assistant.type)}
                      </div>
                      <div className="bg-muted/40 rounded px-2 py-1">
                        <span className="text-muted-foreground/70">Modelo:</span> {getModelLabel(assistant.model)}
                      </div>
                      <div className="bg-muted/40 rounded px-2 py-1">
                        <span className="text-muted-foreground/70">Temp:</span> {assistant.temperature}%
                      </div>
                      <div className="bg-muted/40 rounded px-2 py-1 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {getFlowName(assistant.flowId)}
                      </div>
                    </div>

                    <div className="flex gap-1.5 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleActive.mutate(assistant.id)}
                        disabled={toggleActive.isPending}
                        data-testid={`button-toggle-${assistant.id}`}
                        className="h-6 w-6"
                        title={assistant.isActive ? "Desactivar" : "Activar"}
                      >
                        {assistant.isActive ? (
                          <Power className="w-2.5 h-2.5 text-green-600" />
                        ) : (
                          <PowerOff className="w-2.5 h-2.5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({
                            name: assistant.name,
                            description: assistant.description || "",
                            type: assistant.type,
                            systemPrompt: assistant.systemPrompt || "",
                            model: assistant.model,
                            temperature: assistant.temperature,
                            maxTokens: assistant.maxTokens,
                            language: assistant.language,
                            flowId: assistant.flowId || "",
                          });
                          setEditingId(assistant.id);
                          setShowForm(true);
                        }}
                        data-testid={`button-edit-${assistant.id}`}
                        className="h-6 text-[10px] px-2"
                      >
                        <Edit2 className="w-2.5 h-2.5 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirmId(assistant.id)}
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

      {/* Delete Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-xs w-full p-4 gap-0 bg-card border-border">
          <div className="pb-4 mb-4 border-b border-border/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center flex-shrink-0 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Eliminar Asistente
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground/80 mt-1">
                  Esta acción no se puede deshacer
                </DialogDescription>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            ¿Estás seguro de que quieres eliminar este asistente?
          </p>
          <div className="flex gap-2 justify-end pt-1 border-t border-border/30">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleteMutation.isPending}
              size="sm"
              className="h-8 text-[11px] px-3"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (deleteConfirmId) {
                  deleteMutation.mutate(deleteConfirmId, {
                    onSuccess: () => setDeleteConfirmId(null)
                  });
                }
              }}
              disabled={deleteMutation.isPending}
              size="sm"
              className="h-8 text-[11px] px-3 bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md w-full p-4 gap-0 bg-card border-border max-h-[90vh] overflow-y-auto">
          <div className="pb-4 mb-4 border-b border-border/30 sticky top-0 bg-card">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  {editingId ? "Editar Asistente" : "Crear Nuevo Asistente"}
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground/80 mt-1">
                  Configura un asistente IA con capacidades avanzadas
                </DialogDescription>
              </div>
            </div>
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                  Tipo de Asistente
                </Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-background h-8"
                >
                  <option value="general">General</option>
                  <option value="sales">Ventas</option>
                  <option value="support">Soporte</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              <div>
                <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                  Idioma
                </Label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-background h-8"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                Flujo de Trabajo Asignado
              </Label>
              <select
                value={formData.flowId}
                onChange={(e) => setFormData({ ...formData, flowId: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-background h-8"
              >
                <option value="">Sin flujo asignado</option>
                {flows.map(flow => (
                  <option key={flow.id} value={flow.id}>{flow.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                Instrucciones del Sistema (Prompt)
              </Label>
              <Textarea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="Define el comportamiento y personalidad del asistente"
                data-testid="input-system-prompt"
                className="min-h-16 text-xs bg-background border-border resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                  Modelo IA
                </Label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-border rounded-md bg-background h-8"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5</option>
                  <option value="gemini-pro">Gemini</option>
                  <option value="claude-3">Claude</option>
                </select>
              </div>

              <div>
                <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                  Temperatura ({formData.temperature}%)
                </Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseInt(e.target.value) })}
                  className="w-full"
                  data-testid="slider-temperature"
                />
              </div>
            </div>

            <div>
              <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                Máximo de Tokens: {formData.maxTokens}
              </Label>
              <input
                type="range"
                min="100"
                max="4000"
                value={formData.maxTokens}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                className="w-full"
                data-testid="slider-max-tokens"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1 border-t border-border/30 sticky bottom-0 bg-card">
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
              size="sm"
              className="h-8 text-[11px] px-3"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (editingId) {
                  updateMutation.mutate(editingId);
                } else {
                  createMutation.mutate();
                }
              }}
              disabled={(createMutation.isPending || updateMutation.isPending || !formData.name)}
              size="sm"
              className="h-8 text-[11px] px-3 bg-primary hover:bg-primary/90"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Zap className="w-3 h-3 mr-1 animate-pulse" />
                  {editingId ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  {editingId ? "Actualizar" : "Crear"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
