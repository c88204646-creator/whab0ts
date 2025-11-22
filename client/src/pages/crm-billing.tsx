import { useState } from "react";
import { Receipt, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function CRMBillingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Facturación</h1>
              <p className="text-sm text-muted-foreground">Gestiona tus facturas</p>
            </div>
          </div>
          <Button data-testid="button-add-invoice">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Factura
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
                placeholder="Buscar facturas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-invoices"
              />
            </div>
          </div>

          {/* Empty State */}
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="py-12 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium text-foreground">No hay facturas aún</p>
              <p className="text-sm text-muted-foreground mt-2">Crea tu primera factura para comenzar</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
