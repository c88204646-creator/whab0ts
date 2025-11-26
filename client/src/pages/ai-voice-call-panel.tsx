import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Phone, Square, Play } from "lucide-react";

export default function AIVoiceCallPanelPage() {
  const { toast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);

  const { data: agents } = useQuery({
    queryKey: ["/api/ai-voice/agents"],
  });

  const { data: calls } = useQuery({
    queryKey: ["/api/ai-voice/calls"],
  });

  const makeCallMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ai-voice/calls", {
        agentId: selectedAgentId,
        phoneNumber,
      });
    },
    onSuccess: (data) => {
      setIsCalling(false);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-voice/calls"] });
      toast({
        title: "Llamada iniciada",
        description: `Llamada al ${phoneNumber} en progreso`,
      });
    },
    onError: (error: any) => {
      setIsCalling(false);
      toast({
        title: "Error",
        description: error.message || "Error al hacer la llamada",
        variant: "destructive",
      });
    },
  });

  const handleMakeCall = async () => {
    if (!selectedAgentId || !phoneNumber) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona un agente y un número telefónico",
        variant: "destructive",
      });
      return;
    }

    setIsCalling(true);
    makeCallMutation.mutate();
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de Llamadas</h1>
        <p className="text-secondary-foreground">
          Haz llamadas de IA con tus agentes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Nueva Llamada</h2>

            <div>
              <label className="text-sm font-medium">Seleccionar Agente</label>
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
              >
                <SelectTrigger data-testid="select-agent-call">
                  <SelectValue placeholder="Selecciona un agente" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map((agent: any) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Número Telefónico</label>
              <Input
                type="tel"
                placeholder="+34 XXX XX XX XX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-phone-number"
              />
            </div>

            <Button
              onClick={handleMakeCall}
              disabled={isCalling}
              className="w-full gap-2"
              data-testid="button-make-call"
            >
              <Phone className="w-4 h-4" />
              {isCalling ? "Llamando..." : "Hacer Llamada"}
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Historial de Llamadas</h2>
            <div className="space-y-2">
              {calls && calls.length > 0 ? (
                calls.map((call: any) => (
                  <Card
                    key={call.id}
                    className="p-3 flex items-center justify-between"
                    data-testid={`call-row-${call.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{call.phoneNumber}</p>
                      <p className="text-sm text-secondary-foreground">
                        Duración: {call.duration}s
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          call.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : call.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {call.status}
                      </span>
                      {call.recordingUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          data-testid={`button-play-recording-${call.id}`}
                        >
                          <Play className="w-3 h-3" />
                          Escuchar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-center text-secondary-foreground py-8">
                  No hay llamadas aún
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
