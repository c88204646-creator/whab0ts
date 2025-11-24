import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, Upload, Share2, Eye, MoreVertical, Image as ImageIcon, Video, MapPin, DollarSign, Check, X, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Raffle, RaffleStory, RaffleBankAccount, RafflePurchase } from "@shared/schema";

export default function RaffleDetailsPage() {
  const [match, params] = useRoute("/raffles/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [raffleTitle, setRaffleTitle] = useState("");
  const [raffleDescription, setRaffleDescription] = useState("");
  const [totalTickets, setTotalTickets] = useState(100);
  const [ticketPrice, setTicketPrice] = useState(100);
  const [raffleStatus, setRaffleStatus] = useState("draft");
  const [isPublished, setIsPublished] = useState(false);
  const [whatsappContactNumber, setWhatsappContactNumber] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [showAddStory, setShowAddStory] = useState(false);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyMediaFile, setStoryMediaFile] = useState<File | null>(null);
  const [storyMediaType, setStoryMediaType] = useState<"photo" | "video">("photo");
  const [storyMediaPreview, setStoryMediaPreview] = useState<string>("");
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings">("checking");

  const raffleId = params?.id;

  const { data: raffle, isLoading } = useQuery<Raffle>({
    queryKey: [`/api/raffles/${raffleId}`],
    enabled: !!raffleId,
    retry: false,
  });

  const { data: stories = [] } = useQuery<RaffleStory[]>({
    queryKey: [`/api/raffles/${raffleId}/stories`],
    enabled: !!raffleId,
  });

  const { data: bankAccounts = [] } = useQuery<RaffleBankAccount[]>({
    queryKey: [`/api/raffles/${raffleId}/bank-accounts`],
    enabled: !!raffleId,
  });

  const { data: purchases = [] } = useQuery<RafflePurchase[]>({
    queryKey: [`/api/raffles/${raffleId}/purchases`],
    enabled: !!raffleId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/raffles/${raffleId}`, data);
    },
    onSuccess: () => {
      toast({ title: "Éxito", description: "Rifa actualizada correctamente" });
      queryClient.invalidateQueries({ queryKey: [`/api/raffles/${raffleId}`] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/raffles/${raffleId}/stories`, data);
    },
    onSuccess: () => {
      toast({ title: "✓ Historia creada", description: "Tu historia se agregó exitosamente" });
      queryClient.invalidateQueries({ queryKey: [`/api/raffles/${raffleId}/stories`] });
      setShowAddStory(false);
      setStoryCaption("");
      setStoryMediaFile(null);
      setStoryMediaPreview("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      return apiRequest("DELETE", `/api/raffles/${raffleId}/stories/${storyId}`);
    },
    onSuccess: () => {
      toast({ title: "✓ Historia eliminada" });
      queryClient.invalidateQueries({ queryKey: [`/api/raffles/${raffleId}/stories`] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createBankAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/raffles/${raffleId}/bank-accounts`, data);
    },
    onSuccess: () => {
      toast({ title: "✓ Cuenta agregada", description: "La cuenta bancaria se agregó exitosamente" });
      queryClient.invalidateQueries({ queryKey: [`/api/raffles/${raffleId}/bank-accounts`] });
      setShowAddBankAccount(false);
      setBankName("");
      setAccountHolder("");
      setAccountNumber("");
      setAccountType("checking");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteBankAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return apiRequest("DELETE", `/api/raffles/${raffleId}/bank-accounts/${accountId}`);
    },
    onSuccess: () => {
      toast({ title: "✓ Cuenta eliminada" });
      queryClient.invalidateQueries({ queryKey: [`/api/raffles/${raffleId}/bank-accounts`] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (raffle) {
      setRaffleTitle(raffle.title);
      setRaffleDescription(raffle.description || "");
      setTotalTickets(raffle.totalTickets);
      setTicketPrice(raffle.ticketPrice / 100);
      setRaffleStatus(raffle.status || "draft");
      setIsPublished(raffle.isPublished ?? false);
      setWhatsappContactNumber(raffle.whatsappContactNumber || "");
    }
  }, [raffle]);

  // Auto-save when isPublished changes
  useEffect(() => {
    if (raffle && isPublished !== (raffle.isPublished ?? false)) {
      updateMutation.mutate({ isPublished });
    }
  }, [isPublished, raffle?.isPublished]);

  const handleSave = () => {
    updateMutation.mutate({
      title: raffleTitle,
      description: raffleDescription,
      totalTickets: Number(totalTickets),
      ticketPrice: Number(ticketPrice) * 100,
      status: raffleStatus,
      isPublished,
      whatsappContactNumber,
    });
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video");
    setStoryMediaType(isVideo ? "video" : "photo");
    setStoryMediaFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setStoryMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStory = async () => {
    if (!storyMediaFile || !storyMediaPreview) {
      toast({ title: "Error", description: "Selecciona una foto o video", variant: "destructive" });
      return;
    }

    createStoryMutation.mutate({
      mediaUrl: storyMediaPreview,
      mediaType: storyMediaType,
      caption: storyCaption || undefined,
    });
  };

  const handleCreateBankAccount = () => {
    if (!bankName.trim() || !accountHolder.trim() || !accountNumber.trim()) {
      toast({ title: "Error", description: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    createBankAccountMutation.mutate({
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      accountNumber: accountNumber.trim(),
      accountType,
    });
  };

  // Calculate stats
  const totalRevenue = purchases.reduce((sum, p) => sum + (p.quantity * ticketPrice || 0), 0);
  const soldTickets = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const pendingPayments = purchases.filter(p => p.paymentStatus === "pending").length;
  const approvedPayments = purchases.filter(p => p.paymentStatus === "approved").length;

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Cargando rifa...</div>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-semibold text-destructive mb-2">Rifa no encontrada</div>
        </div>
      </div>
    );
  }

  const publicUrl = `/raffle/${raffleId}`;

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 flex-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/raffles")} 
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-lg font-bold">{raffle.title}</h1>
                  <p className="text-xs text-muted-foreground/70">Panel de Control de Rifa</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(publicUrl, '_blank')}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Ver Público
                </Button>
                <Badge variant={isPublished ? "default" : "secondary"}>
                  {isPublished ? "Publicada" : "Borrador"}
                </Badge>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded p-2">
                <p className="text-xs text-muted-foreground mb-0.5">Boletos Vendidos</p>
                <p className="text-xl font-bold">{soldTickets} / {totalTickets}</p>
              </div>
              <div className="bg-green-500/10 rounded p-2">
                <p className="text-xs text-green-600/70 mb-0.5">Ingresos</p>
                <p className="text-xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-blue-500/10 rounded p-2">
                <p className="text-xs text-blue-600/70 mb-0.5">Pagos Pendientes</p>
                <p className="text-xl font-bold">{pendingPayments}</p>
              </div>
              <div className="bg-purple-500/10 rounded p-2">
                <p className="text-xs text-purple-600/70 mb-0.5">Pagos Aprobados</p>
                <p className="text-xl font-bold">{approvedPayments}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="historias">Historias</TabsTrigger>
              <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
              <TabsTrigger value="boletos">Boletos</TabsTrigger>
              <TabsTrigger value="compras">Compras</TabsTrigger>
              <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base">Información de la Rifa</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título de la Rifa</Label>
                    <Input
                      id="title"
                      value={raffleTitle}
                      onChange={(e) => setRaffleTitle(e.target.value)}
                      placeholder="Ej: Rifa de Auto 2024"
                      className="bg-background border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={raffleDescription}
                      onChange={(e) => setRaffleDescription(e.target.value)}
                      placeholder="Describe el premio y detalles de la rifa"
                      rows={4}
                      className="bg-background border-border/50 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tickets">Total de Boletos</Label>
                      <Input
                        id="tickets"
                        type="number"
                        value={totalTickets}
                        onChange={(e) => setTotalTickets(Number(e.target.value))}
                        className="bg-background border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Precio por Boleto ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(Number(e.target.value))}
                        className="bg-background border-border/50"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">Número WhatsApp Principal (para confirmaciones)</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={whatsappContactNumber}
                      onChange={(e) => setWhatsappContactNumber(e.target.value)}
                      placeholder="+52 1234567890"
                      className="bg-background border-border/50"
                    />
                    <p className="text-xs text-muted-foreground">Este número recibirá las confirmaciones de compra de boletos por WhatsApp</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">Estado</p>
                        <p className="text-xs text-muted-foreground">{raffleStatus}</p>
                      </div>
                      <select 
                        value={raffleStatus}
                        onChange={(e) => setRaffleStatus(e.target.value)}
                        className="px-3 py-2 rounded-md border border-border/50 bg-background text-sm"
                      >
                        <option value="draft">Borrador</option>
                        <option value="active">Activa</option>
                        <option value="closed">Cerrada</option>
                        <option value="finished">Finalizada</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">Publicar Rifa</p>
                        <p className="text-xs text-muted-foreground">Visible en la página pública</p>
                      </div>
                      <Switch
                        checked={isPublished}
                        onCheckedChange={setIsPublished}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="w-full mt-4"
                  >
                    {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stories Tab */}
            <TabsContent value="historias" className="space-y-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Historias (Estilo Instagram)</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setShowAddStory(true)}
                      data-testid="button-add-story"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Historia
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {stories.length === 0 ? (
                    <div className="text-center py-8">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No hay historias aún</p>
                      <p className="text-xs text-muted-foreground mt-1">Agrega fotos o videos que se mostrarán en la página pública</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {stories.map((story) => (
                        <div 
                          key={story.id} 
                          className="relative group rounded-lg overflow-hidden bg-muted aspect-square hover:shadow-lg transition-shadow"
                          data-testid={`story-${story.id}`}
                        >
                          {story.mediaType === "photo" ? (
                            <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                          ) : (
                            <video src={story.mediaUrl} className="w-full h-full object-cover" />
                          )}
                          {story.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="text-xs text-white line-clamp-2">{story.caption}</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="w-9 h-9 bg-red-500/80 hover:bg-red-600 text-white"
                              onClick={() => deleteStoryMutation.mutate(story.id)}
                              disabled={deleteStoryMutation.isPending}
                              data-testid={`button-delete-story-${story.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Story Modal */}
              {showAddStory && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border-border">
                    <CardHeader className="pb-3 border-b border-border/50 flex items-center justify-between flex-row sticky top-0 bg-card">
                      <CardTitle className="text-base">Crear Historia</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setShowAddStory(false);
                          setStoryCaption("");
                          setStoryMediaFile(null);
                          setStoryMediaPreview("");
                        }}
                        data-testid="button-close-story-modal"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Media Preview */}
                      {storyMediaPreview ? (
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                          {storyMediaType === "photo" ? (
                            <img src={storyMediaPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <video src={storyMediaPreview} className="w-full h-full object-cover" controls />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                            onClick={() => {
                              setStoryMediaFile(null);
                              setStoryMediaPreview("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="story-media" className="text-sm font-medium">
                            Foto o Video
                          </Label>
                          <input
                            id="story-media"
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleMediaFileChange}
                            className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-background text-sm cursor-pointer"
                            data-testid="input-story-media"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Soporta fotos (JPG, PNG) y videos (MP4, WebM)
                          </p>
                        </div>
                      )}

                      {/* Caption */}
                      <div>
                        <Label htmlFor="story-caption" className="text-sm font-medium">
                          Descripción (opcional)
                        </Label>
                        <Textarea
                          id="story-caption"
                          placeholder="Escribe una descripción para tu historia..."
                          value={storyCaption}
                          onChange={(e) => setStoryCaption(e.target.value)}
                          className="mt-2 min-h-20 resize-none"
                          data-testid="textarea-story-caption"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowAddStory(false);
                            setStoryCaption("");
                            setStoryMediaFile(null);
                            setStoryMediaPreview("");
                          }}
                          data-testid="button-cancel-story"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleCreateStory}
                          disabled={createStoryMutation.isPending || !storyMediaPreview}
                          data-testid="button-create-story"
                        >
                          {createStoryMutation.isPending ? "Subiendo..." : "Subir Historia"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Bank Accounts Tab */}
            <TabsContent value="cuentas" className="space-y-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Cuentas Bancarias para Cobro</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setShowAddBankAccount(true)}
                      data-testid="button-add-bank-account"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Cuenta
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {bankAccounts.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No hay cuentas configuradas</p>
                      <p className="text-xs text-muted-foreground mt-1">Agrega cuentas bancarias donde los clientes pueden transferir el pago</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bankAccounts.map((account) => (
                        <Card key={account.id} className="p-3 border border-border/50 hover:shadow-md transition-shadow" data-testid={`bank-account-${account.id}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{account.bankName}</p>
                              <p className="text-xs text-muted-foreground">{account.accountHolder}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Número: <span className="font-mono">{account.accountNumber}</span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Tipo: {account.accountType === "checking" ? "Cuenta Corriente" : "Ahorros"}
                              </p>
                            </div>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="w-8 h-8 text-destructive hover:text-destructive"
                              onClick={() => deleteBankAccountMutation.mutate(account.id)}
                              disabled={deleteBankAccountMutation.isPending}
                              data-testid={`button-delete-bank-account-${account.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Bank Account Modal */}
              {showAddBankAccount && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border-border">
                    <CardHeader className="pb-3 border-b border-border/50 flex items-center justify-between flex-row sticky top-0 bg-card">
                      <CardTitle className="text-base">Agregar Cuenta Bancaria</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setShowAddBankAccount(false);
                          setBankName("");
                          setAccountHolder("");
                          setAccountNumber("");
                          setAccountType("checking");
                        }}
                        data-testid="button-close-bank-modal"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Bank Name */}
                      <div>
                        <Label htmlFor="bank-name" className="text-sm font-medium">
                          Nombre del Banco *
                        </Label>
                        <Input
                          id="bank-name"
                          placeholder="ej: BBVA, Scotiabank, Citibanamex..."
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="mt-2"
                          data-testid="input-bank-name"
                        />
                      </div>

                      {/* Account Holder */}
                      <div>
                        <Label htmlFor="account-holder" className="text-sm font-medium">
                          Titular de la Cuenta *
                        </Label>
                        <Input
                          id="account-holder"
                          placeholder="Nombre completo"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          className="mt-2"
                          data-testid="input-account-holder"
                        />
                      </div>

                      {/* Account Number */}
                      <div>
                        <Label htmlFor="account-number" className="text-sm font-medium">
                          Número de Cuenta *
                        </Label>
                        <Input
                          id="account-number"
                          placeholder="Número completo o CLABE"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="mt-2"
                          data-testid="input-account-number"
                        />
                      </div>

                      {/* Account Type */}
                      <div>
                        <Label htmlFor="account-type" className="text-sm font-medium">
                          Tipo de Cuenta
                        </Label>
                        <select
                          id="account-type"
                          value={accountType}
                          onChange={(e) => setAccountType(e.target.value as "checking" | "savings")}
                          className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-background text-sm"
                          data-testid="select-account-type"
                        >
                          <option value="checking">Cuenta Corriente</option>
                          <option value="savings">Ahorros</option>
                        </select>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowAddBankAccount(false);
                            setBankName("");
                            setAccountHolder("");
                            setAccountNumber("");
                            setAccountType("checking");
                          }}
                          data-testid="button-cancel-bank"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleCreateBankAccount}
                          disabled={createBankAccountMutation.isPending}
                          data-testid="button-create-bank-account"
                        >
                          {createBankAccountMutation.isPending ? "Agregando..." : "Agregar Cuenta"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="boletos" className="space-y-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base">Gestión de Boletos</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground/70 mb-1">Disponibles</p>
                      <p className="text-2xl font-bold">{totalTickets - soldTickets}</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg">
                      <p className="text-xs text-blue-600/70 mb-1">Apartados</p>
                      <p className="text-2xl font-bold">{soldTickets}</p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-lg">
                      <p className="text-xs text-green-600/70 mb-1">Pagados</p>
                      <p className="text-2xl font-bold">{approvedPayments}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Total de boletos disponibles: {totalTickets}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Purchases Tab */}
            <TabsContent value="compras" className="space-y-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base">Compras y Apartados</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {purchases.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No hay compras aún</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {purchases.map((purchase) => (
                        <Card key={purchase.id} className="p-3 border border-border/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{purchase.buyerName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {purchase.quantity} boletos
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{purchase.buyerEmail}</p>
                              <p className="text-xs text-muted-foreground">{purchase.buyerPhone}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {purchase.paymentStatus === "approved" ? (
                                  <Badge className="bg-green-600 text-white text-xs flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Pagado
                                  </Badge>
                                ) : purchase.paymentStatus === "pending" ? (
                                  <Badge className="bg-orange-600 text-white text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Pendiente
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-600 text-white text-xs flex items-center gap-1">
                                    <X className="w-3 h-3" />
                                    Rechazado
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  ${(purchase.quantity * ticketPrice).toFixed(2)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="estadisticas" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border/50 p-4">
                  <p className="text-xs text-muted-foreground mb-2">Tasa de Venta</p>
                  <p className="text-3xl font-bold">{totalTickets > 0 ? ((soldTickets / totalTickets) * 100).toFixed(1) : 0}%</p>
                  <p className="text-xs text-muted-foreground mt-2">{soldTickets} de {totalTickets} boletos</p>
                </Card>

                <Card className="border-border/50 p-4">
                  <p className="text-xs text-muted-foreground mb-2">Ingresos Totales</p>
                  <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-2">Por {soldTickets} boletos vendidos</p>
                </Card>

                <Card className="border-border/50 p-4">
                  <p className="text-xs text-muted-foreground mb-2">Promedio por Boleto</p>
                  <p className="text-3xl font-bold">${ticketPrice.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-2">Precio configurado</p>
                </Card>

                <Card className="border-border/50 p-4">
                  <p className="text-xs text-muted-foreground mb-2">Tasa de Pago</p>
                  <p className="text-3xl font-bold">{purchases.length > 0 ? ((approvedPayments / purchases.length) * 100).toFixed(1) : 0}%</p>
                  <p className="text-xs text-muted-foreground mt-2">{approvedPayments} de {purchases.length} compras pagadas</p>
                </Card>
              </div>

              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base">Estado de Pagos</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pagos Aprobados</span>
                      <Badge className="bg-green-600 text-white">{approvedPayments}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pagos Pendientes</span>
                      <Badge className="bg-orange-600 text-white">{pendingPayments}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total de Compras</span>
                      <Badge variant="secondary">{purchases.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
