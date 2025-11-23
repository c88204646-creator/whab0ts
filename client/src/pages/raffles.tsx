import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Raffle } from "@shared/schema";

export default function RafflesPage() {
  const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
  const [activeTab, setActiveTab] = useState("list");

  const { data: raffles = [], isLoading } = useQuery({
    queryKey: ["/api/raffles", userId],
    queryFn: async () => {
      const response = await fetch(`/api/raffles?userId=${userId}`);
      return response.json();
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

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rifas</h1>
          <p className="text-sm text-secondary-foreground mt-1">Gestiona tus rifas y venta de boletos</p>
        </div>
        <Button size="default" className="gap-2" data-testid="button-create-raffle">
          <Plus className="w-4 h-4" />
          Nueva Rifa
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-raffles">
            <TabsTrigger value="list">Mis Rifas</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
            <TabsTrigger value="analytics">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-secondary-foreground">Cargando...</div>
              </div>
            ) : raffles.length === 0 ? (
              <Card className="p-12 text-center">
                <Ticket className="w-12 h-12 mx-auto mb-4 text-secondary-foreground opacity-50" />
                <p className="text-secondary-foreground mb-4">No tienes rifas aún</p>
                <Button size="default" data-testid="button-create-raffle-empty">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear tu primera rifa
                </Button>
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
                          Editar
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
              <p className="text-secondary-foreground">Próximamente: Gestión de compras y compradores</p>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="p-12 text-center">
              <Ticket className="w-12 h-12 mx-auto mb-4 text-secondary-foreground opacity-50" />
              <p className="text-secondary-foreground">Próximamente: Estadísticas y reportes de rifas</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
