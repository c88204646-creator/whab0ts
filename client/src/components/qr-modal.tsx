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
      <DialogContent className="max-w-xs w-full p-4 gap-0 bg-muted/40 border-border/60" data-testid="modal-qr">
        {step === "config" ? (
          <>
            <DialogHeader className="pb-3 mb-3 border-b border-border/30">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Configurar Dispositivo
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground/80 mt-1">
                Nombre y tipo de cuenta
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2.5">
                <FormField
                  control={form.control}
                  name="deviceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-medium text-muted-foreground">Nombre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="WhatsApp Ventas"
                          disabled={isLoading}
                          data-testid="input-device-name"
                          className="h-7 text-xs bg-background/60 border-border/50"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-medium text-muted-foreground">Tipo</FormLabel>
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() => field.onChange("normal")}
                          className={`flex-1 px-2 py-1.5 border rounded-sm transition-all flex flex-col items-center gap-0.5 text-[10px] ${
                            field.value === "normal"
                              ? "border-blue-500/60 bg-blue-500/10"
                              : "border-border/40 bg-background/30 hover:bg-background/50"
                          }`}
                          data-testid="button-account-type-normal"
                        >
                          <User className="w-3 h-3 text-blue-400" />
                          <span className="font-medium">Normal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("business")}
                          className={`flex-1 px-2 py-1.5 border rounded-sm transition-all flex flex-col items-center gap-0.5 text-[10px] ${
                            field.value === "business"
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : "border-border/40 bg-background/30 hover:bg-background/50"
                          }`}
                          data-testid="button-account-type-business"
                        >
                          <Briefcase className="w-3 h-3 text-emerald-400" />
                          <span className="font-medium">Business</span>
                        </button>
                      </div>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <div className="flex gap-1.5 justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    data-testid="button-cancel"
                    size="sm"
                    className="h-7 text-[11px] px-3"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    data-testid="button-generate-qr"
                    size="sm"
                    className="h-7 text-[11px] px-3 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
                        Gen...
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
            <DialogHeader className="pb-2 mb-2 border-b border-border/30">
              <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                Escanear QR
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground/80 mt-1">
                Vincula tu cuenta escaneando el código
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-2">
              <div className="relative">
                {qrCode ? (
                  <>
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-40 h-40 border border-border/50 rounded-md bg-background"
                      data-testid="img-qr-code"
                    />
                    <div className="absolute -top-1 -right-1">
                      <div className="bg-emerald-500 rounded-full p-0.5 animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-40 h-40 border border-border/50 rounded-md flex items-center justify-center bg-background/50">
                    <div className="text-center">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/50 mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground/60">Generando...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2 space-y-1 w-full">
                <div className="bg-blue-500/8 border border-blue-500/15 rounded-sm p-1.5">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[10px] text-muted-foreground/70">
                      <span className="font-medium text-foreground/80">1.</span> Abre WhatsApp
                    </div>
                  </div>
                </div>
                <div className="bg-blue-500/8 border border-blue-500/15 rounded-sm p-1.5">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[10px] text-muted-foreground/70">
                      <span className="font-medium text-foreground/80">2.</span> Ajustes &gt; Dispositivos
                    </div>
                  </div>
                </div>
                <div className="bg-blue-500/8 border border-blue-500/15 rounded-sm p-1.5">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[10px] text-muted-foreground/70">
                      <span className="font-medium text-foreground/80">3.</span> Escanea el código
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/60">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>Se actualiza automáticamente</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                onClick={onClose}
                data-testid="button-close-qr"
                size="sm"
                className="h-7 text-[11px] px-3"
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
