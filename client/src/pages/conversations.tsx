import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MessageCircle, 
  Plus, 
  X, 
  Filter,
  SlidersHorizontal,
  Users,
  TrendingUp,
  Clock,
  Activity,
  Inbox,
  Star,
  Archive,
  AlertCircle,
  ChevronDown,
  LayoutGrid,
  List,
  Sparkles,
  Phone,
  Mail,
  MoreVertical,
  RefreshCw,
  Bell,
  BellOff,
  Pin,
  UserPlus,
  Settings2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { subscribeToMessages } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/lib/debounce";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ConversationCard } from "@/components/conversation-card";
import { ChatBubble } from "@/components/chat-bubble";
import { ContactProfilePanel } from "@/components/contact-profile-panel";
import { QuickActionsBar } from "@/components/quick-actions-bar";
import type { Conversation, Message, WhatsappAccount } from "@shared/schema";

interface CountryFormat {
  code: string;
  name: string;
  localDigits: number;
  prefix?: string;
}

const COUNTRY_CODES: Record<string, CountryFormat> = {
  "52": { code: "52", name: "Mexico", localDigits: 11, prefix: "1" },
  "1": { code: "1", name: "USA/Canada", localDigits: 10 },
  "34": { code: "34", name: "Spain", localDigits: 9 },
  "55": { code: "55", name: "Brazil", localDigits: 11 },
  "54": { code: "54", name: "Argentina", localDigits: 10 },
  "57": { code: "57", name: "Colombia", localDigits: 10 },
  "56": { code: "56", name: "Chile", localDigits: 9 },
};

const SMART_FILTERS = [
  { id: "all", label: "Todos", icon: Inbox, count: 0 },
  { id: "unread", label: "Sin leer", icon: Bell, count: 0 },
  { id: "starred", label: "Destacados", icon: Star, count: 0 },
  { id: "urgent", label: "Urgentes", icon: AlertCircle, count: 0 },
  { id: "recent", label: "Recientes", icon: Clock, count: 0 },
];

const CATEGORIES = [
  { value: "all", label: "Todas las categorias" },
  { value: "general", label: "General" },
  { value: "sales", label: "Ventas" },
  { value: "support", label: "Soporte" },
  { value: "vip", label: "VIP" },
  { value: "other", label: "Otro" },
];

