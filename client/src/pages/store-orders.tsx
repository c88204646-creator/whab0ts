import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, Eye, Trash2, BarChart3, TrendingUp } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { StoreOrder } from "@shared/schema";

interface StoreOrdersPageProps {
  storeId: string;
}

export default function StoreOrdersPage({ storeId }: StoreOrdersPageProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: orders = [], isLoading } = useQuery<StoreOrder[]>({
    queryKey: ["/api/store-orders", storeId === "all" ? "all" : storeId],
    queryFn: async () => {
      let url = `/api/store-orders`;
      if (storeId && storeId !== "all") {
        url += `?storeId=${storeId}`;
      } else if (storeId === "all" && user?.id) {
        url += `?userId=${user.id}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error fetching orders");
      return response.json();
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/store-orders/${orderId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error deleting order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-orders", storeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/store-orders", "all"] });
      toast({ title: "✓ Pedido eliminado", description: "El pedido ha sido removido" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el pedido",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-600 dark:text-green-400";
      case "processing":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
      case "pending":
        return "bg-orange-500/20 text-orange-600 dark:text-orange-400";
      case "cancelled":
        return "bg-red-500/20 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado";
      case "processing":
        return "Procesando";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground">Pedidos</h1>
              <p className="text-xs text-muted-foreground/80">Gestiona todos los pedidos de tu tienda</p>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Total Orders */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
            </div>

            {/* Completed Orders */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Completados</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{completedOrders}</p>
            </div>

            {/* Revenue */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Ingresos</p>
              </div>
              <p className="text-2xl font-bold text-foreground">${(totalRevenue / 100).toFixed(2)}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
              data-testid="input-search-orders"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando pedidos...</p>
              </div>
            ) : filteredOrders.length === 0 && !searchQuery ? (
              <div className="border border-border rounded-lg flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-blue-500/10 dark:bg-blue-500/5 rounded-full flex items-center justify-center mb-6">
                  <Package className="w-10 h-10 text-blue-500/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">No tienes pedidos aún</h3>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Los pedidos aparecerán aquí cuando los clientes realicen compras en tu tienda
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-lg">
                <p className="text-lg text-muted-foreground">No se encontraron pedidos con ese criterio</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="border transition-all hover-elevate"
                    data-testid={`card-order-${order.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        {/* Order Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-semibold text-sm text-foreground truncate">
                              {order.customerName}
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              #{order.id.slice(0, 8)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3 truncate">
                            {order.customerEmail}
                          </p>
                          
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Monto:</span>
                              <p className="font-semibold text-foreground">${(order.finalAmount / 100).toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Estado:</span>
                              <Badge
                                variant="outline"
                                className={`text-xs mt-1 ${getStatusColor(order.status)}`}
                              >
                                {getStatusLabel(order.status)}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ciudad:</span>
                              <p className="font-semibold text-foreground">{order.customerCity || "-"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Teléfono:</span>
                              <p className="font-semibold text-foreground">{order.customerPhone || "-"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            data-testid={`button-view-order-${order.id}`}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => deleteOrderMutation.mutate(order.id)}
                            disabled={deleteOrderMutation.isPending}
                            data-testid={`button-delete-order-${order.id}`}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
