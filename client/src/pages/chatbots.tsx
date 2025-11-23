import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, Bot, Settings, Trash2, X, ShoppingCart, Headphones, Sparkles, Users, Zap, Briefcase, MessageCircle, Eye, Pause, Play, Check, Wifi } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Chatbot, WhatsappAccount } from "@shared/schema";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

const resetForm = (setChatbotName: any, setChatbotDesc: any, setChatbotType: any) => {
  setChatbotName("");
  setChatbotDesc("");
  setChatbotType("general");
};

export default function ChatbotsPage() {
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [chatbotName, setChatbotName] = useState("");
  const [chatbotDescription, setChatbotDescription] = useState("");
  const [chatbotAccountId, setChatbotAccountId] = useState<string | null>(null);
  const [chatbotType, setChatbotType] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleOpenModal = () => {
    resetForm(setChatbotName, setChatbotDescription, setChatbotType);
    setShowNewForm(true);
  };

  const handleCloseModal = () => {
    setShowNewForm(false);
    resetForm(setChatbotName, setChatbotDescription, setChatbotType);
  };

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
    queryKey: [`/api/whatsapp-accounts?userId=${userId}`],
    enabled: !!userId,
    retry: 1,
  });

  const createChatbotMutation = useMutation({
    mutationFn: async (data: any) => {
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
      queryClient.refetchQueries({ queryKey: ["/api/chatbots", "userId", userId] });
      toast({
        title: "Chatbot creado",
        description: "El chatbot se creó exitosamente",
      });
      resetForm(setChatbotName, setChatbotDescription, setChatbotType);
      setShowNewForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el chatbot",
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
      queryClient.refetchQueries({ queryKey: ["/api/chatbots", "userId", userId] });
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

  const toggleChatbotMutation = useMutation({
    mutationFn: async (id: string) => {
      const chatbot = chatbots.find(c => c.id === id);
      if (!chatbot) throw new Error("Chatbot no encontrado");
      return apiRequest("PATCH", `/api/chatbots/${id}`, {
        isActive: !chatbot.isActive,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "userId", userId] });
      queryClient.refetchQueries({ queryKey: ["/api/chatbots", "userId", userId] });
      toast({
        title: data.isActive ? "Chatbot activado" : "Chatbot pausado",
        description: data.isActive ? "El chatbot está activo" : "El chatbot está pausado",
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


  const filteredChatbots = chatbots.filter((chatbot) =>
    chatbot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chatbot.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) {
    return <LoadingSpinner />;
  }

  const activeChatbots = chatbots.filter(c => c.isActive).length;
  const connectedChatbots = chatbots.filter(c => c.whatsappAccountId).length;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Chatbots</h1>
                    <p className="text-xs text-muted-foreground">Crea y gestiona chatbots inteligentes para automatizar respuestas</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleOpenModal} data-testid="button-create-chatbot" size="sm" className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo chatbot</span>
              </Button>
            </div>

            {chatbots.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total" value={chatbots.length} icon={Bot} />
                <StatCard label="Activos" value={activeChatbots} icon={Check} />
                <StatCard label="Conectados" value={connectedChatbots} icon={Wifi} />
                <StatCard label="Pausados" value={chatbots.length - activeChatbots} icon={Pause} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <div className="relative w-full">
              <Input
                placeholder="Buscar chatbots por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-chatbots"
              />
            </div>
          </div>

          {chatbots.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No hay chatbots aún</p>
                <p className="text-sm text-muted-foreground mt-2">Crea tu primer chatbot para comenzar</p>
              </CardContent>
            </Card>
          ) : filteredChatbots.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No se encontraron chatbots</p>
                <p className="text-sm text-muted-foreground mt-2">Intenta ajustar tu búsqueda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Chatbot</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Descripción</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">WhatsApp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChatbots.map((chatbot: any, idx: number) => {
                    const isDeleting = deleteChatbotMutation.isPending && deleteChatbotMutation.variables === chatbot.id;
                    return (
                      <tr 
                        key={chatbot.id}
                        onClick={() => navigate(`/chatbots/${chatbot.id}`)}
                        className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${
                          idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                        }`}
                        data-testid={`row-chatbot-${chatbot.id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/20 text-xs font-semibold">
                                {chatbot.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-semibold text-sm text-foreground">{chatbot.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-muted-foreground truncate">
                            {chatbot.description || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-medium text-foreground capitalize">
                            {chatbot.type === "recursos_humanos" ? "RRHH" : chatbot.type}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            chatbot.whatsappAccountId
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {chatbot.whatsappAccountId ? 'Conectado' : 'Sin conectar'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            chatbot.isActive 
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {chatbot.isActive ? 'Activo' : 'Pausado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              onClick={() => navigate(`/chatbots/${chatbot.id}`)}
                              className="h-8 gap-1"
                              data-testid={`button-view-chatbot-${chatbot.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline text-xs">Ver</span>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigate(`/chatbots/${chatbot.id}`)}
                              className="h-8 w-8 p-0"
                              data-testid={`button-configure-chatbot-${chatbot.id}`}
                              title="Configurar"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleChatbotMutation.mutate(chatbot.id)}
                              className="h-8 w-8 p-0"
                              title={chatbot.isActive ? 'Pausar' : 'Activar'}
                              data-testid={`button-toggle-chatbot-${chatbot.id}`}
                            >
                              {chatbot.isActive ? (
                                <Pause className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Play className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar el chatbot "${chatbot.name}"?`)) {
                                  deleteChatbotMutation.mutate(chatbot.id);
                                }
                              }}
                              disabled={isDeleting}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              data-testid={`button-delete-chatbot-${chatbot.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showNewForm && (
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
                onClick={handleCloseModal}
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
                  autoFocus
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="modal-description">Descripción</Label>
                <Textarea
                  id="modal-description"
                  placeholder="¿Qué hace este chatbot?"
                  value={chatbotDescription}
                  onChange={(e) => setChatbotDescription(e.target.value)}
                  data-testid="input-modal-description"
                  rows={3}
                  className="mt-2"
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
              </div>
            </CardContent>

            <div className="p-6 border-t border-border flex gap-2">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1"
                data-testid="button-cancel-create"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!chatbotName.trim()) {
                    toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
                    return;
                  }
                  createChatbotMutation.mutate({
                    name: chatbotName,
                    description: chatbotDescription,
                    type: chatbotType,
                  });
                }}
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

    </div>
  );
}
