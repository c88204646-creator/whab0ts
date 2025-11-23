import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

export default function RaffleCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalTickets: 1000,
    ticketPrice: 50, // in cents
  });

  const createRaffleMutation = useMutation({
    mutationFn: (data) =>
      apiRequest("POST", "/api/raffles", {
        ...data,
        userId: user.id,
        status: "draft",
        isPublished: false,
      }),
    onSuccess: (raffle: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/raffles`, user.id] });
      toast({
        title: "Éxito",
        description: "Rifa creada correctamente",
      });
      navigate(`/raffles/${raffle.id}/manage`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear la rifa",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.totalTickets < 1) {
      toast({
        title: "Error",
        description: "Completa todos los campos correctamente",
        variant: "destructive",
      });
      return;
    }
    createRaffleMutation.mutate(formData as any);
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/raffles")}
            className="gap-2 h-8"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Rifa</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-xs font-semibold mb-1.5 block">
                  Título *
                </Label>
                <Input
                  id="title"
                  placeholder="Ej: Rifa de iPhone 15"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-xs font-semibold mb-1.5 block">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu rifa..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  data-testid="textarea-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalTickets" className="text-xs font-semibold mb-1.5 block">
                    Total de Boletos *
                  </Label>
                  <Input
                    id="totalTickets"
                    type="number"
                    min="1"
                    max="999999"
                    value={formData.totalTickets}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalTickets: parseInt(e.target.value) || 1,
                      })
                    }
                    data-testid="input-total-tickets"
                  />
                </div>

                <div>
                  <Label htmlFor="ticketPrice" className="text-xs font-semibold mb-1.5 block">
                    Precio por Boleto (en centavos) *
                  </Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    min="1"
                    value={formData.ticketPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ticketPrice: parseInt(e.target.value) || 1,
                      })
                    }
                    data-testid="input-ticket-price"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createRaffleMutation.isPending}
                  data-testid="button-create"
                >
                  Crear Rifa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/raffles")}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
