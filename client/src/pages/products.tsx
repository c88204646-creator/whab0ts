import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, X, ShoppingBag, DollarSign, Link as LinkIcon } from "lucide-react";
import type { Product } from "@shared/schema";

export default function ProductsPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    purchaseUrl: "",
    cost: "",
    categories: [] as string[],
  });
  const [categoryInput, setCategoryInput] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) setUserId(user.id);
  }, []);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", userId],
    queryFn: async () => {
      const response = await fetch(`/api/products?userId=${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error creando producto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", userId] });
      setFormData({ title: "", description: "", purchaseUrl: "", cost: "", categories: [] });
      setShowNewForm(false);
      toast({ title: "Producto creado exitosamente" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error actualizando producto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", userId] });
      setEditingId(null);
      setFormData({ title: "", description: "", purchaseUrl: "", cost: "", categories: [] });
      toast({ title: "Producto actualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando producto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", userId] });
      toast({ title: "Producto eliminado" });
    },
  });

  const handleAddCategory = () => {
    if (categoryInput.trim() && !formData.categories.includes(categoryInput.trim())) {
      setFormData({
        ...formData,
        categories: [...formData.categories, categoryInput.trim()],
      });
      setCategoryInput("");
    }
  };

  const handleRemoveCategory = (category: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter(c => c !== category),
    });
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
      return;
    }

    const data = {
      userId,
      title: formData.title,
      description: formData.description,
      purchaseUrl: formData.purchaseUrl || null,
      cost: formData.cost ? parseInt(formData.cost) * 100 : null, // Convert to cents
      categories: formData.categories,
      isActive: true,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      title: product.title,
      description: product.description || "",
      purchaseUrl: product.purchaseUrl || "",
      cost: product.cost ? (product.cost / 100).toString() : "",
      categories: product.categories || [],
    });
    setShowNewForm(true);
  };

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) return <div className="flex items-center justify-center h-full">Cargando...</div>;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-16 px-6 border-b border-border flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Productos y Servicios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona tu catálogo profesional</p>
        </div>
        <Button onClick={() => { setShowNewForm(true); setEditingId(null); setFormData({ title: "", description: "", purchaseUrl: "", cost: "", categories: [] }); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Search */}
          <div>
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10"
              data-testid="input-search-products"
            />
          </div>

          {/* New/Edit Form */}
          {showNewForm && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Título *</Label>
                  <Input
                    placeholder="Ej: Servicio Premium de Consultoría"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1.5"
                    data-testid="input-product-title"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">Descripción</Label>
                  <Textarea
                    placeholder="Describe tu producto o servicio..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1.5 resize-none"
                    rows={3}
                    data-testid="textarea-product-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Costo (Opcional)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="mt-1.5"
                      data-testid="input-product-cost"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">URL de Compra (Opcional)</Label>
                    <Input
                      placeholder="https://..."
                      value={formData.purchaseUrl}
                      onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
                      className="mt-1.5"
                      data-testid="input-product-url"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Categorías</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Agregar categoría..."
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                      className="flex-1"
                      data-testid="input-product-category"
                    />
                    <Button onClick={handleAddCategory} variant="outline" size="sm">
                      Agregar
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.categories.map(cat => (
                      <Badge key={cat} variant="secondary" className="gap-1">
                        {cat}
                        <button onClick={() => handleRemoveCategory(cat)} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => { setShowNewForm(false); setEditingId(null); }}
                    className="flex-1"
                    data-testid="button-cancel-product"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-product"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-semibold">No hay productos</h3>
              <p className="text-sm text-muted-foreground mt-1">Crea tu primer producto para comenzar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="hover-elevate">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">{product.title}</CardTitle>
                        {product.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                          className="h-8 w-8"
                          data-testid={`button-edit-product-${product.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(product.id)}
                          className="h-8 w-8 hover:text-destructive"
                          data-testid={`button-delete-product-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Cost */}
                    {product.cost && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-semibold">${(product.cost / 100).toFixed(2)}</span>
                      </div>
                    )}

                    {/* Purchase URL */}
                    {product.purchaseUrl && (
                      <a
                        href={product.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                        data-testid={`link-product-purchase-${product.id}`}
                      >
                        <LinkIcon className="w-4 h-4" />
                        Comprar
                      </a>
                    )}

                    {/* Categories */}
                    {product.categories && product.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {product.categories.map(cat => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Status */}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </span>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
