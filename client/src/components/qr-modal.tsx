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
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

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
                          className={`flex-1 p-4 border rounded-lg transition-all ${
                            field.value === "normal"
                              ? "border-primary bg-primary/5"
                              : "border-border hover-elevate"
                          }`}
                          data-testid="button-account-type-normal"
                        >
                          <div className="text-sm font-medium">WhatsApp Normal</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Cuenta personal estándar
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("business")}
                          className={`flex-1 p-4 border rounded-lg transition-all ${
                            field.value === "business"
                              ? "border-primary bg-primary/5"
                              : "border-border hover-elevate"
                          }`}
                          data-testid="button-account-type-business"
                        >
                          <div className="text-sm font-medium">WhatsApp Business</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Cuenta empresarial
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
              <DialogTitle className="text-lg font-semibold">
                Escanear Código QR
              </DialogTitle>
              <DialogDescription>
                Abre WhatsApp en tu teléfono y escanea este código para vincular tu cuenta
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-6">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-64 h-64 border rounded-lg"
                  data-testid="img-qr-code"
                />
              ) : (
                <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-muted">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-4 text-center">
                El código QR se actualiza automáticamente cada 60 segundos
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                data-testid="button-close-qr"
              >
                Cerrar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
