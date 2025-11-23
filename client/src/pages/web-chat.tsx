import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, ExternalLink, Code, Globe, Eye, EyeOff, BarChart3, Check, MonitorPlay, Pause, Play, Edit2, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { WebChatWidget } from "@/components/web-chat-widget";
import type { WebChat } from "@shared/schema";

interface ChatbotOption {
  id: string;
  name: string;
}

export default function WebChatPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [chatbots, setChatbots] = useState<ChatbotOption[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState<string | null>(null);
  const [previewChatId, setPreviewChatId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    chatbotId: "",
    websiteUrl: "",
    customColor: "#3b82f6",
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) setUserId(user.id);
  }, []);

  const { data: webChats = [] } = useQuery<WebChat[]>({
    queryKey: ["/api/web-chats", userId],
    queryFn: async () => {
      const response = await fetch(`/api/web-chats?userId=${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: chatbotList } = useQuery<ChatbotOption[]>({
    queryKey: ["/api/chatbots", userId],
    queryFn: async () => {
      const response = await fetch(`/api/chatbots?userId=${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (chatbotList) {
      setChatbots(chatbotList);
    }
  }, [chatbotList]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/web-chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error creando live chat");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/web-chats", userId] });
      setFormData({ name: "", chatbotId: "", websiteUrl: "", customColor: "#3b82f6" });
      setShowNewForm(false);
      toast({ title: "Live Chat creado exitosamente" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/web-chats/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando live chat");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/web-chats", userId] });
      toast({ title: "Live Chat eliminado" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const chat = webChats.find(c => c.id === id);
      if (!chat) throw new Error("Chat no encontrado");
      const response = await fetch(`/api/web-chats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !chat.isActive }),
      });
      if (!response.ok) throw new Error("Error actualizando live chat");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/web-chats", userId] });
      toast({ title: data.isActive ? "Live Chat activado" : "Live Chat desactivado" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; websiteUrl: string; customColor: string }) => {
      const response = await fetch(`/api/web-chats/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, websiteUrl: data.websiteUrl, customColor: data.customColor }),
      });
      if (!response.ok) throw new Error("Error actualizando live chat");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/web-chats", userId] });
      toast({ title: "Live Chat actualizado" });
      setEditingId(null);
    },
  });

  const handleCopyEmbed = (embedCode: string) => {
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Código copiado al portapapeles" });
  };

  const generateEmbedCode = (chatId: string, chatbotId: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    return `<!-- WhatsApp CRM Live Chat Widget -->
<script>
(function() {
  const script = document.createElement('script');
  script.src = '${baseUrl}/widget.js?chatId=${chatId}&chatbotId=${chatbotId}';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`;
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.chatbotId) {
      toast({ title: "Error", description: "Nombre y Chatbot son requeridos", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      userId,
      name: formData.name,
      chatbotId: formData.chatbotId,
      websiteUrl: formData.websiteUrl || null,
      customColor: formData.customColor,
      isActive: true,
    });
  };

  if (!userId) return <div className="flex items-center justify-center h-full">Cargando...</div>;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Add Button */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Live Chat Web</h1>
                <p className="text-xs text-muted-foreground/80">Incrusta tu chatbot en tu sitio web</p>
              </div>
            </div>

            <Button onClick={() => window.location.href = "/web-chat-create"} data-testid="button-create-webchat" className="gap-2 h-9">
              <Plus className="w-4 h-4" />
              <span>Crear Live Chat</span>
            </Button>
          </div>

          {/* Metrics Row */}
          {webChats.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{webChats.length}</p>
              </div>

              <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-muted-foreground font-medium">Activos</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{webChats.filter(w => w.isActive).length}</p>
              </div>

              <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <p className="text-xs text-muted-foreground font-medium">Inactivos</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{webChats.filter(w => !w.isActive).length}</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar live chats por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
              data-testid="input-search-webchats"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Web Chats Grid */}
          {webChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-semibold">Sin Live Chats</h3>
              <p className="text-sm text-muted-foreground mt-1">Crea tu primer live chat para incrustar en tu sitio</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {webChats.filter(chat => 
                chat.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((chat) => (
                <Card 
                  key={chat.id}
                  className={`border transition-all hover-elevate ${chat.isActive ? 'border-border' : 'border-border/50 opacity-75'}`}
                  data-testid={`card-webchat-${chat.id}`}
                >
                  <CardContent className="p-5">
                    {editingId === chat.id ? (
                      // Editar modo
                      <div className="space-y-3">
                        <Input
                          placeholder="Nombre"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-9 text-sm"
                          data-testid={`input-edit-name-${chat.id}`}
                        />
                        <Input
                          placeholder="URL del sitio web (opcional)"
                          value={formData.websiteUrl}
                          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                          className="h-9 text-sm"
                          data-testid={`input-edit-url-${chat.id}`}
                        />
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={formData.customColor}
                            onChange={(e) => setFormData({ ...formData, customColor: e.target.value })}
                            className="w-10 h-9 rounded-md cursor-pointer"
                            data-testid={`input-edit-color-${chat.id}`}
                          />
                          <Input
                            value={formData.customColor}
                            onChange={(e) => setFormData({ ...formData, customColor: e.target.value })}
                            className="flex-1 h-9 text-sm"
                            data-testid={`input-edit-color-text-${chat.id}`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="flex-1"
                            data-testid={`button-cancel-edit-${chat.id}`}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: chat.id, name: formData.name || chat.name, websiteUrl: formData.websiteUrl, customColor: formData.customColor })}
                            disabled={updateMutation.isPending}
                            className="flex-1"
                            data-testid={`button-save-edit-${chat.id}`}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Vista normal
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-foreground">{chat.name}</div>
                            <div className="text-xs text-muted-foreground/80 mt-0.5">
                              {chatbots.find(c => c.id === chat.chatbotId)?.name || "Chatbot"}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleMutation.mutate(chat.id)}
                              disabled={toggleMutation.isPending}
                              className="h-8 w-8 p-0"
                              title={chat.isActive ? "Pausar widget" : "Activar widget"}
                              data-testid={`button-toggle-${chat.id}`}
                            >
                              {chat.isActive ? (
                                <Pause className="w-4 h-4 text-orange-500" />
                              ) : (
                                <Play className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(chat.id);
                                setFormData({ name: chat.name, chatbotId: chat.chatbotId, websiteUrl: chat.websiteUrl || "", customColor: chat.customColor });
                              }}
                              className="h-8 w-8 p-0"
                              title="Editar widget"
                              data-testid={`button-edit-${chat.id}`}
                            >
                              <Edit2 className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(chat.id)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 p-0"
                              title="Eliminar widget"
                              data-testid={`button-delete-${chat.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {/* Color */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Color</span>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: chat.customColor }}
                              />
                              <span className="text-xs font-medium text-foreground">{chat.customColor}</span>
                            </div>
                          </div>

                          {/* Estado */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Estado</span>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              chat.isActive
                                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                            }`}>
                              {chat.isActive ? 'Activo' : 'Pausado'}
                            </span>
                          </div>

                          {/* Acciones rápidas */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewChatId(previewChatId === chat.id ? null : chat.id)}
                              className="flex-1 h-8 text-xs gap-1"
                              data-testid={`button-preview-${chat.id}`}
                            >
                              <MonitorPlay className="w-3 h-3" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowEmbedCode(showEmbedCode === chat.id ? null : chat.id)}
                              className="flex-1 h-8 text-xs gap-1"
                              data-testid={`button-embed-${chat.id}`}
                            >
                              <Code className="w-3 h-3" />
                              Código
                            </Button>
                          </div>
                        </div>

                        {showEmbedCode === chat.id && (
                          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
                            <div className="flex items-center gap-2">
                              <Code className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs font-semibold">Código de Incrustación</span>
                            </div>
                            <div className="bg-background p-2 rounded font-mono text-xs overflow-x-auto max-h-24 overflow-y-auto border border-border/30">
                              <pre className="whitespace-pre-wrap break-words text-xs">
                                {generateEmbedCode(chat.id, chat.chatbotId)}
                              </pre>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyEmbed(generateEmbedCode(chat.id, chat.chatbotId))}
                              className="w-full gap-2 h-7 text-xs"
                              data-testid={`button-copy-embed-${chat.id}`}
                            >
                              <Copy className="w-3 h-3" />
                              Copiar
                            </Button>
                          </div>
                        )}

                        <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                          {new Date(chat.createdAt).toLocaleDateString()}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Widget Preview */}
      {previewChatId && (
        <WebChatWidget
          chatbotName={webChats.find(c => c.id === previewChatId)?.name || "Chat"}
          customColor={webChats.find(c => c.id === previewChatId)?.customColor || "#3b82f6"}
          onClose={() => setPreviewChatId(null)}
        />
      )}
    </div>
  );
}
