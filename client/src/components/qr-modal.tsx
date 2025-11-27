import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, User, Briefcase, Smartphone, RefreshCw, CheckCircle2 } from "lucide-react";

const deviceSchema = z.object({
  deviceName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  accountType: z.enum(["normal", "business"]),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface QRModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DeviceFormData) => Promise<void>;
  qrCode?: string;
  step: "config" | "qr";
}

export function QRModal({ open, onClose, onSubmit, qrCode, step }: QRModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      deviceName: "",
      accountType: "normal",
    },
  });

  const handleSubmit = async (data: DeviceFormData) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="modal-qr">
        {step === "config" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Configurar Dispositivo
              </DialogTitle>
              <DialogDescription>
                Asigna un nombre al dispositivo y selecciona el tipo de cuenta
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="deviceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Dispositivo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: WhatsApp Ventas"
                          disabled={isLoading}
                          data-testid="input-device-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cuenta</FormLabel>
                      <div className="flex gap-4 mt-2">
                        <button
                          type="button"
                          onClick={() => field.onChange("normal")}
                          className={`flex-1 p-4 border rounded-lg transition-all flex flex-col items-center gap-3 ${
                            field.value === "normal"
                              ? "border-primary bg-primary/5"
                              : "border-border hover-elevate"
                          }`}
                          data-testid="button-account-type-normal"
                        >
                          <User className="w-6 h-6 text-blue-500" />
                          <div className="text-center">
                            <div className="text-sm font-medium">WhatsApp Normal</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Cuenta personal estándar
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("business")}
                          className={`flex-1 p-4 border rounded-lg transition-all flex flex-col items-center gap-3 ${
                            field.value === "business"
                              ? "border-primary bg-primary/5"
                              : "border-border hover-elevate"
                          }`}
                          data-testid="button-account-type-business"
                        >
                          <Briefcase className="w-6 h-6 text-emerald-500" />
                          <div className="text-center">
                            <div className="text-sm font-medium">WhatsApp Business</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Cuenta empresarial
                            </div>
                          </div>
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    data-testid="button-generate-qr"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      "Generar QR"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Escanear Código QR
              </DialogTitle>
              <DialogDescription>
                Abre WhatsApp en tu teléfono y escanea este código para vincular tu cuenta
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-4">
              <div className="relative">
                {qrCode ? (
                  <>
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-64 h-64 border-2 rounded-lg"
                      data-testid="img-qr-code"
                    />
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-green-500 rounded-full p-1 animate-pulse">
                        <RefreshCw className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-64 h-64 border-2 rounded-lg flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Generando código QR...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3 w-full max-w-sm">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Paso 1:</span> Abre WhatsApp en tu teléfono
                    </div>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Paso 2:</span> Ve a Ajustes &gt; Dispositivos vinculados
                    </div>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Paso 3:</span> Escanea este código QR con tu cámara
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>El código se actualiza automáticamente</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                data-testid="button-close-qr"
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
