import { useState, useEffect } from "react";
import { Search, TrendingUp, Users, Activity, MessageCircle, ArrowDown, Eye, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { subscribeToMessages } from "@/lib/websocket";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Conversation, WhatsappAccount } from "@shared/schema";

interface FunnelStage {
  id: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  keywords: string[];
}

const FUNNEL_STAGES: FunnelStage[] = [
  {
    id: "ads",
    label: "Anuncios",
    description: "Contactos desde campañas",
    color: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    textColor: "text-cyan-600 dark:text-cyan-400",
    keywords: ["anuncio", "ad", "campaña", "promoción", "publicidad", "oferta", "descuento", "promo"],
  },
  {
    id: "inquiry",
    label: "Consultas",
    description: "Preguntas iniciales",
    color: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-600 dark:text-blue-400",
    keywords: ["¿", "cuál", "cuánto", "cómo", "precio", "disponible", "info", "información", "detalles", "tienes", "hay"],
  },
  {
    id: "sales",
    label: "Negociación",
    description: "Conversaciones de venta",
    color: "bg-green-500/20 text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-600 dark:text-green-400",
    keywords: ["compro", "compra", "venta", "listo", "acepto", "pago", "quiero", "interesa", "me gustaría", "precio"],
  },
  {
    id: "completed",
    label: "Conversión",
    description: "Ventas completadas",
    color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-600 dark:text-emerald-400",
    keywords: ["gracias", "pedido", "confirmado", "entregado", "recibido", "perfecto", "excelente", "ok", "bien"],
  },
  {
    id: "support",
    label: "Soporte",
    description: "Post-venta",
    color: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-600 dark:text-purple-400",
    keywords: ["problema", "no funciona", "duda", "ayuda", "error", "issue", "no llega", "defecto", "falla"],
  },
];

