import { useState } from "react";
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
import { Phone, Plus, Trash2, Edit2, Settings } from "lucide-react";

export default function AIVoiceAgentsPage() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    voiceId: "",
    language: "es",
  });

  const { data: agents, isLoading } = useQuery({
    queryKey: ["/api/ai-voice/agents"],
  });

  const { data: voices } = useQuery({
    queryKey: ["/api/ai-voice/voices"],
  });

  const createAgentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ai-voice/agents", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-voice/agents"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/ai-voice/agents"] });
      toast({
        title: "Agente eliminado",
        description: "El agente ha sido eliminado exitosamente",
      });
    },
  });

  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agentes de IA para Llamadas</h1>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-agent">
              <Plus className="w-4 h-4" />
              Nuevo Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Agente de IA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre del Agente</label>
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
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Prompt del Sistema
                </label>
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
                <label className="text-sm font-medium">Voz</label>
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
                    {voices?.map((voice: any) => (
                      <SelectItem key={voice.voice_id} value={voice.voice_id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => createAgentMutation.mutate()}
                  disabled={createAgentMutation.isPending}
                  data-testid="button-create-confirm"
                >
                  Crear Agente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents?.map((agent: any) => (
          <Card key={agent.id} className="p-4 space-y-3" data-testid={`card-agent-${agent.id}`}>
            <div>
              <h3 className="font-semibold text-lg" data-testid={`text-agent-name-${agent.id}`}>{agent.name}</h3>
              <p className="text-sm text-secondary-foreground">{agent.description}</p>
            </div>
            <div className="text-sm space-y-1">
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
                className="gap-1"
                data-testid={`button-edit-${agent.id}`}
              >
                <Edit2 className="w-3 h-3" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                data-testid={`button-call-${agent.id}`}
              >
                <Phone className="w-3 h-3" />
                Llamar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteAgentMutation.mutate(agent.id)}
                data-testid={`button-delete-${agent.id}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
