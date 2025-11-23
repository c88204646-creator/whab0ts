import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Palette, Bell, Shield, LogOut, Save, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser?.id) {
      setUser(storedUser);
      setFormData({ name: storedUser.name || "" });
    }
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/user/profile?userId=${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error actualizando perfil");
      return response.json();
    },
    onSuccess: (updatedUser) => {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast({ title: "Perfil actualizado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user?.id }),
      });
      if (!response.ok) throw new Error("Error cambiando contraseña");
      return response.json();
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Contraseña actualizada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleProfileSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate({ name: formData.name });
  };

  const handlePasswordSubmit = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({ title: "Error", description: "Todos los campos son requeridos", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  if (!user) {
    return <div className="flex items-center justify-center h-full">Cargando configuración...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Professional Header */}
      <div className="h-20 px-6 border-b border-border flex items-end pb-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <User className="w-6 h-6 text-primary" />
            </div>
            Configuración
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Personaliza tu cuenta y preferencias</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-3xl space-y-6">
          {/* Perfil Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Actualiza tu información personal y cuenta</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-4 border-t border-border/30">
              {/* Name Field */}
              <div>
                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                  <span>Nombre Completo</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2 h-10"
                  data-testid="input-settings-name"
                />
                <p className="text-xs text-muted-foreground mt-1">Se usa para personalizar tu experiencia</p>
              </div>

              {/* Email Field (Read-only) */}
              <div>
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <div className="mt-2 relative">
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="h-10 bg-muted/50"
                    data-testid="input-settings-email"
                  />
                  <Badge variant="outline" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                    No editable
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">El email no puede ser modificado por seguridad</p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  onClick={handleProfileSubmit}
                  disabled={updateProfileMutation.isPending}
                  className="gap-2 h-10"
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4" />
                  {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cambiar Contraseña Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle>Seguridad</CardTitle>
                  <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-4 border-t border-border/30">
              {/* Current Password */}
              <div>
                <Label htmlFor="current-password" className="text-sm font-semibold">Contraseña Actual</Label>
                <div className="mt-2 relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="h-10 pr-10"
                    placeholder="Tu contraseña actual"
                    data-testid="input-current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="new-password" className="text-sm font-semibold">Nueva Contraseña</Label>
                <div className="mt-2 relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="h-10 pr-10"
                    placeholder="Tu nueva contraseña"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres</p>
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirm-password" className="text-sm font-semibold">Confirmar Contraseña</Label>
                <div className="mt-2 relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="h-10 pr-10"
                    placeholder="Confirma tu nueva contraseña"
                    data-testid="input-confirm-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={changePasswordMutation.isPending}
                  className="gap-2 h-10"
                  variant="outline"
                  data-testid="button-change-password"
                >
                  <Lock className="w-4 h-4" />
                  {changePasswordMutation.isPending ? "Procesando..." : "Cambiar Contraseña"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Apariencia Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Apariencia</CardTitle>
                  <CardDescription>Personaliza el diseño visual del dashboard</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 border-t border-border/30">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover-elevate cursor-pointer transition-colors">
                <div>
                  <Label className="text-sm font-semibold cursor-pointer">Tema del Sitio</Label>
                  <p className="text-xs text-muted-foreground mt-1">Alterna entre modo claro y oscuro</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Información de Cuenta Section */}
          <Card className="border border-border/50 bg-muted/30">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Información de Cuenta</CardTitle>
                  <CardDescription>Detalles de tu cuenta y membresía</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 border-t border-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID de Cuenta</span>
                <code className="text-xs bg-background px-2 py-1 rounded font-mono">{user.id}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge>Profesional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant="default" className="bg-green-600 dark:bg-green-700">Activo</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Ayuda y Soporte Section */}
          <Card className="border border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <AlertCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <CardTitle>Ayuda y Soporte</CardTitle>
                  <CardDescription>Recursos y documentación útiles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 border-t border-border/30 space-y-2">
              <p className="text-sm text-muted-foreground">Para soporte técnico, contáctanos en:</p>
              <a href="mailto:support@whatsappcrm.com" className="text-sm text-primary hover:underline flex items-center gap-2">
                <span>📧 support@whatsappcrm.com</span>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
