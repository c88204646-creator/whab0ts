import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Ticket, Users, TrendingUp, X, Edit2, Trash2, Copy, Check, Eye, Play, DollarSign } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Raffle } from "@shared/schema";

export default function RaffleManagementPage() {
  const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalTickets: "100",
    ticketPrice: "50",
  });
  const { toast } = useToast();

  const { data: raffles = [], isLoading } = useQuery({
    queryKey: ["/api/raffles", userId],
    queryFn: async () => {
      const response = await fetch(`/api/raffles?userId=${userId}`);
      return response.json();
    },
  });

  const createRaffleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/raffles", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          userId,
          totalTickets: parseInt(data.totalTickets),
          ticketPrice: parseInt(data.ticketPrice),
          status: "draft",
          isPublished: false,
        }),
      });
    },
    onSuccess: () => {
      toast({ title: "✓ Rifa creada", description: "Tu rifa se ha creado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", userId] });
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "", totalTickets: "100", ticketPrice: "50" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const publishRaffleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/raffles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: true, status: "active" }),
      });
    },
    onSuccess: () => {
      toast({ title: "✓ Publicada", description: "Tu rifa está en línea" });
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", userId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteRaffleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/raffles/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "✓ Eliminada" });
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", userId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateRaffle = () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
      return;
    }
    createRaffleMutation.mutate(formData);
  };

  const copyShareLink = (raffleId: string) => {
    const link = `${window.location.origin}/raffle/${raffleId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(raffleId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Enlace copiado" });
  };

  const getStatusBadge = (raffle: Raffle) => {
    const variants: any = {
      draft: "bg-slate-500",
      active: "bg-green-600",
      closed: "bg-orange-600",
      finished: "bg-blue-600",
    };
    const labels: any = {
      draft: "Borrador",
      active: "Activa",
      closed: "Cerrada",
      finished: "Finalizada",
    };
    return (
      <Badge className={variants[raffle.status || "draft"]}>
        {labels[raffle.status || "draft"]}
      </Badge>
    );
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Rifas</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona y publica tus rifas</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Rifa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nueva Rifa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Laptop Gamer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    data-testid="input-raffle-title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe el premio..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="resize-none"
                    data-testid="textarea-raffle-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tickets">Boletos Totales</Label>
                    <Input
                      id="tickets"
                      type="number"
                      min="1"
                      max="999999"
                      value={formData.totalTickets}
                      onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                      data-testid="input-total-tickets"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Precio por Boleto ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      value={formData.ticketPrice}
                      onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                      data-testid="input-ticket-price"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateRaffle} className="w-full" disabled={createRaffleMutation.isPending}>
                  {createRaffleMutation.isPending ? "Creando..." : "Crear Rifa"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Rifas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{raffles.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{raffles.filter((r: Raffle) => r.status === "active").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Boletos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
        </div>

        {/* Raffles List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        ) : raffles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No tienes rifas aún. Crea una para comenzar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {raffles.map((raffle: Raffle) => (
              <Card key={raffle.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{raffle.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{raffle.description}</p>
                    </div>
                    {getStatusBadge(raffle)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Boletos:</span>
                    <span className="font-semibold">{raffle.totalTickets}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Precio:</span>
                    <span className="font-semibold">${raffle.ticketPrice}</span>
                  </div>
                </CardContent>
                <div className="border-t border-border/30 p-3 flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-8 text-xs gap-1"
                    onClick={() => copyShareLink(raffle.id)}
                    data-testid={`button-share-raffle-${raffle.id}`}
                  >
                    {copiedId === raffle.id ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Compartir
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => window.location.href = `/raffle/${raffle.id}`}
                    data-testid={`button-view-raffle-${raffle.id}`}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => publishRaffleMutation.mutate(raffle.id)}
                    disabled={raffle.status === "active" || publishRaffleMutation.isPending}
                    data-testid={`button-publish-raffle-${raffle.id}`}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteRaffleMutation.mutate(raffle.id)}
                    data-testid={`button-delete-raffle-${raffle.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
