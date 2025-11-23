import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Ticket, X, Edit2, Trash2, Copy, Check, Eye, Play, DollarSign, AlertCircle, BarChart3, CheckCircle2, Users, Target, Search } from "lucide-react";
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
