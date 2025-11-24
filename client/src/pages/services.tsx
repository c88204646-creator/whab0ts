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
import { Plus, Trash2, Edit2, Search, AlertCircle, Wrench } from "lucide-react";
import type { StoreService } from "@shared/schema";

export default function ServicesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", price: "", duration: "" });

  const storeId = "default-store";

  const { data: services = [], isLoading } = useQuery<StoreService[]>({
    queryKey: ["/api/store-services", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/store-services?storeId=${storeId}`);
      if (!res.ok) throw new Error("Error fetching services");
      return res.json();
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/store-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          name: formData.name,
          description: formData.description,
          price: parseInt(formData.price) || 0,
          duration: formData.duration ? parseInt(formData.duration) : null,
        }),
      });
      if (!res.ok) throw new Error("Error creating service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-services", storeId] });
      setShowDialog(false);
      setFormData({ name: "", description: "", price: "", duration: "" });
      toast({ title: "Servicio creado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/store-services/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseInt(formData.price) || 0,
          duration: formData.duration ? parseInt(formData.duration) : null,
        }),
      });
      if (!res.ok) throw new Error("Error updating service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-services", storeId] });
      setShowDialog(false);
      setFormData({ name: "", description: "", price: "", duration: "" });
      setEditingId(null);
      toast({ title: "Servicio actualizado" });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/store-services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error deleting service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-services", storeId] });
      toast({ title: "Servicio eliminado" });
    },
  });

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
              <Wrench className="w-5 h-5 text-purple-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground">Servicios</h1>
              <p className="text-xs text-muted-foreground/80">Gestiona los servicios que ofrece tu tienda</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Total Servicios</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{services.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-border bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Servicios y Suscripciones</p>
              <p className="text-xs text-foreground/70 mt-0.5">Agrega servicios que tus chatbots pueden ofrecer a los clientes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar servicios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoComplete="off"
                  data-testid="input-search-services"
                />
              </div>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: "", description: "", price: "", duration: "" });
                  setShowDialog(true);
                }}
                className="gap-2"
                data-testid="button-add-service"
              >
                <Plus className="w-4 h-4" />
                Nuevo Servicio
              </Button>
            </div>

            {isLoading ? (
              <LoadingSpinner />
            ) : services.length === 0 ? (
              <Card className="border-dashed border-2 bg-muted/20">
                <CardContent className="py-12 text-center">
                  <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="text-muted-foreground font-medium mb-4">No hay servicios aún</p>
                  <Button
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: "", description: "", price: "", duration: "" });
                      setShowDialog(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Primer Servicio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="hover:border-primary/50 transition-colors" data-testid={`card-service-${service.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                            <Wrench className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                            )}
                            <div className="text-xs text-muted-foreground/60 mt-1">
                              ${(service.price / 100).toFixed(2)} {service.duration && `• ${service.duration} min`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(service.id);
                              setFormData({
                                name: service.name,
                                description: service.description || "",
                                price: (service.price / 100).toString(),
                                duration: service.duration?.toString() || "",
                              });
                              setShowDialog(true);
                            }}
                            data-testid={`button-edit-service-${service.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteServiceMutation.mutate(service.id)}
                            className="text-destructive hover:bg-destructive/10"
                            data-testid={`button-delete-service-${service.id}`}
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
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Consultoría"
                autoComplete="off"
                data-testid="input-service-name"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del servicio"
                autoComplete="off"
                data-testid="input-service-description"
              />
            </div>
            <div>
              <Label>Precio ($) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                autoComplete="off"
                data-testid="input-service-price"
              />
            </div>
            <div>
              <Label>Duración (minutos)</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Ej: 30"
                autoComplete="off"
                data-testid="input-service-duration"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!formData.name.trim()) {
                  toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
                  return;
                }
                editingId ? updateServiceMutation.mutate() : createServiceMutation.mutate();
              }}
              data-testid="button-save-service"
            >
              {editingId ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
