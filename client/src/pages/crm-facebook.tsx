import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Plus, Trash2, LogIn, X, Loader, CheckCircle2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { FacebookAccount } from "@shared/schema";

export default function FacebookPage() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLoginStatus, setShowLoginStatus] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [loginSessionId, setLoginSessionId] = useState<string | null>(null);
  const [loginProgress, setLoginProgress] = useState<"waiting" | "detecting" | "completed">("waiting");

  // Get user ID from localStorage
  const userId = localStorage.getItem("userId") || "";

  const { data: accounts = [], isLoading } = useQuery<FacebookAccount[]>({
    queryKey: [`/api/facebook-accounts/${userId}`],
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

  // No polling needed - manual completion only

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/facebook-accounts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando cuenta");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/facebook-accounts/${userId}`] });
      toast({ title: "Cuenta eliminada" });
      setSelectedAccountId(null);
    },
  });

  const handleStartLogin = () => {
    if (!accountName.trim()) {
      toast({ title: "Error", description: "Ingresa el nombre de la cuenta", variant: "destructive" });
      return;
    }
    startLoginMutation.mutate({ accountName, userId });
  };

  const handleCancelLogin = () => {
    setShowLoginStatus(false);
    setLoginSessionId(null);
    setLoginProgress("waiting");
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

      const account = await response.json();
      setLoginProgress("completed");

      // Clear states
      setTimeout(() => {
        setShowLoginStatus(false);
        setShowAddForm(false);
        setAccountName("");
        setLoginSessionId(null);
        setLoginProgress("waiting");
      }, 1500);

      // Refetch accounts
      await queryClient.refetchQueries({ queryKey: [`/api/facebook-accounts/${userId}`] });
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

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="mx-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-500" />
                  Cuentas de Facebook
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={() => setShowAddForm(true)} data-testid="button-add-facebook" size="sm" className="gap-1 h-8">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Nueva Cuenta</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto p-4">
          {isLoading ? (
            <div className="text-center py-12">Cargando cuentas...</div>
          ) : accounts.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <Facebook className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No hay cuentas agregadas</p>
                <p className="text-sm text-muted-foreground mt-2">Agrega tu primera cuenta de Facebook para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cuentas */}
              <div className="md:col-span-1 space-y-2">
                <h2 className="text-sm font-semibold px-2">Mis Cuentas</h2>
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedAccountId === account.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-border hover-elevate"
                      }`}
                      data-testid={`card-facebook-${account.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{account.accountName}</p>
                          <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <div className={`w-2 h-2 rounded-full ${account.status === 'connected' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                            <span className="text-xs text-muted-foreground capitalize">{account.status}</span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAccountMutation.mutate(account.id);
                          }}
                          className="h-8 w-8 text-destructive"
                          data-testid={`button-delete-facebook-${account.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalle de Cuenta */}
              {selectedAccount && (
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Facebook className="w-5 h-5 text-blue-500" />
                          {selectedAccount.accountName}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                          {selectedAccount.status}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground font-medium">Correo</Label>
                        <p className="text-sm font-semibold mt-1">{selectedAccount.email}</p>
                      </div>

                      {selectedAccount.lastLogin && (
                        <div>
                          <Label className="text-xs text-muted-foreground font-medium">Último Acceso</Label>
                          <p className="text-sm mt-1">
                            {new Date(selectedAccount.lastLogin).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-border/30 space-y-2">
                        <Button
                          className="w-full gap-2"
                          size="sm"
                          disabled={selectedAccount.status === 'connected'}
                          data-testid={`button-login-facebook-${selectedAccount.id}`}
                        >
                          <LogIn className="w-4 h-4" />
                          Iniciar Sesión
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          Abre Facebook en una ventana para validar tu sesión
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar Cuenta */}
      {showAddForm && !showLoginWindow && (
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
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/50">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-500" />
                  Inicia Sesión en Facebook
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelLogin}
                  data-testid="button-close-login-modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden">
                <iframe
                  src="https://www.facebook.com/login.php"
                  className="w-full h-full border-0"
                  title="Facebook Login"
                  data-testid="iframe-facebook-login"
                  sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
                />
              </div>

              <div className="p-4 border-t border-border bg-muted/50 flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground flex-1">
                  <span className="font-semibold">Después de iniciar sesión en Facebook</span>, haz clic en "Confirmar Sesión"
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelLogin}
                    data-testid="button-cancel-login"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmLogin}
                    data-testid="button-confirm-login"
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Sesión
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
