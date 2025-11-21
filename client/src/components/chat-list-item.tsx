import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@shared/schema";

interface ChatListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ChatListItem({ conversation, isActive, onClick }: ChatListItemProps) {
  const timeAgo = conversation.lastMessageTime
    ? new Date(conversation.lastMessageTime).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 border-b border-border text-left hover-elevate ${
        isActive ? "bg-accent" : ""
      }`}
      data-testid={`chat-item-${conversation.id}`}
    >
      <Avatar className="w-12 h-12 flex-shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">
          {conversation.contactName?.charAt(0).toUpperCase() || 
           conversation.contactNumber.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="font-semibold text-sm truncate">
            {conversation.contactName || conversation.contactNumber}
          </h4>
          {timeAgo && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {timeAgo}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {conversation.lastMessageText || "Sin mensajes"}
        </p>
      </div>

      {conversation.unreadCount > 0 && (
        <Badge 
          variant="default" 
          className="rounded-full w-6 h-6 flex items-center justify-center p-0 flex-shrink-0"
          data-testid="badge-unread-count"
        >
          {conversation.unreadCount}
        </Badge>
      )}
    </button>
  );
}
