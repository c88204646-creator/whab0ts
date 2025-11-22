import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, MessageSquare, TrendingUp, Zap, Bot, ShoppingCart, Headphones, Users, Briefcase, Sparkles, MessageCircle, Power, Activity, Clock } from "lucide-react";
import { KnowledgeBaseManager } from "./knowledge-base";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Chatbot, WhatsappAccount } from "@shared/schema";

export default function ChatbotDetailsPage() {
  const [match, params] = useRoute("/chatbots/:id");
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  
  const [chatbotName, setChatbotName] = useState("");
  const [chatbotDescription, setChatbotDescription] = useState("");
  const [chatbotType, setChatbotType] = useState("general");
  const [chatbotAccountId, setChatbotAccountId] = useState<string | null>(null);
  const [chatbotIsActive, setChatbotIsActive] = useState(true);
  const [useAIResponses, setUseAIResponses] = useState(false);
  const { toast } = useToast();

  if (!match) {
    return <div className="p-4">Chatbot no encontrado</div>;
  }

  const chatbotId = params?.id;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserId(parsed.id);
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }, []);

  const { data: chatbot, isLoading, isError, error } = useQuery<Chatbot>({
    queryKey: [`/api/chatbots/${chatbotId}`],
    queryFn: async () => {
      if (!chatbotId) throw new Error('ID no disponible');
      const response = await fetch(`/api/chatbots/${chatbotId}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Chatbot no encontrado');
      }
      return response.json();
    },
    enabled: !!chatbotId,
    retry: false,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/whatsapp-accounts?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error("Error cargando cuentas");
      return response.json();
    },
    enabled: !!userId,
    staleTime: 0,
  });

  const { data: stats = null } = useQuery({
    queryKey: [`/api/chatbots/${chatbotId}/stats`],
    queryFn: async () => {
      if (!chatbotId) return null;
      const response = await fetch(`/api/chatbots/${chatbotId}/stats`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!chatbotId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (chatbot) {
      setChatbotName(chatbot.name);
      setChatbotDescription(chatbot.description || "");
      setChatbotType(chatbot.type || "general");
      setChatbotAccountId(chatbot.whatsappAccountId || null);
      setChatbotIsActive(chatbot.isActive ?? true);
      setUseAIResponses(chatbot.useAIResponses ?? false);
    }
  }, [chatbot]);

  const linkedAccount = accounts.find((a) => a.id === chatbotAccountId);
  
  const hasChanges = !!(chatbot && (
    chatbotName !== chatbot.name ||
    chatbotDescription !== (chatbot.description || "") ||
    chatbotType !== (chatbot.type || "general") ||
    chatbotAccountId !== (chatbot.whatsappAccountId || null) ||
    chatbotIsActive !== (chatbot.isActive ?? true) ||
    useAIResponses !== (chatbot.useAIResponses ?? false)
  ));

  const updateChatbotMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; type: string; whatsappAccountId: string | null; isActive: boolean; useAIResponses: boolean }) => {
      const response = await fetch(`/api/chatbots/${chatbotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al guardar");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/chatbots/${chatbotId}`] });
      toast({ title: "Guardado", description: "Cambios guardados correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudieron guardar los cambios", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!chatbotName.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    updateChatbotMutation.mutate({
      name: chatbotName,
      description: chatbotDescription,
      type: chatbotType,
      whatsappAccountId: chatbotAccountId,
      isActive: chatbotIsActive,
      useAIResponses: useAIResponses,
    });
  };

  if (!chatbot || isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Cargando chatbot...</div>
          <div className="text-sm text-muted-foreground">Por favor espera</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-semibold text-destructive mb-2">Error</div>
          <div className="text-sm text-muted-foreground">{error?.message || 'Chatbot no encontrado'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="max-w-6xl mx-auto space-y-4 p-3 md:p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chatbots")} data-testid="button-back-chatbots">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{chatbot.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tipo: <Badge variant="outline">{chatbot.type}</Badge> • Estado: <Badge variant={chatbotIsActive ? "default" : "secondary"}>{chatbotIsActive ? "Activo" : "Inactivo"}</Badge>
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <MessageSquare className="h-3 h-3 text-blue-500" />
                  Mensajes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xl font-bold" data-testid="stat-total-messages">{stats?.totalMessages || 0}</p>
                <p className="text-xs text-muted-foreground">{stats?.totalMessages ? "Mensajes totales" : "Sin datos"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <Zap className="h-3 h-3 text-amber-500" />
                  Respuestas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xl font-bold" data-testid="stat-automated-responses">{stats?.automatedResponses || 0}</p>
                <p className="text-xs text-muted-foreground">{stats?.automatedResponses ? "Respuestas automatizadas" : "Sin datos"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <TrendingUp className="h-3 h-3 text-emerald-500" />
                  Satisfacción
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xl font-bold" data-testid="stat-satisfaction-rate">{stats?.satisfactionRate || 0}%</p>
                <p className="text-xs text-muted-foreground">{stats?.satisfactionRate ? "Tasa de satisfacción" : "Sin datos"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="general" className="w-full">
            <div className="border-b border-border bg-background/50 px-6 py-4 rounded-t-lg">
              <TabsList className="w-full justify-start border-b-0 bg-transparent gap-8">
                <TabsTrigger value="general" className="relative text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:content-[''] after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-100">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <span>General</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="relative text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:content-[''] after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-100">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="relative text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:content-[''] after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Base de Conocimientos</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="activities" className="relative text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:content-[''] after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>Actividades</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* General Tab */}
            <TabsContent value="general" className="p-4 space-y-3 mt-0">
              <Card className="bg-background/50 border-border/50">
                <CardHeader className="pb-3 border-b border-border/30">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    Información Básica
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Configuración principal</p>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  <div>
                    <Label htmlFor="detail-name" className="text-xs font-semibold flex items-center gap-2 mb-1.5">
                      <span className="text-primary">*</span> Nombre
                    </Label>
                    <Input
                      id="detail-name"
                      placeholder="Ej: Chatbot de Soporte"
                      value={chatbotName}
                      onChange={(e) => setChatbotName(e.target.value)}
                      data-testid="input-detail-name"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="detail-description" className="text-xs font-semibold mb-1.5 block">
                      Descripción
                    </Label>
                    <Input
                      id="detail-description"
                      placeholder="Describe el propósito..."
                      value={chatbotDescription}
                      onChange={(e) => setChatbotDescription(e.target.value)}
                      data-testid="input-detail-description"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <Power className="w-4 h-4 text-primary" />
                      <div>
                        <Label className="text-xs font-semibold block">Estado del Chatbot</Label>
                        <p className="text-xs text-muted-foreground">
                          {chatbotIsActive ? "Chatbot activo y funcionando" : "Chatbot inactivo"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={chatbotIsActive}
                      onCheckedChange={setChatbotIsActive}
                      data-testid="toggle-chatbot-active"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <div>
                        <Label className="text-xs font-semibold block">Respuestas Inteligentes (IA)</Label>
                        <p className="text-xs text-muted-foreground">
                          {useAIResponses ? "El chatbot responderá de forma natural a mensajes sin coincidencia" : "Solo usa reglas y base de conocimientos"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={useAIResponses}
                      onCheckedChange={setUseAIResponses}
                      data-testid="toggle-ai-responses"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50 border-border/50">
                <CardHeader className="pb-3 border-b border-border/30">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Tipo de Chatbot
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Selecciona la categoría</p>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="overflow-x-auto">
                    <div className="flex gap-3 min-w-min pb-2">
                      {[
                        { value: "general", label: "General", icon: Bot },
                        { value: "ventas", label: "Ventas", icon: ShoppingCart },
                        { value: "soporte", label: "Soporte", icon: Headphones },
                        { value: "asistencia", label: "Asistencia", icon: Users },
                        { value: "marketing", label: "Marketing", icon: Zap },
                        { value: "recursos_humanos", label: "RRHH", icon: Briefcase },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setChatbotType(value)}
                          className={`px-4 py-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all flex-shrink-0 ${
                            chatbotType === value
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                          }`}
                          data-testid={`button-type-${value}`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {hasChanges && (
                <div className="flex gap-2 pt-4 border-t border-border/30">
                  <Button
                    onClick={() => {
                      if (chatbot) {
                        setChatbotName(chatbot.name);
                        setChatbotDescription(chatbot.description || "");
                        setChatbotType(chatbot.type || "general");
                        setChatbotIsActive(chatbot.isActive ?? true);
                      }
                    }}
                    variant="outline"
                    size="lg"
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateChatbotMutation.isPending}
                    size="lg"
                    className="px-6"
                    data-testid="button-save-details"
                  >
                    {updateChatbotMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="p-4 space-y-3 mt-0">
              <Card className="bg-background/50 border-border/50">
                <CardHeader className="pb-3 border-b border-border/30">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Vinculación de WhatsApp
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Conecta este chatbot a una cuenta</p>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  <div>
                    <Label className="text-xs font-semibold mb-2 block">
                      Cuenta de WhatsApp
                    </Label>
                    {accountsLoading ? (
                      <p className="text-xs text-muted-foreground">Cargando cuentas...</p>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                          <button
                            onClick={() => setChatbotAccountId(null)}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                              chatbotAccountId === null
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                            }`}
                            data-testid="button-account-none"
                          >
                            <div className="font-semibold text-sm">Sin vincular</div>
                            <div className="text-xs text-muted-foreground">Sin cuenta vinculada</div>
                          </button>
                          {accounts && accounts.length > 0 && (
                            accounts.map((account) => (
                              <button
                                key={account.id}
                                onClick={() => setChatbotAccountId(account.id)}
                                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                  chatbotAccountId === account.id
                                    ? "border-primary bg-primary/10 shadow-sm"
                                    : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                                }`}
                                data-testid={`button-account-${account.id}`}
                              >
                                <div className="font-semibold text-sm">{account.deviceName}</div>
                                <div className="text-xs text-muted-foreground">{account.phoneNumber || "Sin número"}</div>
                              </button>
                            ))
                          )}
                        </div>
                        {accounts && accounts.length === 0 && (
                          <p className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                            No hay cuentas de WhatsApp disponibles. Conecta una cuenta en la sección de Conexiones.
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      Este chatbot responderá a los mensajes de WhatsApp
                    </p>
                  </div>
                </CardContent>
              </Card>

              {hasChanges && (
                <div className="flex gap-2 pt-2 border-t border-border/30">
                  <Button
                    onClick={() => {
                      setChatbotAccountId(chatbot.whatsappAccountId);
                    }}
                    variant="outline"
                    size="sm"
                    className="px-4"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateChatbotMutation.isPending}
                    size="sm"
                    className="px-4"
                  >
                    {updateChatbotMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="knowledge" className="p-4 mt-0">
              <KnowledgeBaseManager chatbotId={chatbotId} />
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="p-4 space-y-3 mt-0">
              <ChatbotActivitiesPanel chatbotId={chatbotId!} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ChatbotActivitiesPanel({ chatbotId }: { chatbotId: string }) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: [`/api/chatbot-activities/${chatbotId}`],
    queryFn: async () => {
      const response = await fetch(`/api/chatbot-activities/${chatbotId}`);
      if (!response.ok) throw new Error("Error cargando actividades");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Cargando actividades...</p>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Sin actividades aún. Los mensajes aparecerán aquí.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background/50 border-border/50 flex flex-col h-96">
      <CardHeader className="pb-3 border-b border-border/30 flex-shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Historial de Actividades
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">Últimas {activities.length} actividades</p>
      </CardHeader>
      <CardContent className="pt-3 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {activities.map((activity: any) => (
            <div key={activity.id} className="p-3 border border-border/30 rounded-lg hover-elevate flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={activity.type === 'rule_matched' ? 'default' : 'secondary'}>
                      {activity.type === 'rule_matched' ? 'Regla' : 'Base de Conocimiento'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{activity.contactNumber}</span>
                  </div>
                  <p className="text-sm mt-2 break-words">
                    <span className="font-semibold">Mensaje:</span> {activity.messageContent}
                  </p>
                  {activity.matchedRule && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-semibold">Regla:</span> {activity.matchedRule}
                    </p>
                  )}
                  {activity.matchedKnowledge && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-semibold">Artículo:</span> {activity.matchedKnowledge}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 break-words">
                    <span className="font-semibold">Respuesta:</span> {activity.responseContent}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(activity.createdAt).toLocaleString('es-ES')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
