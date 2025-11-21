import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  return (
    <div className="h-full overflow-auto">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personaliza tu cuenta y preferencias
        </p>
      </div>

      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Actualiza tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Tu nombre"
                className="mt-2"
                data-testid="input-settings-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="mt-2"
                disabled
                data-testid="input-settings-email"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El email no puede ser modificado
              </p>
            </div>
            <Button data-testid="button-save-profile">
              Guardar Cambios
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>
              Personaliza la apariencia del dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Tema</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Alterna entre modo claro y oscuro
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
            <CardDescription>
              Actualiza tu contraseña de acceso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <Input
                id="current-password"
                type="password"
                className="mt-2"
                data-testid="input-current-password"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                className="mt-2"
                data-testid="input-new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                className="mt-2"
                data-testid="input-confirm-new-password"
              />
            </div>
            <Button variant="destructive" data-testid="button-change-password">
              Cambiar Contraseña
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
