import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
import type { StoreProduct } from "@shared/schema";
import { useLocation } from "wouter";

export default function StoreCheckoutPage({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCity: "",
    customerCountry: "",
    couponCode: "",
  });
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string>("");

  const cartData = JSON.parse(localStorage.getItem("store-cart") || "{}");
  const cart = cartData.cart || [];
  const total = cartData.total || 0;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!formData.customerName.trim()) throw new Error("Nombre requerido");
      if (!formData.customerEmail.trim()) throw new Error("Email requerido");

      const response = await fetch("/api/store-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          customerCity: formData.customerCity,
          customerCountry: formData.customerCountry,
          totalAmount: total,
          discountAmount: 0,
          finalAmount: total,
          couponCode: formData.couponCode,
          status: "pending",
          items: cart.map((item: { product: StoreProduct; quantity: number }) => ({
            productId: item.product.id,
            productName: item.product.name,
            productPrice: item.product.price,
            quantity: item.quantity,
            subtotal: item.product.price * item.quantity,
          })),
        }),
      });
      if (!response.ok) throw new Error("Error al crear la orden");
      return response.json();
    },
    onSuccess: (order) => {
      setOrderId(order.id);
      setOrderComplete(true);
      localStorage.removeItem("store-cart");
      toast({ title: "Orden creada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!storeId || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No hay artículos en el carrito
            </p>
            <Button className="w-full mt-4" onClick={() => setLocation("/")}>
              Volver a la tienda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold">¡Orden Completada!</h1>
              <p className="text-muted-foreground mt-2">
                Tu orden ha sido recibida exitosamente.
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">ID de Orden</p>
              <p className="font-mono font-bold text-center mt-1">{orderId}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Te enviaremos un email de confirmación a <strong>{formData.customerEmail}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-12">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      placeholder="Juan García"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="juan@example.com"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      placeholder="+52 123 456 7890"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPhone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      placeholder="México"
                      value={formData.customerCountry}
                      onChange={(e) =>
                        setFormData({ ...formData, customerCountry: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Ciudad de México"
                    value={formData.customerCity}
                    onChange={(e) =>
                      setFormData({ ...formData, customerCity: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Código Promocional (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Ingresa tu código"
                  value={formData.couponCode}
                  onChange={(e) =>
                    setFormData({ ...formData, couponCode: e.target.value })
                  }
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumen de Orden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 border-b border-border pb-4">
                  {cart.map((item: { product: StoreProduct; quantity: number }) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product.name} x {item.quantity}
                      </span>
                      <span className="font-semibold">
                        ${((item.product.price * item.quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${(total / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío</span>
                    <span>$0.00</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => createOrderMutation.mutate()}
                  disabled={createOrderMutation.isPending || !formData.customerName.trim() || !formData.customerEmail.trim()}
                >
                  {createOrderMutation.isPending ? "Procesando..." : "Confirmar Orden"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
