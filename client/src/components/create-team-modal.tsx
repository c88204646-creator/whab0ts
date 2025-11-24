import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; password: string }) => Promise<void>;
  isLoading: boolean;
}

export function CreateTeamModal({ open, onClose, onSubmit, isLoading }: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!teamName.trim()) {
      setError("El nombre del team es requerido");
      return;
    }

    if (!password.trim()) {
      setError("La contraseña es requerida");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    try {
      await onSubmit({ name: teamName, password });
      setTeamName("");
      setPassword("");
      setShowPassword(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear el team");
    }
  };

  const handleClose = () => {
    setTeamName("");
    setPassword("");
    setShowPassword(false);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-background border-border/50">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-border/30">
          <DialogTitle className="text-xl font-bold">Crear Nuevo Team</DialogTitle>
          <DialogDescription className="mt-2 text-sm">
            Crea un equipo compartido con contraseña de acceso. La contraseña será necesaria para que otros miembros accedan.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team-name" className="font-semibold text-sm">
              Nombre del Team
            </Label>
            <Input
              id="team-name"
              placeholder="Ej: Equipo de Ventas"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={isLoading}
              className="h-10"
              data-testid="input-create-team-name"
            />
            <p className="text-xs text-muted-foreground">Este será el nombre visible para todos los miembros del team</p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="team-password" className="font-semibold text-sm">
              Contraseña de Acceso
            </Label>
            <div className="relative">
              <Input
                id="team-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-10 pr-10"
                data-testid="input-create-team-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Será compartida con los miembros para acceder al panel</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border/30 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            data-testid="button-cancel-create-team"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            data-testid="button-confirm-create-team"
          >
            {isLoading ? "Creando..." : "Crear Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
