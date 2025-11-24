import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Trash2, Eye, Copy, Check, ShoppingBag, Search, BarChart3, TrendingUp } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useLocation } from "wouter";
import type { Store } from "@shared/schema";

export default function StoreManagementPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    if (userData?.id) {
      setUser(userData);
    }
  }, []);

  const { data: stores, isLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores", user?.id],
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

  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const response = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando tienda");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", user?.id] });
      toast({ title: "Tienda eliminada", description: "La tienda ha sido removida" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo eliminar la tienda", 
        variant: "destructive" 
      });
    },
  });

  const handleCopyStoreUrl = (storeId: string) => {
    const url = `${window.location.origin}/store/${storeId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(storeId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "URL copiada al portapapeles" });
  };

  const filteredStores = stores?.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalStores = stores?.length ?? 0;

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Add Button */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Mis Tiendas</h1>
                <p className="text-xs text-muted-foreground/80">Crea y gestiona tus tiendas en línea</p>
              </div>
            </div>

            <Button 
              onClick={() => setShowCreateDialog(true)} 
              data-testid="button-create-new-store" 
              className="gap-2 h-9"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Tienda</span>
            </Button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Total Stores */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalStores}</p>
            </div>

            {/* Products Count */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Activas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stores?.filter(s => s.isActive).length ?? 0}</p>
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
            {/* Alert Banner */}
            <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-foreground">Crea y vende en línea</p>
              <p className="text-xs text-foreground/70 mt-0.5">Agrega productos, establece precios, comparte URL pública y gestiona órdenes</p>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredStores.length === 0 && !searchQuery ? (
              <div className="border border-border rounded-lg flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-blue-500/10 dark:bg-blue-500/5 rounded-full flex items-center justify-center mb-6">
                  <Plus className="w-10 h-10 text-blue-500/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">No tienes tiendas aún</h3>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Comienza creando tu primera tienda para empezar a vender productos y servicios en línea
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)} 
                  data-testid="button-create-first-store" 
                  size="sm" 
                  className="gap-2"
                >
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
                    className="border transition-all hover-elevate"
                    data-testid={`card-store-${store.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{store.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{store.description}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${store.isActive ? "bg-green-500" : "bg-gray-500"}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyStoreUrl(store.id)}
                          className="flex-1 gap-2 text-xs h-8"
                          data-testid={`button-copy-store-${store.id}`}
                        >
                          {copiedId === store.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              URL Pública
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/stores/${store.id}/products`)}
                          className="gap-2 text-xs h-8"
                          data-testid={`button-view-store-products-${store.id}`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Productos
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive gap-2 text-xs h-8 flex-1"
                          onClick={() => deleteStoreMutation.mutate(store.id)}
                          disabled={deleteStoreMutation.isPending}
                          data-testid={`button-delete-store-${store.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
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
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setStoreName("");
                  setStoreDescription("");
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
