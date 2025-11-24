import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pause, Play, Trash2, ShoppingBag, Search, BarChart3, TrendingUp, Package, ShoppingCart, Copy, Share2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Store } from "@shared/schema";

const CURRENCIES = [
  { code: "MXN", symbol: "$", name: "Peso Mexicano" },
  { code: "USD", symbol: "$", name: "Dólar Estadounidense" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "ARS", symbol: "$", name: "Peso Argentino" },
  { code: "COP", symbol: "$", name: "Peso Colombiano" },
  { code: "CLP", symbol: "$", name: "Peso Chileno" },
];

const ALERTS = [
  {
    title: "Crea y vende en línea",
    description: "Agrega productos con categorías, establece precios en tu divisa, y gestiona órdenes",
    icon: "package"
  },
  {
    title: "Comparte tu tienda",
    description: "Haz clic en el botón de copiar en cada tienda para obtener la URL y compartirla con tus clientes en WhatsApp",
    icon: "share"
  }
];

export default function StoreManagementPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("MXN");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    if (userData?.id) {
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % ALERTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/stores?userId=${user.id}`);
      if (!response.ok) throw new Error("Error fetching stores");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const createStoreMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuario no autenticado");
      if (!storeName.trim()) throw new Error("Nombre de tienda requerido");
      
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: storeName.trim(),
          description: storeDescription.trim(),
          currency: selectedCurrency,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error creando tienda");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", user?.id] });
      setStoreName("");
      setStoreDescription("");
      setSelectedCurrency("MXN");
      setShowCreateDialog(false);
      toast({ 
        title: "✓ Tienda creada", 
        description: "Tu tienda ha sido creada y está lista para agregar productos" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creando tienda", 
        description: error.message || "Intenta de nuevo", 
        variant: "destructive" 
      });
    },
  });

  const toggleStoreMutation = useMutation({
    mutationFn: (storeId: string) => {
      const store = stores.find(s => s.id === storeId);
      return fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !(store?.isActive ?? true) }),
      }).then(r => r.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", user?.id] });
      toast({
        title: data.isActive ? "✓ Tienda activada" : "✓ Tienda pausada",
        description: data.isActive 
          ? "La tienda está activa y visible a clientes"
          : "La tienda está pausada",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const response = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando tienda");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", user?.id] });
      toast({ title: "✓ Tienda eliminada", description: "La tienda ha sido removida" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo eliminar la tienda", 
        variant: "destructive" 
      });
    },
  });

  const filteredStores = stores?.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalStores = stores?.length ?? 0;
  const activeStores = stores?.filter(s => s.isActive).length ?? 0;

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Add Button */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Mis Tiendas</h1>
                <p className="text-xs text-muted-foreground/80">Crea y gestiona tus tiendas en línea</p>
              </div>
            </div>

            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-new-store" className="gap-2 h-9">
              <Plus className="w-4 h-4" />
              <span>Nueva Tienda</span>
            </Button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {/* Total Stores */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalStores}</p>
            </div>

            {/* Active Stores */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Activas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{activeStores}</p>
            </div>

            {/* Paused Stores */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Pause className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">Pausadas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalStores - activeStores}</p>
            </div>

            {/* Currencies */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Monedas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{new Set(stores.map(s => s.currency)).size}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
              data-testid="input-search-stores"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            {/* Alert Banner - Rotating */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 mb-6 min-h-20 flex items-center transition-all duration-300">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{ALERTS[currentAlertIndex].title}</p>
                    <p className="text-xs text-foreground/70 mt-0.5">{ALERTS[currentAlertIndex].description}</p>
                  </div>
                  {ALERTS[currentAlertIndex].icon === "share" && <Share2 className="w-5 h-5 text-emerald-500 flex-shrink-0 ml-3" />}
                  {ALERTS[currentAlertIndex].icon === "package" && <Package className="w-5 h-5 text-emerald-500 flex-shrink-0 ml-3" />}
                </div>
                <div className="flex gap-1 mt-3">
                  {ALERTS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentAlertIndex(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentAlertIndex ? "bg-emerald-500 w-3" : "bg-emerald-500/30 w-1.5"
                      }`}
                      data-testid={`button-alert-${index}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando tiendas...</p>
              </div>
            ) : filteredStores.length === 0 && !searchQuery ? (
              <div className="border border-border rounded-lg flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full flex items-center justify-center mb-6">
                  <Plus className="w-10 h-10 text-emerald-500/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">No tienes tiendas aún</h3>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Comienza creando tu primera tienda para empezar a vender productos y servicios en línea
                </p>
                <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-store" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Crear Primera Tienda</span>
                </Button>
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-lg">
                <p className="text-lg text-muted-foreground">No se encontraron tiendas con ese criterio</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredStores.map((store) => (
                  <Card 
                    key={store.id}
                    className={`border transition-all hover-elevate ${store.isActive ? 'border-border' : 'border-border/50 opacity-75'}`}
                    data-testid={`card-store-${store.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-11 w-11 ring-2 ring-offset-1 ring-offset-background ring-border flex-shrink-0">
                            <AvatarFallback className="bg-emerald-500/20 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {store.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground truncate">{store.name}</div>
                            <div className="text-xs text-muted-foreground/80 mt-0.5">
                              {store.description || "Sin descripción"}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleStoreMutation.mutate(store.id)}
                            disabled={toggleStoreMutation.isPending}
                            className="h-8 w-8 p-0"
                            title={store.isActive ? "Pausar tienda" : "Activar tienda"}
                            data-testid={`button-toggle-store-${store.id}`}
                          >
                            {store.isActive ? (
                              <Pause className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Play className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteStoreMutation.mutate(store.id)}
                            disabled={deleteStoreMutation.isPending}
                            className="h-8 w-8 p-0"
                            data-testid={`button-delete-store-${store.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2.5">
                        {/* Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Estado</span>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            store.isActive
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                              : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                          }`}>
                            {store.isActive ? 'Activa' : 'Pausada'}
                          </span>
                        </div>

                        {/* Currency */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Moneda</span>
                          <span className="text-xs font-medium text-foreground">{store.currency}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/stores/${store.id}/products`)}
                          className="flex-1 gap-2 text-xs h-8"
                          data-testid={`button-manage-products-${store.id}`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          Productos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/stores/${store.id}/orders`)}
                          className="flex-1 gap-2 text-xs h-8"
                          data-testid={`button-manage-orders-${store.id}`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Pedidos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const storeUrl = `${window.location.origin}/store/${store.customUrl || store.id}`;
                            navigator.clipboard.writeText(storeUrl);
                            toast({ title: "✓ URL copiada", description: "Enlace listo para compartir" });
                          }}
                          className="px-2 h-8"
                          title="Copiar URL de tienda"
                          data-testid={`button-copy-url-${store.id}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Store Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Tienda</DialogTitle>
            <DialogDescription>
              Crea una tienda para comenzar a vender tus productos o servicios en línea
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Nombre de la Tienda *</Label>
              <Input
                id="store-name"
                placeholder="Ej: Mi Tienda Online"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={createStoreMutation.isPending}
                data-testid="input-store-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-description">Descripción (Opcional)</Label>
              <Input
                id="store-description"
                placeholder="Describe tu tienda y qué vendes..."
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                disabled={createStoreMutation.isPending}
                data-testid="input-store-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-currency">Moneda *</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency} disabled={createStoreMutation.isPending}>
                <SelectTrigger id="store-currency" data-testid="select-store-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(currency => (
                    <SelectItem key={currency.code} value={currency.code} data-testid={`option-currency-${currency.code}`}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setStoreName("");
                  setStoreDescription("");
                  setSelectedCurrency("MXN");
                }}
                disabled={createStoreMutation.isPending}
                data-testid="button-cancel-create-store"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => createStoreMutation.mutate()}
                disabled={createStoreMutation.isPending || !storeName.trim()}
                data-testid="button-create-store-confirm"
              >
                {createStoreMutation.isPending ? "Creando..." : "Crear Tienda"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
