import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Power, Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingChatbotId, setEditingChatbotId] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [chatbotName, setChatbotName] = useState("");
  const [chatbotDescription, setChatbotDescription] = useState("");
  const [chatbotWelcome, setChatbotWelcome] = useState("");
  const [chatbotAccountId, setChatbotAccountId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  // Fetch user's chatbots
  const { data: chatbots = [], isLoading } = useQuery<Chatbot[]>({
    queryKey: ["/api/chatbots", "userId", userId],
    enabled: !!userId,
    retry: 1,
  });

  // Fetch user's WhatsApp accounts
  const { data: accounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", "userId", userId],
    enabled: !!userId,
    retry: 1,
  });

  // Create chatbot mutation
  const createChatbotMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; welcomeMessage: string }) => {
      if (!userId) throw new Error("User not found");
      return apiRequest("POST", "/api/chatbots", {
        userId,
        whatsappAccountId: null,
        ...data,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "userId", userId] });
      toast({
        title: "Chatbot creado",
        description: "El nuevo chatbot se creó correctamente",
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

  // Update chatbot mutation
  const updateChatbotMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description: string; welcomeMessage: string; whatsappAccountId: string | null }) => {
      return apiRequest("PATCH", `/api/chatbots/${data.id}`, {
        name: data.name,
        description: data.description,
        welcomeMessage: data.welcomeMessage,
        whatsappAccountId: data.whatsappAccountId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", "userId", userId] });
      toast({
        title: "Actualizado",
        description: "La configuración se actualizó correctamente",
      });
      resetForm();
      setIsConfigModalOpen(false);
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
    setChatbotWelcome("");
    setChatbotAccountId(null);
    setEditingChatbotId(null);
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

  const handleEditChatbot = (chatbot: Chatbot) => {
    setChatbotName(chatbot.name);
    setChatbotDescription(chatbot.description || "");
    setChatbotWelcome(chatbot.welcomeMessage || "");
    setChatbotAccountId(chatbot.whatsappAccountId);
    setEditingChatbotId(chatbot.id);
    setIsConfigModalOpen(true);
  };

  const handleUpdateChatbot = () => {
    if (!chatbotName.trim() || !editingChatbotId) {
      toast({
        title: "Error",
        description: "El nombre del chatbot es requerido",
        variant: "destructive",
      });
      return;
    }
    updateChatbotMutation.mutate({
      id: editingChatbotId,
      name: chatbotName.trim(),
      description: chatbotDescription.trim(),
      welcomeMessage: chatbotWelcome.trim(),
      whatsappAccountId: chatbotAccountId,
    });
  };

  const filteredChatbots = chatbots.filter((chatbot) =>
    chatbot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chatbot.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const linkedAccount = chatbots.length > 0 && accounts.length > 0;

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
              <Button onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }} data-testid="button-create-chatbot" size="lg" className="gap-2">
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
                <Button onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }} data-testid="button-create-first-chatbot" size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  <span>Crear Primer Chatbot</span>
                </Button>
              </div>
            ) : filteredChatbots.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">No se encontraron chatbots</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChatbots.map((chatbot) => {
                  const linkedWAAccount = accounts.find((acc) => acc.id === chatbot.whatsappAccountId);
                  return (
                    <Card key={chatbot.id} className="hover-elevate overflow-hidden transition-all duration-200 flex flex-col" data-testid={`card-chatbot-${chatbot.id}`}>
                      {/* Header */}
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/5 dark:to-primary/10 px-6 py-4 border-b border-border">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-primary/20 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base text-foreground truncate">{chatbot.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{chatbot.description || "Sin descripción"}</p>
                            </div>
                          </div>
                          <Badge variant={chatbot.isActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                            {chatbot.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-4 flex-1 space-y-3">
                        {linkedWAAccount ? (
                          <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                              <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-emerald-900 dark:text-emerald-300">Vinculado a</p>
                              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 truncate">{linkedWAAccount.deviceName}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
                            <p className="text-xs font-medium text-amber-900 dark:text-amber-300">No vinculado</p>
                            <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">Asigna una cuenta de WhatsApp para activar este chatbot</p>
                          </div>
                        )}

                        {chatbot.welcomeMessage && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Mensaje de bienvenida</p>
                            <p className="text-xs text-foreground line-clamp-2 italic">{chatbot.welcomeMessage}</p>
                          </div>
                        )}
                      </CardContent>

                      {/* Footer */}
                      <div className="px-4 py-3 border-t border-border flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditChatbot(chatbot)}
                          data-testid={`button-edit-chatbot-${chatbot.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          <span>Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar el chatbot "${chatbot.name}"?`)) {
                              deleteChatbotMutation.mutate(chatbot.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-chatbot-${chatbot.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create Chatbot Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent data-testid="modal-create-chatbot">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Chatbot</DialogTitle>
            <DialogDescription>
              Configura los detalles básicos de tu nuevo chatbot. Podrás vincular un WhatsApp después.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-chatbot-name">Nombre *</Label>
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

      {/* Configure Chatbot Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent data-testid="modal-config-chatbot">
          <DialogHeader>
            <DialogTitle>Configurar Chatbot</DialogTitle>
            <DialogDescription>
              Edita los detalles y vincula una cuenta de WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-chatbot-name">Nombre *</Label>
              <Input
                id="edit-chatbot-name"
                value={chatbotName}
                onChange={(e) => setChatbotName(e.target.value)}
                data-testid="input-edit-chatbot-name"
              />
            </div>

            <div>
              <Label htmlFor="edit-chatbot-description">Descripción</Label>
              <Input
                id="edit-chatbot-description"
                value={chatbotDescription}
                onChange={(e) => setChatbotDescription(e.target.value)}
                data-testid="input-edit-chatbot-description"
              />
            </div>

            <div>
              <Label htmlFor="edit-whatsapp-account">Vincular WhatsApp</Label>
              <Select value={chatbotAccountId || "none"} onValueChange={(value) => setChatbotAccountId(value === "none" ? null : value)}>
                <SelectTrigger id="edit-whatsapp-account" data-testid="select-whatsapp-account">
                  <SelectValue placeholder="Selecciona una cuenta de WhatsApp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vincular</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.deviceName} {account.phoneNumber && `(${account.phoneNumber})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Selecciona una cuenta para activar este chatbot
              </p>
            </div>

            <div>
              <Label htmlFor="edit-welcome-message">Mensaje de Bienvenida</Label>
              <Textarea
                id="edit-welcome-message"
                value={chatbotWelcome}
                onChange={(e) => setChatbotWelcome(e.target.value)}
                rows={3}
                data-testid="textarea-edit-welcome-message"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfigModalOpen(false)}
              data-testid="button-cancel-config"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateChatbot}
              disabled={updateChatbotMutation.isPending || !chatbotName.trim()}
              data-testid="button-save-config"
            >
              {updateChatbotMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
