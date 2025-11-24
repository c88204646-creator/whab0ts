import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Plus, Trash2, Edit2, ChevronRight, Package, Layers, Tag, Search, AlertCircle, DollarSign, Store } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { StoreProductCategory, StoreProductSubcategory, Store as StoreType } from "@shared/schema";

interface PanelState {
  view: "categories" | "subcategories" | "products";
  categoryId?: string;
  subcategoryId?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  image?: string;
}

export default function ProductsPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [panelState, setPanelState] = useState<PanelState>({ view: "categories" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<"category" | "subcategory" | "product">("category");
  const [formData, setFormData] = useState<ProductFormData>({ name: "", description: "", price: "", image: "" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) setUserId(user.id);
  }, []);

  const { data: stores = [], isLoading: storesLoading } = useQuery<StoreType[]>({
    queryKey: ["/api/stores", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/stores?userId=${userId}`);
      if (!res.ok) throw new Error("Error fetching stores");
      return res.json();
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const storeId = selectedStoreId || "default-store";

  // Queries
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["/api/store-product-categories", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/store-product-categories?storeId=${storeId}`);
      if (!res.ok) throw new Error("Error fetching categories");
      return res.json();
    },
  });

  const { data: subcategories = [], isLoading: subCatsLoading } = useQuery({
    queryKey: ["/api/store-product-subcategories", panelState.categoryId],
    queryFn: async () => {
      const res = await fetch(`/api/store-product-subcategories?categoryId=${panelState.categoryId}`);
      if (!res.ok) throw new Error("Error fetching subcategories");
      return res.json();
    },
    enabled: panelState.view === "subcategories" && !!panelState.categoryId,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/store-products", panelState.subcategoryId],
    queryFn: async () => {
      const res = await fetch(`/api/store-products?subcategoryId=${panelState.subcategoryId}`);
      if (!res.ok) throw new Error("Error fetching products");
      return res.json();
    },
    enabled: panelState.view === "products" && !!panelState.subcategoryId,
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/store-product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, name: formData.name, description: formData.description }),
      });
      if (!res.ok) throw new Error("Error creating category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-product-categories", storeId] });
      setShowDialog(false);
      setFormData({ name: "", description: "", price: "", image: "" });
      toast({ title: "Categoría creada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/store-product-categories/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, description: formData.description }),
      });
      if (!res.ok) throw new Error("Error updating category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-product-categories", storeId] });
      setShowDialog(false);
      setFormData({ name: "", description: "", price: "", image: "" });
      setEditingId(null);
      toast({ title: "Categoría actualizada" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/store-product-categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error deleting category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-product-categories", storeId] });
      toast({ title: "Categoría eliminada" });
    },
  });

  // Subcategory Mutations
  const createSubcategoryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/store-product-subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: panelState.categoryId, name: formData.name, description: formData.description }),
      });
      if (!res.ok) throw new Error("Error creating subcategory");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-product-subcategories", panelState.categoryId] });
      setShowDialog(false);
      setFormData({ name: "", description: "", price: "", image: "" });
      toast({ title: "Subcategoría creada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/store-product-subcategories/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, description: formData.description }),
      });
      if (!res.ok) throw new Error("Error updating subcategory");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-product-subcategories", panelState.categoryId] });
      setShowDialog(false);
      setFormData({ name: "", description: "", price: "", image: "" });
      setEditingId(null);
      toast({ title: "Subcategoría actualizada" });
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/store-product-subcategories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error deleting subcategory");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-product-subcategories", panelState.categoryId] });
      toast({ title: "Subcategoría eliminada" });
    },
  });

  // Product Mutations
  const createProductMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/store-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          categoryId: panelState.categoryId,
          subcategoryId: panelState.subcategoryId,
          name: formData.name,
          description: formData.description,
          price: Math.round(parseFloat(formData.price) * 100),
        }),
      });
      if (!res.ok) throw new Error("Error creating product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", panelState.subcategoryId] });
      setShowDialog(false);
      setFormData({ name: "", description: "", price: "", image: "" });
      toast({ title: "Producto creado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/store-products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error deleting product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", panelState.subcategoryId] });
      toast({ title: "Producto eliminado" });
    },
  });

  const isLoading = catsLoading || subCatsLoading || productsLoading || storesLoading;

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || "";
  const getSubcategoryName = (id: string) => subcategories.find(s => s.id === id)?.name || "";

  if (!userId) return <LoadingSpinner />;
  if (stores.length === 0) {
    return (
      <div className="flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="py-12 text-center">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-muted-foreground font-medium mb-4">No tienes tiendas creadas</p>
              <Button asChild className="gap-2">
                <a href="/stores">
                  <Plus className="w-4 h-4" />
                  Crear Primera Tienda
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background">
      {/* Store Selector */}
      {stores.length > 0 && (
        <div className="border-b border-border bg-card/50 px-4 py-3 flex-shrink-0">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Selecciona Tienda:</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {stores.map((store) => (
                <Button
                  key={store.id}
                  variant={selectedStoreId === store.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStoreId(store.id)}
                  className="gap-2 flex-shrink-0"
                  data-testid={`button-store-${store.id}`}
                >
                  <Package className="w-4 h-4" />
                  {store.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                <Package className="w-5 h-5 text-purple-500" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Catálogo de Productos</h1>
                <p className="text-xs text-muted-foreground/80">Organiza categorías → subcategorías → productos</p>
              </div>
            </div>
            {panelState.view === "categories" && (
              <Button onClick={() => { setDialogType("category"); setEditingId(null); setFormData({ name: "", description: "", price: "", image: "" }); setShowDialog(true); }} className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                Nueva Categoría
              </Button>
            )}
            {panelState.view === "subcategories" && (
              <Button onClick={() => { setDialogType("subcategory"); setEditingId(null); setFormData({ name: "", description: "", price: "", image: "" }); setShowDialog(true); }} className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                Nueva Subcategoría
              </Button>
            )}
            {panelState.view === "products" && (
              <Button onClick={() => { setDialogType("product"); setEditingId(null); setFormData({ name: "", description: "", price: "", image: "" }); setShowDialog(true); }} className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </Button>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Categorías</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{categories.length}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Subcategorías</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{subcategories.length}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Productos</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="px-4 py-4 border-b border-border bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Estructura Jerárquica</p>
              <p className="text-xs text-foreground/70 mt-0.5">Primero categorías, luego subcategorías, finalmente productos dentro de cada subcategoría</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 mb-6 text-sm">
              <button
                onClick={() => { setPanelState({ view: "categories" }); setSearchQuery(""); }}
                className={`${panelState.view === "categories" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                Categorías
              </button>
              {panelState.categoryId && (
                <>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <button
                    onClick={() => { setPanelState({ view: "subcategories", categoryId: panelState.categoryId }); setSearchQuery(""); }}
                    className={`${panelState.view === "subcategories" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Subcategorías
                  </button>
                </>
              )}
              {panelState.subcategoryId && (
                <>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-primary font-medium">Productos</span>
                </>
              )}
            </div>

            {/* Categories View */}
            {panelState.view === "categories" && (
              <div>
                <div className="flex-1 relative mb-4">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar categorías..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>

                {isLoading ? (
                  <LoadingSpinner />
                ) : categories.length === 0 ? (
                  <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="py-12 text-center">
                      <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                      <p className="text-muted-foreground font-medium mb-4">No hay categorías</p>
                      <Button onClick={() => { setDialogType("category"); setEditingId(null); setFormData({ name: "", description: "", price: "", image: "" }); setShowDialog(true); }} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Primera Categoría
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((category) => (
                      <Card key={category.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setPanelState({ view: "subcategories", categoryId: category.id }); setSearchQuery(""); }}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <Tag className="w-5 h-5 text-purple-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate">{category.name}</p>
                                {category.description && <p className="text-xs text-muted-foreground truncate">{category.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setDialogType("category"); setEditingId(category.id); setFormData({ name: category.name, description: category.description || "", price: "", image: "" }); setShowDialog(true); }}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteCategoryMutation.mutate(category.id); }} className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subcategories View */}
            {panelState.view === "subcategories" && (
              <div>
                <div className="flex-1 relative mb-4">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar subcategorías..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>

                {isLoading ? (
                  <LoadingSpinner />
                ) : subcategories.length === 0 ? (
                  <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="py-12 text-center">
                      <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                      <p className="text-muted-foreground font-medium mb-4">No hay subcategorías</p>
                      <Button onClick={() => { setDialogType("subcategory"); setEditingId(null); setFormData({ name: "", description: "", price: "", image: "" }); setShowDialog(true); }} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Primera Subcategoría
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {subcategories.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((subcategory) => (
                      <Card key={subcategory.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setPanelState({ view: "products", categoryId: panelState.categoryId, subcategoryId: subcategory.id }); setSearchQuery(""); }}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Layers className="w-5 h-5 text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate">{subcategory.name}</p>
                                {subcategory.description && <p className="text-xs text-muted-foreground truncate">{subcategory.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setDialogType("subcategory"); setEditingId(subcategory.id); setFormData({ name: subcategory.name, description: subcategory.description || "", price: "", image: "" }); setShowDialog(true); }}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteSubcategoryMutation.mutate(subcategory.id); }} className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Products View */}
            {panelState.view === "products" && (
              <div>
                <div className="flex-1 relative mb-4">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>

                {isLoading ? (
                  <LoadingSpinner />
                ) : products.length === 0 ? (
                  <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="py-12 text-center">
                      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                      <p className="text-muted-foreground font-medium mb-2">No hay productos</p>
                      <p className="text-xs text-muted-foreground mb-4">en: <span className="font-semibold">{getCategoryName(panelState.categoryId!)} → {getSubcategoryName(panelState.subcategoryId!)}</span></p>
                      <Button onClick={() => { setDialogType("product"); setEditingId(null); setFormData({ name: "", description: "", price: "", image: "" }); setShowDialog(true); }} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Primer Producto
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
                      <Card key={product.id} className="hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-green-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate">{product.name}</p>
                                {product.description && <p className="text-xs text-muted-foreground truncate">{product.description}</p>}
                                <div className="flex items-center gap-1 mt-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                                  <DollarSign className="w-3 h-3" />
                                  {(product.price / 100).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => deleteProductMutation.mutate(product.id)} className="text-destructive hover:bg-destructive/10 flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar" : "Nuevo"} {dialogType === "category" ? "Categoría" : dialogType === "subcategory" ? "Subcategoría" : "Producto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Electrónica"
                autoComplete="off"
              />
            </div>
            <div>
              <Label>Descripción {dialogType === "product" ? "*" : ""}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción breve"
                autoComplete="off"
                rows={3}
              />
            </div>
            {dialogType === "product" && (
              <div>
                <Label>Precio ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  autoComplete="off"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (!formData.name.trim()) {
                toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
                return;
              }
              if (dialogType === "product" && !formData.price.trim()) {
                toast({ title: "Error", description: "El precio es requerido", variant: "destructive" });
                return;
              }
              if (dialogType === "product" && isNaN(parseFloat(formData.price))) {
                toast({ title: "Error", description: "El precio debe ser un número válido", variant: "destructive" });
                return;
              }
              if (dialogType === "category") {
                editingId ? updateCategoryMutation.mutate() : createCategoryMutation.mutate();
              } else if (dialogType === "subcategory") {
                updateSubcategoryMutation.mutate();
              } else {
                createProductMutation.mutate();
              }
            }}>
              {editingId ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
