import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Plus, Trash2, LogIn, X, Loader, CheckCircle2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { FacebookAccount } from "@shared/schema";

export default function FacebookPage() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLoginStatus, setShowLoginStatus] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [loginSessionId, setLoginSessionId] = useState<string | null>(null);
  const [loginProgress, setLoginProgress] = useState<"waiting" | "detecting" | "completed">("waiting");

  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = `guest-${Date.now()}`;
    localStorage.setItem("userId", userId);
  }

  const { data: accounts = [], isLoading } = useQuery<FacebookAccount[]>({
    queryKey: ["/api/facebook-accounts", "userId", userId],
    enabled: !!userId,
  });

  const startLoginMutation = useMutation({
    mutationFn: async (data: { accountName: string; userId: string }) => {
      const response = await fetch("/api/facebook-auth/start-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error iniciando sesión");
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      setLoginSessionId(data.sessionId);
      setShowLoginStatus(true);
      setLoginProgress("waiting");
      toast({
        title: "Navegador abierto",
        description: "Se abrió una ventana del navegador. Inicia sesión en Facebook."
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/facebook-accounts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando cuenta");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook-accounts", "userId", userId] });
      toast({ title: "Cuenta eliminada" });
    },
  });

  const handleStartLogin = () => {
    if (!accountName.trim()) {
      toast({ title: "Error", description: "Ingresa el nombre de la cuenta", variant: "destructive" });
      return;
    }
    if (!userId) {
      toast({ title: "Error", description: "No se encontró tu usuario. Por favor recarga la página.", variant: "destructive" });
      return;
    }
    startLoginMutation.mutate({ accountName, userId });
  };

  const handleCancelLogin = () => {
    setShowLoginStatus(false);
    setLoginSessionId(null);
    setLoginProgress("waiting");
  };

  const handleOpenFacebookWindow = () => {
    const facebookUrl = "https://www.facebook.com/login.php";
    const width = 600;
    const height = 700;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    window.open(
      facebookUrl,
      "facebook_login",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const handleConfirmLogin = async () => {
    if (!loginSessionId) return;

    setLoginProgress("detecting");
    try {
      const response = await fetch("/api/facebook-auth/complete-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: loginSessionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo guardar la sesión",
          variant: "destructive",
        });
        setLoginProgress("waiting");
        return;
      }

      const result = await response.json();
      const { account, actualUserId } = result;

      setLoginProgress("completed");

      if (actualUserId && actualUserId !== userId) {
        localStorage.setItem("userId", actualUserId);
      }

      setTimeout(() => {
        setShowLoginStatus(false);
        setShowAddForm(false);
        setAccountName("");
        setLoginSessionId(null);
        setLoginProgress("waiting");
      }, 1500);

      const userIdForQuery = actualUserId || userId;
      await queryClient.refetchQueries({ queryKey: ["/api/facebook-accounts", "userId", userIdForQuery] });
      toast({
        title: "¡Éxito!",
        description: `Cuenta "${account.accountName}" vinculada correctamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al guardar tu sesión",
        variant: "destructive",
      });
      setLoginProgress("waiting");
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-foreground">Cuentas de Facebook</h1>
                    <p className="text-xs text-muted-foreground">Gestionar cuentas</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                data-testid="button-add-facebook"
                size="sm"
                className="gap-2 h-9"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Cuenta</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Cargando cuentas...</p>
            </div>
          ) : accounts.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <Facebook className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No hay cuentas agregadas</p>
                <p className="text-sm text-muted-foreground mt-2">Agrega tu primera cuenta de Facebook para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Mis Cuentas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      data-testid={`row-facebook-account-${account.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">{account.accountName}</p>
                        </div>
                        <Badge
                          variant={account.status === "connected" ? "default" : "secondary"}
                          data-testid={`badge-status-${account.id}`}
                        >
                          {account.status === "connected" ? "Activa" : "No Activa"}
                        </Badge>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteAccountMutation.mutate(account.id)}
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        data-testid={`button-delete-facebook-${account.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Agregar Cuenta */}
      {showAddForm && !showLoginStatus && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Nueva Cuenta de Facebook</h2>
                <p className="text-sm text-muted-foreground mt-1">Inicia sesión en tu cuenta de Facebook</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddForm(false)}
                data-testid="button-close-facebook"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="account-name">Nombre para esta cuenta *</Label>
                <Input
                  id="account-name"
                  placeholder="Ej: Mi Negocio"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  data-testid="input-account-name"
                  className="mt-2"
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-foreground">¿Cómo funciona?</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Haz clic en "Abrir Facebook"</li>
                  <li>✓ Inicia sesión en Facebook</li>
                  <li>✓ Completa CAPTCHA o verificación 2FA si es necesario</li>
                  <li>✓ Autoriza el acceso cuando se pida</li>
                  <li>✓ Tu sesión se guardará automáticamente</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleStartLogin}
                  disabled={startLoginMutation.isPending || !accountName.trim()}
                  className="flex-1 gap-2"
                  data-testid="button-start-login"
                >
                  {startLoginMutation.isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Abriendo...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Abrir Facebook
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Login Status Modal */}
      {showLoginStatus && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          {loginProgress === "completed" ? (
            <Card className="w-full max-w-md">
              <div className="p-6 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce mx-auto" />
                <div>
                  <h2 className="text-lg font-semibold">¡Sesión Capturada!</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tu cuenta ha sido vinculada correctamente
                  </p>
                </div>
                <Button
                  onClick={handleCancelLogin}
                  className="w-full gap-2"
                  data-testid="button-close-status"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Continuar
                </Button>
              </div>
            </Card>
          ) : loginProgress === "detecting" ? (
            <Card className="w-full max-w-md">
              <div className="p-6 text-center space-y-4">
                <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                <div>
                  <h2 className="text-lg font-semibold">Guardando Sesión...</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Por favor espera mientras guardamos tu sesión
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="w-full max-w-md">
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <Facebook className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <h2 className="text-lg font-semibold">Inicia Sesión en Facebook</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Se abrirá una ventana separada con Facebook
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex gap-2 items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">Haz clic en "Abrir Facebook"</p>
                        <p className="text-xs text-muted-foreground">Se abrirá una ventana nueva</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">Inicia sesión en Facebook</p>
                        <p className="text-xs text-muted-foreground">Completa CAPTCHA o 2FA si es necesario</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">Regresa a esta ventana</p>
                        <p className="text-xs text-muted-foreground">Puedes minimizar la ventana de Facebook</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">4</div>
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">Haz clic en "Confirmar"</p>
                        <p className="text-xs text-muted-foreground">Tu cuenta será vinculada</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-col">
                  <Button
                    onClick={handleOpenFacebookWindow}
                    className="w-full gap-2 h-10"
                    data-testid="button-open-facebook-window"
                  >
                    <LogIn className="w-4 h-4" />
                    Abrir Facebook
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelLogin}
                      className="flex-1"
                      data-testid="button-cancel-login"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConfirmLogin}
                      className="flex-1 gap-2"
                      data-testid="button-confirm-login"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground bg-muted/50 p-2 rounded">
                  💡 Si no se abre la ventana, verifica que los popups estén habilitados
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
