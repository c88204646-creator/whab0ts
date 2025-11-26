import { useState, useMemo } from "react";
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
import { Headphones, Play, Loader2, AlertCircle, CheckCircle, Phone } from "lucide-react";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

export default function AIVoiceCallPanelPage() {
  const { toast } = useToast();
  const userId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}").id;
    } catch {
      return null;
    }
  }, []);

  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);

  const { data: agents = [] } = useQuery({
    queryKey: ["/api/ai-voice/agents", "userId", userId],
    enabled: !!userId,
  });

  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: ["/api/ai-voice/calls", "userId", userId],
    enabled: !!userId,
    refetchInterval: 3000,
  });

  const makeCallMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No estás autenticado");
      if (!selectedAgentId) throw new Error("Selecciona un agente");
      if (!phoneNumber.trim()) throw new Error("Ingresa un número telefónico");
      if (!/^\+?[0-9]{7,}$/.test(phoneNumber.replace(/[\s\-\(\)]/g, ""))) {
        throw new Error("Número telefónico inválido");
      }

      return apiRequest("POST", `/api/ai-voice/calls?userId=${userId}`, {
        agentId: selectedAgentId,
        phoneNumber,
      });
    },
    onSuccess: (data) => {
      setIsCalling(false);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-voice/calls", "userId", userId] });
      toast({
        title: "Llamada iniciada",
        description: `Llamada al ${phoneNumber} en progreso`,
      });
      setPhoneNumber("");
      setSelectedAgentId("");
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
    setIsCalling(true);
    makeCallMutation.mutate();
  };

  const formatPhoneNumber = (num: string) => {
    return num.replace(/(\d{2})(\d{4})(\d{4})/, "+$1 $2 $3");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "in-progress":
      case "ringing":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col bg-background">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Buttons */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                <Headphones className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Panel de Llamadas</h1>
                <p className="text-xs text-muted-foreground/80">Haz llamadas de IA con tus agentes y monitorea su estado</p>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          {!callsLoading && calls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <StatCard label="Total de Llamadas" value={calls.length} icon={Headphones} />
              <StatCard label="Completadas" value={calls.filter((c: any) => c.status === "completed").length} icon={CheckCircle} />
              <StatCard label="Fallidas" value={calls.filter((c: any) => c.status === "failed").length} icon={AlertCircle} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nueva Llamada */}
        <div className="lg:col-span-1">
          <Card className="p-6 space-y-4 sticky top-6">
            <h2 className="font-semibold text-lg">Nueva Llamada</h2>

            <div>
              <label className="text-sm font-medium mb-2 block">Seleccionar Agente</label>
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
              >
                <SelectTrigger data-testid="select-agent-call">
                  <SelectValue placeholder="Selecciona un agente" />
                </SelectTrigger>
                <SelectContent>
                  {agents.length > 0 ? (
                    agents.map((agent: any) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm">No hay agentes disponibles</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Número Telefónico</label>
              <Input
                type="tel"
                placeholder="+34 632 12 34 56"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-phone-number"
                disabled={isCalling}
              />
              <p className="text-xs text-secondary-foreground mt-1">
                Formato: +país código área número
              </p>
            </div>

            <Button
              onClick={handleMakeCall}
              disabled={isCalling || !selectedAgentId || !phoneNumber}
              className="w-full gap-2"
              data-testid="button-make-call"
            >
              {isCalling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Llamando...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Hacer Llamada
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Historial de Llamadas */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Historial de Llamadas</h2>
            {callsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-secondary-foreground">Cargando llamadas...</p>
              </div>
            ) : calls.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {calls.map((call: any) => (
                  <Card
                    key={call.id}
                    className="p-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
                    data-testid={`call-row-${call.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(call.status)}
                        <p className="font-medium">{formatPhoneNumber(call.phoneNumber)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-secondary-foreground">
                        <span>Duración: {call.duration}s</span>
                        {call.createdAt && (
                          <>
                            <span>•</span>
                            <span>
                              {new Date(call.createdAt).toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(call.status)}`}
                      >
                        {call.status}
                      </span>
                      {call.recordingUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          data-testid={`button-play-recording-${call.id}`}
                          onClick={() => {
                            window.open(call.recordingUrl, "_blank");
                          }}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-secondary-foreground">No hay llamadas aún</p>
                <p className="text-sm text-muted-foreground">
                  Realiza tu primera llamada usando el formulario
                </p>
              </div>
            )}
          </Card>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
