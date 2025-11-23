import { useState, useEffect } from "react";
import { Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Conversation, WhatsappAccount } from "@shared/schema";

interface FunnelStage {
  id: string;
  label: string;
  description: string;
  color: string;
  keywords: string[];
}

const FUNNEL_STAGES: FunnelStage[] = [
  {
    id: "ads",
    label: "Anuncios/Campaña",
    description: "Contactos desde anuncios o campañas publicitarias",
    color: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
    keywords: ["anuncio", "ad", "campaña", "promoción", "publicidad", "oferta", "descuento", "vea", "compra"],
  },
  {
    id: "inquiry",
    label: "Consultas",
    description: "Clientes con preguntas o interés inicial",
    color: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    keywords: ["¿?", "cuál", "cuánto", "cómo", "precio", "disponible", "info", "datos", "detalles"],
  },
  {
    id: "sales",
    label: "Negociación",
    description: "Conversaciones activas de venta",
    color: "bg-green-500/20 text-green-600 dark:text-green-400",
    keywords: ["compro", "compra", "venta", "listo", "acepto", "pago", "transfer", "tarjeta"],
  },
  {
    id: "completed",
    label: "Conversión",
    description: "Ventas completadas o conversiones",
    color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    keywords: ["gracias", "pedido", "confirmado", "entregado", "recibido", "exitoso"],
  },
  {
    id: "support",
    label: "Soporte",
    description: "Consultas post-venta o soporte",
    color: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
    keywords: ["problema", "no funciona", "duda", "ayuda", "error", "falla", "repuesto"],
  },
];

const getStageForConversation = (conv: Conversation): FunnelStage => {
  // Use category if available
  if (conv.category && conv.category !== "general") {
    const stage = FUNNEL_STAGES.find(s => s.id === conv.category);
    if (stage) return stage;
  }

  // Otherwise detect from message content
  const text = `${conv.contactName || ""} ${conv.lastMessageText || ""}`.toLowerCase();
  
  for (const stage of FUNNEL_STAGES) {
    for (const keyword of stage.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return stage;
      }
    }
  }

  // Default to inquiry
  return FUNNEL_STAGES[1];
};

const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500 text-white",
    "bg-purple-500 text-white",
    "bg-pink-500 text-white",
    "bg-green-500 text-white",
    "bg-cyan-500 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function SalesFunnelPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: accounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", userId],
    enabled: !!userId,
    retry: 1,
  });

  useEffect(() => {
    if (accounts.length > 0 && !activeAccountId) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", "accountId", activeAccountId],
    enabled: !!activeAccountId,
    refetchInterval: 3000,
  });

  if (isLoading) return <LoadingSpinner />;

  // Group conversations by funnel stage
  const stageGroups = FUNNEL_STAGES.reduce((acc, stage) => {
    const convs = conversations.filter(conv => {
      const matchesStage = getStageForConversation(conv).id === stage.id;
      const matchesSearch = searchQuery === "" ||
        (conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        conv.contactNumber.includes(searchQuery) ||
        (conv.lastMessageText?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesStage && matchesSearch;
    });
    acc[stage.id] = convs;
    return acc;
  }, {} as Record<string, Conversation[]>);

  // Calculate totals and conversion rates
  const totalContacts = conversations.length;
  const conversions = stageGroups.completed.length;
  const conversionRate = totalContacts > 0 ? ((conversions / totalContacts) * 100).toFixed(1) : "0.0";

  // Calculate max width for funnel visualization
  const maxCount = Math.max(...FUNNEL_STAGES.map(s => stageGroups[s.id].length), 1);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10 px-4 lg:px-6 py-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Embudo de Ventas
            </h1>
            <p className="text-xs lg:text-sm text-muted-foreground mt-1">
              Análisis de flujo de conversión con detección automática de anuncios y campañas
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contacto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
                data-testid="input-search-funnel"
              />
            </div>

            {accounts.length > 0 && (
              <Select value={activeAccountId || ""} onValueChange={setActiveAccountId}>
                <SelectTrigger className="w-40 h-9 text-xs" data-testid="select-account-funnel">
                  <SelectValue placeholder="Cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.deviceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Conversion Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="bg-muted/40 rounded-lg p-2 border border-border/40">
              <p className="text-xs text-muted-foreground">Total Contactos</p>
              <p className="text-lg font-bold text-foreground">{totalContacts}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2 border border-border/40">
              <p className="text-xs text-muted-foreground">Conversiones</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{conversions}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2 border border-border/40">
              <p className="text-xs text-muted-foreground">Tasa Conversión</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{conversionRate}%</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2 border border-border/40">
              <p className="text-xs text-muted-foreground">Etapa Principal</p>
              <p className="text-lg font-bold text-foreground">
                {Object.entries(stageGroups).reduce((max, [stage, convs]) => 
                  convs.length > stageGroups[max].length ? stage : max
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <ScrollArea className="flex-1">
        <div className="px-4 lg:px-6 py-6 space-y-6">
          {/* Funnel Chart */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Flujo de Conversión</h2>
            <div className="space-y-3">
              {FUNNEL_STAGES.map((stage, index) => {
                const count = stageGroups[stage.id].length;
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const width = Math.max(percentage, 5); // Min 5% for visibility

                return (
                  <div key={stage.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{stage.label}</p>
                        <p className="text-xs text-muted-foreground">{stage.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground">{((count / totalContacts) * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    
                    {/* Funnel Bar */}
                    <div className="h-8 bg-muted/30 rounded-lg overflow-hidden border border-border/30">
                      <div
                        className={`h-full rounded-lg transition-all duration-300 flex items-center justify-center ${stage.color}`}
                        style={{ width: `${width}%` }}
                      >
                        {count > 0 && (
                          <span className="text-xs font-bold text-foreground px-2 truncate">{count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conversations by Stage */}
          <div className="space-y-8 border-t border-border pt-6">
            {FUNNEL_STAGES.map((stage) => {
              const convs = stageGroups[stage.id];
              if (convs.length === 0) return null;

              return (
                <div key={stage.id} className="space-y-3">
                  <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur py-2">
                    <Badge className={stage.color}>
                      {stage.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {convs.length} chat{convs.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Conversation List */}
                  <div className="grid gap-2">
                    {convs.map((conv) => (
                      <div
                        key={conv.id}
                        className="p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                        data-testid={`funnel-chat-${conv.id}`}
                      >
                        <div className="flex items-start gap-2">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className={getAvatarColor(conv.contactName || conv.contactNumber)}>
                              {(conv.contactName || "C").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">
                              {conv.contactName || conv.contactNumber}
                            </p>
                            <p className="text-xs text-muted-foreground mb-1 truncate">
                              {conv.contactNumber}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {conv.lastMessageText || "Sin mensajes"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {totalContacts === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No hay datos disponibles</p>
              <p className="text-xs text-muted-foreground mt-1">
                Los chats aparecerán aquí cuando lleguen
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
