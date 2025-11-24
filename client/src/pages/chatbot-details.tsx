import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, MessageSquare, TrendingUp, Zap, Bot, ShoppingCart, Headphones, Users, Briefcase, Sparkles, MessageCircle, Power, Activity, Clock, Cpu, Plus, Trash2, Check, Wifi, Edit, AlertTriangle, Link2 } from "lucide-react";
import { KnowledgeBaseManager } from "./knowledge-base";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import type { Chatbot, WhatsappAccount, AIProvider } from "@shared/schema";

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
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
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
    queryKey: ["/api/chatbots", "id", chatbotId],
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
    queryKey: ["/api/chatbots", "id", chatbotId, "stats"],
    queryFn: async () => {
      if (!chatbotId) return null;
      const response = await fetch(`/api/chatbots/${chatbotId}/stats`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!chatbotId,
    refetchInterval: 5000,
  });

  const { data: aiProviders = [] } = useQuery<AIProvider[]>({
    queryKey: ["/api/ai-providers", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/ai-providers?userId=${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: chatbotProviders = [] } = useQuery({
    queryKey: ["/api/chatbots", "id", chatbotId, "ai-providers"],
    queryFn: async () => {
      if (!chatbotId) return [];
      const response = await fetch(`/api/chatbots/${chatbotId}/ai-providers`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!chatbotId,
  });

  const assignProviderMutation = useMutation({
    mutationFn: async (aiProviderId: string) => {
      return apiRequest("POST", `/api/chatbots/${chatbotId}/ai-providers`, { aiProviderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "id", chatbotId, "ai-providers"] });
      toast({ title: "Éxito", description: "Proveedor asignado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const unassignProviderMutation = useMutation({
    mutationFn: async (chatbotProviderId: string) => {
      return apiRequest("DELETE", `/api/chatbots/${chatbotId}/ai-providers/${chatbotProviderId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "id", chatbotId, "ai-providers"] });
      toast({ title: "Éxito", description: "Proveedor removido correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "id", chatbotId] });
      queryClient.refetchQueries({ queryKey: ["/api/chatbots", "id", chatbotId] });
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
      <div className="border-b border-border bg-background">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Top Navigation & Status */}
            <div className="flex items-center justify-between gap-8 mb-8">
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
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/10">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-foreground truncate">{chatbot.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1">Gestor de chatbot inteligente</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Badge variant={chatbotIsActive ? "default" : "secondary"} className="text-xs font-semibold whitespace-nowrap">
                  {chatbotIsActive ? "Activo" : "Inactivo"}
                </Badge>
                {linkedAccount && (
                  <Badge variant="outline" className="text-xs gap-1 whitespace-nowrap">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Conectado
                  </Badge>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-medium text-muted-foreground">Mensajes</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalMessages || 0}</p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <p className="text-xs font-medium text-muted-foreground">Automáticas</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats?.automatedResponses || 0}</p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <p className="text-xs font-medium text-muted-foreground">Satisfacción</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats?.satisfactionRate || 0}%</p>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-purple-500" />
                    <p className="text-xs font-medium text-muted-foreground">Tipo</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{chatbot.type === "recursos_humanos" ? "RRHH" : chatbot.type}</p>
                </div>
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
                        className="bg-background border-border/50 h-9"
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
                        className="bg-background border-border/50 resize-none text-xs"
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
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        <button
                          onClick={() => setChatbotAccountId(null)}
                          className={`px-3 py-2 rounded-md border flex flex-col items-center gap-1.5 transition-all flex-shrink-0 ${
                            chatbotAccountId === null
                              ? "border-primary bg-primary/10"
                              : "border-border/50 bg-muted/30 hover:border-primary/50"
                          }`}
                          data-testid="button-account-none"
                        >
                          <span className="text-xs font-semibold text-center">Sin vincular</span>
                        </button>
                        {accounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => setChatbotAccountId(account.id)}
                            className={`px-3 py-2 rounded-md border flex flex-col items-center gap-1.5 transition-all flex-shrink-0 ${
                              chatbotAccountId === account.id
                                ? "border-primary bg-primary/10"
                                : "border-border/50 bg-muted/30 hover:border-primary/50"
                            }`}
                            data-testid={`button-account-${account.id}`}
                          >
                            <span className="text-xs font-semibold text-center">{account.deviceName}</span>
                            <span className="text-xs text-muted-foreground/70 bg-background/50 px-2 py-0.5 rounded">{account.phoneNumber || "Sin número"}</span>
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
                  <p className="text-xs text-muted-foreground/70 mt-0.5">Asigna proveedores configurados a este chatbot</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {aiProviders.length === 0 ? (
                    <div className="p-4 bg-muted/30 rounded-md border border-dashed border-border/50 text-center">
                      <Zap className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1.5" />
                      <p className="text-sm text-muted-foreground/70">No hay proveedores configurados</p>
                      <p className="text-xs text-muted-foreground/50 mt-1">Ve a la sección "Proveedores de IA" para crear uno</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-semibold mb-2 block">Selecciona un proveedor</Label>
                        <div className="space-y-2">
                          {aiProviders.map((provider: AIProvider) => (
                            <div key={provider.id} className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors flex items-center justify-between bg-muted/20">
                              <div className="flex items-center gap-3 flex-1">
                                <Cpu className="w-4 h-4 text-primary" />
                                <div>
                                  <p className="text-sm font-semibold">{provider.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{provider.provider}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => assignProviderMutation.mutate(provider.id)}
                                disabled={assignProviderMutation.isPending || chatbotProviders.some(p => p.aiProviderId === provider.id)}
                                className="gap-2"
                                data-testid={`button-assign-provider-${provider.id}`}
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                {chatbotProviders.some(p => p.aiProviderId === provider.id) ? "Asignado" : "Asignar"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {chatbotProviders.length > 0 && (
                        <div className="pt-4 border-t border-border space-y-3">
                          <Label className="text-sm font-semibold">Proveedores Asignados:</Label>
                          {chatbotProviders.map((chatbotProvider: any) => {
                            const provider = aiProviders.find(p => p.id === chatbotProvider.aiProviderId);
                            if (!provider) return null;
                            return (
                              <div key={chatbotProvider.id} className="p-3 rounded-lg border border-border bg-primary/5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <div>
                                      <p className="text-sm font-semibold">{provider.name}</p>
                                      <p className="text-xs text-muted-foreground capitalize">{provider.provider}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => unassignProviderMutation.mutate(chatbotProvider.id)}
                                    disabled={unassignProviderMutation.isPending}
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    data-testid={`button-unassign-provider-${chatbotProvider.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