const getStageForConversation = (conv: Conversation): FunnelStage => {
  // If conversation has a category, use it
  if (conv.category && conv.category !== "general") {
    const stage = FUNNEL_STAGES.find(s => s.id === conv.category);
    if (stage) return stage;
  }

  // Analyze last message and contact name for keywords
  const text = `${conv.contactName || ""} ${conv.lastMessageText || ""}`.toLowerCase();
  
  // Check for keywords in order of priority (more specific first)
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
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedConversations, setSelectedConversations] = useState<Conversation[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) setUserId(user.id);
  }, []);

  const { data: allAccounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", userId],
    enabled: !!userId,
    retry: 1,
    queryFn: async () => {
      const response = await fetch(`/api/whatsapp-accounts?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
  });

  // Filter only connected and active accounts
  const accounts = allAccounts.filter(a => a.status === 'connected' && a.isActive);

  useEffect(() => {
    if (accounts.length > 0 && !activeAccountId) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", activeAccountId],
    enabled: !!activeAccountId,
    refetchInterval: 3000,
    staleTime: 5000,
    retry: 1,
    queryFn: async () => {
      if (!activeAccountId) return [];
      const response = await fetch(`/api/conversations?accountId=${activeAccountId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
  });

  useEffect(() => {
    const unsubscribe = subscribeToMessages((message) => {
      if (message.type === "new_message") {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeAccountId] });
      }
    });
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [activeAccountId]);

  if (isLoading) return <LoadingSpinner />;

  // Clean conversations (filter out system messages)
  const cleanConversations = conversations.filter(c => 
    c.contactNumber !== 'status' && 
    !c.contactNumber.includes('broadcast') &&
    c.contactNumber.trim() !== ''
  );

  // Group conversations by funnel stage
  const stageGroups = FUNNEL_STAGES.reduce((acc, stage) => {
    const convs = cleanConversations.filter(conv => {
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

  // Calculate metrics
  const totalContacts = cleanConversations.length;
  const conversions = stageGroups.completed.length;
  const conversionRate = totalContacts > 0 ? ((conversions / totalContacts) * 100).toFixed(1) : "0.0";
  const inNegotiation = stageGroups.sales.length;

  // Get max value for funnel height calculation
  const maxStageCount = Math.max(...FUNNEL_STAGES.map(s => stageGroups[s.id].length), 1);

  return (
    <div className="flex flex-col bg-background">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Account Selector */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Análisis de Conversión</h1>
                <p className="text-xs text-muted-foreground/80">Embudo de ventas con categorización automática</p>
              </div>
            </div>

            {accounts.length > 0 && (
              <Select value={activeAccountId || ""} onValueChange={setActiveAccountId}>
                <SelectTrigger className="w-48 h-9" data-testid="select-account-funnel">
                  <SelectValue placeholder="Seleccionar cuenta" />
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

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {/* Total Contacts */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalContacts}</p>
            </div>

            {/* Conversions */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <p className="text-xs text-muted-foreground font-medium">Conversiones</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{conversions}</p>
            </div>

            {/* Conversion Rate */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Tasa</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
            </div>

            {/* In Negotiation */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">Negociando</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{inNegotiation}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar contacto, número o mensaje..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
              data-testid="input-search-funnel"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            {/* Alert Banner */}
            <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-3 mb-6">
              <p className="text-sm font-semibold text-foreground">Categorización Automática de Conversaciones</p>
              <p className="text-xs text-foreground/70 mt-0.5">Los contactos se categorizan automáticamente según palabras clave y el contenido de los mensajes. Haz clic en una etapa para ver los detalles.</p>
            </div>

            {accounts.length === 0 ? (
              <div className="border border-border rounded-lg flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-primary/10 dark:bg-primary/5 rounded-full flex items-center justify-center mb-6">
                  <MessageCircle className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">Sin cuentas conectadas</h3>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Necesitas tener al menos una cuenta de WhatsApp conectada y activa para ver el análisis de conversión
                </p>
              </div>
            ) : (
              <>
                {/* Funnel Visualization */}
                <div className="space-y-6 mb-8">
                  <div className="flex flex-col items-center justify-center gap-4">
                    {FUNNEL_STAGES.map((stage, index) => {
                      const count = stageGroups[stage.id].length;
                      const percentage = maxStageCount > 0 ? (count / maxStageCount) * 100 : 0;
                      const conversionPct = totalContacts > 0 ? ((count / totalContacts) * 100).toFixed(1) : "0.0";

                      return (
                        <div key={stage.id} className="w-full">
                          {/* Funnel Stage Button */}
                          <button
                            onClick={() => {
                              setSelectedStageId(stage.id);
                              setSelectedConversations(stageGroups[stage.id]);
                              setShowDetailsModal(true);
                            }}
                            className="w-full group"
                            data-testid={`button-stage-${stage.id}`}
                          >
                            <div
                              className={`mx-auto transition-all group-hover:scale-105 rounded-lg border-2 border-border ${stage.bgColor} p-6 shadow-sm hover:shadow-md`}
                              style={{
                                width: `${Math.max(percentage, 20)}%`,
                                minWidth: "250px"
                              }}
                            >
                              <div className="space-y-3">
                                <div>
                                  <p className={`font-bold text-lg ${stage.textColor}`}>{stage.label}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-3xl font-bold text-foreground">{count}</p>
                                    <p className="text-xs text-muted-foreground">{conversionPct}% del total</p>
                                  </div>
                                  <Eye className={`w-5 h-5 ${stage.textColor} opacity-60`} />
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Arrow */}
                          {index < FUNNEL_STAGES.length - 1 && (
                            <div className="flex justify-center py-2">
                              <ArrowDown className="w-5 h-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-5 gap-3">
                  {FUNNEL_STAGES.map((stage) => {
                    const count = stageGroups[stage.id].length;
                    return (
                      <Card
                        key={stage.id}
                        className="cursor-pointer hover-elevate"
                        onClick={() => {
                          setSelectedStageId(stage.id);
                          setSelectedConversations(stageGroups[stage.id]);
                          setShowDetailsModal(true);
                        }}
                        data-testid={`card-stage-summary-${stage.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">{count}</p>
                            <p className={`text-xs font-medium mt-2 ${stage.textColor}`}>{stage.label}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStageId ? FUNNEL_STAGES.find(s => s.id === selectedStageId)?.label : "Conversaciones"}
            </DialogTitle>
            <DialogDescription>
              {selectedConversations.length} conversaciones en esta etapa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground">No hay conversaciones en esta etapa</p>
              </div>
            ) : (
              selectedConversations.map((conv) => {
                const stage = getStageForConversation(conv);
                return (
                  <div
                    key={conv.id}
                    className="flex items-start gap-3 p-3 border border-border/60 rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`conversation-item-${conv.id}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={getAvatarColor(conv.contactName || conv.contactNumber)}>
                        {(conv.contactName || "C").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {conv.contactName || "Contacto"}
                          </p>
                          <p className="text-xs text-muted-foreground">{conv.contactNumber}</p>
                        </div>
                        <Badge className={`${stage.color} text-xs flex-shrink-0`}>
                          {stage.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground/70 mt-2 line-clamp-2">
                        {conv.lastMessageText || "Sin mensajes"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conv.lastMessageTime && new Date(conv.lastMessageTime).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
