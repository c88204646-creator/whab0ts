import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Trash2, Copy, Check, Eye, Play, DollarSign, CheckCircle2, Users, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Raffle } from "@shared/schema";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

const RaffleCard = ({ raffle, onCopyLink, onView, onPublish, onDelete, copiedId, publishLoading }: any) => {
  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'MXN',
      minimumFractionDigits: 0,
    });
    return formatter.format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      active: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      closed: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      finished: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
    return colors[status || "draft"] || colors.draft;
  };

  const statusLabel: any = {
    draft: "Borrador",
    active: "Activa",
    closed: "Cerrada",
    finished: "Finalizada",
  };

  const revenue = raffle.totalTickets * raffle.ticketPrice;

  return (
    <Card className="flex flex-col hover-elevate transition-all overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-muted/40 to-transparent">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-foreground truncate flex-1">{raffle.title}</h3>
          <Badge className={`flex-shrink-0 text-xs font-semibold border ${getStatusColor(raffle.status)}`}>
            {statusLabel[raffle.status || "draft"]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{raffle.description}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 rounded-lg border border-border/30 p-2">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Boletos</p>
            <p className="text-sm font-bold text-foreground">{raffle.totalTickets}</p>
          </div>
          <div className="bg-muted/30 rounded-lg border border-border/30 p-2">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Precio</p>
            <p className="text-sm font-bold text-primary">{formatCurrency(raffle.ticketPrice, raffle.currency)}</p>
          </div>
        </div>

        {/* Ingresos Potenciales */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-2.5">
          <p className="text-xs text-muted-foreground font-medium mb-0.5">INGRESOS POTENCIALES</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(revenue, raffle.currency)}</p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {raffle.isPublished && (
            <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 text-xs font-semibold">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              En línea
            </Badge>
          )}
          {raffle.drawDate && (
            <Badge variant="outline" className="text-xs font-semibold">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(raffle.drawDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border/50 bg-muted/20 p-2.5 flex gap-1.5">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 text-xs gap-1 flex-1" 
          onClick={() => onCopyLink(raffle.id)} 
          title="Copiar enlace"
          data-testid={`button-copy-link-${raffle.id}`}
        >
          {copiedId === raffle.id ? (
            <>
              <Check className="w-3 h-3" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copiar
            </>
          )}
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 text-xs gap-1 flex-1" 
          onClick={() => onView(raffle.id)}
          title="Ver detalles"
          data-testid={`button-view-${raffle.id}`}
        >
          <Eye className="w-3 h-3" />
          Ver
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 text-xs gap-1 flex-1" 
          onClick={() => onPublish(raffle.id)}
          title={raffle.isPublished ? "Ya está publicada" : "Publicar"}
          data-testid={`button-publish-${raffle.id}`} 
          disabled={raffle.isPublished || publishLoading}
        >
          <Play className="w-3 h-3" />
          {raffle.isPublished ? 'En línea' : 'Publicar'}
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => onDelete(raffle)}
          title="Eliminar"
          data-testid={`button-delete-${raffle.id}`}
        >
          <Trash2 className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    </Card>
  );
};

export default function RaffleManagementPage() {
  const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [raffleToDelete, setRaffleToDelete] = useState<Raffle | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const { toast } = useToast();

  const { data: raffles = [], isLoading } = useQuery({
    queryKey: ["/api/raffles", userId],
    queryFn: async () => {
      const response = await fetch(`/api/raffles?userId=${userId}`);
      return response.json();
    },
  });

  const publishRaffleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/raffles/${id}`, { isPublished: true, status: "active" });
    },
    onSuccess: () => {
      toast({ title: "✓ Publicada", description: "Tu rifa está en línea" });
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", userId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "✗ Error al publicar", 
        description: error.message || "Intenta de nuevo",
        variant: "destructive"
      });
    },
  });

  const deleteRaffleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/raffles/${id}`);
    },
    onSuccess: () => {
      toast({ title: "✓ Rifa eliminada permanentemente" });
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", userId] });
      setDeleteDialogOpen(false);
      setRaffleToDelete(null);
      setDeleteConfirmName("");
      setSliderValue(0);
    },
    onError: (error: any) => {
      toast({ 
        title: "✗ Error al eliminar", 
        description: error.message || "Intenta de nuevo",
        variant: "destructive"
      });
    },
  });

  const openDeleteDialog = (raffle: Raffle) => {
    setRaffleToDelete(raffle);
    setDeleteConfirmName("");
    setSliderValue(0);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!raffleToDelete) return;
    if (deleteConfirmName !== raffleToDelete.title) {
      toast({ 
        title: "Nombre incorrecto",
        description: "Escribe el nombre exacto de la rifa",
        variant: "destructive"
      });
      return;
    }
    if (sliderValue < 100) {
      toast({ 
        title: "Completa el desliz",
        description: "Desliza completamente para confirmar",
        variant: "destructive"
      });
      return;
    }
    deleteRaffleMutation.mutate(raffleToDelete.id);
  };

  const copyShareLink = (raffleId: string) => {
    const link = `${window.location.origin}/raffle/${raffleId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(raffleId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Enlace copiado" });
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-foreground">Rifas</h1>
                    <p className="text-xs text-muted-foreground">Crear y gestionar rifas</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => window.location.href = "/raffle/create"} data-testid="button-create-new-raffle" size="sm" className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva rifa</span>
              </Button>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-foreground">Monetiza con rifas profesionales</p>
              <p className="text-xs text-foreground/70 mt-0.5">Crea rifas, gestiona pagos y visualiza ganancias en tiempo real</p>
            </div>

            <div className="space-y-3">
              {raffles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Total" value={raffles.length} icon={Ticket} />
                  <StatCard label="Activas" value={raffles.filter((r: Raffle) => r.status === "active").length} icon={Play} />
                  <StatCard label="Cerradas" value={raffles.filter((r: Raffle) => r.status === "closed").length} icon={DollarSign} />
                  <StatCard label="Finalizadas" value={raffles.filter((r: Raffle) => r.status === "finished").length} icon={Check} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-20">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {raffles.map((raffle: Raffle) => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  onCopyLink={copyShareLink}
                  onView={(id: string) => window.location.href = `/raffles/${id}`}
                  onPublish={(id: string) => publishRaffleMutation.mutate(id)}
                  onDelete={openDeleteDialog}
                  copiedId={copiedId}
                  publishLoading={publishRaffleMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle>Eliminar rifa permanentemente</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold text-foreground">⚠ Advertencia</p>
              <p className="text-sm text-muted-foreground">
                Esta acción es irreversible. Se eliminarán todos los datos de la rifa, incluyendo:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• Boletos y compras registradas</li>
                <li>• Información de pagos</li>
                <li>• Historias y galería</li>
                <li>• Cuentas bancarias asociadas</li>
              </ul>
            </div>

            {raffleToDelete && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Escribe el nombre de la rifa para confirmar:
                  </label>
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border mb-2">
                    <p className="text-sm font-semibold text-foreground">{raffleToDelete.title}</p>
                  </div>
                  <Input
                    placeholder="Nombre de la rifa"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    data-testid="input-delete-confirm-name"
                    className="text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">
                      Desliza para confirmar la eliminación
                    </label>
                    <span className={`text-xs font-bold ${sliderValue === 100 ? "text-green-500" : "text-muted-foreground"}`}>
                      {sliderValue}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(parseInt(e.target.value))}
                    data-testid="slider-delete-confirm"
                    className="w-full h-10 rounded-lg bg-muted border border-border appearance-none cursor-pointer accent-destructive"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--destructive)) 0%, hsl(var(--destructive)) ${sliderValue}%, hsl(var(--muted)) ${sliderValue}%, hsl(var(--muted)) 100%)`
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              data-testid="button-delete-cancel"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              data-testid="button-delete-confirm"
              disabled={
                deleteConfirmName !== (raffleToDelete?.title || "") || 
                sliderValue < 100 || 
                deleteRaffleMutation.isPending
              }
            >
              {deleteRaffleMutation.isPending ? "Eliminando..." : "Eliminar permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
