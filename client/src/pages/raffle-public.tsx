import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Check, AlertCircle, Download, Upload, Zap, ChevronRight, Home, Menu, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 12;

export default function RafflePublicPage() {
  const [match, params] = useRoute("/raffle/:id");
  const raffleId = params?.id;
  const [navOpen, setNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAutoSelectAnimating, setIsAutoSelectAnimating] = useState(false);
  const [buyerData, setBuyerData] = useState({ name: "", email: "", phone: "" });
  const [verifyTicketNumber, setVerifyTicketNumber] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: raffle, isLoading } = useQuery({
    queryKey: [`/api/raffles/public/${raffleId}`],
    enabled: !!raffleId,
  });

  const { data: ticketsData } = useQuery({
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

  // Mock tickets data
  const allTickets = Array.from({ length: raffle?.totalTickets || 100 }, (_, i) => i + 1);
  const availableTickets = allTickets.filter(t => !selectedTickets.includes(t));
  const paginatedTickets = availableTickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(availableTickets.length / ITEMS_PER_PAGE);

  const createPurchaseMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/raffles/${raffleId}/purchases`, {
        method: "POST",
        body: JSON.stringify({
          buyerName: buyerData.name,
          buyerEmail: buyerData.email,
          buyerPhone: buyerData.phone,
          quantity: selectedTickets.length,
          totalAmount: selectedTickets.length * (raffle?.ticketPrice || 0),
          ticketNumbers: selectedTickets,
          status: "pending",
        }),
      });
    },
    onSuccess: () => {
      toast({ title: "✓ Compra registrada", description: "Tu orden está siendo procesada" });
      setSelectedTickets([]);
      setBuyerData({ name: "", email: "", phone: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAutoSelectTickets = () => {
    if (!raffle) return;
    const needed = Math.min(5, availableTickets.length);
    if (needed === 0) {
      toast({ title: "Sin boletos disponibles" });
      return;
    }

    setIsAutoSelectAnimating(true);
    let count = 0;
    const interval = setInterval(() => {
      if (count < needed) {
        const randomIndex = Math.floor(Math.random() * availableTickets.length);
        setSelectedTickets(prev => {
          if (!prev.includes(availableTickets[randomIndex])) {
            return [...prev, availableTickets[randomIndex]];
          }
          return prev;
        });
        count++;
      } else {
        clearInterval(interval);
        setIsAutoSelectAnimating(false);
      }
    }, 150);
  };

  const handleDownloadTickets = () => {
    if (selectedTickets.length === 0) {
      toast({ title: "Selecciona boletos primero" });
      return;
    }
    const ticketText = `BOLETOS SELECCIONADOS\n${raffle?.title}\n\n${selectedTickets.join(", ")}\n\nDescarga este comprobante y envía el comprobante de pago.`;
    const element = document.createElement("a");
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(ticketText)}`);
    element.setAttribute("download", `boletos-${raffleId}.txt`);
    element.click();
  };

  const handleUploadProof = () => {
    if (!paymentProofFile) {
      toast({ title: "Selecciona un archivo" });
      return;
    }
    toast({ title: "✓ Comprobante enviado", description: "Será verificado en breve" });
    setPaymentProofFile(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando rifa...</p>
      </div>
    );
  }

  if (!raffle || !raffle.isPublished) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Rifa no encontrada</p>
            <p className="text-sm text-muted-foreground">Esta rifa no está disponible</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems = [
    { label: "Información", id: "info" },
    { label: "Boletos", id: "tickets" },
    { label: "Verificador", id: "verify" },
    { label: "Galería", id: "gallery" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground hidden sm:block">{raffle.title}</h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {navOpen && (
          <div className="md:hidden border-t border-border/50 bg-muted/30 p-2 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setNavOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">{raffle.title}</h2>
          <p className="text-muted-foreground text-lg">{raffle.description}</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Disponibles</p>
            <p className="text-2xl font-bold text-green-600">{availableTickets.length}</p>
          </div>
          <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Precio</p>
            <p className="text-2xl font-bold text-primary">${raffle.ticketPrice}</p>
          </div>
          <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Seleccionados</p>
            <p className="text-2xl font-bold">{selectedTickets.length}</p>
          </div>
          <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Total</p>
            <p className="text-2xl font-bold text-blue-600">${selectedTickets.length * raffle.ticketPrice}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Galería */}
                {stories && stories.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Galería</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {stories.map((story: any) => (
                          <div key={story.id} className="aspect-square bg-muted rounded-lg overflow-hidden">
                            {story.mediaType === "photo" ? (
                              <img src={story.mediaUrl} alt="Gallery" className="w-full h-full object-cover" />
                            ) : (
                              <video src={story.mediaUrl} className="w-full h-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detalles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detalles del Sorteo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">Descripción</p>
                      <p className="text-muted-foreground">{raffle.description}</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Cómo Comprar:</p>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Selecciona tus boletos</li>
                        <li>Completa tu información</li>
                        <li>Descarga tu comprobante</li>
                        <li>Realiza el pago</li>
                        <li>Sube el comprobante de pago</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>

                {/* Cuentas */}
                {bankAccounts && bankAccounts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Datos de Pago</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {bankAccounts.map((acc: any) => (
                        <div key={acc.id} className="bg-muted/30 rounded-lg p-3 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Cuenta</p>
                          <p className="font-semibold">{acc.accountNumber}</p>
                          <p className="text-xs text-muted-foreground mt-2">{acc.bankName}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle>Información Rápida</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Boletos Totales</p>
                      <p className="text-2xl font-bold">{raffle.totalTickets}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Disponibles</p>
                      <p className="text-2xl font-bold text-green-600">{availableTickets.length}</p>
                    </div>
                    <Button
                      size="lg"
                      className="w-full gap-2"
                      onClick={() => setActiveTab("tickets")}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Comprar Ahora
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                {/* Auto Select */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Selección Automática
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      El sistema seleccionará automáticamente boletos disponibles de forma aleatoria.
                    </p>
                    <Button
                      onClick={handleAutoSelectTickets}
                      disabled={isAutoSelectAnimating || availableTickets.length === 0}
                      className="w-full gap-2"
                    >
                      {isAutoSelectAnimating ? "Seleccionando..." : "Seleccionar Automáticamente (5)"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Tickets Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle>Selecciona tus Boletos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {paginatedTickets.map(ticket => (
                        <button
                          key={ticket}
                          onClick={() => {
                            setSelectedTickets(prev =>
                              prev.includes(ticket)
                                ? prev.filter(t => t !== ticket)
                                : [...prev, ticket]
                            );
                          }}
                          className={`aspect-square rounded-lg font-bold text-sm transition-all border-2 ${
                            selectedTickets.includes(ticket)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted border-border/50 hover:border-primary/50"
                          }`}
                        >
                          {ticket}
                        </button>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          Página {currentPage} de {totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Compra Sidebar */}
              <div className="space-y-4">
                <Card className="border-primary/50 bg-primary/5 sticky top-20">
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Boletos Seleccionados</p>
                      <p className="text-2xl font-bold">{selectedTickets.length}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Total a Pagar</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${selectedTickets.length * raffle.ticketPrice}
                      </p>
                    </div>

                    {selectedTickets.length > 0 && (
                      <div className="bg-muted/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-2">Boletos:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedTickets.sort((a, b) => a - b).map(ticket => (
                            <Badge key={ticket} variant="secondary" className="text-xs">
                              {ticket}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      size="lg"
                      className="w-full gap-2"
                      disabled={selectedTickets.length === 0}
                      onClick={() => {
                        if (!buyerData.name) {
                          toast({ title: "Completa tu información primero", variant: "destructive" });
                          return;
                        }
                        createPurchaseMutation.mutate();
                      }}
                    >
                      <Check className="w-4 h-4" />
                      Confirmar Compra
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={handleDownloadTickets}
                      disabled={selectedTickets.length === 0}
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </Button>
                  </CardContent>
                </Card>

                {/* Datos Personales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tus Datos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Nombre *</Label>
                      <Input
                        placeholder="Tu nombre"
                        value={buyerData.name}
                        onChange={(e) => setBuyerData({ ...buyerData, name: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email *</Label>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        value={buyerData.email}
                        onChange={(e) => setBuyerData({ ...buyerData, email: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Teléfono</Label>
                      <Input
                        placeholder="Tu teléfono"
                        value={buyerData.phone}
                        onChange={(e) => setBuyerData({ ...buyerData, phone: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Verify Tab */}
          <TabsContent value="verify" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6 max-w-4xl">
              <Card>
                <CardHeader>
                  <CardTitle>Verificar Boleto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Número de Boleto</Label>
                    <Input
                      type="number"
                      placeholder="Ej: 123"
                      value={verifyTicketNumber}
                      onChange={(e) => setVerifyTicketNumber(e.target.value)}
                    />
                  </div>
                  <Button className="w-full">Verificar</Button>
                </CardContent>
              </Card>

              {/* Upload Proof */}
              <Card>
                <CardHeader>
                  <CardTitle>Subir Comprobante de Pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <input
                      type="file"
                      onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label htmlFor="proof-upload" className="cursor-pointer">
                      <p className="text-sm font-medium text-foreground">
                        {paymentProofFile?.name || "Selecciona un archivo"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF - Max 5MB</p>
                    </label>
                  </div>
                  <Button className="w-full gap-2" onClick={handleUploadProof} disabled={!paymentProofFile}>
                    <Upload className="w-4 h-4" />
                    Enviar Comprobante
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          {stories && stories.length > 0 && (
            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Galería Completa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {stories.map((story: any) => (
                      <div key={story.id} className="aspect-square bg-muted rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        {story.mediaType === "photo" ? (
                          <img src={story.mediaUrl} alt="Gallery" className="w-full h-full object-cover" />
                        ) : (
                          <video src={story.mediaUrl} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
