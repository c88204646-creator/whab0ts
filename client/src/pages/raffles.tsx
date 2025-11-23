import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Eye, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import LoadingSpinner from "@/components/loading-spinner";

export default function RafflesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: raffles = [], isLoading } = useQuery({
    queryKey: [`/api/raffles`, user.id],
    queryFn: async () => {
      const res = await fetch(`/api/raffles?userId=${user.id}`);
      return res.json();
    },
  });

  const deleteRaffleMutation = useMutation({
    mutationFn: (raffleId: string) =>
      apiRequest("DELETE", `/api/raffles/${raffleId}`, { userId: user.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/raffles`, user.id] });
      toast({
        title: "Éxito",
        description: "Rifa eliminada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la rifa",
        variant: "destructive",
      });
    },
  });

  const filteredRaffles = raffles.filter((raffle: any) =>
    raffle.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    draft: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
    active: "bg-green-500/20 text-green-600 dark:text-green-400",
    closed: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    finished: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-foreground">Rifas</h1>
                    <p className="text-xs text-muted-foreground">Crea y gestiona tus rifas</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate("/raffles/create")}
                data-testid="button-create-raffle"
                size="sm"
                className="gap-2 h-9"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Rifa</span>
              </Button>
            </div>

            <Input
              placeholder="Buscar rifas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
              data-testid="input-search-raffles"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 pb-20">
        {filteredRaffles.length === 0 ? (
          <Card className="bg-muted/20 border-dashed text-center py-12">
            <CardContent>
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium text-foreground">No hay rifas creadas</p>
              <p className="text-sm text-muted-foreground mt-2">
                Crea tu primera rifa para comenzar a vender boletos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRaffles.map((raffle: any) => (
              <Card key={raffle.id} className="hover-elevate">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2">
                        {raffle.title}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`mt-2 ${statusColors[raffle.status as keyof typeof statusColors]}`}
                        data-testid={`badge-status-${raffle.id}`}
                      >
                        {raffle.status === "draft" ? "Borrador" :
                         raffle.status === "active" ? "Activa" :
                         raffle.status === "closed" ? "Cerrada" :
                         "Finalizada"}
                      </Badge>
                    </div>
                    {raffle.isPublished && (
                      <Badge variant="secondary" className="text-xs">
                        Publicada
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Boletos: {raffle.totalTickets}</p>
                    <p className="text-muted-foreground">
                      Precio: ${(raffle.ticketPrice / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/raffles/${raffle.id}/manage`)}
                      data-testid={`button-manage-${raffle.id}`}
                      className="flex-1 gap-2 h-8"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/raffles/${raffle.id}/public`)}
                      data-testid={`button-view-public-${raffle.id}`}
                      className="flex-1 gap-2 h-8"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("¿Eliminar esta rifa?")) {
                          deleteRaffleMutation.mutate(raffle.id);
                        }
                      }}
                      data-testid={`button-delete-${raffle.id}`}
                      className="h-8 w-8"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
