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
import { Headphones, Play, Loader2, AlertCircle, CheckCircle, Phone, Search, ChevronDown } from "lucide-react";

interface CountryFormat {
  code: string;
  name: string;
  localDigits: number;
  prefix?: string;
}

const COUNTRY_CODES: Record<string, CountryFormat> = {
  "52": { code: "52", name: "México 🇲🇽", localDigits: 11, prefix: "1" },
  "1": { code: "1", name: "USA/Canadá 🇺🇸", localDigits: 10 },
  "34": { code: "34", name: "España 🇪🇸", localDigits: 9 },
  "55": { code: "55", name: "Brasil 🇧🇷", localDigits: 11 },
  "54": { code: "54", name: "Argentina 🇦🇷", localDigits: 10 },
  "57": { code: "57", name: "Colombia 🇨🇴", localDigits: 10 },
  "56": { code: "56", name: "Chile 🇨🇱", localDigits: 9 },
  "51": { code: "51", name: "Perú 🇵🇪", localDigits: 9 },
  "58": { code: "58", name: "Venezuela 🇻🇪", localDigits: 10 },
};

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
  const [countryCode, setCountryCode] = useState("52");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneValidation, setPhoneValidation] = useState<string | null>(null);
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
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

  const validatePhoneNumber = (number: string, code: string): boolean => {
    if (!number) return false;
    const cleaned = number.trim().replace(/\s+/g, '');
    const countryFormat = COUNTRY_CODES[code];
    if (!countryFormat) return false;
    const expectedLength = countryFormat.prefix 
      ? countryFormat.localDigits - countryFormat.prefix.length 
      : countryFormat.localDigits;
    return /^\d+$/.test(cleaned) && cleaned.length === expectedLength;
  };

  const getFullPhoneNumber = (): string | null => {
    if (!phoneNumber.trim()) return null;
    
    let cleanNumber = phoneNumber
      .trim()
      .replace(/\s+/g, '')
      .replace(/[-()]/g, '')
      .replace(/[@+]/g, '')
      .replace(/\./g, '');
    
    const cleanCode = countryCode.trim().replace(/\D/g, '');
    
    if (!/^\d+$/.test(cleanNumber)) {
      return null;
    }
    
    const countryFormat = COUNTRY_CODES[cleanCode];
    if (!countryFormat) {
      return null;
    }
    
    const expectedLocalDigits = countryFormat.localDigits;
    const prefix = countryFormat.prefix;
    
    // Add prefix if needed and not already present
    if (prefix && cleanNumber.length === expectedLocalDigits - prefix.length && !cleanNumber.startsWith(prefix)) {
      cleanNumber = prefix + cleanNumber;
    }
    
    if (cleanNumber.length !== expectedLocalDigits) {
      return null;
    }
    
    return `+${cleanCode}${cleanNumber}`;
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    if (validatePhoneNumber(value, countryCode)) {
      setPhoneValidation(null);
    } else if (value.trim()) {
      setPhoneValidation("Número inválido para este país");
    } else {
      setPhoneValidation(null);
    }
  };

  const makeCallMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No estás autenticado");
      if (!selectedAgentId) throw new Error("Selecciona un agente");
      if (!phoneNumber.trim()) throw new Error("Ingresa un número telefónico");
      
      if (!validatePhoneNumber(phoneNumber, countryCode)) {
        throw new Error("El número telefónico no es válido para el país seleccionado");
      }

      const fullPhone = getFullPhoneNumber();
      if (!fullPhone) {
        throw new Error("No se pudo formatear el número telefónico");
      }

      return apiRequest("POST", `/api/ai-voice/calls?userId=${userId}`, {
        agentId: selectedAgentId,
        phoneNumber: fullPhone,
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
    // Protección contra doble clic
    if (isCalling || makeCallMutation.isPending) return;
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

            <Button 
              onClick={handleMakeCall} 
              disabled={isCalling || !selectedAgentId || !phoneNumber || !!phoneValidation}
              size="sm"
              className="gap-2" 
              data-testid="button-make-call-header"
            >
              {isCalling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Llamando...</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Hacer Llamada</span>
                </>
              )}
            </Button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Total de Llamadas" value={calls.length} icon={Headphones} />
            <StatCard label="Completadas" value={calls.filter((c: any) => c.status === "completed").length} icon={CheckCircle} />
            <StatCard label="Fallidas" value={calls.filter((c: any) => c.status === "failed").length} icon={AlertCircle} />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nueva Llamada */}
        <div className="lg:col-span-1">
          <Card className="p-6 space-y-4 sticky top-6">
            <h2 className="font-semibold text-lg">Nueva Llamada</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium mb-2 block">Seleccionar Agente</label>
              {agents.length === 0 ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-semibold mb-1">No hay agentes creados</p>
                    <p>Ve a la sección "Agentes IA" para crear tu primer agente</p>
                  </div>
                </div>
              ) : (
                <Select
                  value={selectedAgentId}
                  onValueChange={setSelectedAgentId}
                >
                  <SelectTrigger data-testid="select-agent-call">
                    <SelectValue placeholder="Selecciona un agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent: any) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Número Telefónico</label>
              <div className="flex gap-2">
                {/* Country Selector */}
                <div className="relative w-32">
                  <button
                    onClick={() => setIsCountrySelectorOpen(!isCountrySelectorOpen)}
                    className="w-full h-10 px-3 rounded-lg border border-red-200/50 dark:border-red-900/50 bg-background flex items-center justify-between hover:bg-muted/50 transition-colors"
                    data-testid="button-country-selector"
                  >
                    <span className="text-sm">{COUNTRY_CODES[countryCode]?.name?.split(' ')[1] || '🌍'} +{countryCode}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {isCountrySelectorOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-red-200/50 dark:border-red-900/50 rounded-lg shadow-lg z-50">
                      <div className="p-2 border-b border-red-200/50 dark:border-red-900/50">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded">
                          <Search className="w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Buscar país..."
                            value={countrySearchTerm}
                            onChange={(e) => setCountrySearchTerm(e.target.value)}
                            className="flex-1 bg-transparent text-sm outline-none"
                            data-testid="input-country-search"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {Object.entries(COUNTRY_CODES)
                          .filter(([_, format]) =>
                            format.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
                            format.code.includes(countrySearchTerm)
                          )
                          .map(([code, format]) => (
                            <button
                              key={code}
                              onClick={() => {
                                setCountryCode(code);
                                setIsCountrySelectorOpen(false);
                                setCountrySearchTerm("");
                                handlePhoneChange(phoneNumber);
                              }}
                              className={`w-full px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${
                                countryCode === code ? "bg-red-100/20 dark:bg-red-900/20" : ""
                              }`}
                              data-testid={`country-option-${code}`}
                            >
                              {format.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <Input
                  type="tel"
                  placeholder={`${COUNTRY_CODES[countryCode]?.localDigits || 10} dígitos`}
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  data-testid="input-phone-number"
                  disabled={isCalling}
                  className={`flex-1 h-10 border-red-200/50 dark:border-red-900/50 ${
                    phoneValidation ? "border-red-500" : ""
                  }`}
                  maxLength={COUNTRY_CODES[countryCode]?.localDigits || 20}
                />
              </div>
              {phoneValidation && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {phoneValidation}
                </p>
              )}
              {!phoneValidation && phoneNumber && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {getFullPhoneNumber()}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Solo números, {COUNTRY_CODES[countryCode]?.localDigits || 10} dígitos
              </p>
            </div>

            <Button
              onClick={handleMakeCall}
              disabled={isCalling || !selectedAgentId || !phoneNumber || !!phoneValidation}
              className="w-full gap-2"
              data-testid="button-make-call"
            >
              {isCalling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Llamando...</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  <span>Hacer Llamada</span>
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Historial de Llamadas */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent dark:from-red-950/30 dark:via-red-950/15 dark:to-transparent p-5 border-b border-red-200/30 dark:border-red-900/30">
              <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                <Headphones className="w-5 h-5 text-red-600 dark:text-red-400" />
                Historial de Llamadas (En Tiempo Real)
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Se actualiza cada 3 segundos</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {callsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-secondary-foreground text-sm">Cargando llamadas...</p>
                </div>
              ) : calls.length > 0 ? (
                <div className="space-y-3">
                  {calls.map((call: any) => (
                    <div
                      key={call.id}
                      className="group overflow-hidden border border-border/40 dark:border-border/60 rounded-lg hover-elevate transition-all"
                      data-testid={`call-row-${call.id}`}
                    >
                      {/* Row Header */}
                      <div className="bg-gradient-to-r from-red-500/5 to-transparent dark:from-red-950/20 dark:to-transparent p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {getStatusIcon(call.status)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-foreground">{formatPhoneNumber(call.phoneNumber)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {call.agentName && <span>{call.agentName} • </span>}
                              {call.createdAt && new Date(call.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(call.status)}`}>
                            {call.status}
                          </span>
                        </div>
                      </div>

                      {/* Row Details */}
                      <div className="px-3.5 py-3 bg-muted/20 border-t border-border/30 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="text-lg">⏱️</span>
                            <span className="font-medium">{call.duration || 0}s</span>
                          </div>
                          {call.recordingUrl && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="text-lg">🎙️</span>
                              <span className="font-medium">Grabación</span>
                            </div>
                          )}
                        </div>
                        {call.recordingUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-8"
                            data-testid={`button-play-recording-${call.id}`}
                            onClick={() => {
                              window.open(call.recordingUrl, "_blank");
                            }}
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Escuchar</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-200/50 dark:border-red-900/50 flex items-center justify-center mb-4">
                    <Phone className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-foreground font-semibold">No hay llamadas aún</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Realiza tu primera llamada usando el formulario
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
