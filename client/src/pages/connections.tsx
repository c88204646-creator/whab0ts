import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Pause, Play, Wifi, Activity, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { QRModal } from "@/components/qr-modal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { WhatsappAccount } from "@shared/schema";

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrStep, setQrStep] = useState<"config" | "qr">("config");
  const [currentQR, setCurrentQR] = useState<string>();
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: accounts = [], isLoading, error } = useQuery<WhatsappAccount[]>({
    queryKey: [`/api/whatsapp-accounts?userId=${userId}`],
    enabled: !!userId,
    retry: 1,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: { deviceName: string; accountType: string }) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return apiRequest("POST", "/api/whatsapp-accounts", {
        ...data,
        userId: user.id,
      });
    },
    onSuccess: (data) => {
      setCurrentAccountId(data.id);
      setCurrentQR(data.qrCode);
      setQrStep("qr");
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp-accounts?userId=${userId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
    },
  });

  const toggleAccountMutation = useMutation({
    mutationFn: (accountId: string) => {
      const account = accounts.find(a => a.id === accountId);
      return apiRequest("PATCH", `/api/whatsapp-accounts/${accountId}`, {
        isActive: !(account?.isActive ?? true),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp-accounts?userId=${userId}`] });
      toast({
        title: data.isActive ? "Conexión activada" : "Conexión pausada",
        description: data.isActive 
          ? "La cuenta está activa y recibiendo mensajes"
          : "La cuenta está pausada pero mantiene la conexión",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) => apiRequest("DELETE", `/api/whatsapp-accounts/${accountId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp-accounts?userId=${userId}`] });
      toast({
        title: "Eliminado",
        description: "La cuenta se eliminó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cuenta",
        variant: "destructive",
      });
    },
  });

  const filteredAccounts = accounts?.filter((account) =>
    account.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.phoneNumber?.includes(searchQuery)
  ) || [];

  const handleAddAccount = () => {
    setQrStep("config");
    setCurrentQR(undefined);
    setCurrentAccountId(null);
    setIsQRModalOpen(true);
  };

  const handleCloseModal = async () => {
    // Si hay una cuenta pendiente sin conectar, eliminarla
    if (currentAccountId && qrStep === "qr") {
      try {
        await disconnectMutation.mutateAsync(currentAccountId);
      } catch (error) {
        console.error("Error eliminando cuenta pendiente:", error);
      }
    }
    setIsQRModalOpen(false);
    setCurrentAccountId(null);
  };

  const handleConfigSubmit = async (data: { deviceName: string; accountType: string }) => {
    await createAccountMutation.mutateAsync(data);
  };

  const handleToggleAccount = (accountId: string) => {
    toggleAccountMutation.mutate(accountId);
  };

  const handleDisconnect = (accountId: string) => {
    disconnectMutation.mutate(accountId);
  };

  // Calculate metrics
  const totalAccounts = accounts.length;
  const connectedAccounts = accounts.filter(a => a.status === 'connected').length;
  const activeAccounts = accounts.filter(a => a.isActive).length;
  const pausedAccounts = accounts.filter(a => !a.isActive && a.status === 'connected').length;

  if (!userId) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Add Button */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <Wifi className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Conexiones WhatsApp</h1>
                <p className="text-xs text-muted-foreground/80">Gestiona y monitorea todas tus cuentas conectadas</p>
              </div>
            </div>

            <Button onClick={handleAddAccount} data-testid="button-add-account" className="gap-2 h-9">
              <Plus className="w-4 h-4" />
              <span>Agregar Cuenta</span>
            </Button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {/* Total Accounts */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalAccounts}</p>
            </div>

            {/* Connected Count */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Conectadas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{connectedAccounts}</p>
            </div>

            {/* Active Count */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Activas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{activeAccounts}</p>
            </div>

            {/* Paused Count */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Pause className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">Pausadas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{pausedAccounts}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
              data-testid="input-search-accounts"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">

            {/* Alert Banner */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-foreground">Conecta múltiples cuentas de WhatsApp</p>
              <p className="text-xs text-foreground/70 mt-0.5">Gestiona todas tus cuentas, monitorea conexiones y automatiza tu comunicación</p>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Cargando cuentas...</div>
            ) : filteredAccounts.length === 0 && !searchQuery ? (
              <div className="border border-border rounded-lg flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-primary/10 dark:bg-primary/5 rounded-full flex items-center justify-center mb-6">
                  <Plus className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">No hay cuentas vinculadas</h3>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Comienza agregando tu primera cuenta de WhatsApp para gestionar conversaciones y automatizar tus procesos
                </p>
                <Button onClick={handleAddAccount} data-testid="button-add-first-account" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Vincular Primera Cuenta</span>
                </Button>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-lg">
                <p className="text-lg text-muted-foreground">No se encontraron cuentas con ese criterio</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredAccounts.map((account) => (
                  <Card 
                    key={account.id}
                    className={`border transition-all hover-elevate ${account.isActive ? 'border-border' : 'border-border/50 opacity-75'}`}
                    data-testid={`card-account-${account.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-11 w-11 ring-2 ring-offset-1 ring-offset-background ring-border flex-shrink-0">
                            <AvatarFallback className="bg-blue-500/20 text-sm font-bold text-blue-600 dark:text-blue-400">
                              {account.deviceName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground truncate">{account.deviceName}</div>
                            <div className="text-xs text-muted-foreground/80 mt-0.5">
                              {account.phoneNumber || "No conectado"}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleAccount(account.id)}
                            disabled={toggleAccountMutation.isPending || account.status !== 'connected'}
                            className="h-8 w-8 p-0"
                            title={account.isActive ? "Pausar conexión" : "Activar conexión"}
                            data-testid={`button-toggle-${account.id}`}
                          >
                            {account.isActive ? (
                              <Pause className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Play className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDisconnect(account.id)}
                            disabled={disconnectMutation.isPending}
                            className="h-8 w-8 p-0"
                            data-testid={`button-delete-${account.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2.5">
                        {/* Connection Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Conexión</span>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            account.status === 'connected'
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                              : account.status === 'connecting'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                          }`}>
                            {account.status === 'connected' ? 'Conectada' : account.status === 'connecting' ? 'Conectando' : 'Desconectada'}
                          </span>
                        </div>

                        {/* Activity Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Actividad</span>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            account.isActive && account.status === 'connected'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                          }`}>
                            {account.isActive && account.status === 'connected' ? 'Activa' : 'Pausada'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <QRModal
        open={isQRModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleConfigSubmit}
        qrCode={currentQR}
        step={qrStep}
      />
    </div>
  );
}
