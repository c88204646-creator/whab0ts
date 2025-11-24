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
import { User, Lock, Palette, Bell, Shield, LogOut, Save, AlertCircle, CheckCircle, Eye, EyeOff, Settings, Info } from "lucide-react";

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
    <div className="h-full flex flex-col bg-background min-h-0">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground">Configuración de Cuenta</h1>
              <p className="text-xs text-muted-foreground/80">Administra tu perfil, seguridad y preferencias</p>
            </div>
          </div>

          {/* Info Alert Banner */}
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-3">
            <p className="text-sm font-semibold text-foreground">Protege tu cuenta</p>
            <p className="text-xs text-foreground/70 mt-0.5">Mantén tu información personal segura y actualiza regularmente tu contraseña</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto space-y-6">
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
            <Card className="border border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Info className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle>Información de Cuenta</CardTitle>
                    <CardDescription>Detalles de tu cuenta y membresía</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 border-t border-border/30">
                <div className="grid grid-cols-3 gap-3">
                  <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-medium">ID de Cuenta</span>
                    </div>
                    <code className="text-xs font-mono text-foreground truncate">{user.id}</code>
                  </div>
                  <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-medium">Plan</span>
                    </div>
                    <Badge className="bg-blue-600 dark:bg-blue-700 text-white">Profesional</Badge>
                  </div>
                  <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-medium">Estado</span>
                    </div>
                    <Badge className="bg-green-600 dark:bg-green-700 text-white">Activo</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
