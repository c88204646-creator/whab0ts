import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Code } from "lucide-react";
import { useLocation } from "wouter";
import { WebChatWidget } from "@/components/web-chat-widget";
import type { WebChat } from "@shared/schema";

interface ChatbotOption {
  id: string;
  name: string;
}

export default function WebChatCreatePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [chatbots, setChatbots] = useState<ChatbotOption[]>([]);
  const [previewWidget, setPreviewWidget] = useState(false);
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
      toast({ title: "Live Chat creado exitosamente" });
      setLocation("/web-chat");
    },
  });

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

  const generateEmbedCode = () => {
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    return `<!-- WhatsApp CRM Live Chat Widget -->
<script>
(function() {
  const script = document.createElement('script');
  script.src = '${baseUrl}/widget.js?chatId=new-chat&chatbotId=${formData.chatbotId}';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`;
  };

  const embedCode = formData.chatbotId ? generateEmbedCode() : "";

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Código copiado al portapapeles" });
  };

  if (!userId) return <div className="flex items-center justify-center h-full">Cargando...</div>;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/web-chat")}
            data-testid="button-back-webchat"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Crear Live Chat</h1>
            <p className="text-xs text-muted-foreground">Configura tu nuevo widget de chat para tu sitio web</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Form */}
            <div className="lg:col-span-1">
              <Card>
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

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/web-chat")}
                      className="flex-1"
                      data-testid="button-cancel-create-webchat"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={createMutation.isPending || !formData.chatbotId}
                      className="flex-1"
                      data-testid="button-submit-create-webchat"
                    >
                      {createMutation.isPending ? "Creando..." : "Crear Live Chat"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Preview and Embed Code */}
            <div className="lg:col-span-2 space-y-6">
              {/* Preview */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold mb-4">Vista Previa</h3>
                  <div className="relative w-full bg-muted/30 rounded-lg overflow-hidden border border-border/50 aspect-video flex items-center justify-center">
                    {formData.chatbotId ? (
                      <>
                        <p className="text-muted-foreground text-sm text-center px-4">El widget aparecería en la esquina inferior derecha</p>
                        <button
                          onClick={() => setPreviewWidget(!previewWidget)}
                          className="absolute bottom-4 right-4 px-4 py-2 rounded-full text-white text-sm font-medium hover:shadow-lg transition-all"
                          style={{ backgroundColor: formData.customColor }}
                          data-testid="button-toggle-preview-widget"
                        >
                          Ver Demostración
                        </button>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">Selecciona un chatbot para ver la vista previa</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Embed Code */}
              {formData.chatbotId && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-semibold mb-4">Código de Integración</h3>
                    <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-border/50">
                      <pre className="whitespace-pre-wrap break-words text-foreground/80">
                        {embedCode}
                      </pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyEmbed}
                      className="mt-3 gap-2"
                      data-testid="button-copy-embed-code"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar Código
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Widget Preview */}
      {previewWidget && formData.chatbotId && (
        <WebChatWidget
          chatbotName={chatbots.find(c => c.id === formData.chatbotId)?.name || "Chat"}
          customColor={formData.customColor}
          onClose={() => setPreviewWidget(false)}
        />
      )}
    </div>
  );
}
