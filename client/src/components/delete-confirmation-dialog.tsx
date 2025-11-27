import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: "Cliente" | "Lead" | "Nota";
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-sm p-0 gap-0 bg-background border-border/50 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center flex-shrink-0 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <h2 className="text-sm font-bold text-foreground truncate">
            Eliminar {itemType}
          </h2>
        </div>

        {/* Content */}
        <div className="px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Esta acción es irreversible. Se eliminarán todos los datos asociados a{" "}
            <span className="font-semibold text-foreground">{itemName}</span>
          </p>
        </div>

        {/* Footer with action buttons */}
        <div className="px-5 py-3 border-t border-border/30 bg-muted/20 rounded-b-lg flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            size="sm"
            className="h-7 text-xs"
            data-testid="button-cancel-delete"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            size="sm"
            className="h-7 text-xs"
            data-testid="button-confirm-delete"
          >
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
