import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: "Cliente" | "Lead";
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
}: DeleteConfirmationDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startValue = useRef(0);

  const isConfirmTextValid =
    confirmText.toLowerCase().trim() === "eliminar";
  const isSliderComplete = sliderValue >= 95;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isConfirmTextValid || !sliderRef.current) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startValue.current = sliderValue;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const diff = e.clientX - startX.current;
      const percentage = (diff / rect.width) * 100;
      const newValue = Math.min(
        100,
        Math.max(0, startValue.current + percentage)
      );

      setSliderValue(newValue);

      if (newValue >= 95) {
        isDragging.current = false;
        onConfirm();
        setTimeout(() => {
          setSliderValue(0);
          setConfirmText("");
          onClose();
        }, 300);
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        if (sliderValue < 95) {
          setSliderValue(0);
        }
      }
    };

    if (isDragging.current) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [sliderValue, isConfirmTextValid, onConfirm, onClose]);

  const handleClose = () => {
    setConfirmText("");
    setSliderValue(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-background border-border/50 shadow-2xl">
        {/* Header with close button */}
        <div className="relative p-6 pb-4 border-b border-border/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-destructive/15 flex items-center justify-center flex-shrink-0 border border-destructive/20">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">
                Eliminar {itemType}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Warning box */}
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <p className="text-sm text-foreground/80 font-medium mb-2">
              Advertencia
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta acción es irreversible. Se eliminarán todos los datos
              asociados a{" "}
              <span className="font-semibold text-foreground">{itemName}</span>
            </p>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Escribe "Eliminar" para confirmar:
            </label>
            <Input
              placeholder="Escribe aquí..."
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="h-10 bg-muted/30 border-border/50 focus-visible:ring-1"
              autoFocus
            />
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Desliza para confirmar
              </label>
              <span
                className={`text-sm font-semibold transition-colors ${
                  isSliderComplete ? "text-green-500" : "text-muted-foreground"
                }`}
              >
                {Math.round(sliderValue)}%
              </span>
            </div>

            {/* Slider track */}
            <div
              ref={sliderRef}
              className={`relative h-12 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${
                isConfirmTextValid
                  ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/8"
                  : "border-border/30 bg-muted/20 opacity-50 cursor-not-allowed"
              }`}
              onMouseDown={handleMouseDown}
            >
              {/* Background fill */}
              <div
                className={`absolute inset-0 rounded-[calc(0.5rem-2px)] transition-all ${
                  isSliderComplete ? "bg-green-500/20" : "bg-destructive/10"
                }`}
                style={{
                  width: `${sliderValue}%`,
                }}
              />

              {/* Slider thumb */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg shadow-md transition-all ${
                  isSliderComplete
                    ? "bg-green-500 text-white"
                    : isConfirmTextValid
                      ? "bg-destructive text-white hover:shadow-lg"
                      : "bg-muted text-muted-foreground"
                }`}
                style={{
                  left: `calc(${sliderValue}% - 1.25rem)`,
                }}
              >
                <div className="flex items-center justify-center h-full">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isSliderComplete ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    )}
                  </svg>
                </div>
              </div>

              {/* Text hint */}
              {isConfirmTextValid && (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground pointer-events-none">
                  {isSliderComplete ? "Eliminando..." : "Desliza →"}
                </div>
              )}
            </div>

            {!isConfirmTextValid && confirmText && (
              <p className="text-xs text-destructive font-medium">
                Debes escribir "Eliminar" para continuar
              </p>
            )}
          </div>
        </div>

        {/* Footer with cancel button */}
        <div className="px-6 py-4 border-t border-border/30 bg-muted/20 rounded-b-lg flex gap-3">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="flex-1 h-9"
            data-testid="button-cancel-delete"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
