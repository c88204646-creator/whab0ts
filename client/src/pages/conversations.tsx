import { useState, useEffect } from "react";
import { Search, Send, Phone, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatListItem } from "@/components/chat-list-item";
import { ChatMessage } from "@/components/chat-message";
import { StatusBadge } from "@/components/status-badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { subscribeToMessages } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message } from "@shared/schema";

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const { toast } = useToast();

  // Get accountId from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accountId = params.get("accountId");
    if (accountId) {
      setActiveAccountId(accountId);
    }
  }, []);

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", activeAccountId],
    enabled: !!activeAccountId,
    refetchInterval: 10000,
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeConversation],
    enabled: !!activeConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { accountId: string; toNumber: string; content: string }) => {
      return apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", activeConversation] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeAccountId] });
      setMessageInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

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

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeAccountId || !currentConversation) return;
    
    sendMessageMutation.mutate({
      accountId: activeAccountId,
      toNumber: currentConversation.contactNumber,
      content: messageInput,
    });
  };

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-3">Conversaciones</h2>
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
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No se encontraron conversaciones" : "No hay conversaciones"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ChatListItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversation}
                onClick={() => setActiveConversation(conv.id)}
              />
            ))
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            <div className="h-16 border-b border-border px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {currentConversation.contactName?.charAt(0).toUpperCase() ||
                     currentConversation.contactNumber.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold" data-testid="text-contact-name">
                    {currentConversation.contactName || currentConversation.contactNumber}
                  </h3>
                  <StatusBadge status="connected" />
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

            <ScrollArea className="flex-1 p-6">
              {messages && messages.length > 0 ? (
                messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No hay mensajes en esta conversación</p>
                </div>
              )}
            </ScrollArea>

            <div className="h-20 border-t border-border px-6 flex items-center gap-3">
              <Input
                placeholder="Escribe un mensaje..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Selecciona una conversación</h3>
              <p className="text-sm text-muted-foreground">
                Elige un chat de la lista para ver los mensajes y responder
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
