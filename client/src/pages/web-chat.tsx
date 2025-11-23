import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, Globe, Check, Pause, Play, Edit2, Search, Package } from "lucide-react";
import type { WebChat } from "@shared/schema";

interface Product {
  id: string;
  title: string;
}

export default function WebChatPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    websiteUrl: "",
    customColor: "#3b82f6",
    productIds: [] as string[],
    acceptingBookings: true,
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
      setFormData({ name: "", title: "", description: "", websiteUrl: "", customColor: "#3b82f6", productIds: [], acceptingBookings: true });
      toast({ title: "Live Chat de Ventas creado" });
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

  const handleSubmit = () => {
    if (!formData.name || !formData.title) {
      toast({ title: "Error", description: "Nombre y Título son requeridos", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      userId,
      ...formData,
    });
  };

  const filteredChats = webChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) return <div className="flex items-center justify-center h-full">Cargando...</div>;

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
            <Button onClick={() => {}} data-testid="button-create-webchat" className="gap-2 h-9">
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
          {/* Create Form */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base">Crear Nuevo Live Chat</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Nombre del Widget</Label>
                  <Input
                    placeholder="Ej: Lead Capture - Productos"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Color Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.customColor}
                      onChange={(e) => setFormData({...formData, customColor: e.target.value})}
                      className="h-9 w-12 p-1"
                    />
                    <Input
                      value={formData.customColor}
                      readOnly
                      className="h-9 flex-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Título de Bienvenida</Label>
                <Input
                  placeholder="¿Cómo podemos ayudarte?"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Descripción</Label>
                <Textarea
                  placeholder="Somos especialistas..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                  className="resize-none text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Productos/Servicios</Label>
                <div className="space-y-2">
                  {products.map(product => (
                    <button
                      key={product.id}
                      onClick={() => setFormData({
                        ...formData,
                        productIds: formData.productIds.includes(product.id)
                          ? formData.productIds.filter(id => id !== product.id)
                          : [...formData.productIds, product.id]
                      })}
                      className={`w-full p-2 rounded-lg border-2 text-left text-xs font-medium transition-colors ${
                        formData.productIds.includes(product.id)
                          ? "border-primary bg-primary/10"
                          : "border-border/30 hover:border-border/50"
                      }`}
                    >
                      {product.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={formData.acceptingBookings}
                    onChange={(e) => setFormData({...formData, acceptingBookings: e.target.checked})}
                    className="w-4 h-4"
                  />
                  Aceptar agendamiento de citas
                </Label>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? "Creando..." : "Crear Live Chat"}
              </Button>
            </CardContent>
          </Card>

          {/* Search */}
          {filteredChats.length > 0 && (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar live chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
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
                            onClick={() => {
                              handleCopyEmbed(generateEmbedCode(chat.id));
                            }}
                            className="h-8 w-8"
                            title="Copiar código"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleMutation.mutate(chat.id)}
                            className="h-8 w-8"
                            title={chat.isActive ? "Desactivar" : "Activar"}
                          >
                            {chat.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(chat.id)}
                            className="h-8 w-8 text-destructive"
                            title="Eliminar"
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