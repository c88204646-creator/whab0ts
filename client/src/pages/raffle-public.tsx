import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Check, AlertCircle, Lock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RafflePublicPage() {
  const [match, params] = useRoute("/raffle/:id");
  const raffleId = params?.id;
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [buyerData, setBuyerData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const { toast } = useToast();

  const { data: raffle, isLoading } = useQuery({
    queryKey: [`/api/raffles/public/${raffleId}`],
    enabled: !!raffleId,
  });

  const { data: tickets } = useQuery({
    queryKey: [`/api/raffles/${raffleId}/available-tickets`],
    enabled: !!raffleId && !!raffle?.isPublished,
  });

  const { data: stories } = useQuery({
    queryKey: [`/api/raffles/${raffleId}/stories/public`],
    enabled: !!raffleId && !!raffle?.isPublished,
  });

  const { data: bankAccounts } = useQuery({
    queryKey: [`/api/raffles/${raffleId}/bank-accounts`],
    enabled: !!raffleId && !!raffle?.isPublished,
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/raffles/${raffleId}/purchases`, {
        method: "POST",
        body: JSON.stringify({
          buyerName: buyerData.name,
          buyerEmail: buyerData.email,
          buyerPhone: buyerData.phone,
          quantity: parseInt(quantity),
          totalAmount: parseInt(quantity) * (raffle?.ticketPrice || 0),
          ticketNumbers: [],
          status: "pending",
        }),
      });
    },
    onSuccess: (data) => {
      toast({ title: "✓ Compra registrada", description: "Tu pago se verificará en breve" });
      setIsBuyDialogOpen(false);
      setQuantity("1");
      setBuyerData({ name: "", email: "", phone: "" });
      queryClient.invalidateQueries({ queryKey: [`/api/raffles/${raffleId}/available-tickets`] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando rifa...</p>
      </div>
    );
  }

  if (!raffle || !raffle.isPublished) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Rifa no encontrada</p>
            <p className="text-sm text-muted-foreground">Esta rifa no está disponible o fue eliminada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">{raffle.title}</h1>
          <p className="text-lg text-muted-foreground">{raffle.description}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Boletos Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{tickets?.available || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Precio por Boleto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${raffle.ticketPrice}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Boletos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{raffle.totalTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Sorteo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">
                {raffle.drawDate ? new Date(raffle.drawDate).toLocaleDateString('es-ES') : "Por anunciar"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {stories && stories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Galería</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stories.map((story: any) => (
                      <div key={story.id} className="aspect-square bg-muted rounded-lg overflow-hidden">
                        {story.mediaType === "photo" ? (
                          <img src={story.mediaUrl} alt={story.caption} className="w-full h-full object-cover" />
                        ) : (
                          <video src={story.mediaUrl} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Detalles del Sorteo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold mb-2">Sobre esta Rifa</p>
                  <p className="text-muted-foreground">{raffle.description}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Cómo Comprar:</p>
                  <ol className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
                    <li>Completa tus datos</li>
                    <li>Selecciona cantidad de boletos</li>
                    <li>Realiza el pago</li>
                    <li>Recibe tus boletos digitales</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">¡Compra Boletos!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Disponibles</p>
                  <p className="text-3xl font-bold text-green-600">{tickets?.available}</p>
                </div>
                <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Comprar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Comprar Boletos</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nombre *</Label>
                        <Input
                          placeholder="Tu nombre"
                          value={buyerData.name}
                          onChange={(e) => setBuyerData({ ...buyerData, name: e.target.value })}
                          data-testid="input-buyer-name"
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          value={buyerData.email}
                          onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                          data-testid="input-buyer-email"
                        />
                      </div>
                      <div>
                        <Label>Teléfono *</Label>
                        <Input
                          placeholder="Tu número"
                          value={buyerData.phone}
                          onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
                          data-testid="input-buyer-phone"
                        />
                      </div>
                      <div>
                        <Label>Cantidad *</Label>
                        <Input
                          type="number"
                          min="1"
                          max={tickets?.available}
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          data-testid="input-quantity"
                        />
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-semibold">Total: ${(parseInt(quantity) * (raffle?.ticketPrice || 0)).toLocaleString()}</p>
                      </div>
                      <Button onClick={() => createPurchaseMutation.mutate()} className="w-full" disabled={createPurchaseMutation.isPending}>
                        {createPurchaseMutation.isPending ? "Procesando..." : "Proceder al Pago"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {bankAccounts && bankAccounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Para Transferencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bankAccounts.map((account: any) => (
                    <div key={account.id} className="p-3 border border-border/50 rounded-lg text-xs space-y-1">
                      <p className="font-semibold">{account.bankName}</p>
                      <p className="text-muted-foreground">{account.accountHolder}</p>
                      <p className="font-mono text-xs bg-muted p-1 rounded">{account.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">{account.accountType === "checking" ? "Corriente" : "Ahorros"}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
