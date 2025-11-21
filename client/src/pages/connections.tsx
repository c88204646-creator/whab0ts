import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AccountCard } from "@/components/account-card";
import { QRModal } from "@/components/qr-modal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { WhatsappAccount } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrStep, setQrStep] = useState<"config" | "qr">("config");
  const [currentQR, setCurrentQR] = useState<string>();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: accounts, isLoading } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts"],
    refetchInterval: 5000, // Poll every 5 seconds for status updates
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
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-accounts"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-accounts"] });
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

  const handleViewChats = (accountId: string) => {
    setLocation(`/conversations?accountId=${accountId}`);
  };

  const handleDisconnect = (accountId: string) => {
    disconnectMutation.mutate(accountId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Conexiones WhatsApp</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona tus cuentas de WhatsApp vinculadas
            </p>
          </div>
          <Button onClick={handleAddAccount} data-testid="button-add-account">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Cuenta
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o número..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-accounts"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAccounts.length === 0 && !searchQuery ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay cuentas vinculadas</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Comienza agregando tu primera cuenta de WhatsApp para gestionar conversaciones
            </p>
            <Button onClick={handleAddAccount} data-testid="button-add-first-account">
              <Plus className="w-4 h-4 mr-2" />
              Vincular Primera Cuenta
            </Button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron cuentas con ese criterio</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onViewChats={handleViewChats}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        )}
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
