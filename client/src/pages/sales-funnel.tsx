import { useState, useEffect } from "react";
import { Search, TrendingUp, Users, Activity, MessageCircle, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) setUserId(user.id);
  }, []);

  const { data: accounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", userId],
    enabled: !!userId,
    retry: 1,
    queryFn: async () => {
      const response = await fetch(`/api/whatsapp-accounts?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
  });

  useEffect(() => {
    if (accounts.length > 0 && !activeAccountId) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  // Same query pattern as conversations.tsx - critical for sync
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", activeAccountId],
    enabled: !!activeAccountId,
    refetchInterval: 2000,
    staleTime: 5000,
    retry: 1,
    queryFn: async () => {
      if (!activeAccountId) return [];
      const response = await fetch(`/api/conversations?accountId=${activeAccountId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
  });

  // WebSocket subscription for real-time updates (same as conversations.tsx)
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

  // Group conversations by funnel stage
  const stageGroups = FUNNEL_STAGES.reduce((acc, stage) => {
    const convs = conversations.filter(conv => {
      if (conv.contactNumber === 'status' || conv.contactNumber.includes('broadcast')) return false;
      
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

  // Calculate totals
  const totalContacts = conversations.filter(c => c.contactNumber !== 'status' && !c.contactNumber.includes('broadcast')).length;
  const conversions = stageGroups.completed.length;
  const conversionRate = totalContacts > 0 ? ((conversions / totalContacts) * 100).toFixed(1) : "0.0";

  // Filter to selected stage only (like filtering conversations)
  const filteredConversations = selectedStageId 
    ? stageGroups[selectedStageId] 
    : Object.values(stageGroups).flat();

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-6 py-8 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Account Selector */}
          <div className="flex items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Análisis de Conversión</h1>
                <p className="text-xs text-muted-foreground/80">Monitorea el flujo de conversión a través de tu embudo de ventas</p>
              </div>
            </div>

            {accounts.length > 0 && (
              <Select value={activeAccountId || ""} onValueChange={setActiveAccountId}>
                <SelectTrigger className="w-40" data-testid="select-account-funnel">
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

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalContacts}</p>
            </div>

            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Conversiones</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{conversions}</p>
            </div>

            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Tasa</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
            </div>

            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">Activos</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stageGroups.sales.length}</p>
            </div>
          </div>

          {/* Search and Filter */}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-6 py-6 max-w-7xl mx-auto">
          {/* Alert Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mb-6">
            <p className="text-sm font-semibold text-foreground">Embudo de Ventas Automático</p>
            <p className="text-xs text-foreground/70 mt-0.5">El sistema clasifica automáticamente tus conversaciones según keywords y patrones. Selecciona una etapa para filtrar.</p>
          </div>

          {/* Funnel Stages Overview */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <Button
              variant={selectedStageId === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStageId(null)}
              className="gap-1 h-auto flex-col py-2 px-2"
              data-testid="button-filter-all-stages"
            >
              <span className="text-xs font-semibold">Todas</span>
              <span className="text-sm font-bold">{totalContacts}</span>
            </Button>
            {FUNNEL_STAGES.map((stage) => (
              <Button
                key={stage.id}
                variant={selectedStageId === stage.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStageId(stage.id)}
                className="gap-1 h-auto flex-col py-2 px-2"
                data-testid={`button-filter-stage-${stage.id}`}
              >
                <span className="text-xs font-semibold line-clamp-2">{stage.label}</span>
                <span className="text-sm font-bold">{stageGroups[stage.id].length}</span>
              </Button>
            ))}
          </div>

          {/* Conversations Grid */}
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-lg">
              <MessageCircle className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No hay conversaciones</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedStageId ? "No coinciden con el filtro seleccionado" : "Los chats aparecerán aquí cuando lleguen"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConversations.map((conv) => {
                const stage = getStageForConversation(conv);
                return (
                  <Card 
                    key={conv.id}
                    className="cursor-pointer border transition-all hover-elevate"
                    data-testid={`funnel-chat-${conv.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="w-9 h-9 flex-shrink-0">
                              <AvatarFallback className={getAvatarColor(conv.contactName || conv.contactNumber)}>
                                {(conv.contactName || "C").substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-foreground truncate">
                                {conv.contactName || "Contacto"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.contactNumber}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${stage.color} flex-shrink-0 text-xs`}>
                            {stage.label}
                          </Badge>
                        </div>

                        {/* Message Preview */}
                        <div className="bg-muted/40 rounded-md p-2.5 min-h-12">
                          <p className="text-xs text-foreground/70 line-clamp-2">
                            {conv.lastMessageText || "Sin mensajes"}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {conv.lastMessageTime 
                                ? new Date(conv.lastMessageTime).toLocaleDateString('es-ES', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : "Sin fecha"}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {conv.unreadCount ? `${conv.unreadCount} sin leer` : "Leído"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
