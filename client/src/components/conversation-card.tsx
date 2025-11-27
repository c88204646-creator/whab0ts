import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  Clock, 
  Star, 
  Archive, 
  Pin, 
  MoreHorizontal,
  Phone,
  Mail,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Minus,
  Image as ImageIcon,
  Mic,
  FileText,
  Video,
  Sparkles
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { Conversation } from "@shared/schema";

interface ConversationCardProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onUpdateStatus?: (status: string) => void;
  onPin?: () => void;
  onStar?: () => void;
}

// Sentiment SVG Icons with colors
const SentimentEmojis = {
  positive: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <circle cx="12" cy="12" r="10" fill="#10b981" opacity="0.15"/>
      <circle cx="12" cy="12" r="10" fill="none" stroke="#10b981" strokeWidth="1.5"/>
      <circle cx="8" cy="10" r="1" fill="#10b981"/>
      <circle cx="16" cy="10" r="1" fill="#10b981"/>
      <path d="M 8 15 Q 12 17 16 15" stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  negative: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <circle cx="12" cy="12" r="10" fill="#ef4444" opacity="0.15"/>
      <circle cx="12" cy="12" r="10" fill="none" stroke="#ef4444" strokeWidth="1.5"/>
      <circle cx="8" cy="10" r="1" fill="#ef4444"/>
      <circle cx="16" cy="10" r="1" fill="#ef4444"/>
      <path d="M 8 17 Q 12 15 16 17" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  neutral: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <circle cx="12" cy="12" r="10" fill="#6b7280" opacity="0.15"/>
      <circle cx="12" cy="12" r="10" fill="none" stroke="#6b7280" strokeWidth="1.5"/>
      <circle cx="8" cy="10" r="1" fill="#6b7280"/>
      <circle cx="16" cy="10" r="1" fill="#6b7280"/>
      <line x1="8" y1="16" x2="16" y2="16" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  angry: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <circle cx="12" cy="12" r="10" fill="#f97316" opacity="0.15"/>
      <circle cx="12" cy="12" r="10" fill="none" stroke="#f97316" strokeWidth="1.5"/>
      <path d="M 7.5 9.5 L 8.5 8.5" stroke="#f97316" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 16.5 9.5 L 15.5 8.5" stroke="#f97316" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 8 17 Q 12 15 16 17" stroke="#f97316" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
};

const detectSentiment = (text: string | null): "positive" | "negative" | "neutral" | "angry" => {
  if (!text) return "neutral";
  
  const lowerText = text.toLowerCase();
  
  // Positive keywords
  const positiveWords = ["gracias", "excelente", "perfecto", "genial", "maravilloso", "amor", "feliz", "bien", "bueno", "increíble", "fantástico", "jajaja", "😊", "😄", ":)", "👍"];
  
  // Negative keywords
  const negativeWords = ["malo", "terrible", "horrible", "odio", "asco", "frustrado", "enfadado", "triste", "😢", "😞", "😭", ":(", "👎"];
  
  // Angry keywords
  const angryWords = ["rabia", "furioso", "enojado", "odio", "ira", "😡", "😠", "!!!", "¡¡¡"];
  
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
  const angryCount = angryWords.filter(w => lowerText.includes(w)).length;
  
  if (angryCount > 0) return "angry";
  if (positiveCount > negativeCount && positiveCount > 0) return "positive";
  if (negativeCount > positiveCount && negativeCount > 0) return "negative";
  
  return "neutral";
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  sales: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  support: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  vip: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  general: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20" },
  other: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
};

const PRIORITY_INDICATORS: Record<string, { color: string; pulse: boolean }> = {
  urgent: { color: "bg-red-500", pulse: true },
  high: { color: "bg-orange-500", pulse: false },
  normal: { color: "bg-blue-500", pulse: false },
  low: { color: "bg-gray-400", pulse: false },
};

