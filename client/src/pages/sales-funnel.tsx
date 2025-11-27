import { useState, useEffect } from "react";
import { Search, TrendingUp, Users, Percent, Zap, Eye, MessageCircle, Megaphone, HelpCircle, MessageSquare, CheckCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLocation } from "wouter";
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
  icon: React.ComponentType<any>;
  color: string;
  bgLight: string;
  keywords: string[];
}

const FUNNEL_STAGES: FunnelStage[] = [
  {
    id: "ads",
    label: "Anuncios",
    description: "Desde campañas",
    icon: Megaphone,
    color: "from-blue-500/20 to-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    keywords: ["anuncio", "ad", "campaña", "promoción", "publicidad", "oferta", "descuento", "promo"],
  },
  {
    id: "inquiry",
    label: "Consultas",
    description: "Preguntas iniciales",
    icon: HelpCircle,
    color: "from-cyan-500/20 to-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
    bgLight: "bg-cyan-50 dark:bg-cyan-950/30",
    keywords: ["¿", "cuál", "cuánto", "cómo", "precio", "disponible", "info", "información", "detalles", "tienes", "hay"],
  },
  {
    id: "sales",
    label: "Negociación",
    description: "Conversaciones de venta",
    icon: MessageSquare,
    color: "from-purple-500/20 to-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
    keywords: ["compro", "compra", "venta", "listo", "acepto", "pago", "quiero", "interesa", "me gustaría", "precio"],
  },
  {
    id: "completed",
    label: "Conversión",
    description: "Ventas completadas",
    icon: CheckCircle,
    color: "from-green-500/20 to-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
    bgLight: "bg-green-50 dark:bg-green-950/30",
    keywords: ["gracias", "pedido", "confirmado", "entregado", "recibido", "perfecto", "excelente", "ok", "bien"],
  },
  {
    id: "support",
    label: "Soporte",
    description: "Post-venta",
    icon: AlertTriangle,
    color: "from-orange-500/20 to-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
    bgLight: "bg-orange-50 dark:bg-orange-950/30",
    keywords: ["problema", "no funciona", "duda", "ayuda", "error", "issue", "no llega", "defecto", "falla"],
  },
];

const getStageForConversation = (conv: Conversation): FunnelStage => {
  if (conv.category && conv.category !== "general") {
    const stage = FUNNEL_STAGES.find(s => s.id === conv.category);
    if (stage) return stage;
  }

  const text = `${conv.contactName || ""} ${conv.lastMessageText || ""}`.toLowerCase();
  
  for (const stage of FUNNEL_STAGES) {
    for (const keyword of stage.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return stage;
      }
    }
  }

  return FUNNEL_STAGES[1];
};

