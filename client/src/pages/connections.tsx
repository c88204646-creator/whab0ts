import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Pause, Play, Wifi, Activity, BarChart3, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { QRModal } from "@/components/qr-modal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { subscribeToMessages } from "@/lib/websocket";
import type { WhatsappAccount } from "@shared/schema";

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrStep, setQrStep] = useState<"config" | "qr">("config");
  const [currentQR, setCurrentQR] = useState<string>();
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);

  const banners = [
    {
      icon: Wifi,
      title: "Conecta múltiples cuentas",
      description: "Gestiona todas tus cuentas, monitorea conexiones y automatiza tu comunicación en WhatsApp."
    },
    {
      icon: AlertCircle,
      title: "Conexión no oficial",
      description: "Este módulo utiliza una conexión no oficial de WhatsApp mediante escaneo de código QR. No es necesario una API oficial."
    }
  ];

  // Rotate banners every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: accounts = [], isLoading, error } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", userId],
    enabled: !!userId,
    staleTime: 5000,
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
      setCurrentQR(data.qrCode);
      setPendingAccountId(data.id);
      setQrStep("qr");
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-accounts", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
    },
  });

  // Poll for QR code updates while modal is open
  useEffect(() => {
    if (!pendingAccountId || !isQRModalOpen || qrStep !== "qr") return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp-accounts/${pendingAccountId}`);
        if (!response.ok) return;
        
        const account = await response.json();
        
        // Update QR code if available
        if (account.qrCode && account.qrCode !== currentQR) {
          setCurrentQR(account.qrCode);
        }
        
        // Check if connected
        if (account.status === 'connected') {
          setIsQRModalOpen(false);
          setPendingAccountId(null);
          setCurrentQR(undefined);
          setQrStep("config");
          queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-accounts", userId] });
          toast({
            title: "Cuenta vinculada",
            description: `WhatsApp conectado exitosamente: ${account.phoneNumber || account.deviceName}`,
          });
        }
      } catch (error) {
        console.error("Error polling account status:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [pendingAccountId, isQRModalOpen, qrStep, currentQR, userId, toast]);

  const toggleAccountMutation = useMutation({
    mutationFn: (accountId: string) => {
      const account = accounts.find(a => a.id === accountId);
      return apiRequest("PATCH", `/api/whatsapp-accounts/${accountId}`, {
        isActive: !(account?.isActive ?? true),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-accounts", userId] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-accounts", userId] });
      toast({
        title: "Cuenta eliminada del panel",
        description: "La cuenta se eliminó del panel, pero mantiene la conexión en el dispositivo",
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

  const reconnectMutation = useMutation({
    mutationFn: (accountId: string) => apiRequest("POST", `/api/whatsapp-accounts/${accountId}/reconnect`, {}),
    onSuccess: (data) => {
      setCurrentQR(data.qrCode);
      setPendingAccountId(data.id);
      setQrStep("qr");
      setIsQRModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-accounts", userId] });
      toast({
        title: "Reconexión iniciada",
        description: "Escanea el nuevo código QR para reconectar la cuenta",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar la reconexión",
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
    setPendingAccountId(null);
    setIsQRModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsQRModalOpen(false);
    setPendingAccountId(null);
    setCurrentQR(undefined);
    setQrStep("config");
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

  const handleReconnect = (accountId: string) => {
    reconnectMutation.mutate(accountId);
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
    <div className="flex flex-col bg-background">
      {/* Professional Header Banner */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Add Button */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                  <Wifi className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">Conexiones WhatsApp</h1>
                  <p className="text-xs text-muted-foreground/80">Gestiona y monitorea todas tus cuentas</p>
                </div>
              </div>
            </div>

            <Button onClick={handleAddAccount} data-testid="button-add-account" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Agregar Cuenta</span>
            </Button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {/* Total Accounts */}
            <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-lg font-bold text-foreground">{totalAccounts}</p>
            </div>

            {/* Connected Count */}
            <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Conectadas</p>
              </div>
              <p className="text-lg font-bold text-foreground">{connectedAccounts}</p>
            </div>

            {/* Active Count */}
            <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Activas</p>
              </div>
              <p className="text-lg font-bold text-foreground">{activeAccounts}</p>
            </div>

            {/* Paused Count */}
            <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Pause className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Pausadas</p>
              </div>
              <p className="text-lg font-bold text-foreground">{pausedAccounts}</p>
            </div>
          </div>

          {/* Rotating Info Banner */}
          <div className="mt-2 mb-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3 transition-opacity duration-500">
            {activeBannerIndex === 0 ? (
              <>
                <Wifi className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">Conecta múltiples cuentas</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Gestiona todas tus cuentas, monitorea conexiones y automatiza tu comunicación en WhatsApp.</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">Conexión no oficial</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Este módulo utiliza una conexión no oficial de WhatsApp mediante escaneo de código QR. No es necesario una API oficial.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">

            {isLoading ? (
              <div className="text-center py-8">Cargando cuentas...</div>
            ) : filteredAccounts.length === 0 && !searchQuery ? (
              <Card className="border border-border/50 rounded-xl shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <Plus className="w-7 h-7 text-blue-500/40" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1 text-foreground">No hay cuentas vinculadas</h3>
                  <p className="text-xs text-muted-foreground mb-6 text-center max-w-sm">
                    Comienza agregando tu primera cuenta de WhatsApp para gestionar conversaciones
                  </p>
                  <Button onClick={handleAddAccount} data-testid="button-add-first-account" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Vincular Primera Cuenta</span>
                  </Button>
                </CardContent>
              </Card>
            ) : filteredAccounts.length === 0 ? (
              <Card className="border border-border/50 rounded-xl shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-xs text-muted-foreground">No se encontraron cuentas con ese criterio</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
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
                            onClick={() => handleReconnect(account.id)}
                            disabled={reconnectMutation.isPending}
                            className="h-8 w-8 p-0"
                            title="Reconectar cuenta"
                            data-testid={`button-reconnect-${account.id}`}
                          >
                            <RefreshCw className={`w-4 h-4 text-blue-500 ${reconnectMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDisconnect(account.id)}
                            disabled={disconnectMutation.isPending}
                            className="h-8 w-8 p-0"
                            title="Eliminar cuenta"
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
