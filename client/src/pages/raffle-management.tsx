import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Trash2, Copy, Check, Eye, Play, DollarSign, CheckCircle2, Pause, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function RaffleManagementPage() {
  const [, navigate] = useLocation();
  const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [raffleToDelete, setRaffleToDelete] = useState<Raffle | null>(null);
  const { toast } = useToast();

  const { data: rafflesData = [], isLoading } = useQuery({
    queryKey: ["/api/raffles", userId],
    queryFn: async () => {
      const response = await fetch(`/api/raffles?userId=${userId}`);
      return response.json();
    },
  });

  // Ensure raffles is always an array
  const raffles = Array.isArray(rafflesData) ? rafflesData : [];

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
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!raffleToDelete) return;
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
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6 flex-shrink-0">
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
            <Button onClick={() => navigate("/raffle/create")} data-testid="button-create-new-raffle" size="sm" className="gap-2 h-9">
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

      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto pb-20">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : raffles.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No hay rifas aún</p>
                <p className="text-sm text-muted-foreground mt-2">Crea tu primera rifa para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="overflow-x-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rifa</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Descripción</th>
                    <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Boletos</th>
                    <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Precio</th>
                    <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Estado</th>
                    <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {raffles.map((raffle: Raffle, idx: number) => {
                    const formatCurrency = (amount: number) => {
                      return new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: raffle.currency || 'MXN',
                        minimumFractionDigits: 0,
                      }).format(amount / 100);
                    };

                    const getStatusColor = (status: string) => {
                      const colors: any = {
                        draft: "bg-slate-500/20 text-slate-600 dark:text-slate-400",
                        active: "bg-green-500/20 text-green-600 dark:text-green-400",
                        closed: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
                        finished: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
                      };
                      return colors[status || "draft"] || colors.draft;
                    };

                    const statusLabel: any = {
                      draft: "Borrador",
                      active: "Activa",
                      closed: "Cerrada",
                      finished: "Finalizada",
                    };

                    return (
                      <tr 
                        key={raffle.id}
                        onClick={() => navigate(`/raffles/${raffle.id}`)}
                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${
                          idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                        }`}
                        data-testid={`row-raffle-${raffle.id}`}
                      >
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                                {raffle.title.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-semibold text-xs text-foreground truncate">{raffle.title}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3 hidden md:table-cell">
                          <div className="text-xs text-muted-foreground truncate max-w-sm">
                            {raffle.description || "-"}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center hidden sm:table-cell">
                          <div className="text-xs font-semibold text-foreground">{raffle.totalTickets}</div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <div className="text-xs font-semibold text-foreground">{formatCurrency(raffle.ticketPrice)}</div>
                        </td>
                        <td className="px-2 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1 justify-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${getStatusColor(raffle.status)}`}>
                              {statusLabel[raffle.status || "draft"]}
                            </span>
                            {raffle.isPublished && (
                              <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 text-xs h-5 px-1.5 flex items-center gap-0.5 flex-shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1.5 justify-end items-center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              onClick={() => navigate(`/raffles/${raffle.id}`)}
                              className="h-8 gap-1"
                              data-testid={`button-view-${raffle.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline text-xs">Ver</span>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyShareLink(raffle.id)}
                              className="h-8 w-8 p-0"
                              data-testid={`button-copy-link-${raffle.id}`}
                              title="Copiar enlace"
                            >
                              {copiedId === raffle.id ? (
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => publishRaffleMutation.mutate(raffle.id)}
                              disabled={raffle.isPublished || publishRaffleMutation.isPending}
                              className="h-8 w-8 p-0"
                              title={raffle.isPublished ? "Ya está publicada" : "Publicar"}
                              data-testid={`button-publish-${raffle.id}`}
                            >
                              {raffle.isPublished ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openDeleteDialog(raffle)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              data-testid={`button-delete-${raffle.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 bg-background border-border/50 shadow-2xl">
          {/* Header */}
          <div className="relative px-5 py-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center flex-shrink-0 border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="text-base font-bold text-foreground truncate">
                Eliminar rifa
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            {raffleToDelete && (
              <p className="text-sm text-muted-foreground">
                Esta acción es irreversible. Se eliminarán todos los datos de la rifa{" "}
                <span className="font-semibold text-foreground">{raffleToDelete.title}</span>
              </p>
            )}
          </div>

          {/* Footer with action buttons */}
          <div className="px-5 py-3 border-t border-border/30 bg-muted/20 rounded-b-lg flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-8 text-sm"
              data-testid="button-delete-cancel"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="h-8 text-sm"
              data-testid="button-delete-confirm"
              disabled={deleteRaffleMutation.isPending}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
