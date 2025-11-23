import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  title: string;
}

export default function WebChatCreatePage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    title: "¿Cómo podemos ayudarte?",
    description: "Somos especialistas en soluciones de negocio. Completa el formulario y nos pondremos en contacto.",
    websiteUrl: "",
    customColor: "#3b82f6",
    productIds: [] as string[],
    acceptingBookings: true,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) setUserId(user.id);
  }, []);

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
      toast({ title: "Live Chat de Ventas creado exitosamente" });
      navigate("/web-chat");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      userId,
      ...formData,
    });
  };

  if (!userId) return <div className="flex items-center justify-center h-full">Cargando...</div>;

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/web-chat")}
            className="h-10 w-10"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Crear Live Chat de Ventas</h1>
            <p className="text-xs text-muted-foreground/80">Configura tu nuevo widget de ventas</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración del Widget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Nombre del Widget *</Label>
                <Input
                  placeholder="Ej: Lead Capture - Productos"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-9"
                  data-testid="input-widget-name"
                />
                <p className="text-xs text-muted-foreground mt-1">Este nombre es solo para tu referencia</p>
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Color Principal</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.customColor}
                    onChange={(e) => setFormData({...formData, customColor: e.target.value})}
                    className="h-9 w-12 p-1"
                    data-testid="input-color"
                  />
                  <Input
                    value={formData.customColor}
                    readOnly
                    className="h-9 flex-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Título de Bienvenida</Label>
                <Input
                  placeholder="¿Cómo podemos ayudarte?"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="h-9"
                  data-testid="input-title"
                />
                <p className="text-xs text-muted-foreground mt-1">Se muestra en la pantalla de bienvenida</p>
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Descripción</Label>
                <Textarea
                  placeholder="Somos especialistas en soluciones de negocio..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="resize-none text-xs"
                  data-testid="input-description"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Productos/Servicios</Label>
                {products.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">No hay productos disponibles. Crea primero tus productos en CRM {'>'} Productos.</p>
                ) : (
                  <div className="space-y-2">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => setFormData({
                          ...formData,
                          productIds: formData.productIds.includes(product.id)
                            ? formData.productIds.filter((id) => id !== product.id)
                            : [...formData.productIds, product.id]
                        })}
                        className={`w-full p-2.5 rounded-lg border-2 text-left text-xs font-medium transition-colors ${
                          formData.productIds.includes(product.id)
                            ? "border-primary bg-primary/10"
                            : "border-border/30 hover:border-border/50"
                        }`}
                        data-testid={`button-product-${product.id}`}
                        type="button"
                      >
                        {product.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptingBookings}
                    onChange={(e) => setFormData({...formData, acceptingBookings: e.target.checked})}
                    className="w-4 h-4 rounded"
                    data-testid="input-accept-bookings"
                  />
                  Permitir agendamiento de citas
                </Label>
                <p className="text-xs text-muted-foreground mt-1 ml-6">Los visitantes podrán agendar citas en tiempo real</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/web-chat")}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || !formData.name}
                  className="flex-1"
                  data-testid="button-create-submit"
                >
                  {createMutation.isPending ? "Creando..." : "Crear Live Chat"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
