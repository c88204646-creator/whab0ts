import { useState, useEffect } from "react";
import { Search, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Conversation, WhatsappAccount } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function ConversationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);
  }, []);

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!userId,
    refetchInterval: 3000,
  });

  const { data: accounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts", userId],
    enabled: !!userId,
  });

  if (isLoading) return <LoadingSpinner />;

  const filteredConversations = conversations.filter(conv =>
    conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contactNumber.includes(searchQuery) ||
    conv.lastMessageText?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 lg:px-6 py-4 bg-card">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Conversaciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona todas tus conversaciones de WhatsApp
          </p>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-conversations"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-lg font-medium text-foreground mb-2">Sin conversaciones</p>
            <p className="text-sm text-muted-foreground">
              {conversations.length === 0 ? "Aún no hay conversaciones" : "No se encontraron resultados"}
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto h-full space-y-2 p-4">
            {filteredConversations.map((conv) => (
              <Card 
                key={conv.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedConvId(conv.id)}
                data-testid={`card-conversation-${conv.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {conv.contactName || conv.contactNumber}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {conv.contactNumber}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {conv.lastMessageText || "Sin mensajes"}
                      </p>
                    </div>
                    {conv.unreadCount && conv.unreadCount > 0 && (
                      <Badge variant="default">{conv.unreadCount}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
