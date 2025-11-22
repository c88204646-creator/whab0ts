import { useState } from "react";
import { CreditCard, Plus, Search, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  initialBalance: number;
  currency: string;
  isActive: boolean;
}

export default function CRMBankingPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("corriente");
  const [initialBalance, setInitialBalance] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const { toast } = useToast();

  const handleAddAccount = () => {
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
      toast({ title: "Error", description: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    const newAccount: BankAccount = {
      id: Math.random().toString(),
      accountName,
      accountNumber,
      bankName,
      accountType,
      initialBalance: Math.round(parseFloat(initialBalance || "0") * 100),
      currency,
      isActive: true,
    };

    setAccounts([...accounts, newAccount]);
    toast({ title: "Éxito", description: "Cuenta bancaria creada" });
    handleCloseForm();
  };

  const handleCloseForm = () => {
    setShowNewForm(false);
    setAccountName("");
    setAccountNumber("");
    setBankName("");
    setAccountType("corriente");
    setInitialBalance("");
    setCurrency("MXN");
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.accountNumber.includes(searchQuery)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Sistema Bancario</h1>
              <p className="text-sm text-muted-foreground">Gestiona tus cuentas bancarias</p>
            </div>
          </div>
          <Button onClick={() => setShowNewForm(true)} data-testid="button-add-bank-account">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o número de cuenta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-accounts"
              />
            </div>
          </div>

          {filteredAccounts.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No hay cuentas bancarias</p>
                <p className="text-sm text-muted-foreground mt-2">Crea tu primera cuenta bancaria para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredAccounts.map((account) => (
                <Card key={account.id} className="hover-elevate">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{account.accountName}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{account.bankName}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                        {account.accountType}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Número de Cuenta</p>
                      <p className="font-mono text-sm text-foreground">{account.accountNumber}</p>
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-lg font-bold text-foreground">
                        {(account.initialBalance / 100).toFixed(2)} {account.currency}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/crm/banking/${account.id}`)}
                      data-testid={`button-view-account-${account.id}`}
                    >
                      <Eye className="w-3 h-3 mr-2" />
                      Ver Detalles
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Cuenta */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <DialogHeader className="p-6 border-b border-border">
              <DialogTitle>Nueva Cuenta Bancaria</DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="account-name">Nombre de Cuenta *</Label>
                <Input
                  id="account-name"
                  placeholder="Ej: Cuenta Corriente Empresa"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="mt-2"
                  data-testid="input-account-name"
                />
              </div>

              <div>
                <Label htmlFor="account-number">Número de Cuenta *</Label>
                <Input
                  id="account-number"
                  placeholder="Ej: 1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-2"
                  data-testid="input-account-number"
                />
              </div>

              <div>
                <Label htmlFor="bank-name">Banco *</Label>
                <Input
                  id="bank-name"
                  placeholder="Ej: BBVA México"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-2"
                  data-testid="input-bank-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="account-type">Tipo de Cuenta</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger id="account-type" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corriente">Corriente</SelectItem>
                      <SelectItem value="ahorro">Ahorro</SelectItem>
                      <SelectItem value="nomina">Nómina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MXN">MXN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="initial-balance">Balance Inicial</Label>
                <Input
                  id="initial-balance"
                  type="number"
                  placeholder="0.00"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="mt-2"
                  step="0.01"
                  data-testid="input-initial-balance"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-2">
              <Button
                variant="outline"
                onClick={handleCloseForm}
                className="flex-1"
                data-testid="button-cancel-account"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddAccount}
                className="flex-1"
                data-testid="button-save-account"
              >
                Crear Cuenta
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
