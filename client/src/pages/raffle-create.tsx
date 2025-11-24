import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Plus, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const DEFAULT_RULES = `1. El sorteo se realiza según la disponibilidad de boletos.
2. Los ganadores serán notificados vía correo electrónico.
3. El premio debe ser reclamado dentro de 30 días.
4. No se permiten cambios de boletos después de la compra.
5. Los resultados son finales y vinculantes.`;

export default function RaffleCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = JSON.parse(localStorage.getItem("user") || "{}").id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalTickets: "100",
    ticketPrice: "50",
    currency: "MXN",
    drawDate: "",
    rules: DEFAULT_RULES,
    photoUrl: "",
    videoUrl: "",
  });

  const [images, setImages] = useState<string[]>([]);

  const createRaffleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/raffles", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          userId,
          totalTickets: parseInt(data.totalTickets),
          ticketPrice: parseInt(data.ticketPrice),
          status: "draft",
          isPublished: false,
        }),
      });
    },
    onSuccess: (raffle: any) => {
      toast({ title: "✓ Rifa creada", description: "Tu rifa se ha creado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", userId] });
      navigate("/raffles");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
      return;
    }
    if (!formData.totalTickets || parseInt(formData.totalTickets) < 10) {
      toast({ title: "Error", description: "Mínimo 10 boletos", variant: "destructive" });
      return;
    }
    if (!formData.ticketPrice || parseInt(formData.ticketPrice) < 1) {
      toast({ title: "Error", description: "El precio debe ser mayor a 0", variant: "destructive" });
      return;
    }
    createRaffleMutation.mutate(formData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In a real app, this would upload to a server/CDN
      // For now, we'll just show a preview
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImages(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      {/* Header - Matching Surveys Style */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-foreground">Crear Nueva Rifa</h1>
                    <p className="text-xs text-muted-foreground">Configura los detalles de tu rifa profesional</p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9"
                onClick={() => navigate("/raffles")}
                data-testid="button-back-to-raffles"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información General */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-semibold mb-2 block">Nombre de la Rifa *</Label>
                    <Input
                      id="title"
                      placeholder="Ej: iPhone 15 Pro Max"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-10"
                      data-testid="input-raffle-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-semibold mb-2 block">Descripción del Premio</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe detalladamente el premio que se rifará..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="resize-none min-h-24"
                      data-testid="textarea-raffle-description"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Configuración de Boletos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Configuración de Boletos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="totalTickets" className="text-sm font-semibold mb-2 block">Total Boletos *</Label>
                      <Input
                        id="totalTickets"
                        type="text"
                        inputMode="numeric"
                        placeholder="100"
                        value={formData.totalTickets}
                        onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value.replace(/[^\d]/g, '') })}
                        className="h-10"
                        data-testid="input-total-tickets"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency" className="text-sm font-semibold mb-2 block">Divisa</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger data-testid="select-currency" className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MXN">MXN (Pesos Mexicanos)</SelectItem>
                          <SelectItem value="USD">USD (Dólares)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ticketPrice" className="text-sm font-semibold mb-2 block">Precio Boleto *</Label>
                      <Input
                        id="ticketPrice"
                        type="text"
                        inputMode="numeric"
                        placeholder="50"
                        value={formData.ticketPrice}
                        onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value.replace(/[^\d]/g, '') })}
                        className="h-10"
                        data-testid="input-ticket-price"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="drawDate" className="text-sm font-semibold mb-2 block">Fecha del Sorteo</Label>
                    <Input
                      id="drawDate"
                      type="datetime-local"
                      value={formData.drawDate}
                      onChange={(e) => setFormData({ ...formData, drawDate: e.target.value })}
                      className="h-10"
                      data-testid="input-draw-date"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Medios */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Medios del Premio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="photo" className="text-sm font-semibold mb-2 block">Foto Principal</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setFormData({ ...formData, photoUrl: evt.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="h-10"
                        data-testid="input-photo"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="video" className="text-sm font-semibold mb-2 block">Video Promocional (URL)</Label>
                    <Input
                      id="video"
                      type="url"
                      placeholder="https://youtube.com/..."
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="h-10"
                      data-testid="input-video-url"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Galería de Fotos</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="gallery-upload"
                      />
                      <label htmlFor="gallery-upload" className="cursor-pointer block">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Arrastra fotos o haz clic para subir</p>
                      </label>
                    </div>
                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img src={img} alt={`preview-${idx}`} className="w-full h-24 object-cover rounded-lg" />
                            <button
                              onClick={() => setImages(images.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 p-1 bg-red-600 rounded-full hover:bg-red-700"
                              data-testid={`button-remove-image-${idx}`}
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reglas Legales */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Términos y Condiciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="rules" className="text-sm font-semibold mb-2 block">Reglas de la Rifa</Label>
                    <Textarea
                      id="rules"
                      value={formData.rules}
                      onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                      className="resize-none min-h-32 text-xs font-mono"
                      data-testid="textarea-rules"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Estas reglas serán mostradas a los compradores</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Preview */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Vista Previa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">RIFA</p>
                      <p className="font-bold text-foreground truncate">{formData.title || "Nombre de la rifa"}</p>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground font-semibold mb-2">PRECIOS</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Boletos:</span>
                          <span className="font-semibold">{formData.totalTickets}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Precio:</span>
                          <span className="font-semibold">{formData.ticketPrice} {formData.currency}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span>Total:</span>
                          <span className="font-bold text-primary">
                            {(parseInt(formData.totalTickets || 0) * parseInt(formData.ticketPrice || 0)).toLocaleString()} {formData.currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground font-semibold mb-2">ESTADO</p>
                      <p className="inline-block px-2 py-1 rounded-full bg-slate-500/20 text-slate-400 text-xs font-medium">Borrador</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-2">
                    <Button 
                      onClick={handleSubmit} 
                      className="w-full h-10" 
                      disabled={createRaffleMutation.isPending}
                      data-testid="button-create-raffle"
                    >
                      {createRaffleMutation.isPending ? "Creando..." : "Crear Rifa"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/raffles")} 
                      className="w-full h-10"
                      data-testid="button-cancel-create"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
