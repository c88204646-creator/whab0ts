import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, Bot, ArrowRight, Settings, Trash2, X, ShoppingCart, Headphones, Sparkles, Users, Zap, Briefcase, MessageCircle, Wifi, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Chatbot, WhatsappAccount } from "@shared/schema";

export default function ChatbotsPage() {
  const [, navigate] = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [chatbotName, setChatbotName] = useState("");
  const [chatbotDescription, setChatbotDescription] = useState("");
  const [chatbotAccountId, setChatbotAccountId] = useState<string | null>(null);
  const [chatbotType, setChatbotType] = useState("general");
  
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: chatbots = [], isLoading } = useQuery<Chatbot[]>({
    queryKey: ["/api/chatbots", "userId", userId],
    enabled: !!userId,
    retry: 1,
  });

  const { data: accounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", "userId", userId],
    enabled: !!userId,
    retry: 1,
  });

  const createChatbotMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; type: string }) => {
      if (!userId) throw new Error("User not found");
      return apiRequest("POST", "/api/chatbots", {
        userId,
        whatsappAccountId: null,
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "userId", userId] });
      toast({
        title: "Chatbot creado",
        description: "Abre el panel de control para configurarlo",
      });
      resetForm();
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el chatbot",
        variant: "destructive",
      });
    },
  });

  const updateChatbotMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description: string; whatsappAccountId: string | null }) => {
      return apiRequest("PATCH", `/api/chatbots/${data.id}`, {
        name: data.name,
        description: data.description,
        whatsappAccountId: data.whatsappAccountId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "userId", userId] });
      toast({
        title: "Actualizado",
        description: "La configuración se guardó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el chatbot",
        variant: "destructive",
      });
    },
  });

  const deleteChatbotMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/chatbots/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "userId", userId] });
      toast({
        title: "Eliminado",
        description: "El chatbot se eliminó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el chatbot",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setChatbotName("");
    setChatbotDescription("");
    setChatbotAccountId(null);
    setChatbotType("general");
  };

  const handleCreateChatbot = () => {
    if (!chatbotName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del chatbot es requerido",
        variant: "destructive",
      });
      return;
    }
    createChatbotMutation.mutate({
      name: chatbotName.trim(),
      description: chatbotDescription.trim(),
      type: chatbotType,
    });
  };

  const handleOpenConfigPanel = (chatbotId: string) => {
    const chatbot = chatbots.find((c) => c.id === chatbotId);
    if (chatbot) {
      setChatbotName(chatbot.name);
      setChatbotDescription(chatbot.description || "");
      setChatbotAccountId(chatbot.whatsappAccountId);
      setSelectedChatbotId(chatbotId);
      setIsConfigPanelOpen(true);
    }
  };

  const handleSaveConfig = () => {
    if (!chatbotName.trim() || !selectedChatbotId) {
      toast({
        title: "Error",
        description: "El nombre del chatbot es requerido",
        variant: "destructive",
      });
      return;
    }
    updateChatbotMutation.mutate({
      id: selectedChatbotId,
      name: chatbotName.trim(),
      description: chatbotDescription.trim(),
      whatsappAccountId: chatbotAccountId,
    });
  };

  const filteredChatbots = chatbots.filter((chatbot) =>
    chatbot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chatbot.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) {
    return <div className="flex items-center justify-center h-full bg-background"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Chatbots</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Crea y gestiona chatbots independientes para automatizar tus respuestas
                </p>
              </div>
              <Button 
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }} 
                data-testid="button-create-chatbot" 
                size="lg" 
                className="gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nuevo Chatbot</span>
              </Button>
            </div>

            <div className="relative max-w-sm">
              <input
                placeholder="Buscar chatbots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 h-10 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-search-chatbots"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chatbots Grid */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredChatbots.length === 0 && !searchQuery ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-primary/10 dark:bg-primary/5 rounded-full flex items-center justify-center mb-6">
                  <Bot className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">No hay chatbots aún</h3>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Crea tu primer chatbot independiente y después vincúlalo a una cuenta de WhatsApp
                </p>
                <Button 
                  onClick={() => {
                    resetForm();
                    setIsCreateModalOpen(true);
                  }} 
                  data-testid="button-create-first-chatbot" 
                  size="lg" 
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crear Primer Chatbot</span>
                </Button>
              </div>
            ) : filteredChatbots.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">No se encontraron chatbots</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredChatbots.map((chatbot) => {
                  const linkedWAAccount = accounts.find((acc) => acc.id === chatbot.whatsappAccountId);
                  
                  const typeConfig: Record<string, { icon: any; gradient: string; label: string }> = {
                    general: { icon: Bot, gradient: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/5 dark:to-blue-600/10", label: "General" },
                    ventas: { icon: ShoppingCart, gradient: "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/5 dark:to-emerald-600/10", label: "Ventas" },
                    soporte: { icon: Headphones, gradient: "from-purple-500/10 to-purple-600/5 dark:from-purple-500/5 dark:to-purple-600/10", label: "Soporte" },
                    asistencia: { icon: Users, gradient: "from-orange-500/10 to-orange-600/5 dark:from-orange-500/5 dark:to-orange-600/10", label: "Asistencia" },
                    marketing: { icon: Zap, gradient: "from-amber-500/10 to-amber-600/5 dark:from-amber-500/5 dark:to-amber-600/10", label: "Marketing" },
                    recursos_humanos: { icon: Briefcase, gradient: "from-pink-500/10 to-pink-600/5 dark:from-pink-500/5 dark:to-pink-600/10", label: "RRHH" },
                  };
                  
                  const config = typeConfig[chatbot.type] || typeConfig.general;
                  const TypeIcon = config.icon;
                  
                  return (
                    <Card key={chatbot.id} className="hover-elevate overflow-hidden transition-all duration-300 flex flex-col h-full border border-border/50 hover:border-border" data-testid={`card-chatbot-${chatbot.id}`}>
                      {/* Header con gradient */}
                      <div className={`bg-gradient-to-br ${config.gradient} px-3 py-2.5 border-b border-border/50 relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-5">
                          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary blur-3xl" />
                        </div>
                        
                        <div className="relative flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 dark:from-primary/20 dark:to-primary/5 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <TypeIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xs text-foreground truncate">{chatbot.name}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{chatbot.description || "Sin descripción"}</p>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              chatbot.isActive 
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${chatbot.isActive ? "bg-emerald-500" : "bg-slate-500"}`} />
                              {chatbot.isActive ? "Activo" : "Inactivo"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-2.5 flex-1 flex flex-col gap-2">
                        {/* WhatsApp Status */}
                        <div className="flex-1">
                          {linkedWAAccount ? (
                            <div className="flex items-center gap-2 p-2 bg-emerald-50/50 dark:bg-emerald-950/20 rounded border border-emerald-200/50 dark:border-emerald-800/30">
                              <div className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/40">
                                <Wifi className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-emerald-900 dark:text-emerald-200 truncate">{linkedWAAccount.deviceName}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded border border-amber-200/50 dark:border-amber-800/30">
                              <div className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-900/40">
                                <MessageCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              </div>
                              <p className="text-[10px] font-semibold text-amber-900 dark:text-amber-200">Sin vincular</p>
                            </div>
                          )}
                        </div>
                      </CardContent>

                      {/* Footer Actions */}
                      <div className="px-2.5 py-2 border-t border-border/50 flex gap-1.5 bg-background/50">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 gap-1 h-7 text-xs"
                          onClick={() => navigate(`/chatbots/${chatbot.id}`)}
                          data-testid={`button-config-chatbot-${chatbot.id}`}
                        >
                          <Settings className="w-3 h-3" />
                          <span className="hidden sm:inline">Conf</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-1.5 h-7"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar el chatbot "${chatbot.name}"?`)) {
                              deleteChatbotMutation.mutate(chatbot.id);
                            }
                          }}
                          data-testid={`button-delete-chatbot-${chatbot.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Nuevo Chatbot</h2>
                <p className="text-sm text-muted-foreground mt-1">Información básica del chatbot</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(false);
                }}
                data-testid="button-close-create"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="modal-name">Nombre *</Label>
                <Input
                  id="modal-name"
                  placeholder="Ej: Soporte, Ventas"
                  value={chatbotName}
                  onChange={(e) => setChatbotName(e.target.value)}
                  data-testid="input-modal-name"
                />
              </div>

              <div>
                <Label htmlFor="modal-description">Descripción</Label>
                <Input
                  id="modal-description"
                  placeholder="¿Qué hace este chatbot?"
                  value={chatbotDescription}
                  onChange={(e) => setChatbotDescription(e.target.value)}
                  data-testid="input-modal-description"
                />
              </div>

              <div>
                <Label>Tipo de Chatbot</Label>
                <div className="overflow-x-auto mt-3 pb-2">
                  <div className="flex gap-2 min-w-min">
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
                        className={`px-3 py-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all flex-shrink-0 ${
                          chatbotType === value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-testid={`button-type-${value}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium whitespace-nowrap">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Desliza para seleccionar el tipo de chatbot
                </p>
              </div>
            </CardContent>

            <div className="p-6 border-t border-border flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(false);
                }}
                className="flex-1"
                data-testid="button-cancel-create"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateChatbot}
                disabled={createChatbotMutation.isPending || !chatbotName.trim()}
                className="flex-1"
                data-testid="button-save-create"
              >
                {createChatbotMutation.isPending ? "Creando..." : "Crear"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Config Panel */}
      {isConfigPanelOpen && selectedChatbotId && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/50" onClick={() => setIsConfigPanelOpen(false)} />
          <div className="w-full md:w-2/5 bg-background border-l border-border flex flex-col animation-in slide-in-from-right">
            <div className="border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Panel de Control</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsConfigPanelOpen(false)}
                data-testid="button-close-config"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="panel-name">Nombre *</Label>
                    <Input
                      id="panel-name"
                      value={chatbotName}
                      onChange={(e) => setChatbotName(e.target.value)}
                      data-testid="input-panel-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="panel-description">Descripción</Label>
                    <Input
                      id="panel-description"
                      value={chatbotDescription}
                      onChange={(e) => setChatbotDescription(e.target.value)}
                      data-testid="input-panel-description"
                    />
                  </div>

                  <div className="p-3 bg-muted/50 rounded text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Próximamente:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Base de conocimientos</li>
                      <li>• Respuestas automáticas</li>
                      <li>• Reglas avanzadas</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="whatsapp" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="panel-account">Vincular WhatsApp</Label>
                    <Select value={chatbotAccountId || "none"} onValueChange={(value) => setChatbotAccountId(value === "none" ? null : value)}>
                      <SelectTrigger id="panel-account" data-testid="select-panel-account">
                        <SelectValue placeholder="Selecciona una cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin vincular</SelectItem>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.deviceName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Este chatbot respondará en la cuenta seleccionada
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="border-t border-border p-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsConfigPanelOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveConfig}
                disabled={updateChatbotMutation.isPending}
                className="flex-1"
                data-testid="button-save-panel-config"
              >
                {updateChatbotMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
