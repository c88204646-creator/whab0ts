import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Upload, Package } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { StoreProduct } from "@shared/schema";

export default function StoreProductsPage({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    stock: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: products, isLoading } = useQuery<StoreProduct[]>({
    queryKey: ["/api/store-products", storeId],
    enabled: !!storeId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name.trim()) throw new Error("Nombre requerido");
      
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
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
        }),
      });
      if (!response.ok) throw new Error("Error creando producto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", storeId] });
      resetForm();
      setShowDialog(false);
      toast({ title: "Producto creado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No product selected");
      
      let imageUrl = formData.image;
      if (imageFile) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
      }

      const response = await fetch(`/api/store-products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          image: imageUrl,
          price: Math.round(parseFloat(formData.price) * 100),
          originalPrice: formData.originalPrice ? Math.round(parseFloat(formData.originalPrice) * 100) : null,
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
        }),
      });
      if (!response.ok) throw new Error("Error actualizando producto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", storeId] });
      resetForm();
      setShowDialog(false);
      toast({ title: "Producto actualizado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/store-products/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando producto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-products", storeId] });
      toast({ title: "Producto eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      category: "",
      stock: "",
      image: "",
    });
    setImageFile(null);
    setImagePreview("");
    setEditingId(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (product: StoreProduct) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      price: (product.price / 100).toString(),
      originalPrice: product.originalPrice ? (product.originalPrice / 100).toString() : "",
      category: product.category || "",
      stock: product.stock.toString(),
      image: product.image || "",
    });
    setImagePreview(product.image || "");
    setEditingId(product.id);
    setShowDialog(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Productos</h1>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No hay productos</p>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Producto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="hover-elevate overflow-hidden">
              {product.image && (
                <img src={product.image} alt={product.name} className="w-full h-40 object-cover" />
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">${(product.price / 100).toFixed(2)}</span>
                  <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                    Stock: {product.stock}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive gap-2"
                    onClick={() => deleteMutation.mutate(product.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Actualiza los detalles del producto" : "Crea un nuevo producto o servicio"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-image">Foto del Producto</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50">
                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
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
              <Label htmlFor="product-name">Nombre *</Label>
              <Input
                id="product-name"
                placeholder="Nombre del producto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Descripción</Label>
              <Textarea
                id="product-description"
                placeholder="Describe tu producto o servicio"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-price">Precio *</Label>
                <Input
                  id="product-price"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-original-price">Precio Original</Label>
                <Input
                  id="product-original-price"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-category">Categoría</Label>
                <Input
                  id="product-category"
                  placeholder="Ej: Electrónica"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-stock">Stock</Label>
                <Input
                  id="product-stock"
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button
                onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}
                disabled={createMutation.isPending || updateMutation.isPending || !formData.name.trim()}
              >
                {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
