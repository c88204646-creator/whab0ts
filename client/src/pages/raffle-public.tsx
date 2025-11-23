import { useState, useRef } from "react";
import { useRoute } from "wouter";
import { AlertCircle, CheckCircle2, Heart, Share2, ChevronDown, ChevronUp, Upload, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Raffle, RaffleStory } from "@shared/schema";

export default function RafflePublicPage() {
  const [match, params] = useRoute("/raffle/:id");
  const { toast } = useToast();
  
  const raffleId = params?.id;
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
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
            <h2 className="text-lg font-semibold">Rifa no encontrada</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Esta rifa no está disponible en este momento.</p>
        </Card>
      </div>
    );
  }

  const ticketPrice = raffle.ticketPrice / 100;
  const totalPrice = selectedTickets.length * ticketPrice;

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
            <Badge variant="secondary" className="bg-green-600">
              {raffle.totalTickets} boletos disponibles
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Description and Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle>Descripción de la Rifa</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-foreground/80 whitespace-pre-line">{raffle.description}</p>
              </CardContent>
            </Card>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground mb-1">Precio del Boleto</p>
                  <p className="text-2xl font-bold">${ticketPrice.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground mb-1">Boletos Totales</p>
                  <p className="text-2xl font-bold">{raffle.totalTickets}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: Purchase Form */}
          <div className="lg:col-span-1">
            <Card className="border-primary/50 sticky top-6">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-lg">Compra tus Boletos</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Buyer Info */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Nombre Completo</label>
                    <Input
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Tu nombre"
                      className="bg-background border-border/50 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Email</label>
                    <Input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="bg-background border-border/50 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Teléfono/WhatsApp</label>
                    <Input
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+52 1234567890"
                      className="bg-background border-border/50 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Ticket Selection */}
                <div className="border-t border-border/50 pt-4">
                  <label className="text-xs font-semibold block mb-2">Cantidad de Boletos</label>
                  <div className="flex gap-2">
                    {[1, 2, 5, 10].map((qty) => (
                      <Button
                        key={qty}
                        variant={selectedTickets.length === qty ? "default" : "outline"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setSelectedTickets(Array.from({ length: qty }, (_, i) => `${i + 1}`))}
                      >
                        {qty}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {selectedTickets.length > 0 && (
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
                )}

                {/* CTA */}
                <Button
                  onClick={() => purchaseMutation.mutate()}
                  disabled={purchaseMutation.isPending || selectedTickets.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {purchaseMutation.isPending ? "Procesando..." : "Apartar Boletos"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Recibirás instrucciones de pago por email
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
