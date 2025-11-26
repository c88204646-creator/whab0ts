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
import { Bot, Plus, Trash2, Edit2, Loader2 } from "lucide-react";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

export default function AIVoiceAgentsPage() {
  const { toast } = useToast();
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
    <div className="flex flex-col bg-background">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Buttons */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                <Bot className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Agentes IA</h1>
                <p className="text-xs text-muted-foreground/80">Crea y gestiona agentes de IA que hacen llamadas telefónicas</p>
              </div>
            </div>

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-agent">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nuevo Agente</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-red-200/50 dark:border-red-900/50 shadow-lg shadow-red-500/5">
                <div className="bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-950/30 dark:to-transparent -mx-6 -mt-6 px-6 pt-6 pb-4 mb-4 border-b border-red-200/50 dark:border-red-900/50">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-foreground">{editingId ? "Editar Agente de IA" : "Crear Nuevo Agente de IA"}</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1">{editingId ? "Actualiza los datos del agente" : "Configura un agente para hacer llamadas automáticas"}</p>
                  </DialogHeader>
                </div>
                
                <div className="space-y-6 pb-4">
                  {/* Nombre del Agente */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Nombre del Agente *</label>
                    <Input
                      placeholder="Mi Agente de Ventas"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      data-testid="input-agent-name"
                      className="h-10 border-red-200/50 dark:border-red-900/50 focus-visible:ring-red-500/20"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Descripción</label>
                    <Textarea
                      placeholder="Descripción corta del agente..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      data-testid="input-agent-description"
                      className="min-h-16 border-red-200/50 dark:border-red-900/50 focus-visible:ring-red-500/20"
                    />
                  </div>

                  {/* Prompt del Sistema */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Prompt del Sistema *</label>
                    <Textarea
                      placeholder="Eres un agente de ventas profesional que..."
                      value={formData.systemPrompt}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          systemPrompt: e.target.value,
                        })
                      }
                      data-testid="input-system-prompt"
                      className="min-h-24 border-red-200/50 dark:border-red-900/50 focus-visible:ring-red-500/20"
                    />
                    <p className="text-xs text-muted-foreground">Define el comportamiento y personalidad del agente</p>
                  </div>

                  {/* Voz */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Voz *</label>
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
                        <SelectTrigger data-testid="select-voice" className="h-10 border-red-200/50 dark:border-red-900/50">
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

                  {/* Idioma */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Idioma</label>
                    <Select value={formData.language} onValueChange={(value) =>
                        setFormData({ ...formData, language: value })
                      }>
                      <SelectTrigger className="h-10 border-red-200/50 dark:border-red-900/50">
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

                  {/* Botones de Acción */}
                  <div className="flex gap-3 pt-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      data-testid="button-cancel"
                      className="flex-1 h-10"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={createAgentMutation.isPending || updateAgentMutation.isPending}
                      data-testid="button-create-confirm"
                      className="flex-1 h-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                    >
                      {createAgentMutation.isPending || updateAgentMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {editingId ? "Actualizando..." : "Creando..."}
                        </>
                      ) : (
                        editingId ? "Actualizar Agente" : "Crear Agente"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Metrics Row */}
          {!isLoading && agents.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <StatCard label="Total de Agentes" value={agents.length} icon={Bot} />
              <StatCard label="Llamadas Realizadas" value={agents.reduce((sum: number, a: any) => sum + (a.callsCount || 0), 0)} icon={Loader2} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <Card className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Cargando agentes...</p>
            </Card>
          ) : agents.length === 0 ? (
            <div className="space-y-6">
              <Card className="p-8 bg-gradient-to-br from-red-50/50 via-background to-background dark:from-red-950/20 dark:via-background dark:to-background border border-red-200/30 dark:border-red-900/30">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-200/50 dark:border-red-900/50 flex items-center justify-center">
                      <Bot className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Comienza a crear agentes de IA</h3>
                    <p className="text-sm text-muted-foreground">
                      Crea agentes inteligentes con prompts personalizados para hacer llamadas automáticas con ElevenLabs
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsCreating(true)}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white gap-2"
                    data-testid="button-create-first-agent"
                  >
                    <Plus className="w-4 h-4" />
                    Crear tu primer agente
                  </Button>
                </div>
              </Card>

              <Card className="p-6 bg-muted/20 border border-border/50 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  ¿Cómo empezar?
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold text-foreground min-w-5">1.</span>
                    <span>Define el nombre y comportamiento de tu agente con un prompt</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-foreground min-w-5">2.</span>
                    <span>Selecciona una voz de ElevenLabs que prefieras</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-foreground min-w-5">3.</span>
                    <span>Ve al Panel de Llamadas y realiza llamadas automáticas</span>
                  </li>
                </ul>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent: any) => (
                <Card key={agent.id} className="overflow-hidden hover-elevate transition-all border border-border/40 dark:border-border/60" data-testid={`card-agent-${agent.id}`}>
                  {/* Card Header con Gradiente */}
                  <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent dark:from-red-950/30 dark:via-red-950/15 dark:to-transparent p-4 pb-3 border-b border-red-200/30 dark:border-red-900/30">
                    <h3 className="font-bold text-base text-foreground line-clamp-1" data-testid={`text-agent-name-${agent.id}`}>{agent.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{agent.description || "Sin descripción"}</p>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Voz */}
                    <div className="flex items-start gap-3 p-2.5 bg-background/50 rounded-md border border-border/30 hover:border-red-500/20 transition-colors">
                      <div className="w-8 h-8 rounded-md bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">🎙️</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Voz</p>
                        <p className="text-sm font-semibold text-foreground truncate">{agent.voiceName}</p>
                      </div>
                    </div>

                    {/* Llamadas */}
                    <div className="flex items-start gap-3 p-2.5 bg-background/50 rounded-md border border-border/30 hover:border-red-500/20 transition-colors">
                      <div className="w-8 h-8 rounded-md bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">📞</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Llamadas Realizadas</p>
                        <p className="text-sm font-semibold text-foreground">{agent.callsCount || 0}</p>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="flex items-start gap-3 p-2.5 bg-background/50 rounded-md border border-border/30 hover:border-red-500/20 transition-colors">
                      <div className="w-8 h-8 rounded-md bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <span className={agent.status === "published" ? "text-sm" : "text-sm"}>
                          {agent.status === "published" ? "✓" : "◯"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Estado</p>
                        <p className={`text-sm font-semibold capitalize ${agent.status === "published" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {agent.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-muted/20 border-t border-border/30 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 flex-1 h-9"
                      onClick={() => handleEditAgent(agent)}
                      data-testid={`button-edit-${agent.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Editar</span>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
        <AlertDialogContent className="border-red-200/50 dark:border-red-900/50 shadow-lg shadow-red-500/5">
          <div className="bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-950/30 dark:to-transparent -mx-6 -mt-6 px-6 pt-6 pb-4 mb-4 border-b border-red-200/50 dark:border-red-900/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-foreground">¿Eliminar agente?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                ¿Estás seguro de que deseas eliminar el agente "<span className="font-semibold text-foreground">{agentToDelete?.name}</span>"? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <AlertDialogCancel className="h-10 border-red-200/50 dark:border-red-900/50">
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
              className="h-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              {deleteAgentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
