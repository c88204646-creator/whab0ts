import { MessageCircle, TrendingUp, AlertCircle, CheckCircle2, Filter, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function SalesFunnelPage() {
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["/api/conversations/funnel"],
  });

  const categories = {
    sales: { color: "bg-green-500/20 text-green-600", label: "Ventas", icon: "💰" },
    support: { color: "bg-purple-500/20 text-purple-600", label: "Soporte", icon: "🛠" },
    complaint: { color: "bg-red-500/20 text-red-600", label: "Quejas", icon: "⚠" },
    vip: { color: "bg-yellow-500/20 text-yellow-600", label: "VIP", icon: "👑" },
    inquiry: { color: "bg-blue-500/20 text-blue-600", label: "Consulta", icon: "❓" },
    other: { color: "bg-gray-500/20 text-gray-600", label: "Otro", icon: "•" },
  };

  if (isLoading) return <LoadingSpinner />;

  const grouped = Object.keys(categories).reduce((acc, cat) => {
    acc[cat] = conversations.filter(c => c.category === cat).length;
    return acc;
  }, {});

  const total = conversations.length;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-1">Embudo de Ventas</h1>
            <p className="text-sm text-muted-foreground">Clasificación automática de chats</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(categories).map(([key, data]) => (
              <Card key={key}>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{grouped[key] || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{data.label}</p>
                    <div className="text-lg mt-2">{data.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Flujo del Embudo</span>
                <Button size="sm" variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Reclasificar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(categories).map(([key, data]) => {
                const count = grouped[key] || 0;
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${data.color}`}>
                        {data.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{count} chats ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-8 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              ℹ️ La clasificación automática analiza el contenido de los mensajes para categorizar chats por tipo (ventas, soporte, quejas, etc.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
