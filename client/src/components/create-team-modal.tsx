import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; password: string }) => Promise<void>;
  isLoading: boolean;
}

export function CreateTeamModal({ open, onClose, onSubmit, isLoading }: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!teamName.trim()) {
      setError("El nombre del team es requerido");
      return;
    }

    if (!email.trim()) {
      setError("El correo es requerido");
      return;
    }

    if (!email.includes("@")) {
      setError("Correo inválido");
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

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      await onSubmit({ name: teamName, email, password });
      setTeamName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear el team");
    }
  };

  const handleClose = () => {
    setTeamName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
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
            Crea un team independiente con su propia cuenta de acceso. El team podrá invitar miembros.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
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
              className="h-9"
              data-testid="input-create-team-name"
            />
            <p className="text-xs text-muted-foreground">Identificador único del team</p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="team-email" className="font-semibold text-sm">
              Correo del Team
            </Label>
            <Input
              id="team-email"
              type="email"
              placeholder="team@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-9"
              data-testid="input-create-team-email"
            />
            <p className="text-xs text-muted-foreground">Para acceder al panel</p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="team-password" className="font-semibold text-sm">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="team-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-9 pr-10"
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
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="team-confirm-password" className="font-semibold text-sm">
              Confirmar Contraseña
            </Label>
            <Input
              id="team-confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="h-9"
              data-testid="input-create-team-confirm-password"
            />
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
