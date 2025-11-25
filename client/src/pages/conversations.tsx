import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Send, MoreVertical, MessageCircle, Plus, X, Flag, Tag, Archive, Trash2, AlertCircle, TrendingUp, Clock, User, Activity, Users, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessage } from "@/components/chat-message";
import { StatusBadge } from "@/components/status-badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { subscribeToMessages } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/lib/debounce";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Conversation, Message, WhatsappAccount } from "@shared/schema";

interface CountryFormat {
  code: string;
  name: string;
  localDigits: number;
  prefix?: string;
}

const COUNTRY_CODES: Record<string, CountryFormat> = {
  "52": { code: "52", name: "México 🇲🇽", localDigits: 11, prefix: "1" },
  "1": { code: "1", name: "USA/Canadá 🇺🇸", localDigits: 10 },
  "34": { code: "34", name: "España 🇪🇸", localDigits: 9 },
  "55": { code: "55", name: "Brasil 🇧🇷", localDigits: 11 },
  "54": { code: "54", name: "Argentina 🇦🇷", localDigits: 10 },
  "57": { code: "57", name: "Colombia 🇨🇴", localDigits: 10 },
  "56": { code: "56", name: "Chile 🇨🇱", localDigits: 9 },
  "51": { code: "51", name: "Perú 🇵🇪", localDigits: 9 },
  "58": { code: "58", name: "Venezuela 🇻🇪", localDigits: 10 },
  "502": { code: "502", name: "Guatemala 🇬🇹", localDigits: 8 },
  "503": { code: "503", name: "El Salvador 🇸🇻", localDigits: 8 },
  "504": { code: "504", name: "Honduras 🇭🇳", localDigits: 8 },
  "505": { code: "505", name: "Nicaragua 🇳🇮", localDigits: 8 },
  "506": { code: "506", name: "Costa Rica 🇨🇷", localDigits: 8 },
  "507": { code: "507", name: "Panamá 🇵🇦", localDigits: 8 },
};

