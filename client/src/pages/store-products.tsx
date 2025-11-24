import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Upload, Package, Eye, EyeOff, Copy, Link2, Check, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { StoreProduct, Store, StoreProductCategory, StoreProductSubcategory } from "@shared/schema";

export default function StoreProductsPage({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSubcategoryDialog, setShowSubcategoryDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<boolean | null>(null);
  const [slugCheckError, setSlugCheckError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: "", description: "" });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    stock: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Fetch store details
  const { data: store, isLoading: storeLoading } = useQuery<Store>({
    queryKey: ["/api/stores", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const response = await fetch(`/api/stores/${storeId}`);
      if (!response.ok) throw new Error("Error fetching store");
      return response.json();
    },
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<StoreProduct[]>({
    queryKey: ["/api/store-products", storeId],
    enabled: !!storeId,
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<StoreProductCategory[]>({
    queryKey: ["/api/store-product-categories", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const response = await fetch(`/api/store-product-categories?storeId=${storeId}`);
      if (!response.ok) throw new Error("Error fetching categories");
      return response.json();
    },
  });

  // Fetch subcategories
  const { data: subcategories = [] } = useQuery<StoreProductSubcategory[]>({
    queryKey: ["/api/store-product-subcategories", selectedCategory],
    enabled: !!selectedCategory,
    queryFn: async () => {
      const response = await fetch(`/api/store-product-subcategories?categoryId=${selectedCategory}`);
      if (!response.ok) throw new Error("Error fetching subcategories");
      return response.json();
    },
  });

  // Update slug mutation
  const updateSlugMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customUrl: customSlug }),
      });
      if (!response.ok) throw new Error("Error updating slug");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", storeId] });
      setEditingSlug(false);
      toast({ title: "✓ URL personalizada", description: "Tu slug de tienda ha sido actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!categoryForm.name.trim()) throw new Error("Nombre requerido");
      const response = await fetch("/api/store-product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          name: categoryForm.name,
          description: categoryForm.description,
          order: categories.length,
          isActive: true,
        }),
      });
      if (!response.ok) throw new Error("Error creando categoría");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-product-categories", storeId] });
      setCategoryForm({ name: "", description: "" });
      setShowCategoryDialog(false);
      toast({ title: "Categoría creada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create subcategory mutation
  const createSubcategoryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCategory) throw new Error("Selecciona una categoría");
      if (!subcategoryForm.name.trim()) throw new Error("Nombre requerido");
      const response = await fetch("/api/store-product-subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategory,
          name: subcategoryForm.name,
          description: subcategoryForm.description,
          order: subcategories.length,
          isActive: true,
        }),
      });
      if (!response.ok) throw new Error("Error creando subcategoría");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-product-subcategories", selectedCategory] });
      setSubcategoryForm({ name: "", description: "" });
      setShowSubcategoryDialog(false);
      toast({ title: "Subcategoría creada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/store-product-categories/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando categoría");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-product-categories", storeId] });
      toast({ title: "Categoría eliminada" });
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name.trim()) throw new Error("Nombre requerido");
      if (!formData.price.trim()) throw new Error("Precio requerido");
      
      let imageUrl = formData.image;
      if (imageFile) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
      }

      const response = await fetch("/api/store-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          name: formData.name,
          description: formData.description,
          image: imageUrl,
          price: Math.round(parseFloat(formData.price) * 100),
          originalPrice: formData.originalPrice ? Math.round(parseFloat(formData.originalPrice) * 100) : null,
          categoryId: selectedCategory || null,
          subcategoryId: selectedSubcategory || null,
          stock: parseInt(formData.stock) || 0,
          isActive: true,
        }),
      });
      if (!response.ok) throw new Error("Error creando producto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", storeId] });
      resetForm();
      setShowProductDialog(false);
      toast({ title: "Producto creado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/store-products/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando producto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", storeId] });
      toast({ title: "Producto eliminado" });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", originalPrice: "", stock: "", image: "" });
    setImageFile(null);
    setImagePreview("");
    setEditingId(null);
    setSelectedCategory("");
    setSelectedSubcategory("");
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="flex flex-col bg-background h-screen">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-lg font-bold text-foreground">{store?.name || "Catálogo de Productos"}</h1>
              <p className="text-xs text-muted-foreground mt-1">Gestiona categorías y productos</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowCategoryDialog(true)} variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Categoría
              </Button>
              <Button onClick={() => { resetForm(); setShowProductDialog(true); }} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </Button>
            </div>
          </div>

          {/* Slug Section */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/40">
            {editingSlug ? (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs font-semibold mb-2 block">Personalizar URL</Label>
                  <div className="flex gap-1">
                    <span className="text-xs text-muted-foreground self-center px-2 py-1 bg-background/60 rounded border border-border/40">/store/</span>
                    <Input
                      value={customSlug}
                      onChange={(e) => {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        setCustomSlug(slug);
                        setSlugCheckError(null);
                        if (slug.trim() && slug.length > 2) {
                          clearTimeout((window as any).slugCheckTimeout);
                          (window as any).slugCheckTimeout = setTimeout(async () => {
                            try {
                              const response = await fetch(`/api/stores/check-slug/${slug}`);
                              const data = await response.json();
                              setSlugAvailability(data.available);
                              if (!data.available) setSlugCheckError("Este slug ya está en uso");
                            } catch (err: any) {
                              setSlugCheckError("Error verificando disponibilidad");
                            }
                          }, 300);
                        }
                      }}
                      placeholder="mi-tienda"
                      className="flex-1 h-8 text-xs"
                    />
                  </div>
                  {customSlug.trim() && (
                    <p className={`text-xs mt-1 ${slugAvailability ? 'text-green-600 dark:text-green-400' : slugAvailability === false ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {slugAvailability === null ? "Verificando..." : slugAvailability ? "✓ Disponible" : "✗ No disponible"}
                    </p>
                  )}
                </div>
                <Button size="sm" onClick={() => updateSlugMutation.mutate()} disabled={updateSlugMutation.isPending || !customSlug.trim() || !slugAvailability} className="h-8 gap-1">
                  <Check className="w-3 h-3" />
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingSlug(false)} className="h-8">Cancelar</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => { setCustomSlug(store?.customUrl || ""); setEditingSlug(true); setSlugAvailability(null); }} className="gap-2 h-8 text-xs">
                <Link2 className="w-3 h-3" />
                Personalizar URL
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        <div className="max-w-7xl mx-auto w-full flex gap-4">
          {/* Sidebar - Categories */}
          <div className="w-64 border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="bg-muted/50 p-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Categorías</p>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {categoriesLoading ? (
                <div className="p-4 text-center"><LoadingSpinner /></div>
              ) : categories.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground text-center">No hay categorías</div>
              ) : (
                <div className="space-y-1 p-2">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <div className="flex items-center gap-1 hover:bg-muted/50 rounded px-2 py-1 group">
                        <button onClick={() => toggleCategory(cat.id)} className="p-0.5 hover:bg-muted rounded">
                          {expandedCategories.has(cat.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                        <Folder className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <button onClick={() => setSelectedCategory(cat.id)} className="flex-1 text-xs text-left truncate hover:text-foreground">
                          {cat.name}
                        </button>
                        <Button size="icon" variant="ghost" className="w-5 h-5 opacity-0 group-hover:opacity-100" onClick={() => deleteCategoryMutation.mutate(cat.id)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                      {expandedCategories.has(cat.id) && (
                        <div className="ml-4 space-y-1">
                          {subcategories.map((subcat) => (
                            <div key={subcat.id} className="flex items-center gap-1 hover:bg-muted/50 rounded px-2 py-1 group">
                              <button onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(subcat.id); }} className="flex-1 text-xs text-left truncate text-muted-foreground hover:text-foreground">
                                {subcat.name}
                              </button>
                            </div>
                          ))}
                          <button onClick={() => { setSelectedCategory(cat.id); setShowSubcategoryDialog(true); }} className="text-xs text-blue-500 px-2 py-1 hover:bg-blue-500/10 rounded w-full text-left">
                            + Subcategoría
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main - Products */}
          <div className="flex-1 border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="bg-muted/50 p-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Productos {products?.length ? `(${products.length})` : ""}</p>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {productsLoading ? (
                <div className="text-center"><LoadingSpinner /></div>
              ) : !products || products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-muted-foreground">No hay productos. Crea uno para comenzar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card key={product.id} className="hover-elevate">
                      {product.image && <img src={product.image} alt={product.name} className="w-full h-40 object-cover" />}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">${(product.price / 100).toFixed(2)}</span>
                          <Button size="icon" variant="ghost" onClick={() => deleteProductMutation.mutate(product.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
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
      </div>

      {/* Create Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>Crea una categoría para organizar tus productos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Ej: Electrónica" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="Descripción breve" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancelar</Button>
              <Button onClick={() => createCategoryMutation.mutate()} disabled={createCategoryMutation.isPending || !categoryForm.name.trim()}>
                {createCategoryMutation.isPending ? "Creando..." : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Subcategory Dialog */}
      <Dialog open={showSubcategoryDialog} onOpenChange={setShowSubcategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Subcategoría</DialogTitle>
            <DialogDescription>Crea una subcategoría dentro de esta categoría</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={subcategoryForm.name} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })} placeholder="Ej: Laptops" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={subcategoryForm.description} onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })} placeholder="Descripción breve" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSubcategoryDialog(false)}>Cancelar</Button>
              <Button onClick={() => createSubcategoryMutation.mutate()} disabled={createSubcategoryMutation.isPending || !subcategoryForm.name.trim()}>
                {createSubcategoryMutation.isPending ? "Creando..." : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Producto</DialogTitle>
            <DialogDescription>Crea un nuevo producto o servicio</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Foto del Producto</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50">
                <input id="product-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded" />
                ) : (
                  <label htmlFor="product-image" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Haz clic para subir una imagen</span>
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del producto" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe tu producto" className="h-20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Precio *</Label>
                <Input type="number" placeholder="0.00" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" placeholder="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory(""); }} className="w-full h-9 px-3 rounded-md border border-input text-sm">
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Subcategoría</Label>
                <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} disabled={!selectedCategory} className="w-full h-9 px-3 rounded-md border border-input text-sm disabled:opacity-50">
                  <option value="">Sin subcategoría</option>
                  {subcategories.map((subcat) => (
                    <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setShowProductDialog(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={() => createProductMutation.mutate()} disabled={createProductMutation.isPending || !formData.name.trim() || !formData.price.trim()}>
                {createProductMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
