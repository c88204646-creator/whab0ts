import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Check, AlertCircle, Menu, X, MessageCircle, Zap, Search, Info, Images } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 20;

export default function RafflePublicPage() {
  const [match, params] = useRoute("/raffle/:id");
  const raffleId = params?.id;
  const [navOpen, setNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAutoSelectAnimating, setIsAutoSelectAnimating] = useState(false);
  
  // Customer form state
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerData, setCustomerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    whatsapp: "",
  });
  const [verifyTicketNumber, setVerifyTicketNumber] = useState("");
  const { toast } = useToast();

  const { data: raffle, isLoading } = useQuery({
    queryKey: ["/api/raffles", "public", raffleId],
    queryFn: async () => {
      if (!raffleId) return null;
      const response = await fetch(`/api/raffles/${raffleId}/public`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!raffleId,
  });

  const { data: stories } = useQuery({
    queryKey: ["/api/raffles", raffleId, "stories", "public"],
    enabled: !!raffleId && !!raffle?.isPublished,
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ["/api/raffles", raffleId, "bank-accounts"],
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
  const totalAmount = selectedTickets.length * (raffle?.ticketPrice || 0);

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/raffles/${raffleId}/customers`, {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        whatsapp: customerData.whatsapp,
        ticketNumbers: selectedTickets,
      });
    },
    onSuccess: (result) => {
      // Generate WhatsApp link
      const message = `Hola ${customerData.firstName}, he apartado los siguientes boletos en la rifa ${raffle?.title}:\n\nBoletos: ${selectedTickets.join(", ")}\nTotal: $${totalAmount}\nID de Cliente: ${result.customerId}\n\nPor favor confirma tu pago.`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappLink = `https://wa.me/${raffle.whatsappContactNumber}?text=${encodedMessage}`;
      
      toast({ title: "✓ Cliente registrado", description: "Abriendo WhatsApp..." });
      window.open(whatsappLink, "_blank");
      
      // Reset
      setSelectedTickets([]);
      setCustomerData({ firstName: "", lastName: "", email: "", phone: "", whatsapp: "" });
      setShowCustomerForm(false);
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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando rifa...</p>
      </div>
    );
  }

  if (!raffle || !raffle.isPublished) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
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
    { label: "Información", id: "info", icon: Info },
    { label: "Boletos", id: "tickets", icon: ShoppingCart },
    { label: "Verificador", id: "verify", icon: Search },
    { label: "Galería", id: "gallery", icon: Images },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: raffle.currency || 'MXN',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header - Professional Casino Style */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground hidden sm:block">{raffle.title}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Sorteo Profesional</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    activeTab === item.id
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu */}
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
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setNavOpen(false);
                  }}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all text-left ${
                    activeTab === item.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Hero Section - Casino Professional */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-3">{raffle.title}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl">{raffle.description}</p>
        </div>
      </div>

      {/* Stats Bar - Professional Layout */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20 p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Disponibles</p>
              <p className="text-3xl font-bold text-green-600">{availableTickets.length}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20 p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Precio</p>
              <p className="text-3xl font-bold text-blue-600">${raffle.ticketPrice / 100}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg border border-purple-500/20 p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Seleccionados</p>
              <p className="text-3xl font-bold text-purple-600">{selectedTickets.length}</p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Total</p>
              <p className="text-3xl font-bold text-primary">${totalAmount / 100}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <Card className="bg-gradient-to-br from-card/80 to-muted/20 border-border/40">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      Detalles del Sorteo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">{raffle.description}</p>
                  </CardContent>
                </Card>

                {/* Gallery */}
                {stories && stories.length > 0 && (
                  <Card className="bg-gradient-to-br from-card/80 to-muted/20 border-border/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gallery className="w-5 h-5 text-primary" />
                        Galería
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {stories.map((story: any) => (
                          <div key={story.id} className="aspect-square bg-muted rounded-lg overflow-hidden hover:ring-2 ring-primary/30 transition-all">
                            {story.mediaType === "photo" ? (
                              <img src={story.mediaUrl} alt="Gallery" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                            ) : (
                              <video src={story.mediaUrl} className="w-full h-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bank Accounts */}
                {bankAccounts && bankAccounts.length > 0 && (
                  <Card className="bg-gradient-to-br from-card/80 to-muted/20 border-border/40">
                    <CardHeader>
                      <CardTitle>Datos de Pago</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {bankAccounts.map((acc: any) => (
                        <div key={acc.id} className="bg-muted/40 rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-all">
                          <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase">Cuenta {acc.accountType}</p>
                          <p className="font-mono font-bold text-foreground text-lg">{acc.accountNumber}</p>
                          <p className="text-xs text-muted-foreground mt-2">{acc.bankName}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Sidebar Info */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-base">Información Rápida</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-semibold">TOTAL DE BOLETOS</p>
                      <p className="text-3xl font-bold text-foreground">{raffle.totalTickets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-semibold">DISPONIBLES</p>
                      <p className="text-3xl font-bold text-green-600">{availableTickets.length}</p>
                    </div>
                    {raffle.drawDate && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2 font-semibold">FECHA DE SORTEO</p>
                        <p className="font-semibold text-foreground">
                          {new Date(raffle.drawDate).toLocaleDateString('es-MX', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    <Button
                      size="lg"
                      className="w-full gap-2"
                      onClick={() => setActiveTab("tickets")}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Comprar Boletos
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
                <Card className="bg-gradient-to-br from-card/80 to-muted/20 border-border/40">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Selección Automática (Casino)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      El sistema seleccionará automáticamente 5 boletos disponibles de forma aleatoria con animación casino.
                    </p>
                    <Button
                      onClick={handleAutoSelectTickets}
                      disabled={isAutoSelectAnimating || availableTickets.length === 0}
                      className="w-full gap-2"
                      size="lg"
                    >
                      {isAutoSelectAnimating ? "Seleccionando..." : "Seleccionar Automáticamente (5 Boletos)"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Tickets Grid */}
                <Card className="bg-gradient-to-br from-card/80 to-muted/20 border-border/40">
                  <CardHeader>
                    <CardTitle>Selecciona tus Boletos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
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
                          className={`aspect-square rounded-md font-bold text-xs transition-all border-2 hover:scale-105 ${
                            selectedTickets.includes(ticket)
                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg"
                              : "bg-muted/60 border-border/50 hover:border-primary/50"
                          }`}
                          data-testid={`button-ticket-${ticket}`}
                        >
                          {ticket.toString().padStart(6, "0")}
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
                        <div className="text-xs text-muted-foreground font-medium">
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

              {/* Right Sidebar - Checkout */}
              <div className="space-y-4">
                {/* Summary */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 sticky top-20">
                  <CardHeader>
                    <CardTitle>Resumen de Compra</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">BOLETOS</p>
                      <p className="text-2xl font-bold">{selectedTickets.length}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">TOTAL</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
                    </div>

                    {selectedTickets.length > 0 && (
                      <div className="bg-muted/40 rounded-lg p-3 max-h-24 overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-2 font-semibold">BOLETOS SELECCIONADOS:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedTickets.sort((a, b) => a - b).map(ticket => (
                            <Badge key={ticket} variant="secondary" className="text-xs">
                              {ticket.toString().padStart(6, "0")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      size="lg"
                      className="w-full gap-2"
                      disabled={selectedTickets.length === 0}
                      onClick={() => setShowCustomerForm(true)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Apartar Boletos
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Verify Tab */}
          <TabsContent value="verify" className="space-y-6">
            <Card className="bg-gradient-to-br from-card/80 to-muted/20 border-border/40 max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Verificar Boleto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Número de Boleto (6 dígitos)</Label>
                  <Input
                    type="text"
                    placeholder="Ej: 000123"
                    value={verifyTicketNumber}
                    onChange={(e) => setVerifyTicketNumber(e.target.value.padStart(6, "0"))}
                    maxLength={6}
                    className="text-center font-mono text-lg"
                  />
                </div>
                <Button
                  onClick={() => {
                    const ticket = parseInt(verifyTicketNumber);
                    if (selectedTickets.includes(ticket)) {
                      toast({ title: "✓ Boleto válido", description: "Este boleto está disponible" });
                    } else {
                      toast({ title: "✗ Boleto no disponible", description: "Este boleto ya fue vendido", variant: "destructive" });
                    }
                  }}
                  className="w-full"
                  disabled={!verifyTicketNumber}
                >
                  Verificar Boleto
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            {stories && stories.length > 0 ? (
              <Card className="bg-gradient-to-br from-card/80 to-muted/20 border-border/40">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {stories.map((story: any) => (
                      <div key={story.id} className="group aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer">
                        {story.mediaType === "photo" ? (
                          <img 
                            src={story.mediaUrl} 
                            alt="Gallery" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                          />
                        ) : (
                          <video 
                            src={story.mediaUrl} 
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-card/80 to-muted/20 border-border/40">
                <CardContent className="py-12 text-center">
                  <Images className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="text-muted-foreground">No hay fotos/videos en la galería</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Customer Form Dialog */}
      <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Completa tu Información
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nombre *</Label>
                <Input
                  placeholder="Juan"
                  value={customerData.firstName}
                  onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Apellido *</Label>
                <Input
                  placeholder="Pérez"
                  value={customerData.lastName}
                  onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Teléfono *</Label>
              <Input
                placeholder="+52 1234567890"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">WhatsApp *</Label>
              <Input
                placeholder="Tu número WhatsApp"
                value={customerData.whatsapp}
                onChange={(e) => setCustomerData({ ...customerData, whatsapp: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-semibold mb-2">Total a pagar: {formatCurrency(totalAmount)}</p>
              <p className="mb-2">Boletos: {selectedTickets.join(", ")}</p>
              <p>Se abrirá WhatsApp para confirmar tu pago.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCustomerForm(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createCustomerMutation.mutate()}
              disabled={
                !customerData.firstName || 
                !customerData.lastName || 
                !customerData.email || 
                !customerData.phone ||
                !customerData.whatsapp ||
                createCustomerMutation.isPending
              }
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {createCustomerMutation.isPending ? "Enviando..." : "Abrir WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
