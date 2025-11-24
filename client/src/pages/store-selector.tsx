import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Search, Package, ChevronRight, BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import type { Store } from "@shared/schema";

export default function StoreSelectorPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/stores?userId=${user.id}`);
      if (!res.ok) throw new Error("Error fetching stores");
      return res.json();
    },
    enabled: !!user?.id,
  });

  if (!user?.id) {
    return (
      <div className="flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground">Usuario no identificado</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col bg-background">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground">Pedidos</h1>
              <p className="text-xs text-muted-foreground/80">Selecciona una tienda para ver sus pedidos</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total Tiendas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stores.length}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Activas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stores.filter(s => s.isActive).length}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">Inactivas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stores.filter(s => !s.isActive).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="px-4 py-4 border-b border-border bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Selecciona una tienda</p>
              <p className="text-xs text-foreground/70 mt-0.5">Elige la tienda para ver, filtrar y gestionar sus pedidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tiendas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoComplete="off"
                  data-testid="input-search-stores"
                />
              </div>
            </div>

            {isLoading ? (
              <LoadingSpinner />
            ) : stores.length === 0 ? (
              <Card className="border-dashed border-2 bg-muted/20">
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="text-muted-foreground font-medium mb-2">No tienes tiendas creadas</p>
                  <p className="text-xs text-muted-foreground mb-4">Crea tu primera tienda para empezar a gestionar pedidos</p>
                  <Button asChild className="gap-2">
                    <Link href="/stores">
                      <Package className="w-4 h-4" />
                      Ir a Tiendas
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredStores.length === 0 ? (
                  <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="py-8 text-center">
                      <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                      <p className="text-xs text-muted-foreground">No encontramos tiendas con ese nombre</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredStores.map((store) => (
                    <Link href={`/stores/${store.id}/orders`} asChild>
                    <Card
                      key={store.id}
                      className="hover:border-primary/50 transition-colors cursor-pointer"
                      data-testid={`card-store-${store.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {store.logo ? (
                              <img
                                src={store.logo}
                                alt={store.name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-semibold text-foreground truncate">{store.name}</p>
                                {!store.isActive && (
                                  <span className="inline-block px-2 py-0.5 bg-gray-500/20 text-gray-600 dark:text-gray-400 text-xs rounded-full flex-shrink-0">
                                    Inactiva
                                  </span>
                                )}
                              </div>
                              {store.description && (
                                <p className="text-xs text-muted-foreground truncate">{store.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground/60 mt-0.5">
                                Moneda: {store.currency}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
