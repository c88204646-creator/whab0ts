import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, Folder, FileText, Sparkles, Eye, EyeOff } from "lucide-react";
import type { KnowledgeBaseCategory, KnowledgeBaseSubcategory, KnowledgeBaseItem } from "@shared/schema";

interface KnowledgeBaseProps {
  chatbotId: string;
}

export function KnowledgeBaseManager({ chatbotId }: KnowledgeBaseProps) {
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");

  const { data: categories = [] } = useQuery<KnowledgeBaseCategory[]>({
    queryKey: [`/api/knowledge-base/categories/${chatbotId}`],
    queryFn: async () => {
      const response = await fetch(`/api/knowledge-base/categories/${chatbotId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!chatbotId,
  });

  const { data: items = [] } = useQuery<KnowledgeBaseItem[]>({
    queryKey: [`/api/knowledge-base/items/${chatbotId}`],
    queryFn: async () => {
      const response = await fetch(`/api/knowledge-base/items/${chatbotId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!chatbotId,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; chatbotId: string; order: number }) => {
      const response = await fetch("/api/knowledge-base/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error creando categoría");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/categories/${chatbotId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/knowledge-base/categories/${chatbotId}`] });
      setNewCategoryName("");
      setNewCategoryDesc("");
      setShowNewCategory(false);
      toast({ title: "Categoría creada", description: "La categoría se ha agregado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear la categoría", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/knowledge-base/categories/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando categoría");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/categories/${chatbotId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/knowledge-base/categories/${chatbotId}`] });
      toast({ title: "Categoría eliminada" });
    },
  });

  const toggleCategoryMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/knowledge-base/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!response.ok) throw new Error("Error actualizando categoría");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/categories/${chatbotId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/knowledge-base/categories/${chatbotId}`] });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: {
      chatbotId: string;
      categoryId: string;
      title: string;
      content: string;
      keywords: string[];
    }) => {
      const response = await fetch("/api/knowledge-base/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error creando elemento");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/items/${chatbotId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/knowledge-base/items/${chatbotId}`] });
      toast({ title: "Contenido agregado", description: "El elemento se ha agregado exitosamente" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/knowledge-base/items/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando elemento");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/items/${chatbotId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/knowledge-base/items/${chatbotId}`] });
      toast({ title: "Contenido eliminado" });
    },
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/knowledge-base/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!response.ok) throw new Error("Error actualizando elemento");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/knowledge-base/items/${chatbotId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/knowledge-base/items/${chatbotId}`] });
    },
  });

  const toggleCategory = (categoryId: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setExpandedCategories(newSet);
  };

  const getCategoryItems = (categoryId: string) => {
    return items.filter((item) => item.categoryId === categoryId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Base de Conocimientos Profesional
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Organiza tu información en categorías y subcategorías para respuestas inteligentes
          </p>
        </div>
        <Button onClick={() => setShowNewCategory(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* New Category Form */}
      {showNewCategory && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="new-category-name" className="text-sm font-semibold">
                Nombre de la Categoría
              </Label>
              <Input
                id="new-category-name"
                placeholder="Ej: Políticas de Envío"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                data-testid="input-category-name"
                className="mt-2 h-10"
              />
            </div>
            <div>
              <Label htmlFor="new-category-desc" className="text-sm font-semibold">
                Descripción
              </Label>
              <Textarea
                id="new-category-desc"
                placeholder="Describe el contenido de esta categoría..."
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                data-testid="textarea-category-desc"
                className="mt-2 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  createCategoryMutation.mutate({
                    name: newCategoryName,
                    description: newCategoryDesc,
                    chatbotId,
                    order: categories.length,
                  });
                }}
                disabled={!newCategoryName || createCategoryMutation.isPending}
                data-testid="button-create-category"
              >
                {createCategoryMutation.isPending ? "Creando..." : "Crear"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategoryName("");
                  setNewCategoryDesc("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
        {categories.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-medium">No hay categorías aún</p>
              <p className="text-sm text-muted-foreground mt-1">Crea tu primera categoría para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          categories.map((category) => {
            const categoryItems = getCategoryItems(category.id);
            const isExpanded = expandedCategories.has(category.id);

            return (
              <Card key={category.id} className="bg-background/50 border-border/50 overflow-hidden">
                <div
                  onClick={() => toggleCategory(category.id)}
                  className="px-4 py-2 bg-gradient-to-r from-primary/5 to-primary/10 cursor-pointer hover:from-primary/10 hover:to-primary/15 transition-colors flex items-center justify-between border-b border-border/30"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-primary" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Folder className="w-4 h-4 text-primary" />
                        {category.name}
                      </h4>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {categoryItems.length} elementos
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategoryMutation.mutate({ id: category.id, isActive: category.isActive });
                      }}
                      disabled={toggleCategoryMutation.isPending}
                      data-testid={`button-toggle-category-${category.id}`}
                      title={category.isActive ? "Desactivar categoría" : "Activar categoría"}
                    >
                      {category.isActive ? (
                        <Eye className="w-4 h-4 text-primary" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategoryMutation.mutate(category.id);
                      }}
                      disabled={deleteCategoryMutation.isPending}
                      data-testid={`button-delete-category-${category.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="pt-3 pb-3 space-y-2 max-h-[40vh] overflow-y-auto">
                    {/* Items List */}
                    {categoryItems.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <FileText className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <p className="text-xs">No hay elementos en esta categoría</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categoryItems.map((item) => (
                          <Card key={item.id} className={`border-border/50 ${item.isActive ? "bg-muted/30" : "bg-muted/10 opacity-60"}`}>
                            <CardContent className="pt-2 pb-2">
                              <div className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-xs flex items-center gap-1">
                                      <FileText className="w-3 h-3 text-primary/60" />
                                      {item.title}
                                      {!item.isActive && <Badge variant="outline" className="text-xs">Desactivado</Badge>}
                                    </h5>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.content}</p>
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => toggleItemMutation.mutate({ id: item.id, isActive: item.isActive })}
                                      disabled={toggleItemMutation.isPending}
                                      data-testid={`button-toggle-item-${item.id}`}
                                      title={item.isActive ? "Desactivar elemento" : "Activar elemento"}
                                      className="h-6 w-6"
                                    >
                                      {item.isActive ? (
                                        <Eye className="w-3 h-3 text-primary" />
                                      ) : (
                                        <EyeOff className="w-3 h-3 text-muted-foreground" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteItemMutation.mutate(item.id)}
                                      disabled={deleteItemMutation.isPending}
                                      data-testid={`button-delete-item-${item.id}`}
                                      className="h-6 w-6"
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                                {item.keywords && item.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-0.5 mt-1">
                                    {item.keywords.slice(0, 3).map((keyword) => (
                                      <Badge key={keyword} variant="outline" className="text-xs">
                                        {keyword}
                                      </Badge>
                                    ))}
                                    {item.keywords.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{item.keywords.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Add Item Form */}
                    <Button
                      variant="outline"
                      className="w-full gap-2 mt-4"
                      onClick={() => setEditingItem(category.id)}
                      data-testid={`button-add-item-${category.id}`}
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Contenido
                    </Button>

                    {editingItem === category.id && (
                      <ItemForm
                        categoryId={category.id}
                        chatbotId={chatbotId}
                        onSuccess={() => setEditingItem(null)}
                        onCancel={() => setEditingItem(null)}
                        createItemMutation={createItemMutation}
                      />
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function ItemForm({
  categoryId,
  chatbotId,
  onSuccess,
  onCancel,
  createItemMutation,
}: {
  categoryId: string;
  chatbotId: string;
  onSuccess: () => void;
  onCancel: () => void;
  createItemMutation: any;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");

  return (
    <Card className="bg-primary/5 border-primary/20 mt-4">
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label htmlFor="item-title" className="text-sm font-semibold">
            Título
          </Label>
          <Input
            id="item-title"
            placeholder="Ej: Envíos Internacionales"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid="input-item-title"
            className="mt-2 h-10"
          />
        </div>
        <div>
          <Label htmlFor="item-content" className="text-sm font-semibold">
            Contenido
          </Label>
          <Textarea
            id="item-content"
            placeholder="Escribe el contenido detallado..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            data-testid="textarea-item-content"
            className="mt-2 resize-none"
            rows={4}
          />
        </div>
        <div>
          <Label htmlFor="item-keywords" className="text-sm font-semibold">
            Palabras Clave (separadas por comas)
          </Label>
          <Input
            id="item-keywords"
            placeholder="Ej: envío, internacional, tarifa"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            data-testid="input-item-keywords"
            className="mt-2 h-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              createItemMutation.mutate({
                chatbotId,
                categoryId,
                title,
                content,
                keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
              });
              setTitle("");
              setContent("");
              setKeywords("");
              onSuccess();
            }}
            disabled={!title || !content || createItemMutation.isPending}
            data-testid="button-save-item"
          >
            {createItemMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
