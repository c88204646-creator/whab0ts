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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    voiceId: "",
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

  const handleSubmit = () => {
    createAgentMutation.mutate();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      systemPrompt: "",
      voiceId: "",
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Agente de IA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre del Agente *</label>
                <Input
                  placeholder="Mi Agente de Ventas"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  data-testid="input-agent-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  placeholder="Descripción corta del agente..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  data-testid="input-agent-description"
                  className="min-h-16"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prompt del Sistema *</label>
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
                  className="min-h-24"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Voz *</label>
                {voicesLoading ? (
                  <div className="p-2 text-sm text-secondary-foreground">Cargando voces...</div>
                ) : (
                  <Select
                    value={formData.voiceId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, voiceId: value })
                    }
                  >
                    <SelectTrigger data-testid="select-voice">
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
              <div>
                <label className="text-sm font-medium">Idioma</label>
                <Select value={formData.language} onValueChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }>
                  <SelectTrigger>
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
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createAgentMutation.isPending}
                  data-testid="button-create-confirm"
                >
                  {createAgentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Agente"
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
            <Card className="p-12 text-center">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No hay agentes creados</h3>
              <p className="text-secondary-foreground mb-4">
                Crea tu primer agente de IA para empezar a hacer llamadas
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent: any) => (
                <Card key={agent.id} className="p-4 space-y-3 hover:shadow-md transition-shadow" data-testid={`card-agent-${agent.id}`}>
                  <div>
                    <h3 className="font-semibold text-lg" data-testid={`text-agent-name-${agent.id}`}>{agent.name}</h3>
                    <p className="text-sm text-secondary-foreground line-clamp-2">{agent.description || "Sin descripción"}</p>
                  </div>
                  <div className="text-sm space-y-1 bg-muted/50 p-2 rounded">
                    <p>
                      <span className="font-medium">Voz:</span> {agent.voiceName}
                    </p>
                    <p>
                      <span className="font-medium">Llamadas:</span> {agent.callsCount}
                    </p>
                    <p>
                      <span className="font-medium">Estado:</span>{" "}
                      <span className={agent.status === "published" ? "text-green-600" : "text-yellow-600"}>
                        {agent.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 flex-1"
                      data-testid={`button-edit-${agent.id}`}
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm("¿Eliminar este agente?")) {
                          deleteAgentMutation.mutate(agent.id);
                        }
                      }}
                      data-testid={`button-delete-${agent.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
