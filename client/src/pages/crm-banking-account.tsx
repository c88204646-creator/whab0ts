import { useState } from "react";
import { CreditCard, ArrowUp, ArrowDown, Plus, Trash2, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: "deposito" | "gasto" | "transferencia";
  category: string;
  description: string;
  amount: number;
  date: string;
  reference?: string;
}

export default function CRMBankingAccountPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Mock data - in real app, fetch from API
  const [balance, setBalance] = useState(50000);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "deposito",
      category: "venta",
      description: "Venta de productos",
      amount: 5000,
      date: "2025-11-22",
      reference: "INV-001",
    },
    {
      id: "2",
      type: "gasto",
      category: "servicios",
      description: "Pago de servicios",
      amount: -2000,
      date: "2025-11-21",
      reference: "REF-001",
    },
  ]);

  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<"deposito" | "gasto">("deposito");
  const [category, setCategory] = useState("venta");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const handleAddTransaction = () => {
    if (!description.trim() || !amount) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }

    const transactionAmount = parseFloat(amount) * (transactionType === "gasto" ? -1 : 1);
    const newTransaction: Transaction = {
      id: Math.random().toString(),
      type: transactionType,
      category,
      description,
      amount: transactionAmount * 100,
      date: new Date().toISOString().split("T")[0],
      reference: reference || undefined,
    };

    setTransactions([newTransaction, ...transactions]);
    setBalance(balance + transactionAmount * 100);
    toast({ title: "Éxito", description: "Transacción registrada" });
    handleCloseForm();
  };

  const handleCloseForm = () => {
    setShowNewTransaction(false);
    setDescription("");
    setAmount("");
    setReference("");
    setTransactionType("deposito");
    setCategory("venta");
  };

  const handleDeleteTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) {
      setBalance(balance - transaction.amount);
      setTransactions(transactions.filter((t) => t.id !== id));
      toast({ title: "Éxito", description: "Transacción eliminada" });
    }
  };

  const totalDeposits = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/crm/banking")}
              data-testid="button-back-banking"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Cuenta Corriente Empresa</h1>
              <p className="text-sm text-muted-foreground">BBVA México • 1234567890</p>
            </div>
          </div>
          <Button onClick={() => setShowNewTransaction(true)} data-testid="button-add-transaction">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4 space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-semibold">Balance Actual</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  ${(balance / 100).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Depósitos</p>
                    <p className="text-2xl font-bold text-green-400 mt-2">
                      ${(totalDeposits / 100).toFixed(2)}
                    </p>
                  </div>
                  <ArrowDown className="w-8 h-8 text-green-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Gastos</p>
                    <p className="text-2xl font-bold text-red-400 mt-2">
                      ${(totalExpenses / 100).toFixed(2)}
                    </p>
                  </div>
                  <ArrowUp className="w-8 h-8 text-red-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-semibold">Transacciones</p>
                <p className="text-2xl font-bold text-foreground mt-2">{transactions.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Transactions */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Historial de Transacciones</h2>
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <Card className="bg-muted/20 border-dashed">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">Sin transacciones aún</p>
                  </CardContent>
                </Card>
              ) : (
                transactions.map((transaction) => (
                  <Card key={transaction.id} className="hover-elevate">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`p-2 rounded-lg ${
                              transaction.amount > 0
                                ? "bg-green-500/10"
                                : "bg-red-500/10"
                            }`}
                          >
                            {transaction.amount > 0 ? (
                              <ArrowDown className={`w-4 h-4 text-green-400`} />
                            ) : (
                              <ArrowUp className={`w-4 h-4 text-red-400`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {transaction.description}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                {transaction.category}
                              </span>
                              {transaction.reference && (
                                <span className="text-xs text-muted-foreground">
                                  Ref: {transaction.reference}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {transaction.date}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <p
                            className={`font-bold text-lg ${
                              transaction.amount > 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""} $
                            {Math.abs(transaction.amount / 100).toFixed(2)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            data-testid={`button-delete-transaction-${transaction.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nueva Transacción */}
      {showNewTransaction && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Nueva Transacción</h2>
            </CardHeader>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="trans-type">Tipo de Transacción</Label>
                <Select value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
                  <SelectTrigger id="trans-type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposito">Depósito</SelectItem>
                    <SelectItem value="gasto">Gasto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venta">Venta</SelectItem>
                    <SelectItem value="servicios">Servicios</SelectItem>
                    <SelectItem value="salarios">Salarios</SelectItem>
                    <SelectItem value="utiles">Útiles</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Input
                  id="description"
                  placeholder="Describe la transacción"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2"
                  data-testid="input-transaction-description"
                />
              </div>

              <div>
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2"
                  step="0.01"
                  data-testid="input-transaction-amount"
                />
              </div>

              <div>
                <Label htmlFor="reference">Referencia (Opcional)</Label>
                <Input
                  id="reference"
                  placeholder="Número de factura, cheque, etc."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-2"
                  data-testid="input-transaction-reference"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-2">
              <Button
                variant="outline"
                onClick={handleCloseForm}
                className="flex-1"
                data-testid="button-cancel-transaction"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddTransaction}
                className="flex-1"
                data-testid="button-save-transaction"
              >
                Registrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
