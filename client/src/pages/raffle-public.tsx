import { useState, useRef } from "react";
import { useRoute } from "wouter";
import { AlertCircle, CheckCircle2, Heart, Share2, ChevronDown, ChevronUp, Upload, Phone, Mail, Search, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Raffle, RaffleStory, RafflePurchase } from "@shared/schema";

export default function RafflePublicPage() {
  const [match, params] = useRoute("/raffle/:id");
  const { toast } = useToast();
  
  const raffleId = params?.id;
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("comprar");
  const [ticketToVerify, setTicketToVerify] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: raffle, isLoading } = useQuery<Raffle>({
    queryKey: [`/api/raffles/public/${raffleId}`],
    enabled: !!raffleId,
    retry: false,
  });

  const { data: stories = [] } = useQuery<RaffleStory[]>({
    queryKey: [`/api/raffles/${raffleId}/stories/public`],
    enabled: !!raffleId,
  });

  const { data: purchases = [] } = useQuery<RafflePurchase[]>({
    queryKey: [`/api/raffles/${raffleId}/purchases/public`],
    enabled: !!raffleId,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!buyerName || !buyerEmail || !buyerPhone || selectedTickets.length === 0) {
        throw new Error("Complete todos los campos");
      }
      return apiRequest(`/api/raffles/${raffleId}/purchases`, {
        method: "POST",
        body: JSON.stringify({
          buyerName,
          buyerEmail,
          buyerPhone,
          ticketNumbers: selectedTickets,
          quantity: selectedTickets.length,
        }),
      });
    },
    onSuccess: () => {
      toast({ title: "Éxito", description: "Boletos apartados correctamente. Enviaremos instrucciones de pago." });
      setSelectedTickets([]);
      setBuyerName("");
      setBuyerEmail("");
      setBuyerPhone("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const verifyTicketMutation = useMutation({
    mutationFn: async (ticketNumber: string) => {
      const purchase = purchases.find(p => 
        p.ticketNumbers?.includes(ticketNumber)
      );
      if (!purchase) {
        throw new Error("Boleto no encontrado");
      }
      return {
        ticketNumber,
        buyerName: purchase.buyerName,
        status: purchase.paymentStatus,
        verified: true,
      };
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      toast({ title: "Boleto Verificado", description: `Boleto ${data.ticketNumber} - ${data.buyerName}` });
    },
    onError: (error: any) => {
      setVerificationResult({ verified: false, error: error.message });
      toast({ title: "Verificación Fallida", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Cargando rifa...</div>
      </div>
    );
  }

  if (!raffle || !raffle.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 border-destructive/50 max-w-sm">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Rifa no disponible</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Esta rifa no está disponible en este momento.</p>
        </Card>
      </div>
    );
  }

  const ticketPrice = raffle.ticketPrice / 100;
  const totalPrice = selectedTickets.length * ticketPrice;
  const soldTickets = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const availableTickets = raffle.totalTickets - soldTickets;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section with Stories */}
      <div className="relative h-96 bg-black overflow-hidden group">
        {stories.length > 0 ? (
          <div className="relative w-full h-full">
            {stories[currentStoryIndex].mediaType === "photo" ? (
              <img 
                src={stories[currentStoryIndex].mediaUrl} 
                alt="Story" 
                className="w-full h-full object-cover"
              />
            ) : (
              <video 
                src={stories[currentStoryIndex].mediaUrl} 
                className="w-full h-full object-cover"
                autoPlay
                muted
              />
            )}
            {stories.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentStoryIndex((i) => (i - 1 + stories.length) % stories.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronUp className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={() => setCurrentStoryIndex((i) => (i + 1) % stories.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronDown className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-white/10 rounded-lg mx-auto mb-4" />
              <p className="text-white/60">Sin imagen</p>
            </div>
          </div>
        )}

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        {/* Title and Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-4xl font-bold mb-2">{raffle.title}</h1>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary">
              ${ticketPrice.toFixed(2)} por boleto
            </Badge>
            <Badge variant="secondary" className={availableTickets > 0 ? "bg-green-600" : "bg-red-600"}>
              {availableTickets} boletos disponibles
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="comprar">Comprar Boletos</TabsTrigger>
            <TabsTrigger value="descripcion">Descripción</TabsTrigger>
            <TabsTrigger value="verificar">Verificar Boleto</TabsTrigger>
            <TabsTrigger value="compras">Compras Realizadas</TabsTrigger>
          </TabsList>

          {/* Buy Tab */}
          <TabsContent value="comprar" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle>Tus Datos</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Nombre Completo *</label>
                    <Input
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="bg-background border-border/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Email *</label>
                    <Input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="bg-background border-border/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Teléfono/WhatsApp *</label>
                    <Input
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+52 1234567890"
                      className="bg-background border-border/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle>Selecciona Boletos</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 5, 10].map((qty) => (
                      <Button
                        key={qty}
                        variant={selectedTickets.length === qty ? "default" : "outline"}
                        className="h-10"
                        onClick={() => setSelectedTickets(Array.from({ length: qty }, (_, i) => String(i + 1).padStart(6, '0')))}
                      >
                        {qty}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm">Boletos seleccionados: <span className="font-bold">{selectedTickets.length}</span></p>
                    <p className="text-sm">Total: <span className="font-bold">${totalPrice.toFixed(2)}</span></p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Purchase Summary */}
            <div className="lg:col-span-1">
              <Card className="border-primary/50 sticky top-6">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-lg">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{selectedTickets.length} boletos</span>
                      <span className="text-muted-foreground">${(selectedTickets.length * ticketPrice).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-primary/20" />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => purchaseMutation.mutate()}
                    disabled={purchaseMutation.isPending || selectedTickets.length === 0 || !buyerName || !buyerEmail || !buyerPhone}
                    className="w-full"
                    size="lg"
                  >
                    {purchaseMutation.isPending ? "Procesando..." : "Apartar Boletos"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Recibirás instrucciones de pago por email
                  </p>

                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      ✓ Boletos apartados por 24 horas<br/>
                      ✓ Envío de comprobante para verificación<br/>
                      ✓ Boletos digitales inmediatamente
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Description Tab */}
          <TabsContent value="descripcion" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle>Descripción de la Rifa</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-foreground/80 whitespace-pre-line">{raffle.description}</p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base">Información</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Boletos Totales</p>
                    <p className="text-lg font-bold">{raffle.totalTickets}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Precio por Boleto</p>
                    <p className="text-lg font-bold">${ticketPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Disponibles</p>
                    <p className="text-lg font-bold text-green-600">{availableTickets}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Verify Ticket Tab */}
          <TabsContent value="verificar" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle>Verificar Boleto</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">Ingresa tu número de boleto para verificar su estado</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="000001"
                      value={ticketToVerify}
                      onChange={(e) => setTicketToVerify(e.target.value.toUpperCase())}
                      className="bg-background border-border/50"
                      maxLength="6"
                    />
                    <Button
                      onClick={() => verifyTicketMutation.mutate(ticketToVerify)}
                      disabled={verifyTicketMutation.isPending || !ticketToVerify}
                      className="gap-2"
                    >
                      {verifyTicketMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Verificar
                    </Button>
                  </div>

                  {verificationResult && (
                    <Card className={`p-4 ${verificationResult.verified ? "border-green-600 bg-green-500/5" : "border-red-600 bg-red-500/5"}`}>
                      <div className="flex items-start gap-3">
                        {verificationResult.verified ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          {verificationResult.verified ? (
                            <>
                              <p className="font-semibold text-green-600">Boleto Válido</p>
                              <p className="text-sm text-muted-foreground">Boleto: {verificationResult.ticketNumber}</p>
                              <p className="text-sm text-muted-foreground">Comprador: {verificationResult.buyerName}</p>
                              <Badge className={`mt-2 ${verificationResult.status === "approved" ? "bg-green-600" : "bg-orange-600"}`}>
                                {verificationResult.status === "approved" ? "Pagado" : "Pendiente de Pago"}
                              </Badge>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-red-600">Boleto No Encontrado</p>
                              <p className="text-sm text-muted-foreground">{verificationResult.error}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Purchases List Tab */}
          <TabsContent value="compras" className="grid grid-cols-1 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle>Compras Realizadas ({purchases.length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {purchases.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No hay compras aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchases.map((purchase, idx) => (
                      <Card key={purchase.id} className="p-3 border border-border/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">Compra #{idx + 1}</p>
                            <p className="text-xs text-muted-foreground">{purchase.quantity} boletos</p>
                          </div>
                          <Badge variant={purchase.paymentStatus === "approved" ? "default" : "secondary"}>
                            {purchase.paymentStatus === "approved" ? "Pagado" : "Pendiente"}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
