import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, MessageSquare, TrendingUp, Zap, Bot, ShoppingCart, Headphones, Users, Briefcase, Sparkles, MessageCircle, Power, Activity, Clock, Cpu, Plus, Trash2, Check, Wifi } from "lucide-react";
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

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

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
  const [newProvider, setNewProvider] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
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

  const { data: providers = [] } = useQuery({
    queryKey: [`/api/chatbots/${chatbotId}/ai-providers`],
    queryFn: async () => {
      if (!chatbotId) return [];
      const response = await fetch(`/api/chatbots/${chatbotId}/ai-providers`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!chatbotId,
  });

  const addAIProviderMutation = useMutation({
    mutationFn: async (data: { provider: string; apiKey: string }) => {
      const response = await fetch(`/api/chatbots/${chatbotId}/ai-providers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al agregar proveedor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}/ai-providers`] });
      setNewProvider("");
      setNewApiKey("");
      toast({ title: "Éxito", description: "Proveedor de IA agregado correctamente" });
    },
    onError: () => {
      setNewApiKey("");
      toast({ title: "Error", description: "No se pudo agregar el proveedor", variant: "destructive" });
    },
  });

  const deleteAIProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/ai-providers/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}/ai-providers`] });
      toast({ title: "Éxito", description: "Proveedor eliminado correctamente" });
    },
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
    <div className="h-full overflow-y-auto bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4 flex-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/chatbots")} 
                  data-testid="button-back-chatbots" 
                  className="h-10 w-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-foreground">{chatbot.name}</h1>
                      <p className="text-xs text-muted-foreground">Gestiona la configuración y el comportamiento del chatbot</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={chatbotIsActive ? "default" : "secondary"} className="text-xs">
                  {chatbotIsActive ? "Activo" : "Inactivo"}
                </Badge>
                {linkedAccount && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Wifi className="w-3 h-3" />
                    Conectado
                  </Badge>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Mensajes" value={stats?.totalMessages || 0} icon={MessageSquare} />
                <StatCard label="Respuestas Automáticas" value={stats?.automatedResponses || 0} icon={Zap} />
                <StatCard label="Satisfacción" value={`${stats?.satisfactionRate || 0}%`} icon={TrendingUp} />
                <StatCard label="Tipo" value={chatbot.type === "recursos_humanos" ? "RRHH" : chatbot.type} icon={Bot} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="general" className="gap-2" data-testid="tab-general">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-2" data-testid="tab-whatsapp">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2" data-testid="tab-knowledge">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Base</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2" data-testid="tab-ai">
                <Cpu className="w-4 h-4" />
                <span className="hidden sm:inline">IA</span>
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <Label htmlFor="detail-name" className="text-sm font-semibold mb-2 block">
                      Nombre del Chatbot *
                    </Label>
                    <Input
                      id="detail-name"
                      placeholder="Ej: Chatbot de Soporte"
                      value={chatbotName}
                      onChange={(e) => setChatbotName(e.target.value)}
                      data-testid="input-detail-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="detail-description" className="text-sm font-semibold mb-2 block">
                      Descripción
                    </Label>
                    <Textarea
                      id="detail-description"
                      placeholder="Describe el propósito de este chatbot..."
                      value={chatbotDescription}
                      onChange={(e) => setChatbotDescription(e.target.value)}
                      data-testid="input-detail-description"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Tipo de Chatbot
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 min-w-min pb-2">
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
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 hover:bg-muted/30"
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

              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <Power className="w-4 h-4 text-primary" />
                    Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2">
                      <Power className="w-4 h-4 text-primary" />
                      <div>
                        <Label className="text-sm font-semibold block">Estado</Label>
                        <p className="text-xs text-muted-foreground">
                          {chatbotIsActive ? "El chatbot está activo" : "El chatbot está pausado"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={chatbotIsActive}
                      onCheckedChange={setChatbotIsActive}
                      data-testid="toggle-chatbot-active"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-primary" />
                      <div>
                        <Label className="text-sm font-semibold block">Respuestas con IA</Label>
                        <p className="text-xs text-muted-foreground">
                          {useAIResponses ? "Usar IA para respuestas" : "Solo reglas y base de conocimientos"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={useAIResponses}
                      onCheckedChange={setUseAIResponses}
                      data-testid="toggle-use-ai-responses"
                    />
                  </div>
                </CardContent>
              </Card>

              {hasChanges && (
                <div className="flex gap-2 pt-4 border-t border-border">
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
                    data-testid="button-cancel-general"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateChatbotMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-general"
                  >
                    {updateChatbotMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Vinculación de WhatsApp
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-2">Conecta este chatbot a una cuenta de WhatsApp</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {accountsLoading ? (
                      <p className="text-sm text-muted-foreground py-4">Cargando cuentas...</p>
                    ) : accounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 px-3 bg-muted/30 rounded-lg">
                        No hay cuentas de WhatsApp. Crea una en la sección de Conexiones.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => setChatbotAccountId(null)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                            chatbotAccountId === null
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 hover:bg-muted/30"
                          }`}
                          data-testid="button-account-none"
                        >
                          <div className="font-semibold text-sm">Sin vincular</div>
                          <div className="text-xs text-muted-foreground">No usar WhatsApp</div>
                        </button>
                        {accounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => setChatbotAccountId(account.id)}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                              chatbotAccountId === account.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50 hover:bg-muted/30"
                            }`}
                            data-testid={`button-account-${account.id}`}
                          >
                            <div className="font-semibold text-sm">{account.deviceName}</div>
                            <div className="text-xs text-muted-foreground">{account.phoneNumber || "Sin número"}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {hasChanges && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      setChatbotAccountId(chatbot?.whatsappAccountId || null);
                    }}
                    variant="outline"
                    data-testid="button-cancel-whatsapp"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateChatbotMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-whatsapp"
                  >
                    {updateChatbotMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="knowledge">
              <KnowledgeBaseManager chatbotId={chatbotId} />
            </TabsContent>

            {/* AI Providers Tab */}
            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    Proveedores de IA
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-2">Configura tus API keys para servicios de IA</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Proveedor</Label>
                      <Select value={newProvider} onValueChange={setNewProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                          <SelectItem value="gemini-flash">Google Gemini - Flash (Gratuita)</SelectItem>
                          <SelectItem value="gemini-pro">Google Gemini - Pro (Comercial)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="api-key" className="text-sm font-semibold mb-2 block">API Key</Label>
                      <Input
                        id="api-key"
                        placeholder="Ej: sk-... o AIzaSy..."
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        type="password"
                        autoComplete="off"
                        data-testid="input-api-key"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Tu API key se guarda de forma segura</p>
                    </div>

                    <Button
                      onClick={() => {
                        if (!newProvider.trim() || !newApiKey.trim()) {
                          toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
                          return;
                        }
                        addAIProviderMutation.mutate({ provider: newProvider, apiKey: newApiKey });
                      }}
                      disabled={addAIProviderMutation.isPending}
                      className="w-full"
                      data-testid="button-add-ai-provider"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Proveedor
                    </Button>
                  </div>

                  {providers.length > 0 && (
                    <div className="pt-4 border-t border-border space-y-3">
                      <Label className="text-sm font-semibold">Proveedores Configurados:</Label>
                      {providers.map((provider: any) => {
                        let displayName = provider.provider;
                        if (provider.provider === "openai") displayName = "OpenAI (ChatGPT)";
                        if (provider.provider === "gemini-flash") displayName = "Google Gemini - Flash";
                        if (provider.provider === "gemini-pro") displayName = "Google Gemini - Pro";
                        
                        return (
                          <div key={provider.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                            <div className="flex items-center gap-2">
                              <Cpu className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-sm font-semibold">{displayName}</p>
                                <p className="text-xs text-muted-foreground">API Key: ***</p>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (window.confirm("¿Eliminar este proveedor?")) {
                                  deleteAIProviderMutation.mutate(provider.id);
                                }
                              }}
                              disabled={deleteAIProviderMutation.isPending}
                              data-testid={`button-delete-ai-${provider.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
