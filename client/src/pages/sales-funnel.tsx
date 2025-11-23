import { useState, useEffect } from "react";
import { Search, Filter, MessageCircle, TrendingUp, ChevronRight } from "lucide-react";
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

const CATEGORIES = [
  { value: "all", label: "Todas las Categorías" },
  { value: "sales", label: "Ventas", color: "bg-green-500/20 text-green-600 dark:text-green-400" },
  { value: "support", label: "Soporte", color: "bg-purple-500/20 text-purple-600 dark:text-purple-400" },
  { value: "complaint", label: "Quejas", color: "bg-red-500/20 text-red-600 dark:text-red-400" },
  { value: "vip", label: "VIP", color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" },
  { value: "inquiry", label: "Consulta", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
  { value: "other", label: "Otro", color: "bg-gray-500/20 text-gray-600 dark:text-gray-400" },
];

const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500 text-white",
    "bg-purple-500 text-white",
    "bg-pink-500 text-white",
    "bg-green-500 text-white",
    "bg-cyan-500 text-white",
    "bg-orange-500 text-white",
    "bg-rose-500 text-white",
    "bg-indigo-500 text-white",
    "bg-teal-500 text-white",
    "bg-amber-500 text-white",
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
  const [filterCategory, setFilterCategory] = useState("all");
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
    queryKey: ["/api/conversations", activeAccountId],
    enabled: !!activeAccountId,
    refetchInterval: 3000,
    staleTime: 5000,
    retry: 1,
  });

  if (isLoading) return <LoadingSpinner />;

  // Filter conversations
  const filtered = conversations.filter((conv) => {
    const matchesSearch =
      searchQuery === "" ||
      conv.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactNumber.includes(searchQuery) ||
      (conv.lastMessageText?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesCategory = filterCategory === "all" || conv.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Group by category - include "general" if it has conversations
  const grouped = CATEGORIES.filter(c => c.value !== "all").reduce((acc, cat) => {
    const convs = filtered.filter(c => c.category === cat.value);
    if (convs.length > 0) {
      acc[cat.value] = convs;
    }
    return acc;
  }, {} as Record<string, Conversation[]>);

  // If no categories have conversations, show all in "general"
  if (Object.keys(grouped).length === 0 && filtered.length > 0) {
    grouped["general"] = filtered;
  }

  const getCategoryInfo = (categoryValue: string) => {
    if (categoryValue === "general") {
      return { value: "general", label: "General", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" };
    }
    return CATEGORIES.find(c => c.value === categoryValue);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10 px-6 py-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Embudo de Ventas - CRM
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Chats clasificados automáticamente por categoría
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, número o contenido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-funnel"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48" data-testid="select-category-funnel">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-8">
          {Object.entries(grouped).map(([categoryValue, convs]) => {
            const categoryInfo = getCategoryInfo(categoryValue);
            if (!categoryInfo || convs.length === 0) return null;

            return (
              <div key={categoryValue} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur py-2">
                  <Badge className={categoryInfo.color}>
                    {categoryInfo.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {convs.length} chat{convs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Conversation List */}
                <div className="space-y-2">
                  {convs.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                      data-testid={`chat-${conv.id}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback className={getAvatarColor(conv.contactName)}>
                            {conv.contactName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {conv.contactName}
                            </p>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <p className="text-xs text-muted-foreground mb-2 truncate">
                            {conv.contactNumber}
                          </p>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {conv.lastMessageText || "Sin mensajes"}
                          </p>

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {conv.priority && (
                              <Badge variant="outline" className="text-xs">
                                {conv.priority.charAt(0).toUpperCase() + conv.priority.slice(1)}
                              </Badge>
                            )}
                            {conv.status && (
                              <Badge variant="secondary" className="text-xs">
                                {conv.status === "active" ? "Activa" : conv.status === "archived" ? "Archivada" : conv.status}
                              </Badge>
                            )}
                            {conv.lastMessageAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(conv.lastMessageAt).toLocaleString("es-ES", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No se encontraron chats</p>
              <p className="text-xs text-muted-foreground mt-1">
                Intenta cambiar los filtros de búsqueda
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Summary Footer */}
      <div className="border-t border-border bg-muted/30 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Total: {filtered.length} chat{filtered.length !== 1 ? 's' : ''}</span>
          <span>Clasificación automática en tiempo real</span>
        </div>
      </div>
    </div>
  );
}
