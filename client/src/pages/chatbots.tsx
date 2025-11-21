import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Power, Bot, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Chatbot, ChatbotRule } from "@shared/schema";

export default function ChatbotsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isEditingChatbot, setIsEditingChatbot] = useState(false);
  
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeChatbotId, setActiveChatbotId] = useState<string | null>(null);
  
  const [chatbotName, setChatbotName] = useState("");
  const [chatbotDescription, setChatbotDescription] = useState("");
  const [chatbotWelcome, setChatbotWelcome] = useState("");
  const [trigger, setTrigger] = useState("");
  const [response, setResponse] = useState("");
  
  const { toast } = useToast();

  // Get active account from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accountId = params.get("accountId");
    if (accountId) {
      setActiveAccountId(accountId);
    }
  }, []);

  // Fetch chatbots
  const { data: chatbots = [] } = useQuery<Chatbot[]>({
    queryKey: ["/api/chatbots", "accountId", activeAccountId],
    enabled: !!activeAccountId,
    retry: 1,
  });

  // Auto-select first chatbot if none selected
  useEffect(() => {
    if (chatbots.length > 0 && !activeChatbotId) {
      setActiveChatbotId(chatbots[0].id);
    }
  }, [chatbots, activeChatbotId]);

  // Get active chatbot data
  const activeChatbot = chatbots.find(c => c.id === activeChatbotId);

  // Populate form when chatbot changes
  useEffect(() => {
    if (activeChatbot) {
      setChatbotName(activeChatbot.name);
      setChatbotDescription(activeChatbot.description || "");
      setChatbotWelcome(activeChatbot.welcomeMessage || "");
    }
  }, [activeChatbot]);

  // Fetch rules for active chatbot
  const { data: rules = [] } = useQuery<ChatbotRule[]>({
    queryKey: ["/api/chatbot-rules", "chatbotId", activeChatbotId],
    enabled: !!activeChatbotId,
    retry: 1,
  });

  // Create chatbot mutation
  const createChatbotMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; welcomeMessage: string }) => {
      if (!activeAccountId) throw new Error("Account not selected");
      return apiRequest("POST", "/api/chatbots", {
        whatsappAccountId: activeAccountId,
        ...data,
        isActive: true,
      });
    },
    onSuccess: (newChatbot) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "accountId", activeAccountId] });
      setActiveChatbotId(newChatbot.id);
      toast({
        title: "Chatbot creado",
        description: "El nuevo chatbot se creó correctamente",
      });
      resetChatbotForm();
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

  // Update chatbot mutation
  const updateChatbotMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; welcomeMessage: string }) => {
      if (!activeChatbotId) throw new Error("Chatbot not selected");
      return apiRequest("PATCH", `/api/chatbots/${activeChatbotId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "accountId", activeAccountId] });
      toast({
        title: "Actualizado",
        description: "La configuración se actualizó correctamente",
      });
      setIsEditingChatbot(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el chatbot",
        variant: "destructive",
      });
    },
  });

  // Delete chatbot mutation
  const deleteChatbotMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/chatbots/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "accountId", activeAccountId] });
      setActiveChatbotId(null);
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

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: { chatbotId: string; trigger: string; response: string }) => {
      return apiRequest("POST", "/api/chatbot-rules", {
        ...data,
        isActive: true,
        priority: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot-rules", "chatbotId", activeChatbotId] });
      toast({
        title: "Regla creada",
        description: "La regla se creó correctamente",
      });
      setTrigger("");
      setResponse("");
      setIsRuleModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la regla",
        variant: "destructive",
      });
    },
  });

  const resetChatbotForm = () => {
    setChatbotName("");
    setChatbotDescription("");
    setChatbotWelcome("");
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
      welcomeMessage: chatbotWelcome.trim(),
    });
  };

  const handleUpdateChatbot = () => {
    if (!chatbotName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del chatbot es requerido",
        variant: "destructive",
      });
      return;
    }
    updateChatbotMutation.mutate({
      name: chatbotName.trim(),
      description: chatbotDescription.trim(),
      welcomeMessage: chatbotWelcome.trim(),
    });
  };

  const handleAddRule = () => {
    if (!activeChatbotId) return;
    if (!trigger.trim() || !response.trim()) {
      toast({
        title: "Error",
        description: "Completa todos los campos",
        variant: "destructive",
      });
      return;
    }
    createRuleMutation.mutate({
      chatbotId: activeChatbotId,
      trigger: trigger.trim(),
      response: response.trim(),
    });
  };

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Chatbots</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea y configura chatbots independientes para tus conversaciones
            </p>
          </div>
          <Button onClick={() => {
            resetChatbotForm();
            setIsCreateModalOpen(true);
          }} data-testid="button-create-chatbot">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Chatbot
          </Button>
        </div>

        {/* Chatbots list - horizontal tabs */}
        {chatbots.length > 0 && (
          <Tabs value={activeChatbotId || ""} onValueChange={setActiveChatbotId}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {chatbots.map((chatbot) => (
                <TabsTrigger key={chatbot.id} value={chatbot.id} data-testid={`tab-chatbot-${chatbot.id}`}>
                  <Bot className="w-4 h-4 mr-2" />
                  {chatbot.name}
                  {chatbot.isActive ? (
                    <Badge className="ml-2 h-2 w-2 rounded-full bg-emerald-500 p-0" />
                  ) : (
                    <Badge variant="secondary" className="ml-2 h-2 w-2 rounded-full p-0" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {!activeChatbot ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No hay chatbots</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Crea tu primer chatbot para comenzar a automatizar tus respuestas
              </p>
              <Button onClick={() => {
                resetChatbotForm();
                setIsCreateModalOpen(true);
              }} data-testid="button-create-first-chatbot">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Chatbot
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Chatbot Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{activeChatbot.name}</CardTitle>
                  <CardDescription>
                    Configuración independiente de este chatbot
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingChatbot(!isEditingChatbot)}
                    data-testid="button-edit-chatbot"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {isEditingChatbot ? "Cancelar" : "Editar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el chatbot "${activeChatbot.name}"?`)) {
                        deleteChatbotMutation.mutate(activeChatbot.id);
                      }
                    }}
                    data-testid="button-delete-chatbot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="chatbot-name">Nombre del Chatbot</Label>
                <Input
                  id="chatbot-name"
                  value={chatbotName}
                  onChange={(e) => setChatbotName(e.target.value)}
                  placeholder="Ej: Soporte Técnico"
                  disabled={!isEditingChatbot}
                  data-testid="input-chatbot-name"
                />
              </div>

              <div>
                <Label htmlFor="chatbot-description">Descripción</Label>
                <Input
                  id="chatbot-description"
                  value={chatbotDescription}
                  onChange={(e) => setChatbotDescription(e.target.value)}
                  placeholder="Describe qué hace este chatbot"
                  disabled={!isEditingChatbot}
                  data-testid="input-chatbot-description"
                />
              </div>

              <div>
                <Label htmlFor="welcome-message">Mensaje de Bienvenida</Label>
                <Textarea
                  id="welcome-message"
                  value={chatbotWelcome}
                  onChange={(e) => setChatbotWelcome(e.target.value)}
                  placeholder="Escribe el mensaje que se enviará cuando alguien inicie una conversación..."
                  disabled={!isEditingChatbot}
                  data-testid="textarea-welcome-message"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Este mensaje se enviará automáticamente al recibir el primer contacto
                </p>
              </div>
            </CardContent>

            {isEditingChatbot && (
              <CardFooter>
                <Button
                  onClick={handleUpdateChatbot}
                  disabled={updateChatbotMutation.isPending}
                  data-testid="button-save-chatbot"
                >
                  {updateChatbotMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Rules Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reglas de Respuesta Automática</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" data-testid="badge-rules-count">
                  {rules?.length || 0} reglas
                </Badge>
                <Button
                  size="sm"
                  onClick={() => setIsRuleModalOpen(true)}
                  data-testid="button-add-rule"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Regla
                </Button>
              </div>
            </div>

            {!rules || rules.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay reglas configuradas</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                    Crea reglas para responder automáticamente cuando los usuarios envíen palabras clave específicas
                  </p>
                  <Button onClick={() => setIsRuleModalOpen(true)} data-testid="button-add-first-rule">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Regla
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.map((rule) => (
                  <Card key={rule.id} className="hover-elevate" data-testid={`card-rule-${rule.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {rule.trigger}
                          </Badge>
                          {rule.isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Activa
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactiva</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {rule.response}
                        </p>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Chatbot Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent data-testid="modal-create-chatbot">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Chatbot</DialogTitle>
            <DialogDescription>
              Configura los detalles básicos de tu nuevo chatbot
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-chatbot-name">Nombre</Label>
              <Input
                id="new-chatbot-name"
                placeholder="Ej: Soporte, Ventas, etc"
                value={chatbotName}
                onChange={(e) => setChatbotName(e.target.value)}
                data-testid="input-new-chatbot-name"
              />
            </div>

            <div>
              <Label htmlFor="new-chatbot-description">Descripción</Label>
              <Input
                id="new-chatbot-description"
                placeholder="Describe el propósito de este chatbot"
                value={chatbotDescription}
                onChange={(e) => setChatbotDescription(e.target.value)}
                data-testid="input-new-chatbot-description"
              />
            </div>

            <div>
              <Label htmlFor="new-chatbot-welcome">Mensaje de Bienvenida</Label>
              <Textarea
                id="new-chatbot-welcome"
                placeholder="Mensaje que se enviará al iniciar conversación"
                value={chatbotWelcome}
                onChange={(e) => setChatbotWelcome(e.target.value)}
                rows={3}
                data-testid="textarea-new-chatbot-welcome"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateChatbot}
              disabled={createChatbotMutation.isPending || !chatbotName.trim()}
              data-testid="button-save-create"
            >
              {createChatbotMutation.isPending ? "Creando..." : "Crear Chatbot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rule Modal */}
      <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <DialogContent data-testid="modal-add-rule">
          <DialogHeader>
            <DialogTitle>Nueva Regla de Respuesta</DialogTitle>
            <DialogDescription>
              Configura una palabra clave y la respuesta automática para {activeChatbot?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="trigger">Palabra Clave (Trigger)</Label>
              <Input
                id="trigger"
                placeholder="Ej: hola, precio, horario"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                data-testid="input-trigger"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El chatbot responderá cuando detecte esta palabra
              </p>
            </div>

            <div>
              <Label htmlFor="response">Respuesta Automática</Label>
              <Textarea
                id="response"
                placeholder="Escribe la respuesta que se enviará..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
                data-testid="textarea-response"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRuleModalOpen(false)}
              data-testid="button-cancel-rule"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddRule}
              disabled={createRuleMutation.isPending || !trigger.trim() || !response.trim()}
              data-testid="button-save-rule"
            >
              {createRuleMutation.isPending ? "Guardando..." : "Guardar Regla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
