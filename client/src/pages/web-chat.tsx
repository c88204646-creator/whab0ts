import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, ExternalLink, Code, Globe, Eye, EyeOff, BarChart3, Check } from "lucide-react";
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

  const handleCopyEmbed = (embedCode: string) => {
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Código copiado al portapapeles" });
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

            <Button onClick={() => setShowNewForm(true)} data-testid="button-create-webchat" className="gap-2 h-9">
              <Plus className="w-4 h-4" />
              <span>Nuevo Live Chat</span>
            </Button>
          </div>

          {/* Metrics Row */}
          {webChats.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* New Form */}
          {showNewForm && (
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Nombre *</Label>
                  <Input
                    placeholder="Ej: Chat para sitio principal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1.5"
                    data-testid="input-webchat-name"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">Chatbot *</Label>
                  <select
                    value={formData.chatbotId}
                    onChange={(e) => setFormData({ ...formData, chatbotId: e.target.value })}
                    className="w-full mt-1.5 h-10 px-3 rounded-md border border-border bg-background text-sm"
                    data-testid="select-webchat-chatbot"
                  >
                    <option value="">Selecciona un chatbot</option>
                    {chatbots.map(cb => (
                      <option key={cb.id} value={cb.id}>{cb.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Sitio Web (Opcional)</Label>
                  <Input
                    placeholder="https://tusitio.com"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="mt-1.5"
                    data-testid="input-webchat-website"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">Color Personalizado</Label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="color"
                      value={formData.customColor}
                      onChange={(e) => setFormData({ ...formData, customColor: e.target.value })}
                      className="w-12 h-10 rounded-md cursor-pointer"
                      data-testid="input-webchat-color"
                    />
                    <Input
                      value={formData.customColor}
                      onChange={(e) => setFormData({ ...formData, customColor: e.target.value })}
                      className="flex-1"
                      placeholder="#3b82f6"
                      data-testid="input-webchat-color-text"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowNewForm(false)} className="flex-1" data-testid="button-cancel-webchat">
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending} className="flex-1" data-testid="button-create-webchat">
                    {createMutation.isPending ? "Creando..." : "Crear"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Web Chats Grid */}
          {webChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-semibold">Sin Live Chats</h3>
              <p className="text-sm text-muted-foreground mt-1">Crea tu primer live chat para incrustar en tu sitio</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {webChats.map(chat => (
                <Card key={chat.id} className="hover-elevate">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base">{chat.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {chatbots.find(c => c.id === chat.chatbotId)?.name || "Chatbot"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowEmbedCode(showEmbedCode === chat.id ? null : chat.id)}
                          className="h-8 w-8"
                          data-testid={`button-show-embed-${chat.id}`}
                        >
                          {showEmbedCode === chat.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(chat.id)}
                          className="h-8 w-8 hover:text-destructive"
                          data-testid={`button-delete-webchat-${chat.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: chat.customColor }}
                      />
                      <span className="text-muted-foreground">{chat.customColor}</span>
                    </div>

                    {chat.websiteUrl && (
                      <a
                        href={chat.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                        data-testid={`link-website-${chat.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        {chat.websiteUrl}
                      </a>
                    )}

                    {showEmbedCode === chat.id && (
                      <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50 space-y-2">
                        <div className="flex items-center gap-2">
                          <Code className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-semibold">Código de Incrustación</span>
                        </div>
                        <div className="bg-background p-3 rounded font-mono text-xs overflow-x-auto line-clamp-3">
                          {chat.embedCode}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyEmbed(chat.embedCode!)}
                          className="w-full gap-2 h-8 text-xs"
                          data-testid={`button-copy-embed-${chat.id}`}
                        >
                          <Copy className="w-3 h-3" />
                          Copiar Código
                        </Button>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(chat.createdAt).toLocaleDateString()}
                      </span>
                      <Badge variant={chat.isActive ? "default" : "secondary"}>
                        {chat.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
