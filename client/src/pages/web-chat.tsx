import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, Globe, Check, Pause, Play, Search, Package } from "lucide-react";
import type { WebChat } from "@shared/schema";

interface Product {
  id: string;
  title: string;
}

export default function WebChatPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const initUserId = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user?.id) {
            setUserId(user.id);
            setIsInitialized(true);
            return;
          }
        }
      } catch (error) {
        console.error("Error reading user from localStorage:", error);
      }
      // Mark as initialized even if we couldn't get userId
      setIsInitialized(true);
    };
    
    initUserId();
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

  const { data: productList } = useQuery<Product[]>({
    queryKey: ["/api/products", userId],
    queryFn: async () => {
      const response = await fetch(`/api/products?userId=${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (productList) {
      setProducts(productList);
    }
  }, [productList]);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/web-chats", userId] });
    },
  });

  const handleCopyEmbed = (embedCode: string) => {
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Código copiado" });
  };

  const generateEmbedCode = (chatId: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    return `<!-- WhatsApp CRM Live Chat Widget -->
<script>
(function() {
  const script = document.createElement('script');
  script.src = '${baseUrl}/widget.js?chatId=${chatId}';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`;
  };

  const filteredChats = webChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isInitialized) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="pt-8 pb-8 text-center">
            <Globe className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Error de autenticación</h3>
            <p className="text-xs text-muted-foreground mb-4">No pudimos obtener tu información. Por favor recarga la página.</p>
            <Button onClick={() => window.location.reload()}>Recargar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Live Chat de Ventas</h1>
                <p className="text-xs text-muted-foreground/80">Captura leads y agenda citas automáticamente</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/web-chat-create")} 
              data-testid="button-create-webchat" 
              className="gap-2 h-9"
            >
              <Plus className="w-4 h-4" />
              Crear Live Chat
            </Button>
          </div>

          {webChats.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                </div>
                <p className="text-2xl font-bold">{webChats.length}</p>
              </div>
              <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-muted-foreground font-medium">Activos</p>
                </div>
                <p className="text-2xl font-bold">{webChats.filter(w => w.isActive).length}</p>
              </div>
              <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-purple-500" />
                  <p className="text-xs text-muted-foreground font-medium">Con Productos</p>
                </div>
                <p className="text-2xl font-bold">{webChats.filter(w => w.productIds?.length > 0).length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          {webChats.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-8 pb-8 text-center">
                <Globe className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Sin Live Chat aún</h3>
                <p className="text-xs text-muted-foreground mb-4">Crea tu primer widget de ventas para capturar leads</p>
                <Button 
                  onClick={() => navigate("/web-chat-create")}
                  data-testid="button-create-first"
                >
                  Crear Live Chat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar live chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>

              {/* List */}
              <div className="space-y-2">
                {filteredChats.map(chat => (
                  <Card key={chat.id} className="hover:border-border/50 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{chat.name}</h3>
                            <Badge variant={chat.isActive ? "default" : "secondary"} className="text-xs">
                              {chat.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{chat.title}</p>
                          {chat.productIds && chat.productIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {chat.productIds.map((productId, idx) => {
                                const product = products.find(p => p.id === productId);
                                return product ? (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {product.title}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyEmbed(generateEmbedCode(chat.id))}
                            className="h-8 w-8"
                            title="Copiar código"
                            data-testid="button-copy-embed"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleMutation.mutate(chat.id)}
                            className="h-8 w-8"
                            title={chat.isActive ? "Desactivar" : "Activar"}
                            data-testid="button-toggle"
                          >
                            {chat.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(chat.id)}
                            className="h-8 w-8 text-destructive"
                            title="Eliminar"
                            data-testid="button-delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}