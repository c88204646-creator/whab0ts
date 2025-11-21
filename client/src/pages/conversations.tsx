import { useState, useEffect, useRef } from "react";
import { Search, Send, Phone, MoreVertical, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChatListItem } from "@/components/chat-list-item";
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
import type { Conversation, Message, WhatsappAccount } from "@shared/schema";

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get userId from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  // Fetch user's WhatsApp accounts
  const { data: accounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", "userId", userId],
    enabled: !!userId,
    retry: 1,
  });

  // Auto-select first account if none selected
  useEffect(() => {
    if (accounts.length > 0 && !activeAccountId) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  // Fetch conversations for selected account
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", "accountId", activeAccountId],
    enabled: !!activeAccountId,
    refetchInterval: 3000,
    retry: 1,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeConversation],
    enabled: !!activeConversation,
    retry: 1,
    refetchInterval: 1000,
    queryFn: async () => {
      if (!activeConversation) return [];
      const response = await fetch(`/api/messages/${activeConversation}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { accountId: string; toNumber: string; content: string }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onSuccess: async () => {
      setMessageInput("");
      // Immediately refetch messages after sending
      await refetchMessages();
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

  // Autoscroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Subscribe to WebSocket messages for real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToMessages((message) => {
      if (message.type === "new_message") {
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      }
    });

    return unsubscribe;
  }, []);

  const filteredConversations = conversations?.filter((conv) =>
    conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contactNumber.includes(searchQuery)
  ) || [];

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

  if (!userId) {
    return <div className="flex items-center justify-center h-full bg-background"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Account Selector */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Selecciona una cuenta de WhatsApp
            </label>
            <Select value={activeAccountId || ""} onValueChange={setActiveAccountId}>
              <SelectTrigger data-testid="select-whatsapp-account">
                <SelectValue placeholder="Cargando cuentas..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{account.deviceName}</span>
                      {account.phoneNumber && (
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">
                          {account.phoneNumber}
                        </code>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentAccount && (
            <div className="flex items-center gap-2 pt-6">
              <StatusBadge status={currentAccount.status} />
            </div>
          )}
        </div>
      </div>

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
          <div className="w-80 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold mb-3">Chats</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {conversations.length === 0
                      ? "No hay conversaciones aún"
                      : "No se encontraron chats"}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredConversations.map((conversation) => (
                    <ChatListItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={activeConversation === conversation.id}
                      onClick={() => setActiveConversation(conversation.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          {activeConversation ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {currentConversation?.contactName?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {currentConversation?.contactName || "Chat"}
                      </h3>
                      {currentConversation?.contactNumber && (
                        <Badge variant="secondary" className="text-xs">
                          {currentConversation.contactNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="h-20 border-t border-border px-6 py-4 flex items-center gap-2 bg-card">
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
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  data-testid="button-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <p className="text-muted-foreground">Selecciona un chat para comenzar</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
