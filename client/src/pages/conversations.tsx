import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
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
  { id: "pinned", label: "Fijados", icon: Pin, count: 0 },
  { id: "archived", label: "Archivados", icon: Archive, count: 0 },
  { id: "unread", label: "Sin leer", icon: Bell, count: 0 },
  { id: "starred", label: "Destacados", icon: Star, count: 0 },
  { id: "urgent", label: "Urgentes", icon: AlertCircle, count: 0 },
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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

  // Auto-sync conversations when account is selected
  useEffect(() => {
    const syncConversations = async () => {
      if (!activeAccountId) return;
      try {
        console.log(`[AUTO-SYNC] Sincronizando conversaciones para cuenta ${activeAccountId}`);
        const response = await fetch(`/api/conversations/sync/${activeAccountId}`, { method: "POST" });
        if (response.ok) {
          const data = await response.json();
          console.log(`[AUTO-SYNC] Sincronizadas ${data.createdCount} nuevas conversaciones`);
          await refetchConversations();
        }
      } catch (error) {
        console.error('[AUTO-SYNC] Error:', error);
      }
    };
    
    syncConversations();
  }, [activeAccountId]);

  // Listen for WebSocket sync events
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: any) => {
      if (message.type === 'conversations_synced' && message.accountId === activeAccountId) {
        console.log('Conversaciones sincronizadas desde WebSocket');
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeAccountId] });
      }
    });
    return () => {
      unsubscribe?.();
    };
  }, [activeAccountId]);

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
    staleTime: 5000,
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

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest("PATCH", `/api/conversations/${conversationId}`, { unreadCount: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeAccountId] });
    },
    onError: (error: any) => {
      console.error("Error marking as read:", error);
    },
  });

  const sendMediaMutation = useMutation({
    mutationFn: async (data: { accountId: string; toNumber: string; files: File[]; caption?: string }) => {
      const formData = new FormData();
      formData.append("accountId", data.accountId);
      formData.append("toNumber", data.toNumber);
      if (data.caption) formData.append("caption", data.caption);
      data.files.forEach((file) => formData.append("files", file));
      
      const response = await fetch("/api/messages/media", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error enviando archivos");
      }
      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeAccountId] });
      toast({ title: "Archivos enviados" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar",
        description: error.message || "No se pudieron enviar los archivos",
        variant: "destructive",
      });
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: async (data: { id: string; category?: string; priority?: string; status?: string; tags?: string[]; notes?: string; isPinned?: boolean; isStarred?: boolean }) => {
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
      if (activeFilter === "all") {
        matchesSmartFilter = true; // Show all conversations
      } else if (activeFilter === "unread") {
        matchesSmartFilter = (conv.unreadCount || 0) > 0;
      } else if (activeFilter === "pinned") {
        matchesSmartFilter = conv.isPinned === true;
      } else if (activeFilter === "starred") {
        matchesSmartFilter = conv.isStarred === true;
      } else if (activeFilter === "urgent") {
        matchesSmartFilter = (conv.priority === "urgent" || conv.priority === "high");
      } else if (activeFilter === "archived") {
        matchesSmartFilter = conv.status === "archived";
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

  const activeConversations = conversations?.filter(c => c.status !== "archived") || [];
  const totalConversations = activeConversations.length;
  const unreadCount = activeConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  const pinnedCount = conversations?.filter(c => c.isPinned === true).length || 0;
  const starredCount = conversations?.filter(c => c.isStarred === true).length || 0;
  const urgentCount = activeConversations.filter(c => c.priority === "urgent" || c.priority === "high").length;
  const archivedCount = conversations?.filter(c => c.status === "archived").length || 0;
  const recentCount = activeConversations.filter(c => {
    if (!c.lastMessageTime) return false;
    return new Date(c.lastMessageTime).toDateString() === new Date().toDateString();
  }).length || 0;

  const smartFiltersWithCounts = SMART_FILTERS.map(f => ({
    ...f,
    count: f.id === "all" ? totalConversations :
           f.id === "unread" ? unreadCount :
           f.id === "pinned" ? pinnedCount :
           f.id === "starred" ? starredCount :
           f.id === "urgent" ? urgentCount :
           f.id === "archived" ? archivedCount :
           f.id === "recent" ? recentCount : 0
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

  const handleSendWithFiles = (files: File[], caption?: string) => {
    if (!activeAccountId || !currentConversation || files.length === 0) return;
    sendMediaMutation.mutate({
      accountId: activeAccountId,
      toNumber: currentConversation.contactNumber,
      files,
      caption,
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
      <div className="flex-shrink-0 border-b border-border/50 sticky top-0 z-10 px-6 py-3 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-md bg-purple-600/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Centro de Conversaciones</h1>
              <p className="text-xs text-muted-foreground">Gestiona los miembros de tu equipo</p>
            </div>
          </div>

          {accounts.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={activeAccountId || ""} onValueChange={setActiveAccountId}>
                <SelectTrigger 
                  className="w-60 h-9 px-2 border border-border/50 bg-muted/50 hover:bg-muted/60 hover-elevate rounded-lg shadow-sm" 
                  data-testid="select-account"
                >
                  {activeAccountId ? (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex-shrink-0">
                        <div className="w-0.5 h-0.5 rounded-full bg-emerald-500" />
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {accounts.find(a => a.id === activeAccountId)?.deviceName || "Seleccionar"}
                        </span>
                        <span className="text-[9px] text-muted-foreground truncate font-mono">
                          {accounts.find(a => a.id === activeAccountId)?.phoneNumber}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <SelectValue placeholder="Seleccionar cuenta..." />
                  )}
                </SelectTrigger>
                <SelectContent className="w-64 bg-card/95 border-border/50 rounded-lg shadow-lg">
                  {accounts.map((account) => (
                    <SelectItem 
                      key={account.id} 
                      value={account.id}
                      className="p-0 rounded-md mx-0.5 my-0.5 flex"
                    >
                      <div className="flex items-center gap-1.5 w-full py-1.5 px-2 rounded-md">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border border-emerald-500/40 flex-shrink-0">
                          <div className="w-0.5 h-0.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">
                              {account.deviceName}
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0 whitespace-nowrap">
                              <span className="w-0.5 h-0.5 rounded-full bg-emerald-400" />
                              Conectado
                            </span>
                          </div>
                          <code className="text-[8px] text-muted-foreground font-mono">
                            {account.phoneNumber}
                          </code>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isRefreshing || !activeAccountId}
                onClick={async () => {
                  if (!activeAccountId) return;
                  setIsRefreshing(true);
                  try {
                    toast({ title: "Sincronizando...", description: "Obteniendo conversaciones del dispositivo..." });
                    const response = await fetch(`/api/conversations/sync/${activeAccountId}`, { method: "POST" });
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || "Error sincronizando");
                    }
                    const data = await response.json();
                    toast({ 
                      title: "Sincronización completada", 
                      description: `${data.createdCount} nuevas conversaciones, ${data.totalConversations} total` 
                    });
                    // Wait a moment for the data to be ready then refetch
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await refetchConversations();
                  } catch (error: any) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                data-testid="button-sync-conversations"
                title="Sincronizar conversaciones con WhatsApp"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {!activeAccountId ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-xs border-border/50 bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-6 px-5 text-center">
              <div className="w-12 h-12 rounded-lg bg-purple-600/15 flex items-center justify-center mb-3 border border-purple-600/20">
                <MessageCircle className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Sin cuentas conectadas</h3>
              <p className="text-xs text-muted-foreground/80 mb-4 leading-relaxed">
                Vincula una cuenta de WhatsApp en Conexiones para gestionar conversaciones
              </p>
              <Button 
                size="sm" 
                className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={() => setLocation('/connections')}
              >
                Ir a Conexiones
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 border-r border-border bg-card flex flex-col"
          >
            <div className="p-2 space-y-1.5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="relative flex items-center flex-1">
                  <Search className="absolute left-2.5 w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 pr-7 h-7 w-full text-xs rounded-lg"
                    data-testid="input-search"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0.5 h-5 w-5 flex-shrink-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  )}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={activeFilter === "pinned" ? "default" : "ghost"}
                      size="icon" 
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => setActiveFilter("pinned")}
                      data-testid="button-filter-pinned"
                    >
                      <Pin className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Fijados</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={activeFilter === "archived" ? "default" : "ghost"}
                      size="icon" 
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => setActiveFilter("archived")}
                      data-testid="button-filter-archived"
                    >
                      <Archive className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Archivados</TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-1.5">
                <div className="w-full flex gap-0.5 overflow-x-auto pb-1 scrollbar-thin">
                  {smartFiltersWithCounts.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = activeFilter === filter.id;
                    return (
                      <Button
                        key={filter.id}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`flex-shrink-0 gap-0.5 h-7 text-[11px] px-2 ${isActive ? "" : "hover:bg-muted"}`}
                        data-testid={`button-filter-${filter.id}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{filter.label}</span>
                        {filter.count > 0 && (
                          <Badge variant={isActive ? "secondary" : "outline"} className="h-3.5 min-w-3.5 px-0.5 text-[6px] font-semibold flex items-center justify-center">
                            {filter.count}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>

                <div className="w-full flex gap-0.5 overflow-x-auto pb-1 scrollbar-thin">
                  {CATEGORIES.map(cat => {
                    const isActive = categoryFilter === cat.value;
                    return (
                      <Button
                        key={cat.value}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCategoryFilter(cat.value)}
                        className="flex-shrink-0 gap-0.5 h-7 text-[11px] px-2"
                        data-testid={`button-category-${cat.value}`}
                      >
                        {cat.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1.5">
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
                          // Marcar como leído cuando se abre la conversación
                          if (conversation.unreadCount > 0) {
                            markAsReadMutation.mutate(conversation.id);
                          }
                        }}
                        onUpdateStatus={(status) => {
                          updateConversationMutation.mutate({ id: conversation.id, status });
                          if (status === "archived" && activeConversation === conversation.id) {
                            setActiveConversation(null);
                          }
                        }}
                        onPin={() => {
                          updateConversationMutation.mutate({ 
                            id: conversation.id, 
                            isPinned: !conversation.isPinned 
                          });
                        }}
                        onStar={() => {
                          updateConversationMutation.mutate({ 
                            id: conversation.id, 
                            isStarred: !conversation.isStarred 
                          });
                        }}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            <div className="p-2.5 border-t border-border/50 bg-muted/20">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-medium">{filteredConversations.length}</span>
                <span className="flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5" />
                  En vivo
                </span>
              </div>
            </div>
          </motion.div>

          {activeConversation && currentConversation ? (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col min-w-0 overflow-hidden"
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
                        <DropdownMenuItem onClick={() => updateConversationMutation.mutate({ 
                          id: currentConversation.id, 
                          isPinned: !currentConversation.isPinned 
                        })}>
                          <Pin className={`w-4 h-4 mr-2 ${currentConversation.isPinned ? "text-primary" : ""}`} />
                          {currentConversation.isPinned ? "Desfijar" : "Fijar conversacion"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateConversationMutation.mutate({ 
                          id: currentConversation.id, 
                          isStarred: !currentConversation.isStarred 
                        })}>
                          <Star className={`w-4 h-4 mr-2 ${currentConversation.isStarred ? "text-yellow-500 fill-yellow-500" : ""}`} />
                          {currentConversation.isStarred ? "Quitar destacado" : "Destacar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          const newStatus = currentConversation.status === "archived" ? "active" : "archived";
                          updateConversationMutation.mutate({ id: currentConversation.id, status: newStatus });
                          if (newStatus === "archived") {
                            setActiveConversation(null);
                            toast({ title: "Conversacion archivada" });
                          } else {
                            toast({ title: "Conversacion restaurada" });
                          }
                        }}>
                          <Archive className={`w-4 h-4 mr-2 ${currentConversation.status === "archived" ? "text-primary" : ""}`} />
                          {currentConversation.status === "archived" ? "Restaurar" : "Archivar"}
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
                  onSendWithFiles={handleSendWithFiles}
                  isLoading={sendMessageMutation.isPending || sendMediaMutation.isPending}
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-3 border border-primary/10">
                  <MessageCircle className="w-7 h-7 text-primary/40" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Selecciona una conversacion</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Elige una conversacion de la lista
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showCreateModal !== null} onOpenChange={() => setShowCreateModal(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/90 to-primary/70 px-6 py-3 text-white">
            <h2 className="text-sm font-bold mb-0.5">
              Crear {showCreateModal === "client" ? "Cliente" : "Lead"}
            </h2>
            <p className="text-xs text-white/80 leading-tight">
              {currentConversation?.contactName || currentConversation?.contactNumber}
            </p>
          </div>
          <div className="space-y-4">
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
          <DialogFooter className="px-6 pb-6">
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
