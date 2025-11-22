import { useState, useEffect } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
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
    queryKey: ["/api/whatsapp-accounts", "userId", userId],
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
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-accounts", "userId", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) => apiRequest("DELETE", `/api/whatsapp-accounts/${accountId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-accounts", "userId", userId] });
      toast({
        title: "Desconectado",
        description: "La cuenta se desconectó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo desconectar la cuenta",
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

  const handleDisconnect = (accountId: string) => {
    disconnectMutation.mutate(accountId);
  };

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
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Conexiones WhatsApp</h1>
                    <p className="text-xs text-muted-foreground">Gestiona y monitorea todas tus cuentas de WhatsApp</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleAddAccount} data-testid="button-add-account" size="sm" className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar Cuenta</span>
              </Button>
            </div>

            <div className="relative max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o número..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-10 text-sm"
                data-testid="input-search-accounts"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
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
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-min">
                  {filteredAccounts.map((account) => (
                    <Card 
                      key={account.id}
                      className="flex-shrink-0 w-72 border border-border hover-elevate transition-all"
                      data-testid={`card-account-${account.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/20 text-sm font-semibold">
                                {account.deviceName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-foreground">{account.deviceName}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {account.phoneNumber || "No conectado"}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDisconnect(account.id)}
                            className="h-8 w-8 p-0 flex-shrink-0"
                            data-testid={`button-disconnect-${account.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Estado</span>
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
