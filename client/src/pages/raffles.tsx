import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Ticket, Users, TrendingUp, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Raffle } from "@shared/schema";

export default function RafflesPage() {
  const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
  const [activeTab, setActiveTab] = useState("list");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalTickets: "100",
    ticketPrice: "100",
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
          totalTickets: Number(data.totalTickets),
          ticketPrice: Number(data.ticketPrice) * 100, // Convert to cents
          status: "draft",
          isPublished: false,
        }),
      });
    },
    onSuccess: () => {
      toast({ title: "Éxito", description: "Rifa creada correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", userId] });
      setIsDialogOpen(false);
      setFormData({ title: "", description: "", totalTickets: "100", ticketPrice: "100" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-600";
      case "active":
        return "bg-green-600";
      case "closed":
        return "bg-orange-600";
      case "finished":
        return "bg-blue-600";
      default:
        return "bg-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Borrador";
      case "active":
        return "Activa";
      case "closed":
        return "Cerrada";
      case "finished":
        return "Finalizada";
      default:
        return status;
    }
  };

  const handleCreateRaffle = () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
      return;
    }
    createRaffleMutation.mutate(formData);
  };

  // Calculate aggregate stats
  const totalRaffles = raffles.length;
  const activeRaffles = raffles.filter(r => r.status === "active").length;
  const totalTickets = raffles.reduce((sum, r) => sum + (r.totalTickets || 0), 0);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rifas</h1>
          <p className="text-sm text-secondary-foreground mt-1">Gestiona tus rifas y venta de boletos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="default" className="gap-2" data-testid="button-create-raffle">
              <Plus className="w-4 h-4" />
              Nueva Rifa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Rifa</DialogTitle>
              <DialogDescription>Completa los datos básicos de tu rifa. Podrás editarlos después.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Rifa *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Rifa de Auto 2024"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-background border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el premio y detalles de la rifa"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background border-border/50 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalTickets">Total de Boletos</Label>
                  <Input
                    id="totalTickets"
                    type="number"
                    min="1"
                    value={formData.totalTickets}
                    onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                    className="bg-background border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Precio por Boleto ($)</Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                    className="bg-background border-border/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateRaffle}
                disabled={createRaffleMutation.isPending}
              >
                {createRaffleMutation.isPending ? "Creando..." : "Crear Rifa"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-raffles">
            <TabsTrigger value="list">Mis Rifas</TabsTrigger>
            <TabsTrigger value="purchases">Compras Totales</TabsTrigger>
            <TabsTrigger value="analytics">Estadísticas Generales</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Rifas</p>
                <p className="text-2xl font-bold">{totalRaffles}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Activas</p>
                <p className="text-2xl font-bold text-green-600">{activeRaffles}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Boletos</p>
                <p className="text-2xl font-bold">{totalTickets}</p>
              </Card>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-secondary-foreground">Cargando...</div>
              </div>
            ) : raffles.length === 0 ? (
              <Card className="p-12 text-center">
                <Ticket className="w-12 h-12 mx-auto mb-4 text-secondary-foreground opacity-50" />
                <p className="text-secondary-foreground mb-4">No tienes rifas aún</p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="default" data-testid="button-create-raffle-empty">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear tu primera rifa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Crear Nueva Rifa</DialogTitle>
                      <DialogDescription>Completa los datos básicos de tu rifa. Podrás editarlos después.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title2">Título de la Rifa *</Label>
                        <Input
                          id="title2"
                          placeholder="Ej: Rifa de Auto 2024"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="bg-background border-border/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description2">Descripción</Label>
                        <Textarea
                          id="description2"
                          placeholder="Describe el premio y detalles de la rifa"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="bg-background border-border/50 resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="totalTickets2">Total de Boletos</Label>
                          <Input
                            id="totalTickets2"
                            type="number"
                            min="1"
                            value={formData.totalTickets}
                            onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                            className="bg-background border-border/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ticketPrice2">Precio por Boleto ($)</Label>
                          <Input
                            id="ticketPrice2"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.ticketPrice}
                            onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                            className="bg-background border-border/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateRaffle}
                        disabled={createRaffleMutation.isPending}
                      >
                        {createRaffleMutation.isPending ? "Creando..." : "Crear Rifa"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {raffles.map((raffle: Raffle) => (
                  <Card 
                    key={raffle.id} 
                    className="p-4 hover-elevate cursor-pointer transition-all" 
                    data-testid={`card-raffle-${raffle.id}`}
                    onClick={() => window.location.href = `/raffles/${raffle.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">{raffle.title}</h3>
                        <p className="text-sm text-secondary-foreground mt-1">{raffle.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-sm text-secondary-foreground flex items-center gap-1">
                            <Ticket className="w-4 h-4" />
                            {raffle.totalTickets} boletos
                          </span>
                          <span className="text-sm font-medium text-foreground">${(raffle.ticketPrice / 100).toFixed(2)}</span>
                          <Badge className={getStatusColor(raffle.status || "draft")} variant="secondary" data-testid={`badge-status-${raffle.id}`}>
                            {getStatusLabel(raffle.status || "draft")}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          data-testid={`button-edit-raffle-${raffle.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/raffles/${raffle.id}`;
                          }}
                        >
                          Gestionar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases" className="mt-6">
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-secondary-foreground opacity-50" />
              <p className="text-secondary-foreground">Ver compras desde el panel de cada rifa</p>
              <p className="text-xs text-muted-foreground mt-2">Selecciona una rifa para ver sus compras y estadísticas</p>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="p-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-secondary-foreground opacity-50" />
              <p className="text-secondary-foreground">Ver estadísticas desde el panel de cada rifa</p>
              <p className="text-xs text-muted-foreground mt-2">Selecciona una rifa para ver sus estadísticas detalladas</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
