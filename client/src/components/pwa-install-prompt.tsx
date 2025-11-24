import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar dispositivo móvil
    const userAgent = navigator.userAgent;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(isMobileDevice);

    // Detectar si ya está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listener para el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setShowPrompt(true);
    };

    // Listener para cuando se instala la app
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Mostrar prompt automáticamente en móvil después de 3 segundos
    if (isMobileDevice && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || !isMobile || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-border rounded-lg shadow-lg p-4 z-50 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
            <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Instala CRM Panel</h3>
            <p className="text-xs text-muted-foreground">Acceso rápido desde tu pantalla de inicio</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Cerrar"
          data-testid="button-close-pwa-prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Benefits */}
      <div className="bg-muted/30 rounded px-3 py-2 mb-4 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span className="text-muted-foreground">Funciona offline</span>
        </div>
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span className="text-muted-foreground">Sin banners del navegador</span>
        </div>
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span className="text-muted-foreground">Carga más rápido</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleDismiss}
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs"
          data-testid="button-maybe-later-pwa"
        >
          Después
        </Button>
        <Button
          onClick={handleInstall}
          size="sm"
          className="flex-1 h-8 text-xs gap-1"
          data-testid="button-install-pwa"
        >
          <Download className="w-3.5 h-3.5" />
          Instalar
        </Button>
      </div>

      {/* iOS Instructions */}
      <div className="mt-3 pt-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground mb-2">
          <strong>iOS:</strong> Toca Compartir → Agregar a pantalla de inicio
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>Android:</strong> Toca el botón Instalar arriba
        </p>
      </div>
    </div>
  );
}