const getAvatarGradient = (name: string): string => {
  const gradients = [
    "from-violet-500 to-purple-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-pink-500 to-rose-500",
    "from-indigo-500 to-blue-500",
    "from-fuchsia-500 to-pink-500",
    "from-teal-500 to-green-500",
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const getTimeAgo = (timestamp: string | null): string => {
  if (!timestamp) return "";
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return then.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};

const getMessagePreviewIcon = (text: string | null): JSX.Element | null => {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  if (lowerText.includes("[imagen]") || lowerText.includes("image")) {
    return <ImageIcon className="w-3 h-3 text-muted-foreground" />;
  }
  if (lowerText.includes("[audio]") || lowerText.includes("voice")) {
    return <Mic className="w-3 h-3 text-muted-foreground" />;
  }
  if (lowerText.includes("[documento]") || lowerText.includes("document")) {
    return <FileText className="w-3 h-3 text-muted-foreground" />;
  }
  if (lowerText.includes("[video]")) {
    return <Video className="w-3 h-3 text-muted-foreground" />;
  }
  return null;
};

export function ConversationCard({
  conversation,
  isActive,
  onClick,
  onUpdateStatus,
  onPin,
  onStar,
}: ConversationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isArchived = conversation.status === "archived";
  
  const sentiment = detectSentiment(conversation.lastMessageText);
  const SentimentEmoji = SentimentEmojis[sentiment];
  
  const categoryStyle = CATEGORY_STYLES[conversation.category || "general"] || CATEGORY_STYLES.general;
  const priorityStyle = PRIORITY_INDICATORS[conversation.priority || "normal"] || PRIORITY_INDICATORS.normal;
  
  const avatarGradient = getAvatarGradient(conversation.contactName || conversation.contactNumber);
  const timeAgo = getTimeAgo(conversation.lastMessageTime ? conversation.lastMessageTime.toString() : null);
  const messageIcon = getMessagePreviewIcon(conversation.lastMessageText);
  
  const isPinned = conversation.isPinned || false;
  const isStarred = conversation.isStarred || false;
  const hasAI = false;
  
  const displayName = conversation.contactName || conversation.contactNumber;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`
        relative group cursor-pointer rounded-lg p-2 transition-all duration-200
        ${isActive 
          ? "bg-primary/8 border-2 border-primary/30 shadow-sm shadow-primary/10" 
          : "bg-card border border-border/50 hover:border-primary/20 hover:bg-muted/30"
        }
      `}
      data-testid={`conversation-card-${conversation.id}`}
    >
      {priorityStyle.pulse && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className={`absolute inset-0 rounded-full ${priorityStyle.color} opacity-75`} />
          <span className={`absolute inset-0 rounded-full ${priorityStyle.color}`} />
        </motion.div>
      )}
      
      {isPinned && (
        <div className="absolute -top-1 -left-1">
          <Pin className="w-3.5 h-3.5 text-primary fill-primary" />
        </div>
      )}

      <div className="flex items-start gap-2">
        <div className="relative flex-shrink-0">
          <Avatar className={`w-9 h-9 ring-1.5 ring-offset-1 ring-offset-background ${isActive ? "ring-primary/50" : "ring-border/50"}`}>
            <AvatarImage src={undefined} />
            <AvatarFallback className={`bg-gradient-to-br ${avatarGradient} text-white font-semibold text-sm`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${priorityStyle.color}`} />
          
          {hasAI && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-violet-500" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 min-w-0">
              <h3 className="font-semibold text-xs text-foreground truncate">
                {displayName}
              </h3>
              {isStarred && (
                <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[9px] text-muted-foreground font-medium">{timeAgo}</span>
              {conversation.unreadCount > 0 && (
                <Badge 
                  className="h-4 min-w-4 px-1 text-[9px] font-bold bg-primary text-primary-foreground border-0 rounded-full"
                >
                  {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messageIcon}
            <p className="text-[11px] text-muted-foreground truncate leading-tight">
              {conversation.lastMessageText || "Sin mensajes"}
            </p>
          </div>

          <div className="flex items-center justify-between gap-1 pt-0.5">
            <div className="flex items-center gap-1 min-w-0">
              {conversation.category && conversation.category !== "general" && (
                <Badge 
                  variant="outline"
                  className={`text-[9px] h-4 px-1.5 font-medium ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} border flex-shrink-0 whitespace-nowrap`}
                >
                  {conversation.category === "sales" && "Ventas"}
                  {conversation.category === "support" && "Soporte"}
                  {conversation.category === "vip" && "VIP"}
                  {conversation.category === "other" && "Otro"}
                </Badge>
              )}
              
              {(conversation.tags || []).slice(0, 1).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="text-[9px] h-4 px-1 font-normal bg-muted/60 flex-shrink-0 whitespace-nowrap"
                >
                  {tag}
                </Badge>
              ))}
              {(conversation.tags || []).length > 1 && (
                <span className="text-[9px] text-muted-foreground flex-shrink-0">
                  +{(conversation.tags || []).length - 1}
                </span>
              )}
            </div>

            <div 
              className="flex items-center gap-0.5"
              style={{ visibility: isHovered ? 'visible' : 'hidden' }}
            >
              <div 
                className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
              >
                {SentimentEmoji}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin?.(); }}>
                    <Pin className="w-4 h-4 mr-2" />
                    {isPinned ? "Desfijar" : "Fijar arriba"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStar?.(); }}>
                    <Star className="w-4 h-4 mr-2" />
                    {isStarred ? "Quitar estrella" : "Destacar"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus?.(isArchived ? "active" : "archived"); }} data-testid="menu-archive-status">
                    <Archive className={`w-4 h-4 mr-2 ${isArchived ? "text-primary" : ""}`} />
                    {isArchived ? "Restaurar" : "Archivar"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {isActive && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"
          layoutId="activeIndicator"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.div>
  );
}
