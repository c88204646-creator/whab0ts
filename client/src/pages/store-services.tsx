import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Plus, Edit2, Trash2, Loader2, Clock, DollarSign } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function StoreServicesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    durationMinutes: 60,
    price: 0,
    image: "",
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["/api/store-services", storeId],
    enabled: !!storeId,
    queryFn: () => apiRequest(`/api/store-services?storeId=${storeId}`),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/store-services`, { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-services"] });
      setFormData({ name: "", description: "", durationMinutes: 60, price: 0, image: "" });
      toast({ title: "Éxito", description: "Servicio creado" });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/store-services/${editingId}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-services"] });
      setEditingId(null);
      setFormData({ name: "", description: "", durationMinutes: 60, price: 0, image: "" });
      toast({ title: "Éxito", description: "Servicio actualizado" });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/store-services/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-services"] });
      toast({ title: "Éxito", description: "Servicio eliminado" });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleSubmit = async () => {
    if (!formData.name || !storeId) {
      toast({ title: "Error", description: "Completa los campos requeridos", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ ...formData, storeId });
    } else {
      createMutation.mutate({ ...formData, storeId });
    }
  };

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description || "",
      durationMinutes: service.durationMinutes,
      price: service.price,
      image: service.image || "",
    });
  };

  return (
    <div className="flex flex-col bg-background h-screen">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Catálogo de Servicios</h1>
                <p className="text-xs text-muted-foreground/80">Gestiona los servicios disponibles para tus agentes IA</p>
              </div>
            </div>
            <Button onClick={() => setLocation("/commerce")} size="sm" data-testid="button-back">
              Volver
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <Card className="p-4">
              <h2 className="text-lg font-bold mb-4">{editingId ? "Editar" : "Nuevo"} Servicio</h2>
              <div className="space-y-3">
                <Input
                  placeholder="Nombre del servicio"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-service-name"
                />
                <Textarea
                  placeholder="Descripción"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="resize-none h-20"
                  data-testid="input-service-description"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Duración (min)"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                    data-testid="input-service-duration"
                  />
                  <Input
                    type="number"
                    placeholder="Precio (centavos)"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    data-testid="input-service-price"
                  />
                </div>
                <Input
                  placeholder="URL imagen"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  data-testid="input-service-image"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!storeId || createMutation.isPending || updateMutation.isPending}
                  className="w-full"
                  data-testid="button-save-service"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {editingId ? "Actualizar" : "Crear"}
                    </>
                  )}
                </Button>
                {editingId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: "", description: "", durationMinutes: 60, price: 0, image: "" });
                    }}
                    className="w-full"
                    data-testid="button-cancel-edit"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </Card>

            {/* Services List */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <Card className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Cargando servicios...</p>
                </Card>
              ) : services.length === 0 ? (
                <Card className="p-8 text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground">Sin servicios disponibles</p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {services.map((service: any) => (
                    <Card key={service.id} className="p-4" data-testid={`card-service-${service.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">{service.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(service)}
                            data-testid={`button-edit-service-${service.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(service.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-service-${service.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{service.durationMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>${(service.price / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
