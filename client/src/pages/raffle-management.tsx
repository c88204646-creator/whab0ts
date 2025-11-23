import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Ticket, X, Edit2, Trash2, Copy, Check, Eye, Play, DollarSign } from "lucide-react";
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
    currency: "MXN",
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
      setFormData({ title: "", description: "", totalTickets: "100", ticketPrice: "50", currency: "MXN" });
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
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      {/* Banner Header */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Mis Rifas</h1>
                <p className="text-xs text-muted-foreground/80">Gestiona y publica tus rifas</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 flex-shrink-0">
                  <Plus className="w-4 h-4" />
                  Nueva Rifa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base">Crear Nueva Rifa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-xs font-semibold mb-1.5 block">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Ej: Laptop Gamer"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-8 text-xs"
                      data-testid="input-raffle-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-xs font-semibold mb-1.5 block">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe el premio..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="resize-none text-xs min-h-16"
                      data-testid="textarea-raffle-description"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="tickets" className="text-xs font-semibold mb-1.5 block">Boletos Totales</Label>
                      <Input
                        id="tickets"
                        type="text"
                        inputMode="numeric"
                        placeholder="100"
                        value={formData.totalTickets}
                        onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value.replace(/[^\d]/g, '') })}
                        className="h-8 text-xs"
                        data-testid="input-total-tickets"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency" className="text-xs font-semibold mb-1.5 block">Divisa</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger className="h-8 text-xs" data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MXN">MXN</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-xs font-semibold mb-1.5 block">Precio por Boleto</Label>
                    <Input
                      id="price"
                      type="text"
                      inputMode="numeric"
                      placeholder="50"
                      value={formData.ticketPrice}
                      onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value.replace(/[^\d]/g, '') })}
                      className="h-8 text-xs"
                      data-testid="input-ticket-price"
                    />
                  </div>
                  <Button onClick={handleCreateRaffle} className="w-full h-8 text-xs" disabled={createRaffleMutation.isPending}>
                    {createRaffleMutation.isPending ? "Creando..." : "Crear Rifa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-5">
            <div className="px-5 py-4 bg-muted/20 rounded-lg border border-border/40">
              <p className="text-xs text-muted-foreground font-medium">Total</p>
              <p className="text-2xl font-bold text-foreground mt-2">{raffles.length}</p>
            </div>
            <div className="px-5 py-4 bg-muted/20 rounded-lg border border-border/40">
              <p className="text-xs text-muted-foreground font-medium">Activas</p>
              <p className="text-2xl font-bold text-primary mt-2">{raffles.filter((r: Raffle) => r.status === "active").length}</p>
            </div>
            <div className="px-5 py-4 bg-muted/20 rounded-lg border border-border/40">
              <p className="text-xs text-muted-foreground font-medium">Ventas</p>
              <p className="text-2xl font-bold text-foreground mt-2">$0</p>
            </div>
            <div className="px-5 py-4 bg-muted/20 rounded-lg border border-border/40">
              <p className="text-xs text-muted-foreground font-medium">Boletos</p>
              <p className="text-2xl font-bold text-foreground mt-2">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : raffles.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-sm">No tienes rifas aún. Crea una para comenzar.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {raffles.map((raffle: Raffle) => (
                <Card key={raffle.id} className="flex flex-col hover-elevate transition-all">
                  <CardHeader className="pb-3 border-b border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">{raffle.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{raffle.description}</p>
                      </div>
                      {getStatusBadge(raffle)}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 py-3 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Boletos:</span>
                      <span className="font-semibold text-foreground">{raffle.totalTickets}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Precio:</span>
                      <span className="font-semibold text-foreground">${raffle.ticketPrice}</span>
                    </div>
                  </CardContent>
                  <div className="flex gap-1.5 px-3 py-2.5 border-t border-border bg-muted/20">
                    <Button variant="ghost" size="sm" className="flex-1 h-7 gap-1.5 text-xs" onClick={() => copyShareLink(raffle.id)} data-testid={`button-copy-link-${raffle.id}`}>
                      {copiedId === raffle.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copiedId === raffle.id ? "Copiado" : "Compartir"}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 h-7 gap-1.5 text-xs" onClick={() => window.location.href = `/raffle/${raffle.id}`} data-testid={`button-view-${raffle.id}`}>
                      <Eye className="w-3 h-3" />
                      Ver
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 h-7 gap-1.5 text-xs" onClick={() => publishRaffleMutation.mutate(raffle.id)} data-testid={`button-publish-${raffle.id}`} disabled={raffle.isPublished || publishRaffleMutation.isPending}>
                      <Play className="w-3 h-3" />
                      {raffle.isPublished ? "En línea" : "Publicar"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRaffleMutation.mutate(raffle.id)} data-testid={`button-delete-${raffle.id}`} disabled={deleteRaffleMutation.isPending}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
