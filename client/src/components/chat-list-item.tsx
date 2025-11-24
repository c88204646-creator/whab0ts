import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Conversation } from "@shared/schema";

interface ChatListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

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

export function ChatListItem({ conversation, isActive, onClick }: ChatListItemProps) {
  const timeAgo = conversation.lastMessageTime
    ? new Date(conversation.lastMessageTime).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const contactName = conversation.contactName || conversation.contactNumber;
  const avatarColor = getAvatarColor(contactName);
  const unreadCount = conversation.unreadCount || 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all duration-200 ${
        isActive 
          ? "bg-accent/40 border border-accent/50" 
          : "hover:bg-muted/40 hover:border hover:border-border/30"
      }`}
      data-testid={`chat-item-${conversation.id}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarFallback className={`text-xs font-bold ${avatarColor}`}>
            {contactName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-destructive border-2 border-background flex items-center justify-center shadow-md">
              <span className="text-xs font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h4 className="font-semibold text-sm truncate text-foreground">
            {contactName}
          </h4>
          {timeAgo && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {timeAgo}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate leading-tight">
          {conversation.lastMessageText || "Sin mensajes"}
        </p>
      </div>
    </button>
  );
}
