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
  <div className="px-4 py-3 bg-card border border-border/50 rounded-lg hover-elevate transition-all">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide leading-tight">{label}</p>
      </div>
      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
    </div>
    <p className="text-sm font-bold uppercase text-foreground">{value}</p>
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
      <div className="border-b border-border/50 bg-card sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            {/* Top Navigation & Status */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 flex-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/chatbots")} 
                  data-testid="button-back-chatbots" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg font-bold text-foreground truncate">{chatbot.name}</h1>
                      <p className="text-xs text-muted-foreground/70">Gestor de chatbot inteligente</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <Badge variant={chatbotIsActive ? "default" : "secondary"} className="text-xs font-semibold px-2.5 py-0.5 whitespace-nowrap">
                  {chatbotIsActive ? "Activo" : "Inactivo"}
                </Badge>
                {linkedAccount && (
                  <Badge variant="outline" className="text-xs gap-1 px-2.5 py-0.5 whitespace-nowrap">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Conectado
                  </Badge>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
      <div className="px-4 py-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 bg-muted/50 p-1 border border-border/50">
              <TabsTrigger value="general" className="gap-2 text-xs sm:text-sm" data-testid="tab-general">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-2 text-xs sm:text-sm" data-testid="tab-whatsapp">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2 text-xs sm:text-sm" data-testid="tab-knowledge">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Base</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2 text-xs sm:text-sm" data-testid="tab-ai">
                <Cpu className="w-4 h-4" />
                <span className="hidden sm:inline">IA</span>
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-3">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="detail-name" className="text-xs font-semibold text-foreground">
                        Nombre
                      </Label>
                      <Input
                        id="detail-name"
                        placeholder="Nombre del chatbot"
                        value={chatbotName}
                        onChange={(e) => setChatbotName(e.target.value)}
                        data-testid="input-detail-name"
                        className="bg-muted/50 border-border/50 h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="detail-description" className="text-xs font-semibold text-foreground">
                        Descripción
                      </Label>
                      <Textarea
                        id="detail-description"
                        placeholder="Describe el propósito y funciones del chatbot"
                        value={chatbotDescription}
                        onChange={(e) => setChatbotDescription(e.target.value)}
                        data-testid="input-detail-description"
                        rows={2}
                        className="bg-muted/50 border-border/50 resize-none text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                        className={`px-2 py-2 rounded-md border flex flex-col items-center gap-1.5 transition-all text-center ${
                          chatbotType === value
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/50 bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                        }`}
                        data-testid={`button-type-${value}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="border-border/50">
                  <CardHeader className="pb-2 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Power className="w-3.5 h-3.5 text-primary" />
                      </div>
                      Estado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground/70">
                        {chatbotIsActive ? "Activo" : "Pausado"}
                      </p>
                    </div>
                    <Switch
                      checked={chatbotIsActive}
                      onCheckedChange={setChatbotIsActive}
                      data-testid="toggle-chatbot-active"
                    />
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader className="pb-2 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Cpu className="w-3.5 h-3.5 text-primary" />
                      </div>
                      Respuestas IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground/70">
                        {useAIResponses ? "Activada" : "Desactivada"}
                      </p>
                    </div>
                    <Switch
                      checked={useAIResponses}
                      onCheckedChange={setUseAIResponses}
                      data-testid="toggle-use-ai-responses"
                    />
                  </CardContent>
                </Card>
              </div>

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
            <TabsContent value="whatsapp" className="space-y-3">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    </div>
                    Conexión WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {accountsLoading ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">Cargando cuentas...</p>
                    ) : accounts.length === 0 ? (
                      <div className="p-4 bg-muted/30 rounded-md border border-border/50 text-center">
                        <MessageCircle className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1.5" />
                        <p className="text-sm text-muted-foreground/70">No hay cuentas de WhatsApp</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">Crea una en la sección de Conexiones</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => setChatbotAccountId(null)}
                          className={`w-full p-4 rounded-md border text-left transition-all ${
                            chatbotAccountId === null
                              ? "border-primary bg-primary/10"
                              : "border-border/50 bg-muted/30 hover:border-primary/50"
                          }`}
                          data-testid="button-account-none"
                        >
                          <div className="font-semibold text-sm text-foreground">Sin vincular</div>
                          <div className="text-xs text-muted-foreground/70">El chatbot no usará WhatsApp</div>
                        </button>
                        {accounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => setChatbotAccountId(account.id)}
                            className={`w-full p-4 rounded-md border text-left transition-all ${
                              chatbotAccountId === account.id
                                ? "border-primary bg-primary/10"
                                : "border-border/50 bg-muted/30 hover:border-primary/50"
                            }`}
                            data-testid={`button-account-${account.id}`}
                          >
                            <div className="font-semibold text-sm text-foreground">{account.deviceName}</div>
                            <div className="text-xs text-muted-foreground/70">{account.phoneNumber || "Sin número asignado"}</div>
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
            <TabsContent value="ai" className="space-y-3">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <Cpu className="w-3.5 h-3.5 text-primary" />
                    </div>
                    Proveedores de Inteligencia Artificial
                  </CardTitle>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">Configura tus API keys para servicios de IA</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-semibold mb-1.5 block">Proveedor</Label>
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
                      <Label htmlFor="api-key" className="text-xs font-semibold mb-1.5 block">API Key</Label>
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
