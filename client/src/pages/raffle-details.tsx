import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, Upload, Share2, Eye, MoreVertical, Image as ImageIcon, Video, MapPin, DollarSign } from "lucide-react";
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
import type { Raffle, RaffleStory, RaffleBankAccount } from "@shared/schema";

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
  const [activeTab, setActiveTab] = useState("general");

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

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/raffles/${raffleId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Éxito", description: "Rifa actualizada correctamente" });
      queryClient.invalidateQueries({ queryKey: [`/api/raffles/${raffleId}`] });
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
      setTicketPrice(raffle.ticketPrice);
      setRaffleStatus(raffle.status || "draft");
      setIsPublished(raffle.isPublished ?? false);
    }
  }, [raffle]);

  const handleSave = () => {
    updateMutation.mutate({
      title: raffleTitle,
      description: raffleDescription,
      totalTickets: Number(totalTickets),
      ticketPrice: Number(ticketPrice),
      status: raffleStatus,
      isPublished,
    });
  };

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
                  <p className="text-xs text-muted-foreground/70">Gestor de rifa</p>
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="historias">Historias</TabsTrigger>
              <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
              <TabsTrigger value="boletos">Boletos</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base">Información Básica</CardTitle>
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
                        value={ticketPrice / 100}
                        onChange={(e) => setTicketPrice(Number(e.target.value) * 100)}
                        className="bg-background border-border/50"
                        step="0.01"
                      />
                    </div>
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
                    <Button size="sm" variant="outline" className="gap-2">
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
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-4">
                      {stories.map((story) => (
                        <div key={story.id} className="relative group rounded-lg overflow-hidden bg-muted aspect-video">
                          {story.mediaType === "photo" ? (
                            <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                          ) : (
                            <video src={story.mediaUrl} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="icon" variant="ghost" className="w-8 h-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bank Accounts Tab */}
            <TabsContent value="cuentas" className="space-y-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Cuentas Bancarias para Cobro</span>
                    <Button size="sm" variant="outline" className="gap-2">
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
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bankAccounts.map((account) => (
                        <Card key={account.id} className="p-3 border border-border/50">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-sm">{account.bankName}</p>
                              <p className="text-xs text-muted-foreground">{account.accountHolder}</p>
                              <p className="text-xs text-muted-foreground">Cuenta: {account.accountNumber}</p>
                            </div>
                            <Button size="icon" variant="ghost" className="w-8 h-8">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg">
                      <p className="text-xs text-blue-600/70 mb-1">Apartados</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-lg">
                      <p className="text-xs text-green-600/70 mb-1">Vendidos</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Los boletos se generan automáticamente (000001-{String(totalTickets).padStart(6, '0')})</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
