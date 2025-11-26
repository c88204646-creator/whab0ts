import { useState } from "react";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, Users } from "lucide-react";

export default function TeamLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const { toast } = useToast();
  const [, navigate] = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowSuccess(false);

    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email inválido");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/team-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Email o contraseña incorrectos");
      }

      const data = await response.json();

      if (data.user && data.teamMember) {
        setMemberInfo(data.teamMember);
        setShowSuccess(true);

        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.teamMember.role,
          teamInfo: {
            teamMemberId: data.teamMember.id,
            teamId: data.teamMember.teamId,
          },
          moduleAccess: data.moduleAccess,
        };

        localStorage.setItem("user", JSON.stringify(userData));

        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Team Access</h1>
          <p className="text-muted-foreground mt-2">Acceso para miembros del equipo</p>
        </div>

        {/* Success Message */}
        {showSuccess && memberInfo && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              ¡Bienvenido! Accediendo como <strong>{memberInfo.roleLabel}</strong>...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && !showSuccess && (
          <Alert className="mb-6 bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-card to-card/50 border-b">
            <CardTitle className="text-xl">Inicia Sesión</CardTitle>
            <CardDescription>Ingresa con tu email y contraseña</CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
                  <Mail className="w-4 h-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || showSuccess}
                  className="h-10 text-sm"
                  data-testid="input-team-email"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold">
                  <Lock className="w-4 h-4 text-primary" />
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || showSuccess}
                    className="h-10 text-sm pr-10"
                    data-testid="input-team-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading || showSuccess}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || showSuccess}
                className="w-full h-10 text-sm font-medium"
                data-testid="button-team-login"
              >
                {isLoading ? "Verificando..." : showSuccess ? "Redirigiendo..." : "Ingresar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-card/50 rounded-lg border border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            Si no tienes acceso o olvidaste tu contraseña, contacta al administrador del equipo.
          </p>
        </div>

        {/* Branding */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Plataforma CRM WhatsApp • Gestión profesional de equipos
          </p>
        </div>
      </div>
    </div>
  );
}
