import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bot, Plus, Trash2, Edit2, Loader2, Settings, Mic, Volume2, Globe } from "lucide-react";
import { useLocation } from "wouter";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-6 py-4 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
    </div>
    <p className="text-3xl font-semibold text-foreground">{value}</p>
  </div>
);

export default function AIVoiceAgentsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const userId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}").id;
    } catch {
      return null;
    }
  }, []);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    voiceId: "",
    voiceName: "",
    language: "es",
  });

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["/api/ai-voice/agents", "userId", userId],
    enabled: !!userId,
  });

  const { data: voices = [], isLoading: voicesLoading } = useQuery({
    queryKey: ["/api/ai-voice/voices"],
  });

  const createAgentMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name.trim()) throw new Error("El nombre es requerido");
      if (!formData.systemPrompt.trim()) throw new Error("El prompt es requerido");
      if (!formData.voiceId) throw new Error("La voz es requerida");
      
      return apiRequest("POST", `/api/ai-voice/agents?userId=${userId}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-voice/agents", "userId", userId] });
      setFormData({
        name: "",
        description: "",
        systemPrompt: "",
        voiceId: "",
        voiceName: "",
        language: "es",
      });
      setIsCreating(false);
      toast({
        title: "Agente creado",
        description: "Tu agente de IA ha sido creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el agente",
        variant: "destructive",
      });
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      return apiRequest("DELETE", `/api/ai-voice/agents/${agentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-voice/agents", "userId", userId] });
      toast({
        title: "Agente eliminado",
        description: "El agente ha sido eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el agente",
        variant: "destructive",
      });
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name.trim()) throw new Error("El nombre es requerido");
      if (!formData.systemPrompt.trim()) throw new Error("El prompt es requerido");
      if (!formData.voiceId) throw new Error("La voz es requerida");
      
      return apiRequest("PATCH", `/api/ai-voice/agents/${editingId}`, {
        name: formData.name,
        description: formData.description,
        systemPrompt: formData.systemPrompt,
        voiceId: formData.voiceId,
        voiceName: formData.voiceName,
        language: formData.language,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-voice/agents", "userId", userId] });
      setFormData({
        name: "",
        description: "",
        systemPrompt: "",
        voiceId: "",
        voiceName: "",
        language: "es",
      });
      setEditingId(null);
      setIsCreating(false);
      toast({
        title: "Agente actualizado",
        description: "Tu agente de IA ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el agente",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (editingId) {
      updateAgentMutation.mutate();
    } else {
      createAgentMutation.mutate();
    }
  };

  const handleEditAgent = (agent: any) => {
    setFormData({
      name: agent.name,
      description: agent.description || "",
      systemPrompt: agent.systemPrompt,
      voiceId: agent.voiceId,
      voiceName: agent.voiceName || "",
      language: agent.language,
    });
    setEditingId(agent.id);
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      systemPrompt: "",
      voiceId: "",
      voiceName: "",
      language: "es",
    });
    setEditingId(null);
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col bg-background h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 border border-red-400/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-foreground">Agentes IA</h1>
                <p className="text-sm text-muted-foreground mt-1">Crea y gestiona agentes que hacen llamadas automáticas con IA en tiempo real</p>
              </div>
            </div>

            <Dialog open={isCreating} onOpenChange={(open) => {
              setIsCreating(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" data-testid="button-create-agent">
                  <Plus className="w-5 h-5" />
                  <span>Nuevo Agente</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col border-red-200/50 dark:border-red-900/50">
                <div className="bg-gradient-to-b from-red-50/80 to-red-50/40 dark:from-red-950/40 dark:to-red-950/20 -mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-red-200/50 dark:border-red-900/50">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-foreground">{editingId ? "Editar Agente" : "Nuevo Agente IA"}</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-2">{editingId ? "Actualiza la configuración del agente" : "Configura un agente para hacer llamadas automáticas"}</p>
                  </DialogHeader>
                </div>
                
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground">Nombre del Agente *</label>
                    <Input
                      placeholder="Ej: Agente de Ventas"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      data-testid="input-agent-name"
                      className="h-10 border-border/50 focus-visible:ring-red-500/30"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground">Descripción</label>
                    <Textarea
                      placeholder="Descripción breve de qué hace este agente..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      data-testid="input-agent-description"
                      className="min-h-14 max-h-20 border-border/50 focus-visible:ring-red-500/30 resize-none"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground">Instrucciones *</label>
                    <Textarea
                      placeholder="Define cómo debe comportarse el agente..."
                      value={formData.systemPrompt}
                      onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                      data-testid="input-system-prompt"
                      className="min-h-24 max-h-28 border-border/50 focus-visible:ring-red-500/30 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">Define el comportamiento y personalidad del agente</p>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-red-600/60" />
                      Voz del Agente *
                    </label>
                    {voicesLoading ? (
                      <div className="p-3 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-border/50">Cargando voces...</div>
                    ) : (
                      <Select
                        value={formData.voiceId}
                        onValueChange={(value) => {
                          const selectedVoice = voices.find((v: any) => v.voice_id === value);
                          setFormData({
                            ...formData,
                            voiceId: value,
                            voiceName: selectedVoice?.name || "",
                          });
                        }}
                      >
                        <SelectTrigger data-testid="select-voice" className="h-10 border-border/50 focus-visible:ring-red-500/30">
                          <SelectValue placeholder="Selecciona una voz" />
                        </SelectTrigger>
                        <SelectContent>
                          {voices.length > 0 ? (
                            voices.map((voice: any) => (
                              <SelectItem key={voice.voice_id} value={voice.voice_id}>
                                {voice.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm">No hay voces disponibles</div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Globe className="w-4 h-4 text-red-600/60" />
                      Idioma *
                    </label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                      <SelectTrigger className="h-10 border-border/50 focus-visible:ring-red-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="gap-3 px-6 py-4 border-t border-border/50 bg-muted/20">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsCreating(false);
                    }}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createAgentMutation.isPending || updateAgentMutation.isPending || !formData.name.trim() || !formData.systemPrompt.trim()}
                    className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    data-testid="button-save-agent"
                  >
                    {(createAgentMutation.isPending || updateAgentMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingId ? "Actualizar" : "Crear"}</span>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard label="Total de Agentes" value={agents.length} icon={Bot} />
            <StatCard label="Voces Disponibles" value={voices.length} icon={Mic} />
            <StatCard label="Idiomas Soportados" value={4} icon={Globe} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Sin agentes aún</h3>
              <p className="text-sm text-muted-foreground mt-1">Crea tu primer agente IA para comenzar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent: any) => (
                <Card key={agent.id} className="overflow-hidden hover-elevate transition-all group border-border/50 bg-card">
                  <div className="h-2 bg-gradient-to-r from-red-500 via-red-600 to-red-700" />
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground leading-tight">{agent.name}</h3>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{agent.description}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 bg-muted/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Volume2 className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span className="text-muted-foreground/80 truncate">{agent.voiceName || agent.voiceId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span className="text-muted-foreground/80 uppercase">{agent.language}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-muted/20 border-t border-border/30 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9"
                      onClick={() => handleEditAgent(agent)}
                      data-testid={`button-edit-${agent.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Editar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 border-red-200/50 dark:border-red-900/50 text-red-600 dark:text-red-400"
                      onClick={() => navigate(`/ai-voice-agents/${agent.id}/config`)}
                      data-testid={`button-config-${agent.id}`}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-9 px-3"
                      onClick={() => setAgentToDelete({ id: agent.id, name: agent.name })}
                      data-testid={`button-delete-${agent.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
        <AlertDialogContent className="max-w-sm border-red-200/50 dark:border-red-900/50">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg">Eliminar Agente</AlertDialogTitle>
                <AlertDialogDescription className="mt-2">
                  ¿Estás seguro de eliminar "<strong>{agentToDelete?.name}</strong>"? No se puede deshacer.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-4">
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (agentToDelete) {
                  deleteAgentMutation.mutate(agentToDelete.id);
                  setAgentToDelete(null);
                }
              }}
              disabled={deleteAgentMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
              data-testid="button-confirm-delete"
            >
              {deleteAgentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Eliminar</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
