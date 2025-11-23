import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Grid3x3, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoadingSpinner from "@/components/loading-spinner";

export default function RafflePublicPage() {
  const [, params] = useRoute("/raffles/:raffleId/public");
  const { toast } = useToast();

  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [buyerData, setBuyerData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyTicketNum, setVerifyTicketNum] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const { data: raffle, isLoading } = useQuery({
    queryKey: [`/api/raffles-public/${params?.raffleId}`],
    queryFn: async () => {
      const res = await fetch(`/api/raffles-public/${params?.raffleId}`);
      if (!res.ok) throw new Error("Rifa no encontrada");
      return res.json();
    },
  });

  const createPurchaseMutation = useMutation({
    mutationFn: (data) => apiRequest("POST", "/api/raffle-purchases", data),
    onSuccess: (purchase: any) => {
      toast({
        title: "Éxito",
        description: `Boletos reservados. ID de compra: ${purchase.id}`,
      });
      setSelectedTickets([]);
      setBuyerData({ name: "", email: "", phone: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al reservar boletos",
        variant: "destructive",
      });
    },
  });

  const verifyTicketMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/verify-ticket", {
        raffleId: params?.raffleId,
        ticketNumber: verifyTicketNum.padStart(6, "0"),
      }),
    onSuccess: (result: any) => {
      setVerifyResult(result);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTicketSelect = (ticketNum: string) => {
    if (selectedTickets.includes(ticketNum)) {
      setSelectedTickets(selectedTickets.filter((t) => t !== ticketNum));
    } else {
      setSelectedTickets([...selectedTickets, ticketNum]);
    }
  };

  const handlePurchase = () => {
    if (!buyerData.name || !buyerData.email || !buyerData.phone) {
      toast({
        title: "Error",
        description: "Completa todos tus datos",
        variant: "destructive",
      });
      return;
    }

    if (selectedTickets.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un boleto",
        variant: "destructive",
      });
      return;
    }

    createPurchaseMutation.mutate({
      raffleId: params?.raffleId,
      buyerName: buyerData.name,
      buyerEmail: buyerData.email,
      buyerPhone: buyerData.phone,
      ticketNumbers: selectedTickets,
      quantity: selectedTickets.length,
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!raffle) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Rifa no encontrada</p>
      </div>
    );
  }

  const totalSelected = selectedTickets.length * raffle.ticketPrice;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/20 to-background border-b border-border p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {raffle.title}
          </h1>
          <p className="text-muted-foreground">{raffle.description}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stories */}
          {raffle.stories && raffle.stories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Galería</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {raffle.stories.map((story: any) => (
                    <div
                      key={story.id}
                      className="rounded-lg overflow-hidden bg-muted aspect-square"
                    >
                      {story.mediaType === "photo" ? (
                        <img
                          src={story.mediaUrl}
                          alt={story.caption}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={story.mediaUrl}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tickets Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Grid3x3 className="w-5 h-5" />
                Selecciona tus Boletos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {Array.from({ length: Math.min(raffle.totalTickets, 100) }).map(
                  (_, i) => {
                    const ticketNum = String(i + 1).padStart(6, "0");
                    const isSelected = selectedTickets.includes(ticketNum);
                    return (
                      <Button
                        key={i}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTicketSelect(ticketNum)}
                        className="h-10 text-xs font-semibold"
                        data-testid={`button-ticket-${ticketNum}`}
                      >
                        {ticketNum}
                      </Button>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>

          {/* Verify Ticket */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verificar Boleto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="verify-input" className="text-xs font-semibold mb-1.5 block">
                  Ingresa número de boleto
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="verify-input"
                    placeholder="000001"
                    value={verifyTicketNum}
                    onChange={(e) => setVerifyTicketNum(e.target.value)}
                    maxLength="6"
                    data-testid="input-verify-ticket"
                  />
                  <Button
                    onClick={() => verifyTicketMutation.mutate()}
                    disabled={!verifyTicketNum || verifyTicketMutation.isPending}
                    size="sm"
                    className="gap-2"
                    data-testid="button-verify"
                  >
                    <Search className="w-4 h-4" />
                    Verificar
                  </Button>
                </div>
              </div>

              {verifyResult && (
                <div
                  className={`p-3 rounded-lg border ${
                    verifyResult.found
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  }`}
                >
                  {verifyResult.found ? (
                    <>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-semibold">Boleto válido</span>
                      </div>
                      <p className="text-sm mt-1 text-green-600 dark:text-green-400">
                        {verifyResult.status === "sold"
                          ? `Vendido a: ${verifyResult.buyerName}`
                          : `Estado: ${verifyResult.status}`}
                      </p>
                    </>
                  ) : (
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      {verifyResult.message}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Boletos disponibles</p>
                <p className="text-lg font-bold">{raffle.availableCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seleccionados</p>
                <p className="text-lg font-bold">{selectedTickets.length}</p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">
                  ${(totalSelected / 100).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tus Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="buyer-name" className="text-xs font-semibold mb-1.5 block">
                  Nombre
                </Label>
                <Input
                  id="buyer-name"
                  value={buyerData.name}
                  onChange={(e) =>
                    setBuyerData({ ...buyerData, name: e.target.value })
                  }
                  placeholder="Tu nombre"
                  data-testid="input-buyer-name"
                />
              </div>
              <div>
                <Label htmlFor="buyer-email" className="text-xs font-semibold mb-1.5 block">
                  Email
                </Label>
                <Input
                  id="buyer-email"
                  type="email"
                  value={buyerData.email}
                  onChange={(e) =>
                    setBuyerData({ ...buyerData, email: e.target.value })
                  }
                  placeholder="tu@email.com"
                  data-testid="input-buyer-email"
                />
              </div>
              <div>
                <Label htmlFor="buyer-phone" className="text-xs font-semibold mb-1.5 block">
                  Teléfono
                </Label>
                <Input
                  id="buyer-phone"
                  value={buyerData.phone}
                  onChange={(e) =>
                    setBuyerData({ ...buyerData, phone: e.target.value })
                  }
                  placeholder="+1234567890"
                  data-testid="input-buyer-phone"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Accounts */}
          {raffle.bankAccounts && raffle.bankAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cuentas Bancarias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {raffle.bankAccounts.map((account: any) => (
                  <div key={account.id} className="text-sm border-b pb-2 last:border-0">
                    <p className="font-semibold">{account.bankName}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.accountHolder}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ****{account.accountNumber.slice(-4)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={
              selectedTickets.length === 0 ||
              !buyerData.name ||
              createPurchaseMutation.isPending
            }
            className="w-full"
            size="lg"
            data-testid="button-confirm-purchase"
          >
            Apartar Boletos
          </Button>
        </div>
      </div>
    </div>
  );
}
