import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Pause, Play, Wifi, Activity, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { QRModal } from "@/components/qr-modal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WhatsappAccount } from "@shared/schema";

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrStep, setQrStep] = useState<"config" | "qr">("config");
  const [currentQR, setCurrentQR] = useState<string>();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  // Polling every 5 seconds to detect connection status changes
  const { data: accounts = [], isLoading } = useQuery<WhatsappAccount[]>({
    queryKey: [`/api/whatsapp-accounts?userId=${userId}`],
    enabled: !!userId,
    refetchInterval: 5000,
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
    setIsQRModalOpen(true);
  };

  const handleConfigSubmit = async (data: { deviceName: string; accountType: string }) => {
    await createAccountMutation.mutateAsync(data);
  };

  // Calculate metrics
  const totalAccounts = accounts.length;
  const connectedAccounts = accounts.filter(a => a.status === 'connected').length;
  const activeAccounts = accounts.filter(a => a.isActive).length;

  if (!userId) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
                <Wifi className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Conexiones WhatsApp</h1>
                <p className="text-xs text-muted-foreground/80">Gestiona y monitorea todas tus cuentas</p>
              </div>
            </div>

            <Button onClick={handleAddAccount} data-testid="button-add-account" className="gap-2 h-9">
              <Plus className="w-4 h-4" />
              <span>Agregar Cuenta</span>
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalAccounts}</p>
            </div>

            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Conectadas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{connectedAccounts}</p>
            </div>

            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Activas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{activeAccounts}</p>
            </div>
          </div>

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

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="text-center py-8">Cargando cuentas...</div>
            ) : filteredAccounts.length === 0 && !searchQuery ? (
              <div className="border border-border rounded-lg flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Plus className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">No hay cuentas vinculadas</h3>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Comienza agregando tu primera cuenta de WhatsApp
                </p>
                <Button onClick={handleAddAccount} data-testid="button-add-first-account" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Vincular Primera Cuenta</span>
                </Button>
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
                          <Avatar className="h-11 w-11 ring-2 ring-offset-1 ring-offset-background ring-border">
                            <AvatarFallback className="bg-blue-500/20 text-sm font-bold text-blue-600">
                              {account.deviceName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-foreground">{account.deviceName}</div>
                            <div className="text-xs text-muted-foreground/80 mt-0.5">
                              {account.phoneNumber || "No conectado"}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleAccountMutation.mutate(account.id)}
                            disabled={toggleAccountMutation.isPending || account.status !== 'connected'}
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
                            onClick={() => disconnectMutation.mutate(account.id)}
                            disabled={disconnectMutation.isPending}
                            data-testid={`button-delete-${account.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Conexión</span>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            account.status === 'connected'
                              ? 'bg-green-500/20 text-green-600'
                              : 'bg-gray-500/20 text-gray-600'
                          }`}>
                            {account.status === 'connected' ? 'Conectada' : 'Desconectada'}
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
        onClose={() => setIsQRModalOpen(false)}
        onSubmit={handleConfigSubmit}
        qrCode={currentQR}
        step={qrStep}
      />
    </div>
  );
}
