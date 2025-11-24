import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Trash2, Eye, Copy, Check, ShoppingBag } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Store } from "@shared/schema";

export default function StoreManagementPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      if (!user?.id) throw new Error("User not authenticated");
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: storeName,
          description: storeDescription,
        }),
      });
      if (!response.ok) throw new Error("Error creating store");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", user?.id] });
      setStoreName("");
      setStoreDescription("");
      setShowCreateDialog(false);
      toast({ title: "Tienda creada", description: "Tu nueva tienda ha sido creada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const response = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error deleting store");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", user?.id] });
      toast({ title: "Tienda eliminada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCopyStoreUrl = (storeId: string) => {
    const url = `${window.location.origin}/store/${storeId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(storeId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "URL copiada al portapapeles" });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar bg-background">
      <div className="border-b border-border bg-background">
        <div className="px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Mis Tiendas</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Crea y gestiona tus tiendas en línea
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2" data-testid="button-create-new-store">
                <Plus className="w-4 h-4" />
                Nueva Tienda
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-4">
              {stores?.length ?? 0} tienda{stores && stores.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {!stores || stores.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold text-foreground mb-2">No tienes tiendas aún</p>
                <p className="text-sm text-muted-foreground mb-6">Crea tu primera tienda para comenzar a vender</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Tienda
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((store) => (
                <Card key={store.id} className="hover-elevate" data-testid={`card-store-${store.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{store.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{store.description}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${store.isActive ? "bg-green-500" : "bg-gray-500"}`} />
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
                            Copiar URL
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs h-8"
                        data-testid={`button-view-store-${store.id}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs h-8"
                        data-testid={`button-edit-store-${store.id}`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive gap-2 text-xs h-8"
                        onClick={() => deleteStoreMutation.mutate(store.id)}
                        data-testid={`button-delete-store-${store.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Tienda</DialogTitle>
            <DialogDescription>
              Crea una tienda para comenzar a vender tus productos o servicios
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Nombre de la Tienda</Label>
              <Input
                id="store-name"
                placeholder="Ej: Mi Tienda Online"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                data-testid="input-store-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-description">Descripción (Opcional)</Label>
              <Input
                id="store-description"
                placeholder="Describe tu tienda..."
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                data-testid="input-store-description"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
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