const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500 text-white",
    "bg-purple-500 text-white",
    "bg-cyan-500 text-white",
    "bg-green-500 text-white",
    "bg-orange-500 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function SalesFunnelPage() {
  const [, navigate] = useLocation();
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

  const accounts = allAccounts.filter(a => a.status === 'connected' && a.isActive);

  useEffect(() => {
    if (accounts.length > 0 && !activeAccountId) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", activeAccountId],
    enabled: !!activeAccountId,
    refetchInterval: 8000,
    staleTime: 10000,
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

  const cleanConversations = conversations.filter(c => 
    c.contactNumber !== 'status' && 
    !c.contactNumber.includes('broadcast') &&
    c.contactNumber.trim() !== ''
  );

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

  const totalContacts = cleanConversations.length;
  const conversions = stageGroups.completed.length;
  const conversionRate = totalContacts > 0 ? ((conversions / totalContacts) * 100).toFixed(1) : "0.0";
  const inNegotiation = stageGroups.sales.length;

  return (
    <div className="flex flex-col h-screen bg-background min-h-0">
      {/* Header */}
      <div className="border-b border-border px-4 py-6 flex-shrink-0 bg-gradient-to-b from-card via-card/95 to-card/90">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground">Análisis de Conversión</h1>
                <p className="text-xs text-muted-foreground/80">Embudo de ventas automático en tiempo real</p>
              </div>
            </div>

            {accounts.length > 0 && (
              <Select value={activeAccountId || ""} onValueChange={setActiveAccountId}>
                <SelectTrigger className="w-48 h-9 text-sm flex-shrink-0" data-testid="select-account-funnel">
                  <SelectValue placeholder="Selecciona cuenta" />
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {accounts.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Sin cuentas conectadas</h3>
              <p className="text-sm text-muted-foreground">Necesitas una cuenta WhatsApp activa</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full overflow-hidden">
            {/* Left Column - Funnel Stages */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-border p-3 gap-3">
              {/* Search Bar */}
              <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contacto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-xs"
                  data-testid="input-search-funnel"
                />
              </div>

              {/* Funnel Cards */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {FUNNEL_STAGES.map((stage) => {
                  const count = stageGroups[stage.id].length;
                  const percentage = totalContacts > 0 ? ((count / totalContacts) * 100).toFixed(0) : "0";

                  return (
                    <button
                      key={stage.id}
                      onClick={() => {
                        setSelectedStageId(stage.id);
                        setSelectedConversations(stageGroups[stage.id]);
                        setShowDetailsModal(true);
                      }}
                      className="w-full text-left"
                      data-testid={`button-stage-${stage.id}`}
                    >
                      <div className={`transition-all rounded-lg border p-2.5 cursor-pointer bg-gradient-to-r ${stage.color} hover-elevate`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {stage.icon && <stage.icon className="w-4 h-4 flex-shrink-0" />}
                            <div>
                              <h3 className="font-semibold text-xs text-foreground">{stage.label}</h3>
                              <p className="text-xs text-muted-foreground/80">{stage.description}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xl font-bold text-foreground">{count}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{percentage}% del total</p>
                          </div>
                          <div className="text-right">
                            <div className="w-16 h-1 bg-muted/40 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-foreground/30 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Metrics & Summary */}
            <div className="w-64 flex flex-col gap-3 flex-shrink-0 p-3 bg-gradient-to-b from-background/50 to-background overflow-y-auto custom-scrollbar">
              {/* Main KPIs */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-foreground">Indicadores Clave</h2>
                
                {/* Total Contacts */}
                <div className="rounded-lg border border-border/60 bg-card p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Total Contactos</p>
                    <Users className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalContacts}</p>
                </div>

                {/* Conversion Rate */}
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Tasa de Conversión</p>
                    <Percent className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{conversionRate}%</p>
                </div>

                {/* Conversions */}
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Conversiones Completadas</p>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{conversions}</p>
                </div>

                {/* In Negotiation */}
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-muted-foreground">En Negociación</p>
                    <MessageSquare className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{inNegotiation}</p>
                </div>
              </div>

              {/* Stage Breakdown */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-foreground">Distribución por Etapa</h2>
                <div className="space-y-1.5">
                  {FUNNEL_STAGES.map((stage) => {
                    const count = stageGroups[stage.id].length;
                    const percentage = totalContacts > 0 ? ((count / totalContacts) * 100) : 0;
                    
                    return (
                      <button
                        key={stage.id}
                        onClick={() => {
                          setSelectedStageId(stage.id);
                          setSelectedConversations(stageGroups[stage.id]);
                          setShowDetailsModal(true);
                        }}
                        className="w-full group"
                        data-testid={`card-stage-summary-${stage.id}`}
                      >
                        <div className="p-3 rounded-lg border border-border/60 bg-card hover-elevate transition-colors hover:bg-muted/50">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {stage.icon && <stage.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                              <p className="text-xs font-medium text-foreground truncate">{stage.label}</p>
                            </div>
                            <p className="text-xs font-bold text-foreground flex-shrink-0">{count}</p>
                          </div>
                          <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-foreground/40 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info Box */}
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 flex-shrink-0">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Sistema Automático</p>
                <p className="text-xs text-foreground/70 leading-tight">Las conversaciones se categorizan automáticamente usando análisis de palabras clave inteligente.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal - Compact */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-md max-h-[75vh] overflow-y-auto p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">
              {selectedStageId ? FUNNEL_STAGES.find(s => s.id === selectedStageId)?.label : "Conversaciones"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedConversations.length} conversaciones en esta etapa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {selectedConversations.length === 0 ? (
              <div className="text-center py-6">
                <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No hay conversaciones en esta etapa</p>
              </div>
            ) : (
              selectedConversations.map((conv) => {
                const stage = getStageForConversation(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setShowDetailsModal(false);
                      navigate(`/conversations?contact=${encodeURIComponent(conv.contactNumber)}`);
                    }}
                    className="w-full flex items-start gap-2.5 p-2.5 border border-border/60 rounded-lg hover:bg-muted/50 transition-colors text-left hover-elevate"
                    data-testid={`conversation-item-${conv.id}`}
                  >
                    <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                      <AvatarFallback className={getAvatarColor(conv.contactName || conv.contactNumber)}>
                        {(conv.contactName || "C").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate">
                            {conv.contactName || "Contacto"}
                          </p>
                          <p className="text-xs text-muted-foreground">{conv.contactNumber}</p>
                        </div>
                        <Badge className="text-xs flex-shrink-0 h-5" variant="outline">
                          {stage.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground/70 line-clamp-1">
                        {conv.lastMessageText || "Sin mensajes"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
