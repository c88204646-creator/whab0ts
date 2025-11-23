import { useState, useEffect, useRef } from "react";
import { Search, Send, MoreVertical, Plus, X, Smile, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Conversation, Message, WhatsappAccount } from "@shared/schema";

const COMMON_EMOJIS = ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "👋", "👍", "👎", "🙌", "👏", "🤝", "❤️", "🔥", "✨", "💯", "🎉", "🚀"];

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState<"client" | "lead" | null>(null);
  const [createFormData, setCreateFormData] = useState({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserId(user?.id || null);
  }, []);

  const { data: accounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", userId],
    enabled: !!userId,
  });

  useEffect(() => {
    if (accounts.length > 0 && !activeAccountId) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", activeAccountId],
    enabled: !!activeAccountId,
    refetchInterval: 2000,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeConversation],
    enabled: !!activeConversation,
    refetchInterval: 1000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { accountId: string; toNumber: string; content: string; isManual: boolean }) =>
      apiRequest("POST", "/api/messages", data),
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation] });
    },
  });

  const filteredConversations = conversations.filter(c =>
    c.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contactNumber.includes(searchQuery)
  );

  const activeConv = conversations.find(c => c.id === activeConversation);

  if (loadingConversations) return <LoadingSpinner />;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-border flex flex-col bg-card">
          <div className="border-b border-border p-4">
            <h1 className="text-xl font-bold text-foreground mb-3">Conversaciones</h1>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                data-testid="input-search-conversations"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Sin conversaciones
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant={activeConversation === conv.id ? "default" : "ghost"}
                    className="w-full justify-start h-auto py-2 px-3"
                    onClick={() => setActiveConversation(conv.id)}
                    data-testid={`button-conversation-${conv.id}`}
                  >
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {conv.contactName || conv.contactNumber}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessageText || "Sin mensajes"}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConv ? (
            <>
              <div className="border-b border-border p-4 bg-card flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">
                    {activeConv.contactName || activeConv.contactNumber}
                  </h2>
                  <p className="text-xs text-muted-foreground">{activeConv.contactNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateModal("client")}
                  data-testid="button-create-client"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {loadingMessages ? (
                    <div className="text-center text-sm text-muted-foreground py-8">Cargando...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">Sin mensajes</div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        data-testid={`message-${msg.id}`}
                      >
                        <div
                          className={`max-w-xs p-2.5 rounded-lg text-sm ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              <div className="border-t border-border p-3 bg-card">
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        data-testid="button-emoji"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="grid grid-cols-8 gap-1">
                        {COMMON_EMOJIS.map((emoji) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setMessageInput(messageInput + emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Input
                    placeholder="Escribir mensaje..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && messageInput.trim()) {
                        sendMessageMutation.mutate({
                          accountId: activeAccountId || "",
                          toNumber: activeConv.contactNumber,
                          content: messageInput,
                          isManual: true,
                        });
                      }
                    }}
                    className="h-9"
                    data-testid="input-message"
                  />

                  <Button
                    onClick={() => {
                      if (messageInput.trim()) {
                        sendMessageMutation.mutate({
                          accountId: activeAccountId || "",
                          toNumber: activeConv.contactNumber,
                          content: messageInput,
                          isManual: true,
                        });
                      }
                    }}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    size="icon"
                    className="h-9 w-9"
                    data-testid="button-send"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Selecciona una conversación</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {showCreateModal === "client" ? "Crear Cliente" : "Crear Lead"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowCreateModal(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Nombre</Label>
                <Input
                  placeholder="Nombre"
                  value={createFormData.firstName}
                  onChange={(e) => setCreateFormData({...createFormData, firstName: e.target.value})}
                  className="h-8 text-xs mt-1"
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <Label className="text-xs">Apellido</Label>
                <Input
                  placeholder="Apellido"
                  value={createFormData.lastName}
                  onChange={(e) => setCreateFormData({...createFormData, lastName: e.target.value})}
                  className="h-8 text-xs mt-1"
                  data-testid="input-last-name"
                />
              </div>
              <div>
                <Label className="text-xs">Teléfono</Label>
                <Input
                  placeholder="Teléfono"
                  value={createFormData.phone}
                  onChange={(e) => setCreateFormData({...createFormData, phone: e.target.value})}
                  className="h-8 text-xs mt-1"
                  data-testid="input-phone"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  placeholder="Email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                  className="h-8 text-xs mt-1"
                  data-testid="input-email"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(null)}
                  className="flex-1 h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "Contacto creado",
                      description: `${createFormData.firstName} ${createFormData.lastName}`,
                    });
                    setShowCreateModal(null);
                    setCreateFormData({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
                  }}
                  className="flex-1 h-8 text-xs"
                  data-testid="button-save"
                >
                  Crear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
