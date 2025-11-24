import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Plus, Trash2, Edit2, ChevronRight, Package, Layers, Tag, Search, AlertCircle } from "lucide-react";
import type { StoreProductCategory, StoreProductSubcategory } from "@shared/schema";

interface PanelState {
  view: "categories" | "subcategories";
  categoryId?: string;
}

export default function ProductsPage() {
  const { toast } = useToast();
  const [panelState, setPanelState] = useState<PanelState>({ view: "categories" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const storeId = "default-store";

  // Queries
  const { data: categories = [], isLoading: catsLoading } = useQuery<StoreProductCategory[]>({
    queryKey: ["/api/store-product-categories", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/store-product-categories?storeId=${storeId}`);
      if (!res.ok) throw new Error("Error fetching categories");
      return res.json();
    },
  });

  const { data: subcategories = [], isLoading: subCatsLoading } = useQuery<StoreProductSubcategory[]>({
    queryKey: ["/api/store-product-subcategories", panelState.categoryId],
    queryFn: async () => {
      const res = await fetch(`/api/store-product-subcategories?categoryId=${panelState.categoryId}`);
      if (!res.ok) throw new Error("Error fetching subcategories");
      return res.json();
    },
    enabled: panelState.view === "subcategories" && !!panelState.categoryId,
  });

  // Mutations
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
      setFormData({ name: "", description: "" });
      toast({ title: "Categoría creada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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
      setFormData({ name: "", description: "" });
      toast({ title: "Subcategoría creada" });
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
      setFormData({ name: "", description: "" });
      setEditingId(null);
      toast({ title: "Categoría actualizada" });
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
      setFormData({ name: "", description: "" });
      setEditingId(null);
      toast({ title: "Subcategoría actualizada" });
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

  const isLoading = catsLoading || subCatsLoading;

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground">Productos</h1>
              <p className="text-xs text-muted-foreground/80">Organiza tus productos por categorías y subcategorías</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Categorías</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{categories.length}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Subcategorías</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{subcategories.length}</p>
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
              <p className="text-sm font-semibold text-foreground">Estructura WooCommerce</p>
              <p className="text-xs text-foreground/70 mt-0.5">Crea primero categorías, luego subcategorías dentro de ellas</p>
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
                  <span className="text-primary font-medium">Subcategorías</span>
                </>
              )}
            </div>

            {/* Categories View */}
            {panelState.view === "categories" && (
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar categorías..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      autoComplete="off"
                      data-testid="input-search-categories"
                    />
                  </div>
                  <Button onClick={() => { setEditingId(null); setFormData({ name: "", description: "" }); setShowDialog(true); }} className="gap-2" data-testid="button-add-category">
                    <Plus className="w-4 h-4" />
                    Nueva Categoría
                  </Button>
                </div>

                {isLoading ? (
                  <LoadingSpinner />
                ) : categories.length === 0 ? (
                  <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="py-12 text-center">
                      <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                      <p className="text-muted-foreground font-medium mb-4">No hay categorías aún</p>
                      <Button onClick={() => { setEditingId(null); setFormData({ name: "", description: "" }); setShowDialog(true); }} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Primera Categoría
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((category) => (
                      <Card key={category.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setPanelState({ view: "subcategories", categoryId: category.id }); setSearchQuery(""); }} data-testid={`card-category-${category.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <Tag className="w-5 h-5 text-purple-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate">{category.name}</p>
                                {category.description && (
                                  <p className="text-xs text-muted-foreground truncate">{category.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); setEditingId(category.id); setFormData({ name: category.name, description: category.description || "" }); setShowDialog(true); }}
                                data-testid={`button-edit-category-${category.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); deleteCategoryMutation.mutate(category.id); }}
                                className="text-destructive hover:bg-destructive/10"
                                data-testid={`button-delete-category-${category.id}`}
                              >
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
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar subcategorías..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      autoComplete="off"
                      data-testid="input-search-subcategories"
                    />
                  </div>
                  <Button onClick={() => { setEditingId(null); setFormData({ name: "", description: "" }); setShowDialog(true); }} className="gap-2" data-testid="button-add-subcategory">
                    <Plus className="w-4 h-4" />
                    Nueva Subcategoría
                  </Button>
                </div>

                {isLoading ? (
                  <LoadingSpinner />
                ) : subcategories.length === 0 ? (
                  <Card className="border-dashed border-2 bg-muted/20">
                    <CardContent className="py-12 text-center">
                      <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                      <p className="text-muted-foreground font-medium mb-4">No hay subcategorías aún</p>
                      <Button onClick={() => { setEditingId(null); setFormData({ name: "", description: "" }); setShowDialog(true); }} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Crear Primera Subcategoría
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {subcategories.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((subcategory) => (
                      <Card key={subcategory.id} className="hover:border-primary/50 transition-colors" data-testid={`card-subcategory-${subcategory.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Layers className="w-5 h-5 text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate">{subcategory.name}</p>
                                {subcategory.description && (
                                  <p className="text-xs text-muted-foreground truncate">{subcategory.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => { setEditingId(subcategory.id); setFormData({ name: subcategory.name, description: subcategory.description || "" }); setShowDialog(true); }}
                                data-testid={`button-edit-subcategory-${subcategory.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteSubcategoryMutation.mutate(subcategory.id)}
                                className="text-destructive hover:bg-destructive/10"
                                data-testid={`button-delete-subcategory-${subcategory.id}`}
                              >
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
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar" : "Nueva"} {panelState.view === "subcategories" ? "Subcategoría" : "Categoría"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Electrónica"
                autoComplete="off"
                data-testid="input-category-name"
              />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción breve"
                autoComplete="off"
                data-testid="input-category-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (!formData.name.trim()) {
                toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
                return;
              }
              if (panelState.view === "subcategories") {
                editingId ? updateSubcategoryMutation.mutate() : createSubcategoryMutation.mutate();
              } else {
                editingId ? updateCategoryMutation.mutate() : createCategoryMutation.mutate();
              }
            }} data-testid="button-save-category">
              {editingId ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