const getAvatarGradient = (name: string): string => {
  const gradients = [
    "from-violet-500 to-purple-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-pink-500 to-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState<"client" | "lead" | null>(null);
  const [createFormData, setCreateFormData] = useState({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
  const [whatsappCode, setWhatsappCode] = useState("52");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contactFromUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
    const params = new URLSearchParams(window.location.search);
    contactFromUrlRef.current = params.get('contact');
  }, []);

  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", activeAccountId],
    enabled: !!activeAccountId,
    refetchInterval: 5000,
    staleTime: 8000,
    retry: 1,
    queryFn: async () => {
      if (!activeAccountId) return [];
      const response = await fetch(`/api/conversations?accountId=${activeAccountId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
  });

  useEffect(() => {
    if (contactFromUrlRef.current && conversations.length > 0 && !activeConversation) {
      const conv = conversations.find(c => c.contactNumber === contactFromUrlRef.current);
      if (conv) {
        setActiveConversation(conv.id);
        window.history.replaceState({}, document.title, window.location.pathname);
        contactFromUrlRef.current = null;
      }
    }
  }, [conversations, activeConversation]);

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

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeConversation],
    enabled: !!activeConversation,
    retry: 1,
    staleTime: 2000,
    refetchInterval: 3000,
    queryFn: async () => {
      if (!activeConversation) return [];
      const response = await fetch(`/api/messages/${activeConversation}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { accountId: string; toNumber: string; content: string; isManual: boolean }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ["/api/messages", activeConversation] });
      const previousMessages = queryClient.getQueryData<Message[]>(["/api/messages", activeConversation]) || [];
      
      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}`,
        conversationId: activeConversation || "",
        content: newMessage.content,
        sender: "user",
        timestamp: new Date(),
        status: "sending",
        direction: "outgoing",
        messageId: `temp-${Date.now()}`,
      } as unknown as Message;
      
      queryClient.setQueryData(["/api/messages", activeConversation], [...previousMessages, optimisticMessage]);
      return { previousMessages, optimisticMessage };
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeAccountId] });
    },
    onError: (error: any, newMessage, context: any) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["/api/messages", activeConversation], context.previousMessages);
      }
      toast({
        title: "Error al enviar",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: async (data: { id: string; category?: string; priority?: string; status?: string; tags?: string[]; notes?: string }) => {
      return apiRequest("PATCH", `/api/conversations/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeAccountId] });
      toast({ title: "Conversacion actualizada" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      queryClient.refetchQueries({ queryKey: ["/api/conversations", activeAccountId] });
    }
  }, [messages.length, activeAccountId, queryClient]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages((message) => {
      if (message.type === "new_message") {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation] });
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeAccountId] });
      }
    });
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [activeConversation, activeAccountId]);

  const filteredConversations = useMemo(() => {
    let filtered = conversations?.filter((conv) => {
      if (conv.contactNumber === 'status' || conv.contactNumber.includes('broadcast')) return false;
      
      const matchesSearch = conv.contactName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        conv.contactNumber.includes(debouncedSearchQuery);
      
      const matchesCategory = categoryFilter === "all" || conv.category === categoryFilter;
      
      let matchesSmartFilter = true;
      if (activeFilter === "unread") {
        matchesSmartFilter = (conv.unreadCount || 0) > 0;
      } else if (activeFilter === "urgent") {
        matchesSmartFilter = conv.priority === "urgent" || conv.priority === "high";
      } else if (activeFilter === "recent") {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        matchesSmartFilter = conv.lastMessageTime ? new Date(conv.lastMessageTime) > hourAgo : false;
      }
      
      return matchesSearch && matchesCategory && matchesSmartFilter;
    });

    return filtered?.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    }) || [];
  }, [conversations, debouncedSearchQuery, categoryFilter, activeFilter]);

  const currentConversation = conversations?.find((c) => c.id === activeConversation);
  const currentAccount = accounts?.find((a) => a.id === activeAccountId);

  const totalConversations = conversations?.length || 0;
  const unreadCount = conversations?.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) || 0;
  const todayCount = conversations?.filter(c => {
    if (!c.lastMessageTime) return false;
    return new Date(c.lastMessageTime).toDateString() === new Date().toDateString();
  }).length || 0;
  const urgentCount = conversations?.filter(c => c.priority === "urgent" || c.priority === "high").length || 0;

  const smartFiltersWithCounts = SMART_FILTERS.map(f => ({
    ...f,
    count: f.id === "all" ? totalConversations :
           f.id === "unread" ? unreadCount :
           f.id === "urgent" ? urgentCount :
           f.id === "recent" ? todayCount : 0
  }));

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeAccountId || !currentConversation) return;
    sendMessageMutation.mutate({
      accountId: activeAccountId,
      toNumber: currentConversation.contactNumber,
      content: messageInput,
      isManual: true,
    });
  };

  const handleCreateClientOrLead = (type: "client" | "lead") => {
    if (!currentConversation) return;
    const [firstName = "", lastName = ""] = (currentConversation.contactName || "").split(" ");
    setCreateFormData({
      firstName,
      lastName,
      phone: currentConversation.contactNumber,
      email: "",
      notes: currentConversation.notes || "",
    });
    setWhatsappNumber("");
    setWhatsappCode("52");
    setShowCreateModal(type);
  };

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error creando cliente");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", userId] });
      toast({ title: "Cliente creado exitosamente" });
      setShowCreateModal(null);
      setCreateFormData({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error creando lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", userId] });
      toast({ title: "Lead creado exitosamente" });
      setShowCreateModal(null);
      setCreateFormData({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getFullWhatsAppNumber = (): string | null => {
    if (!whatsappNumber.trim()) return null;
    let cleanNumber = whatsappNumber.trim().replace(/\s+/g, '').replace(/[-()]/g, '').replace(/[@+]/g, '').replace(/\./g, '');
    const cleanCode = whatsappCode.trim().replace(/\D/g, '');
    if (!/^\d+$/.test(cleanNumber)) return null;
    const countryFormat = COUNTRY_CODES[cleanCode];
    if (!countryFormat) return null;
    if (countryFormat.prefix && cleanNumber.length === countryFormat.localDigits - countryFormat.prefix.length) {
      cleanNumber = countryFormat.prefix + cleanNumber;
    }
    if (cleanNumber.length < 8 || cleanNumber.length !== countryFormat.localDigits) return null;
    return `${cleanCode}${cleanNumber}`;
  };

  if (!userId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-6 py-5">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-between gap-6 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Centro de Conversaciones</h1>
                <p className="text-xs text-muted-foreground">Gestiona tus chats de WhatsApp en tiempo real</p>
              </div>
            </div>

            {accounts.length > 0 && (
              <div className="flex items-center gap-3">
                <Select value={activeAccountId || ""} onValueChange={setActiveAccountId}>
                  <SelectTrigger className="w-56 h-10 bg-muted/50 border-border/50" data-testid="select-account">
                    <SelectValue placeholder="Seleccionar cuenta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-medium">{account.deviceName}</span>
                          {account.phoneNumber && (
                            <code className="text-xs text-muted-foreground">{account.phoneNumber}</code>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10"
                      onClick={() => refetchConversations()}
                      data-testid="button-refresh-conversations"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Actualizar</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {activeAccountId && (
            <div className="grid grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-4 border border-blue-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalConversations}</p>
                    <p className="text-xs text-muted-foreground">Conversaciones</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl p-4 border border-orange-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
                    <p className="text-xs text-muted-foreground">Sin leer</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl p-4 border border-emerald-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{todayCount}</p>
                    <p className="text-xs text-muted-foreground">Activas hoy</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl p-4 border border-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{urgentCount}</p>
                    <p className="text-xs text-muted-foreground">Urgentes</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {!activeAccountId ? (
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageCircle className="w-10 h-10 text-primary/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sin cuentas conectadas</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Vincula una cuenta de WhatsApp en el modulo de Conexiones para empezar a gestionar tus conversaciones
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-96 border-r border-border bg-card flex flex-col"
          >
            <div className="p-4 space-y-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                  data-testid="input-search"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {smartFiltersWithCounts.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = activeFilter === filter.id;
                    return (
                      <Button
                        key={filter.id}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`flex-shrink-0 gap-1.5 h-8 text-xs ${isActive ? "" : "hover:bg-muted"}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {filter.label}
                        {filter.count > 0 && (
                          <Badge variant={isActive ? "secondary" : "outline"} className="h-5 min-w-5 px-1.5 text-[10px]">
                            {filter.count}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0">
                      <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="p-2">
                      <Label className="text-xs text-muted-foreground">Categoria</Label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-8 mt-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                <AnimatePresence mode="popLayout">
                  {conversationsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? "Sin resultados" : "No hay conversaciones"}
                      </p>
                    </motion.div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <ConversationCard
                        key={conversation.id}
                        conversation={conversation}
                        isActive={activeConversation === conversation.id}
                        onClick={() => {
                          setActiveConversation(conversation.id);
                          setShowProfilePanel(false);
                        }}
                        onArchive={() => updateConversationMutation.mutate({ id: conversation.id, status: "archived" })}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{filteredConversations.length} conversaciones</span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  En tiempo real
                </span>
              </div>
            </div>
          </motion.div>

          {activeConversation && currentConversation ? (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col min-w-0"
              >
                <div className="h-16 border-b border-border px-4 flex items-center justify-between bg-card flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(currentConversation.contactName || currentConversation.contactNumber)} text-white font-semibold`}>
                        {(currentConversation.contactName || currentConversation.contactNumber).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {currentConversation.contactName || currentConversation.contactNumber}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{currentConversation.contactNumber}</span>
                        {currentConversation.category && currentConversation.category !== "general" && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {currentConversation.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Llamar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={showProfilePanel ? "default" : "ghost"} 
                          size="icon" 
                          className="h-9 w-9"
                          onClick={() => setShowProfilePanel(!showProfilePanel)}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver perfil</TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCreateClientOrLead("client")}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Crear Cliente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCreateClientOrLead("lead")}>
                          <Users className="w-4 h-4 mr-2" />
                          Crear Lead
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Pin className="w-4 h-4 mr-2" />
                          Fijar conversacion
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="w-4 h-4 mr-2" />
                          Destacar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Archive className="w-4 h-4 mr-2" />
                          Archivar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <ScrollArea className="flex-1 bg-muted/20">
                  <div className="p-4 space-y-1 min-h-full">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-20">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                          <MessageCircle className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">Sin mensajes aun</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Envia el primer mensaje</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <ChatBubble
                          key={message.id}
                          message={message}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <QuickActionsBar
                  value={messageInput}
                  onChange={setMessageInput}
                  onSend={handleSendMessage}
                  isLoading={sendMessageMutation.isPending}
                  placeholder="Escribe un mensaje..."
                  contactName={currentConversation.contactName || undefined}
                />
              </motion.div>

              <AnimatePresence>
                {showProfilePanel && (
                  <ContactProfilePanel
                    conversation={currentConversation}
                    messages={messages}
                    onClose={() => setShowProfilePanel(false)}
                    onUpdateConversation={(data) => {
                      const cleanData: any = { id: currentConversation.id };
                      if (data.category) cleanData.category = data.category;
                      if (data.priority) cleanData.priority = data.priority;
                      if (data.status) cleanData.status = data.status;
                      if (data.tags) cleanData.tags = data.tags;
                      if (data.notes !== undefined) cleanData.notes = data.notes;
                      updateConversationMutation.mutate(cleanData);
                    }}
                    onCreateClient={() => handleCreateClientOrLead("client")}
                    onCreateLead={() => handleCreateClientOrLead("lead")}
                  />
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/10">
              <div className="text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-primary/10">
                  <MessageCircle className="w-12 h-12 text-primary/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Selecciona una conversacion</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Elige una conversacion de la lista para ver los mensajes y responder
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showCreateModal !== null} onOpenChange={() => setShowCreateModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Crear {showCreateModal === "client" ? "Cliente" : "Lead"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Nombre</Label>
                <Input
                  value={createFormData.firstName}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Apellido</Label>
                <Input
                  value={createFormData.lastName}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Telefono</Label>
              <div className="flex gap-2 mt-1">
                <Select value={whatsappCode} onValueChange={setWhatsappCode}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COUNTRY_CODES).map(([code, info]) => (
                      <SelectItem key={code} value={code}>+{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={whatsappNumber || createFormData.phone}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Numero"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={createFormData.email}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                type="email"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const fullNumber = getFullWhatsAppNumber() || createFormData.phone;
                if (showCreateModal === "client") {
                  createClientMutation.mutate({
                    firstName: createFormData.firstName,
                    lastName: createFormData.lastName,
                    phone: fullNumber,
                    email: createFormData.email || null,
                    userId,
                  });
                } else {
                  createLeadMutation.mutate({
                    firstName: createFormData.firstName,
                    lastName: createFormData.lastName,
                    phone: fullNumber,
                    email: createFormData.email || null,
                    userId,
                    source: "whatsapp",
                    status: "new",
                  });
                }
              }}
              disabled={createClientMutation.isPending || createLeadMutation.isPending}
            >
              {(createClientMutation.isPending || createLeadMutation.isPending) ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
