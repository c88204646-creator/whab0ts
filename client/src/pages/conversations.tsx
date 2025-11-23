import { useState, useEffect, useRef } from "react";
import { Search, Send, MoreVertical, MessageCircle, Plus, X, Flag, Tag, Archive, Trash2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessage } from "@/components/chat-message";
import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { subscribeToMessages } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Conversation, Message, WhatsappAccount } from "@shared/schema";

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

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [tagInput, setTagInput] = useState("");
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: accounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", "userId", userId],
    enabled: !!userId,
    retry: 1,
  });

  useEffect(() => {
    if (accounts.length > 0 && !activeAccountId) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", "accountId", activeAccountId],
    enabled: !!activeAccountId,
    refetchInterval: 2000,
    staleTime: 0,
    retry: 1,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeConversation],
    enabled: !!activeConversation,
    retry: 1,
    staleTime: 0,
    refetchInterval: 500,
    queryFn: async () => {
      if (!activeConversation) return [];
      const response = await fetch(`/api/messages/${activeConversation}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { accountId: string; toNumber: string; content: string }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", "accountId", activeAccountId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
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
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", "accountId", activeAccountId] });
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

  useEffect(() => {
    const unsubscribe = subscribeToMessages((message) => {
      if (message.type === "new_message") {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation] });
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", "accountId", activeAccountId] });
      }
    });
    return unsubscribe;
  }, [activeConversation, activeAccountId]);

  const filteredConversations = conversations?.filter((conv) => {
    if (conv.contactNumber === 'status' || conv.contactNumber.includes('broadcast')) return false;
    
    const matchesSearch = conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactNumber.includes(searchQuery);
    
    const matchesCategory = filterCategory === "all" || conv.category === filterCategory;
    const matchesPriority = filterPriority === "all" || conv.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || conv.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  }) || [];

  const currentConversation = conversations?.find((c) => c.id === activeConversation);
  const currentAccount = accounts?.find((a) => a.id === activeAccountId);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeAccountId || !currentConversation) return;
    sendMessageMutation.mutate({
      accountId: activeAccountId,
      toNumber: currentConversation.contactNumber,
      content: messageInput,
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

  if (!userId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-1 flex-col bg-background min-h-0 h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground">Conversaciones CRM</h1>
              <p className="text-xs text-muted-foreground/70">Gestiona tus chats</p>
            </div>
          </div>

          <div className="relative max-w-xs flex-shrink-0">
            <Select value={activeAccountId || ""} onValueChange={setActiveAccountId}>
              <SelectTrigger className="h-8 text-xs w-56" data-testid="select-whatsapp-account">
                <SelectValue placeholder="Cargando cuentas..." />
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
        </div>
      </div>

      {/* Status Badge */}
      {currentAccount && (
        <div className="px-4 py-1.5 border-b border-border bg-card/50 flex items-center gap-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <StatusBadge status={currentAccount.status} />
          </div>
        </div>
      )}

      {!activeAccountId ? (
        <div className="flex-1 flex items-center justify-center">
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
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/4 min-w-64 border-r border-border flex flex-col overflow-hidden">
            <div className="p-2 border-b border-border space-y-1.5 flex-shrink-0">
              <h2 className="text-sm font-semibold">Conversaciones</h2>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs"
                  data-testid="input-search-conversations"
                />
              </div>

              {/* Filters - Inline */}
              <div className="flex gap-1">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-7 text-xs flex-1" data-testid="select-filter-category">
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
                  <SelectTrigger className="h-7 text-xs flex-1" data-testid="select-filter-priority">
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
                  <SelectTrigger className="h-7 text-xs flex-1" data-testid="select-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {CONV_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
              {filteredConversations.length === 0 ? (
                <div className="p-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    {conversations.length === 0 ? "No hay conversaciones" : "Sin resultados"}
                  </p>
                </div>
              ) : (
                <div className="p-1 space-y-0.5">
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
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          setActiveConversation(conversation.id);
                          setShowDetailsPanel(true);
                        }}
                        className={`p-1 rounded-md border cursor-pointer transition-all text-xs ${
                          activeConversation === conversation.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-muted/30"
                        }`}
                        data-testid={`conversation-item-${conversation.id}`}
                      >
                        <div className="flex items-start gap-1 mb-0.5">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="text-xs font-bold bg-primary/20">
                              {conversation.contactName?.substring(0, 2).toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-xs text-foreground truncate leading-tight">
                              {conversation.contactName || conversation.contactNumber}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate leading-none">
                              {conversation.lastMessageText || "Sin mensajes"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 flex-wrap">
                          {category && (
                            <Badge variant="outline" className={`text-xs h-4 ${category.color}`}>
                              {category.label}
                            </Badge>
                          )}
                          {priority && (
                            <Badge variant="outline" className={`text-xs h-4 ${priority.color}`}>
                              {priority.label}
                            </Badge>
                          )}
                          {urgencyBadge && (
                            <Badge 
                              variant={urgencyBadge.variant as any} 
                              className="text-xs h-4"
                              data-testid={`badge-urgency-${conversation.id}`}
                            >
                              {urgencyBadge.text}
                            </Badge>
                          )}
                          {conversation.unreadCount > 0 && (
                            <Badge className="text-xs h-4">{conversation.unreadCount}</Badge>
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
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="h-12 border-b border-border px-4 flex items-center justify-between bg-card">
                <div className="flex items-center gap-2 flex-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-bold bg-primary/20">
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
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                  <div className="space-y-1">
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Details Panel */}
                {showDetailsPanel && currentConversation && (
                  <div className="w-64 border-l border-border flex flex-col bg-muted/20 p-3">
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
                              <Input
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
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="h-14 border-t border-border px-4 py-2 flex items-center gap-2 bg-card">
                <Input
                  placeholder="Escribe tu mensaje..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  data-testid="input-message"
                  className="h-8 text-xs"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  data-testid="button-send"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <p className="text-muted-foreground">Selecciona una conversación para comenzar</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
