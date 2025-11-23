import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Ticket, X, Edit2, Trash2, Copy, Check, Eye, Play, DollarSign, AlertCircle, BarChart3, CheckCircle2, Users, Target, Search, TrendingUp, Calendar } from "lucide-react";
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

const RaffleCard = ({ raffle, onCopyLink, onView, onPublish, onDelete, copiedId, publishLoading, deleteLoading }: any) => {
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
      draft: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
      active: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
      closed: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
      finished: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
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
    <Card className="flex flex-col hover-elevate transition-all overflow-hidden">
      {/* Header Section */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{raffle.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{raffle.description}</p>
          </div>
          <Badge variant="outline" className={`flex-shrink-0 border ${getStatusColor(raffle.status)}`}>
            {statusLabel[raffle.status || "draft"]}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {raffle.isPublished && (
            <div className="flex items-center gap-1 text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full border border-green-500/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>En línea</span>
            </div>
          )}
          {raffle.drawDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-full border border-border/50 bg-muted/50">
              <Calendar className="w-3 h-3" />
              <span>{new Date(raffle.drawDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 px-4 py-3 space-y-2.5">
        {/* Tickets Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-xs text-muted-foreground font-medium mb-1">Boletos</p>
            <p className="text-lg font-bold text-foreground">{raffle.totalTickets}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-xs text-muted-foreground font-medium mb-1">Precio</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(raffle.ticketPrice, raffle.currency)}</p>
          </div>
        </div>

        {/* Revenue Potential */}
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Ingresos potenciales</span>
            </div>
            <span className="text-sm font-bold text-accent">{formatCurrency(raffle.totalTickets * raffle.ticketPrice, raffle.currency)}</span>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="border-t border-border bg-muted/20 p-2.5 flex gap-1.5">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 h-7 gap-1 text-xs" 
          onClick={() => onCopyLink(raffle.id)} 
          data-testid={`button-copy-link-${raffle.id}`}
          title="Copiar enlace de compartir"
        >
          {copiedId === raffle.id ? (
            <>
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Compartir</span>
            </>
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 h-7 gap-1 text-xs" 
          onClick={() => onView(raffle.id)} 
          data-testid={`button-view-${raffle.id}`}
          title="Ver rifa"
        >
          <Eye className="w-3 h-3" />
          <span className="hidden sm:inline">Ver</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 h-7 gap-1 text-xs" 
          onClick={() => onPublish(raffle.id)} 
          data-testid={`button-publish-${raffle.id}`} 
          disabled={raffle.isPublished || publishLoading}
          title={raffle.isPublished ? "Ya está en línea" : "Publicar rifa"}
        >
          <Play className="w-3 h-3" />
          {raffle.isPublished ? "En línea" : "Publicar"}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          onClick={() => onDelete(raffle.id)} 
          data-testid={`button-delete-${raffle.id}`} 
          disabled={deleteLoading}
          title="Eliminar rifa"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};

export default function RaffleManagementPage() {
  const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

            {/* Alert Banner */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Monetiza con rifas profesionales</p>
                  <p className="text-xs text-foreground/70 mt-0.5">Crea rifas con boletos de 6 dígitos, gestiona pagos y visualiza ganancias en tiempo real</p>
                </div>
                <Button 
                  onClick={() => window.location.href = "/raffle/create"}
                  variant="default" 
                  size="sm" 
                  className="flex-shrink-0 text-xs h-8" 
                  data-testid="button-add-raffle-banner"
                >
                  Agregar
                </Button>
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {raffles.map((raffle: Raffle) => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  onCopyLink={copyShareLink}
                  onView={(id: string) => window.location.href = `/raffle/${id}`}
                  onPublish={(id: string) => publishRaffleMutation.mutate(id)}
                  onDelete={(id: string) => deleteRaffleMutation.mutate(id)}
                  copiedId={copiedId}
                  publishLoading={publishRaffleMutation.isPending}
                  deleteLoading={deleteRaffleMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
