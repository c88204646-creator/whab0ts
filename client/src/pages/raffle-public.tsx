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
import { ShoppingCart, Check, AlertCircle, Menu, X, MessageCircle, Zap, Search, Info, Images, TrendingUp, Heart, Share2, Lock, Clock } from "lucide-react";
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
  const [isFavorite, setIsFavorite] = useState(false);
  
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

  const { data: stories = [] } = useQuery({
    queryKey: ["/api/raffles", raffleId, "stories", "public"],
    enabled: !!raffleId && !!raffle?.isPublished,
  });

  const { data: bankAccounts = [] } = useQuery({
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Cargando sorteo...</p>
        </div>
      </div>
    );
  }

  if (!raffle || !raffle.isPublished) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4">
        <Card className="w-full max-w-md border-destructive/30 bg-destructive/5">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-lg font-bold text-foreground mb-2">Sorteo no disponible</p>
            <p className="text-sm text-muted-foreground">Este sorteo aún no ha sido publicado o no existe</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/2 to-background">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-primary to-primary/60 flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-foreground">{raffle.title}</h1>
              <p className="text-xs text-muted-foreground">Sorteo Profesional</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <button onClick={() => setActiveTab("info")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "info" ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
              <Info className="w-4 h-4 inline mr-2" /> Información
            </button>
            <button onClick={() => setActiveTab("tickets")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "tickets" ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
              <ShoppingCart className="w-4 h-4 inline mr-2" /> Boletos
            </button>
            <button onClick={() => setActiveTab("verify")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "verify" ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
              <Search className="w-4 h-4 inline mr-2" /> Verificar
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button onClick={() => setNavOpen(!navOpen)} className="md:hidden p-2 hover:bg-muted rounded-lg">
            {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {navOpen && (
          <div className="md:hidden border-t border-border/30 bg-muted/20 p-3 space-y-1">
            {[
              { id: "info", label: "Información", icon: Info },
              { id: "tickets", label: "Boletos", icon: ShoppingCart },
              { id: "verify", label: "Verificar", icon: Search },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setNavOpen(false); }}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === item.id ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-primary/20 text-primary border-primary/30">SORTEO ACTIVO</Badge>
                <Badge variant="outline" className="text-xs">En Venta</Badge>
              </div>
              <h2 className="text-5xl lg:text-6xl font-black text-foreground leading-tight">{raffle.title}</h2>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">{raffle.description}</p>
              
              <div className="flex items-center gap-4 pt-4">
                <Button size="lg" onClick={() => setActiveTab("tickets")} className="gap-2 shadow-lg">
                  <ShoppingCart className="w-5 h-5" /> Comprar Ahora
                </Button>
                <Button size="lg" variant="outline" onClick={() => setIsFavorite(!isFavorite)} className={isFavorite ? "text-destructive" : ""}>
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">DISPONIBLES</p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">{availableTickets.length}</p>
                  <p className="text-xs text-muted-foreground mt-2">de {raffle.totalTickets} boletos</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">PRECIO</p>
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">${raffle.ticketPrice / 100}</p>
                  <p className="text-xs text-muted-foreground mt-2">Por boleto</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">TU SELECCIÓN</p>
                  <p className="text-4xl font-bold text-primary">${totalAmount / 100}</p>
                  <p className="text-xs text-muted-foreground mt-2">{selectedTickets.length} boletos</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 pb-20 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Description Card */}
                <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3 border-b border-border/30">
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      Detalles del Sorteo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground leading-relaxed text-base">{raffle.description}</p>
                  </CardContent>
                </Card>

                {/* Gallery - Professional Grid */}
                {stories && stories.length > 0 && (
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader className="pb-3 border-b border-border/30">
                      <CardTitle className="flex items-center gap-2">
                        <Images className="w-5 h-5 text-primary" />
                        Galería Fotográfica
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {stories.map((story: any) => (
                          <div key={story.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/50 cursor-pointer">
                            {story.mediaType === "photo" ? (
                              <img src={story.mediaUrl} alt="Gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            ) : (
                              <video src={story.mediaUrl} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Methods */}
                {bankAccounts && bankAccounts.length > 0 && (
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader className="pb-3 border-b border-border/30">
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        Datos para Transferencia
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-3">
                      {bankAccounts.map((acc: any) => (
                        <div key={acc.id} className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{acc.bankName}</p>
                            <Badge variant="secondary" className="text-xs">{acc.accountType === "checking" ? "Corriente" : "Ahorros"}</Badge>
                          </div>
                          <p className="font-mono font-bold text-foreground text-lg break-all">{acc.accountNumber}</p>
                          <p className="text-xs text-muted-foreground mt-2">A nombre de: {acc.accountHolder}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 shadow-lg sticky top-20">
                  <CardHeader>
                    <CardTitle className="text-lg">Información Rápida</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Total Boletos</p>
                        <p className="text-3xl font-black text-foreground">{raffle.totalTickets}</p>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                        <p className="text-xs text-green-700 dark:text-green-300 font-bold uppercase tracking-wider mb-2">Disponibles</p>
                        <p className="text-3xl font-black text-green-600 dark:text-green-400">{availableTickets.length}</p>
                      </div>
                      {raffle.drawDate && (
                        <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Sorteo</p>
                          <p className="font-bold text-foreground text-sm">
                            {new Date(raffle.drawDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button size="lg" className="w-full gap-2 shadow-lg" onClick={() => setActiveTab("tickets")}>
                      <ShoppingCart className="w-4 h-4" />
                      Seleccionar Boletos
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
                <Card className="border-border/50 shadow-lg bg-gradient-to-br from-card via-card to-muted/10">
                  <CardHeader className="pb-3 border-b border-border/30">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Selección Rápida
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      El sistema seleccionará aleatoriamente 5 boletos disponibles para ti. Ideal si prefieres suerte aleatoria.
                    </p>
                    <Button onClick={handleAutoSelectTickets} disabled={isAutoSelectAnimating || availableTickets.length === 0} className="w-full gap-2" size="lg">
                      {isAutoSelectAnimating ? "Seleccionando..." : "Seleccionar 5 Boletos al Azar"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Tickets Grid */}
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="pb-3 border-b border-border/30">
                    <div className="flex items-center justify-between">
                      <CardTitle>Elige tus Boletos</CardTitle>
                      <Badge variant="outline">{selectedTickets.length} seleccionados</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
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
                          className={`aspect-square rounded-lg font-bold text-xs transition-all border-2 hover:scale-105 ${
                            selectedTickets.includes(ticket)
                              ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground border-primary shadow-lg scale-105"
                              : "bg-muted/60 border-border/50 hover:border-primary/50 hover:bg-muted/80"
                          }`}
                          data-testid={`button-ticket-${ticket}`}
                        >
                          {ticket.toString().padStart(6, "0")}
                        </button>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-6 border-t border-border/30">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                          ← Anterior
                        </Button>
                        <span className="text-xs text-muted-foreground font-semibold">
                          Página {currentPage} de {totalPages}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                          Siguiente →
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Checkout Sidebar */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 shadow-lg sticky top-20">
                  <CardHeader className="pb-3 border-b border-primary/30">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Resumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-3">
                      <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Boletos</p>
                        <p className="text-3xl font-black text-foreground">{selectedTickets.length}</p>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Total a Pagar</p>
                        <p className="text-3xl font-black text-primary">${totalAmount / 100}</p>
                      </div>
                    </div>

                    {selectedTickets.length > 0 && (
                      <div className="bg-muted/30 rounded-lg p-3 max-h-32 overflow-y-auto border border-border/30">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Boletos Seleccionados</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTickets.sort((a, b) => a - b).map(ticket => (
                            <Badge key={ticket} variant="secondary" className="text-xs">
                              {ticket.toString().padStart(6, "0")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button size="lg" className="w-full gap-2 shadow-lg" disabled={selectedTickets.length === 0} onClick={() => setShowCustomerForm(true)}>
                      <MessageCircle className="w-4 h-4" />
                      Apartar Boletos
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">Se abrirá WhatsApp para confirmar</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Verify Tab */}
          <TabsContent value="verify" className="space-y-6">
            <Card className="border-border/50 shadow-lg max-w-2xl">
              <CardHeader className="pb-3 border-b border-border/30">
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Verificar Disponibilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <p className="text-muted-foreground">Ingresa un número de boleto (6 dígitos) para verificar si está disponible.</p>
                
                <div className="space-y-3">
                  <Label htmlFor="verify-input" className="text-sm font-semibold">Número de Boleto</Label>
                  <div className="flex gap-3">
                    <Input
                      id="verify-input"
                      type="text"
                      placeholder="000123"
                      value={verifyTicketNumber}
                      onChange={(e) => setVerifyTicketNumber(e.target.value.padStart(6, "0"))}
                      maxLength={6}
                      className="text-center font-mono text-lg font-bold"
                    />
                    <Button
                      onClick={() => {
                        const ticket = parseInt(verifyTicketNumber);
                        if (availableTickets.includes(ticket)) {
                          toast({ title: "✓ Boleto Disponible", description: `El boleto ${verifyTicketNumber} está disponible para comprar` });
                        } else {
                          toast({ title: "✗ No Disponible", description: `El boleto ${verifyTicketNumber} ya fue vendido`, variant: "destructive" });
                        }
                      }}
                      disabled={!verifyTicketNumber}
                      className="gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Verificar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Customer Form Dialog */}
      <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Información de Comprador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Nombre *</Label>
                <Input placeholder="Juan" value={customerData.firstName} onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })} className="text-sm mt-1.5" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Apellido *</Label>
                <Input placeholder="Pérez" value={customerData.lastName} onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })} className="text-sm mt-1.5" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Email *</Label>
              <Input type="email" placeholder="tu@email.com" value={customerData.email} onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })} className="text-sm mt-1.5" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Teléfono *</Label>
              <Input placeholder="+52 1234567890" value={customerData.phone} onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })} className="text-sm mt-1.5" />
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-bold text-foreground">Resumen de Compra</p>
              <p className="text-muted-foreground">Total: <span className="font-bold text-primary">${totalAmount / 100}</span></p>
              <p className="text-muted-foreground">Boletos: <span className="font-mono font-bold">{selectedTickets.join(", ")}</span></p>
              <p className="text-xs text-muted-foreground pt-2 border-t border-primary/20">Se abrirá WhatsApp para confirmar tu pago</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCustomerForm(false)}>Cancelar</Button>
            <Button
              onClick={() => createCustomerMutation.mutate()}
              disabled={
                !customerData.firstName || 
                !customerData.lastName || 
                !customerData.email || 
                !customerData.phone ||
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
