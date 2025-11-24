import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Store, StoreProduct } from "@shared/schema";
import { useLocation } from "wouter";

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export default function PublicStorePage({ storeUrl }: { storeUrl: string }) {
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const { data: storeData, isLoading, isError } = useQuery<Store & { products: StoreProduct[] }>({
    queryKey: ["/api/stores/url", storeUrl],
    queryFn: async () => {
      const res = await fetch(`/api/stores/url/${storeUrl}`);
      if (!res.ok) throw new Error("Tienda no encontrada");
      return res.json();
    },
    enabled: !!storeUrl,
  });

  const handleAddToCart = (product: StoreProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !storeData) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Tienda no encontrada</h1>
        <p className="text-muted-foreground">La tienda "{storeUrl}" no existe o ha sido eliminada</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{storeData.name}</h1>
            {storeData.description && (
              <p className="text-muted-foreground mt-2">{storeData.description}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => setShowCart(!showCart)}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-bold">{cart.length}</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {showCart ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Carrito</h2>
            {cart.length === 0 ? (
              <Card className="bg-muted/20 border-dashed">
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-4">Tu carrito está vacío</p>
                  <Button onClick={() => setShowCart(false)}>Ver Productos</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <Card key={item.product.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ${(item.product.price / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateQuantity(item.product.id, item.quantity - 1)
                            }
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateQuantity(item.product.id, item.quantity + 1)
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <span className="w-24 text-right font-bold">
                            ${((item.product.price * item.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>${(total / 100).toFixed(2)}</span>
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      localStorage.setItem(
                        "store-cart",
                        JSON.stringify({ storeId: storeData.id, cart, total })
                      );
                      setLocation(`/checkout/${storeData.id}`);
                    }}
                  >
                    Proceder al Checkout
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowCart(false)}
                  >
                    Seguir Comprando
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Nuestros Productos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeData.products?.map((product) => (
                <Card key={product.id} className="hover-elevate overflow-hidden">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold">
                          ${(product.price / 100).toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <p className="text-xs text-muted-foreground line-through">
                            ${(product.originalPrice / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                        Stock: {product.stock}
                      </span>
                    </div>

                    <Button
                      className="w-full gap-2"
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {product.stock === 0 ? "Agotado" : "Agregar"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