const CATEGORIES = [
  { value: "general", label: "General", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
  { value: "sales", label: "Ventas", color: "bg-green-500/20 text-green-600 dark:text-green-400" },
  { value: "support", label: "Soporte", color: "bg-purple-500/20 text-purple-600 dark:text-purple-400" },
  { value: "vip", label: "VIP", color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" },
  { value: "other", label: "Otro", color: "bg-gray-500/20 text-gray-600 dark:text-gray-400" },
];

const PRIORITIES = [
  { value: "low", label: "Baja", icon: "▼", color: "text-blue-500" },
  { value: "normal", label: "Normal", icon: "→", color: "text-gray-500" },
  { value: "high", label: "Alta", icon: "▲", color: "text-orange-500" },
  { value: "urgent", label: "Urgente", icon: "‼", color: "text-red-500" },
];

const CONV_STATUSES = [
  { value: "active", label: "Activa" },
  { value: "archived", label: "Archivada" },
  { value: "spam", label: "Spam" },
  { value: "blocked", label: "Bloqueada" },
];

const COMMON_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
  "👋", "👍", "👎", "🙌", "👏", "🤝", "❤️", "🔥",
  "✨", "💯", "🎉", "🚀", "👌", "💪", "🤔", "😍",
  "😢", "😭", "😤", "😡", "🙏", "💔", "⭐", "☀️",
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

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [tagInput, setTagInput] = useState("");
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState<"client" | "lead" | null>(null);
  const [createFormData, setCreateFormData] = useState({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
  const [whatsappCode, setWhatsappCode] = useState("52");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappValidation, setWhatsappValidation] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contactFromUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
    // Capture URL contact param on mount
    const params = new URLSearchParams(window.location.search);
    contactFromUrlRef.current = params.get('contact');
  }, []);

  const { data: conversations = [] } = useQuery<Conversation[]>({
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

  // Handle contact parameter from URL (when navigating from sales funnel)
  useEffect(() => {
    if (contactFromUrlRef.current && conversations.length > 0 && !activeConversation) {
      const conv = conversations.find(c => c.contactNumber === contactFromUrlRef.current);
      if (conv) {
        setActiveConversation(conv.id);
        // Clear the URL parameter
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

  // Filter only connected and active accounts
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
      // Cancel any in-flight queries
      await queryClient.cancelQueries({ queryKey: ["/api/messages", activeConversation] });
      
      // Get previous data
      const previousMessages = queryClient.getQueryData<Message[]>(["/api/messages", activeConversation]) || [];
      
      // Create optimistic message
      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}`,
        conversationId: activeConversation || "",
        content: newMessage.content,
        sender: "user",
        timestamp: new Date().toISOString(),
        status: "sending",
        metadata: { isManual: true }
      } as unknown as Message;
      
      // Update cache immediately with optimistic message
      queryClient.setQueryData(["/api/messages", activeConversation], [...previousMessages, optimisticMessage]);
      
      return { previousMessages, optimisticMessage };
    },
    onSuccess: () => {
      setMessageInput("");
      // Invalidate cache to force immediate refresh
      queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeAccountId] });
    },
    onError: (error: any, newMessage, context: any) => {
      // Rollback optimistic update
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
      toast({
        title: "Éxito",
        description: "Conversación actualizada",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la conversación",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Refetch conversations immediately when messages change to keep lastMessageText in sync
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
    return conversations?.filter((conv) => {
      if (conv.contactNumber === 'status' || conv.contactNumber.includes('broadcast')) return false;
      
      const matchesSearch = conv.contactName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        conv.contactNumber.includes(debouncedSearchQuery);
      
      const matchesCategory = filterCategory === "all" || conv.category === filterCategory;
      const matchesPriority = filterPriority === "all" || conv.priority === filterPriority;
      const matchesStatus = filterStatus === "all" || conv.status === filterStatus;
      
      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    })?.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    }) || [];
  }, [conversations, debouncedSearchQuery, filterCategory, filterPriority, filterStatus]);

  const currentConversation = conversations?.find((c) => c.id === activeConversation);
  const currentAccount = accounts?.find((a) => a.id === activeAccountId);

  // Calculate metrics
  const totalConversations = conversations?.length || 0;
  const unreadCount = conversations?.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) || 0;
  const todayMessageCount = conversations?.reduce((sum, conv) => {
    const lastMessageTime = conv.lastMessageTime ? new Date(conv.lastMessageTime) : null;
    if (!lastMessageTime) return sum;
    const today = new Date();
    return lastMessageTime.toDateString() === today.toDateString() ? sum + 1 : sum;
  }, 0) || 0;
  const activeConversationCount = conversations?.filter(c => c.status === 'active')?.length || 0;

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeAccountId || !currentConversation) {
      console.warn('Cannot send message:', { messageInput: messageInput.trim(), activeAccountId, currentConversation });
      return;
    }
    sendMessageMutation.mutate({
      accountId: activeAccountId,
      toNumber: currentConversation.contactNumber,
      content: messageInput,
      isManual: true,
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && currentConversation) {
      const newTags = [...(currentConversation.tags || []), tagInput.trim()];
      updateConversationMutation.mutate({
        id: currentConversation.id,
        tags: newTags,
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (currentConversation) {
      const newTags = (currentConversation.tags || []).filter(t => t !== tag);
      updateConversationMutation.mutate({
        id: currentConversation.id,
        tags: newTags,
      });
    }
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

  const validateWhatsAppNumber = (number: string): boolean => {
    if (!number) return false;
    const cleaned = number.trim().replace(/\s+/g, '');
    return /^\d{10,}$/.test(cleaned);
  };

  const getFullWhatsAppNumber = (): string | null => {
    if (!whatsappNumber.trim()) return null;
    
    let cleanNumber = whatsappNumber
      .trim()
      .replace(/\s+/g, '')
      .replace(/[-()]/g, '')
      .replace(/[@+]/g, '')
      .replace(/\./g, '');
    
    const cleanCode = whatsappCode.trim().replace(/\D/g, '');
    
    if (!/^\d+$/.test(cleanNumber)) {
      return null;
    }
    
    const countryFormat = COUNTRY_CODES[cleanCode];
    if (!countryFormat) {
      return null;
    }
    
    const expectedLocalDigits = countryFormat.localDigits;
    const prefix = countryFormat.prefix;
    
    if (prefix && cleanNumber.length === expectedLocalDigits - prefix.length) {
      cleanNumber = prefix + cleanNumber;
    }
    
    if (cleanNumber.length < 8) {
      return null;
    }
    
    if (cleanNumber.length !== expectedLocalDigits) {
      return null;
    }
    
    return `${cleanCode}${cleanNumber}`;
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
    setWhatsappValidation(null);
    setShowCreateModal(type);
  };

  if (!userId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-1 flex-col bg-background min-h-0 h-full">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Account Selector */}
          <div className="flex items-center justify-between gap-8 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Conversaciones CRM</h1>
                <p className="text-xs text-muted-foreground/80">Gestiona y responde tus chats en tiempo real</p>
              </div>
            </div>

            {/* Account Selector Banner */}
            <div className="flex items-center gap-3 bg-muted/40 px-4 py-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <Select value={activeAccountId || ""} onValueChange={setActiveAccountId}>
                  <SelectTrigger className="h-9 text-xs border-0 bg-transparent font-medium w-52" data-testid="select-whatsapp-account">
                    <SelectValue placeholder="Seleccionar cuenta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{account.deviceName}</span>
                          {account.phoneNumber && (
                            <code className="text-xs bg-muted px-2 py-0.5 rounded">{account.phoneNumber}</code>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {currentAccount && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-border/50">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {currentAccount.status === 'connected' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metrics Row */}
          {activeAccountId && (
            <div className="grid grid-cols-4 gap-3">
              {/* Total Conversations */}
              <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                </div>
                <p className="text-xl font-bold text-foreground">{totalConversations}</p>
              </div>

              {/* Unread Count */}
              <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-orange-500" />
                  <p className="text-xs text-muted-foreground font-medium">Sin leer</p>
                </div>
                <p className="text-xl font-bold text-foreground">{unreadCount}</p>
              </div>

              {/* Today Messages */}
              <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-green-500" />
                  <p className="text-xs text-muted-foreground font-medium">Hoy</p>
                </div>
                <p className="text-xl font-bold text-foreground">{todayMessageCount}</p>
              </div>

              {/* Active Conversations */}
              <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                  <p className="text-xs text-muted-foreground font-medium">Activas</p>
                </div>
                <p className="text-xl font-bold text-foreground">{activeConversationCount}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!activeAccountId ? (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No hay cuentas disponibles</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Vincula una cuenta de WhatsApp en Conexiones para empezar a ver tus conversaciones
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Conversations List */}
          <div className="w-1/4 min-w-64 border-r border-border flex flex-col overflow-hidden min-h-0">
            <div className="p-3 border-b border-border space-y-2 flex-shrink-0 bg-muted/30">
              <h2 className="text-sm font-semibold text-foreground">Conversaciones</h2>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input autoComplete="off"
                  placeholder="Buscar contacto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-7 text-xs"
                  data-testid="input-search-conversations"
                />
              </div>

              {/* Filters - Grid */}
              <div className="grid grid-cols-3 gap-1.5">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-7 text-xs" data-testid="select-filter-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="h-7 text-xs" data-testid="select-filter-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-7 text-xs" data-testid="select-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {CONV_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    {conversations.length === 0 ? "No hay conversaciones" : "Sin resultados"}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {filteredConversations.map((conversation) => {
                    const category = CATEGORIES.find(c => c.value === conversation.category);
                    const priority = PRIORITIES.find(p => p.value === conversation.priority);
                    
                    // Determine urgency badge based on response time
                    let urgencyBadge = null;
                    const lastMessageTime = conversation.lastMessageTime ? new Date(conversation.lastMessageTime) : new Date();
                    const now = new Date();
                    const hoursAgo = Math.floor((now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60));
                    
                    if (hoursAgo > 24) {
                      urgencyBadge = { text: "Urgente", variant: "destructive" };
                    } else if (hoursAgo > 12) {
                      urgencyBadge = { text: "Alta", variant: "outline" };
                    } else if (hoursAgo > 4) {
                      urgencyBadge = { text: "Normal", variant: "outline" };
                    } else if (hoursAgo > 0) {
                      urgencyBadge = { text: "Reciente", variant: "outline" };
                    }
                    
                    const avatarColor = getAvatarColor(conversation.contactName || conversation.contactNumber);
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          setActiveConversation(conversation.id);
                          setShowDetailsPanel(true);
                        }}
                        className={`px-3.5 py-3 rounded-lg border cursor-pointer transition-all text-xs ${
                          activeConversation === conversation.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                        data-testid={`conversation-item-${conversation.id}`}
                      >
                        <div className="flex items-start gap-3 mb-2.5">
                          <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-offset-1 ring-offset-background ring-border">
                            <AvatarFallback className={`text-sm font-bold ${avatarColor}`}>
                              {conversation.contactName?.substring(0, 2).toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-xs text-foreground truncate leading-tight">
                              {conversation.contactName || conversation.contactNumber}
                            </h3>
                            <p className="text-xs text-muted-foreground/80 truncate leading-tight mt-0.5">
                              {conversation.lastMessageText || "Sin mensajes"}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge className="text-xs h-5 px-1.5 flex-shrink-0 bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          {category && (
                            <Badge variant="secondary" className={`text-xs h-5 ${category.color}`}>
                              {category.label}
                            </Badge>
                          )}
                          {priority && (
                            <Badge variant="outline" className={`text-xs h-5 px-2 ${priority.color}`}>
                              {priority.label}
                            </Badge>
                          )}
                          {urgencyBadge && (
                            <Badge 
                              variant={urgencyBadge.variant as any} 
                              className="text-xs h-5"
                              data-testid={`badge-urgency-${conversation.id}`}
                            >
                              {urgencyBadge.text}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {activeConversation ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Chat Header */}
              <div className="h-11 border-b border-border px-4 flex items-center justify-between bg-card flex-shrink-0">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-9 w-9 ring-2 ring-offset-1 ring-offset-background ring-border">
                    <AvatarFallback className={`text-xs font-bold ${currentConversation ? getAvatarColor(currentConversation.contactName || currentConversation.contactNumber) : "bg-primary/20"}`}>
                      {currentConversation?.contactName?.substring(0, 2).toUpperCase() || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{currentConversation?.contactName || "Chat"}</h3>
                    <p className="text-xs text-muted-foreground">{currentConversation?.contactNumber}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                  data-testid="button-toggle-details"
                  className="h-8 w-8"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar min-h-0">
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Details Panel */}
                {showDetailsPanel && currentConversation && (
                  <div className="w-64 border-l border-border flex flex-col bg-muted/20 p-3 min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                      <h3 className="font-semibold text-sm">Detalles</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDetailsPanel(false)}
                        className="h-7 w-7"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="space-y-3 pr-3">
                        {/* Category */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Categoría</label>
                          <Select
                            value={currentConversation.category || "general"}
                            onValueChange={(value) =>
                              updateConversationMutation.mutate({
                                id: currentConversation.id,
                                category: value as any,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs" data-testid="select-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Prioridad</label>
                          <Select
                            value={currentConversation.priority || "normal"}
                            onValueChange={(value) =>
                              updateConversationMutation.mutate({
                                id: currentConversation.id,
                                priority: value as any,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs" data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITIES.map(p => (
                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Status */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Estado</label>
                          <Select
                            value={currentConversation.status || "active"}
                            onValueChange={(value) =>
                              updateConversationMutation.mutate({
                                id: currentConversation.id,
                                status: value as any,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs" data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONV_STATUSES.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Etiquetas</label>
                          <div className="space-y-1.5">
                            <div className="flex gap-1">
                              <Input autoComplete="off"
                                placeholder="Nueva etiqueta..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTag();
                                  }
                                }}
                                className="h-7 text-xs"
                                data-testid="input-tag"
                              />
                              <Button
                                size="icon"
                                onClick={handleAddTag}
                                className="h-7 w-7"
                                data-testid="button-add-tag"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            {(currentConversation.tags || []).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {currentConversation.tags?.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs gap-1">
                                    {tag}
                                    <button
                                      onClick={() => handleRemoveTag(tag)}
                                      className="ml-1"
                                      data-testid={`button-remove-tag-${tag}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Notas</label>
                          <textarea
                            value={currentConversation.notes || ""}
                            onChange={(e) => {
                              const timeout = setTimeout(() => {
                                updateConversationMutation.mutate({
                                  id: currentConversation.id,
                                  notes: e.target.value,
                                });
                              }, 500);
                              return () => clearTimeout(timeout);
                            }}
                            placeholder="Notas..."
                            className="w-full h-16 text-xs p-2 rounded-md border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            data-testid="textarea-notes"
                          />
                        </div>

                        {/* Create Client/Lead Buttons */}
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleCreateClientOrLead("client")}
                            className="w-full h-7 text-xs gap-2"
                            variant="outline"
                            data-testid="button-create-client"
                          >
                            <Plus className="w-3 h-3" />
                            Crear Cliente
                          </Button>
                          <Button
                            onClick={() => handleCreateClientOrLead("lead")}
                            className="w-full h-7 text-xs gap-2"
                            variant="outline"
                            data-testid="button-create-lead"
                          >
                            <Users className="w-3 h-3" />
                            Crear Lead
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-border px-3 py-2 flex items-end gap-2 bg-card flex-shrink-0">
                <Textarea
                  placeholder="Escribe tu mensaje aquí"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !sendMessageMutation.isPending) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-message"
                  className="h-9 text-xs resize-none max-h-32 p-2"
                  rows={1}
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="true"
                />
                
                {/* Emoji Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 flex-shrink-0"
                      data-testid="button-emoji-picker"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="end">
                    <div className="grid grid-cols-8 gap-1">
                      {COMMON_EMOJIS.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg hover:bg-muted"
                          onClick={() => {
                            setMessageInput(messageInput + emoji);
                          }}
                          data-testid={`button-emoji-${index}`}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  data-testid="button-send"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 relative"
                >
                  {sendMessageMutation.isPending ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center min-h-0">
              <div>
                <p className="text-muted-foreground">Selecciona una conversación para comenzar</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Client/Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm max-h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-semibold">
                {showCreateModal === "client" ? "Crear Cliente" : "Crear Lead"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateModal(null)}
                className="h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2.5">
              <div className="space-y-2">
                <div>
                  <Label htmlFor="firstName" className="text-xs font-semibold">Nombre</Label>
                  <Input autoComplete="off"
                    id="firstName"
                    placeholder="Nombre"
                    value={createFormData.firstName}
                    onChange={(e) => setCreateFormData({...createFormData, firstName: e.target.value})}
                    className="mt-1 h-8 text-xs"
                    data-testid="input-create-first-name"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-xs font-semibold">Apellido</Label>
                  <Input autoComplete="off"
                    id="lastName"
                    placeholder="Apellido"
                    value={createFormData.lastName}
                    onChange={(e) => setCreateFormData({...createFormData, lastName: e.target.value})}
                    className="mt-1 h-8 text-xs"
                    data-testid="input-create-last-name"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">WhatsApp</Label>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <Select value={whatsappCode} onValueChange={setWhatsappCode}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COUNTRY_CODES).map(([code, format]) => (
                          <SelectItem key={code} value={code} className="text-xs">
                            {format.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input autoComplete="off"
                      value={whatsappNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setWhatsappNumber(value);
                        if (value) {
                          setWhatsappValidation(validateWhatsAppNumber(value) ? "valid" : "invalid");
                        } else {
                          setWhatsappValidation(null);
                        }
                      }}
                      placeholder="Número"
                      className="col-span-2 h-8 text-xs"
                    />
                  </div>
                  {whatsappValidation === "invalid" && (
                    <p className="text-xs text-destructive mt-0.5">Número inválido</p>
                  )}
                  {whatsappValidation === "valid" && (
                    <p className="text-xs text-green-500 mt-0.5">✓ Válido</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                  <Input autoComplete="off"
                    id="email"
                    placeholder="Email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                    className="mt-1 h-8 text-xs"
                    data-testid="input-create-email"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-xs font-semibold">Notas</Label>
                  <Textarea autoComplete="off"
                    id="notes"
                    placeholder="Notas..."
                    value={createFormData.notes}
                    onChange={(e) => setCreateFormData({...createFormData, notes: e.target.value})}
                    className="mt-1 resize-none text-xs"
                    rows={2}
                    data-testid="textarea-create-notes"
                  />
                </div>
              </div>
            </div>

            <div className="px-3 py-2.5 border-t border-border flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(null)}
                className="flex-1 h-8 text-xs"
                data-testid="button-cancel-create"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const fullWhatsApp = getFullWhatsAppNumber();
                  if (!fullWhatsApp) {
                    toast({ title: "Error", description: "Número de WhatsApp inválido", variant: "destructive" });
                    return;
                  }

                  if (showCreateModal === "client") {
                    createClientMutation.mutate({
                      userId,
                      firstName: createFormData.firstName,
                      lastName: createFormData.lastName,
                      phone: fullWhatsApp,
                      email: createFormData.email,
                      notes: createFormData.notes,
                      status: "active",
                    });
                  } else {
                    createLeadMutation.mutate({
                      userId,
                      firstName: createFormData.firstName,
                      lastName: createFormData.lastName,
                      phone: fullWhatsApp,
                      email: createFormData.email,
                      notes: createFormData.notes,
                      status: "new",
                      source: "whatsapp",
                    });
                  }
                }}
                disabled={createClientMutation.isPending || createLeadMutation.isPending}
                className="flex-1 h-8 text-xs"
                data-testid="button-save-create"
              >
                {createClientMutation.isPending || createLeadMutation.isPending ? "Creando..." : "Crear"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
