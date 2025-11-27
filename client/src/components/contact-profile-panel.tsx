import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Tag, 
  Plus, 
  Edit3, 
  UserPlus, 
  Users,
  MessageCircle,
  Image as ImageIcon,
  Mic,
  FileText,
  Video,
  Clock,
  Star,
  TrendingUp,
  Activity,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Conversation, Message } from "@shared/schema";

interface ContactProfilePanelProps {
  conversation: Conversation;
  messages: Message[];
  onClose: () => void;
  onUpdateConversation: (data: Partial<Conversation>) => void;
  onCreateClient: () => void;
  onCreateLead: () => void;
}

const CATEGORIES = [
  { value: "general", label: "General", color: "bg-slate-500" },
  { value: "sales", label: "Ventas", color: "bg-emerald-500" },
  { value: "support", label: "Soporte", color: "bg-blue-500" },
  { value: "vip", label: "VIP", color: "bg-amber-500" },
  { value: "other", label: "Otro", color: "bg-purple-500" },
];

const PRIORITIES = [
  { value: "low", label: "Baja", color: "text-gray-500" },
  { value: "normal", label: "Normal", color: "text-blue-500" },
  { value: "high", label: "Alta", color: "text-orange-500" },
  { value: "urgent", label: "Urgente", color: "text-red-500" },
];

const STATUSES = [
  { value: "active", label: "Activa" },
  { value: "archived", label: "Archivada" },
  { value: "spam", label: "Spam" },
  { value: "blocked", label: "Bloqueada" },
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

function MediaGallery({ messages }: { messages: Message[] }) {
  const mediaMessages = messages.filter(m => 
    m.mediaType === "image" || m.mediaType === "video" || m.mediaType === "audio" || m.mediaType === "document"
  );

  const images = mediaMessages.filter(m => m.mediaType === "image" && m.mediaUrl);
  const audios = mediaMessages.filter(m => m.mediaType === "audio");
  const documents = mediaMessages.filter(m => m.mediaType === "document");
  const videos = mediaMessages.filter(m => m.mediaType === "video");

  if (mediaMessages.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
          <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-xs text-muted-foreground">Sin archivos multimedia</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Im\u00e1genes ({images.length})</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {images.slice(0, 9).map((msg) => (
              <motion.div
                key={msg.id}
                whileHover={{ scale: 1.05 }}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer bg-muted"
              >
                <img 
                  src={msg.mediaUrl!} 
                  alt="" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
          {images.length > 9 && (
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
              Ver todas ({images.length})
            </Button>
          )}
        </div>
      )}

      {audios.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Audios ({audios.length})</span>
          </div>
          <div className="space-y-1.5">
            {audios.slice(0, 3).map((msg) => (
              <div key={msg.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">Audio</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Documentos ({documents.length})</span>
          </div>
          <div className="space-y-1.5">
            {documents.slice(0, 3).map((msg) => (
              <div key={msg.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">Documento</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Videos ({videos.length})</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTimeline({ messages, conversation }: { messages: Message[]; conversation: Conversation }) {
  const recentMessages = messages.slice(-10).reverse();
  
  const activities = [
    {
      id: "created",
      type: "system",
      title: "Conversaci\u00f3n iniciada",
      time: conversation.createdAt,
      icon: MessageCircle,
      color: "text-blue-500 bg-blue-500/10",
    },
    ...recentMessages.map((msg) => ({
      id: msg.id,
      type: msg.direction as string,
      title: msg.direction === "incoming" ? "Mensaje recibido" : "Mensaje enviado",
      content: msg.content?.substring(0, 50) + (msg.content && msg.content.length > 50 ? "..." : ""),
      time: msg.timestamp,
      icon: msg.mediaType === "audio" ? Mic : msg.mediaType === "image" ? ImageIcon : MessageCircle,
      color: msg.direction === "incoming" ? "text-emerald-500 bg-emerald-500/10" : "text-primary bg-primary/10",
    })),
  ];

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-3">
        {activities.slice(0, 8).map((activity, index) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex gap-3 pl-1"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${activity.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0 pb-3">
                <p className="text-xs font-medium text-foreground">{activity.title}</p>
                {"content" in activity && activity.content && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{activity.content}</p>
                )}
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {new Date(activity.time).toLocaleString("es-ES", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function ContactProfilePanel({
  conversation,
  messages,
  onClose,
  onUpdateConversation,
  onCreateClient,
  onCreateLead,
}: ContactProfilePanelProps) {
  const [tagInput, setTagInput] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  
  const displayName = conversation.contactName || conversation.contactNumber;
  const initials = displayName.substring(0, 2).toUpperCase();
  const avatarGradient = getAvatarGradient(displayName);
  
  const totalMessages = messages.length;
  const incomingMessages = messages.filter(m => m.direction === "incoming").length;
  const outgoingMessages = messages.filter(m => m.direction === "outgoing").length;
  const mediaCount = messages.filter(m => m.mediaType && m.mediaType !== "text").length;

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = [...(conversation.tags || []), tagInput.trim()];
      onUpdateConversation({ tags: newTags } as any);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = (conversation.tags || []).filter(t => t !== tag);
    onUpdateConversation({ tags: newTags } as any);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden flex-shrink-0"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Perfil del Contacto</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-4 space-y-6">
          <div className="text-center">
            <Avatar className="w-20 h-20 mx-auto ring-4 ring-offset-4 ring-offset-background ring-primary/20">
              <AvatarImage src={undefined} />
              <AvatarFallback className={`bg-gradient-to-br ${avatarGradient} text-white text-2xl font-bold`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="mt-4">
              <h2 className="font-bold text-lg text-foreground">{displayName}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{conversation.contactNumber}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => navigator.clipboard.writeText(conversation.contactNumber)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar n\u00famero</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
              <Button onClick={onCreateClient} size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <UserPlus className="w-3.5 h-3.5" />
                Crear Cliente
              </Button>
              <Button onClick={onCreateLead} size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Users className="w-3.5 h-3.5" />
                Crear Lead
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-foreground">{totalMessages}</p>
              <p className="text-[10px] text-muted-foreground">Mensajes</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-emerald-600">{incomingMessages}</p>
              <p className="text-[10px] text-muted-foreground">Recibidos</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-blue-600">{outgoingMessages}</p>
              <p className="text-[10px] text-muted-foreground">Enviados</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold text-purple-600">{mediaCount}</p>
              <p className="text-[10px] text-muted-foreground">Multimedia</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-9">
              <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">Actividad</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Categor\u00eda</label>
                <Select
                  value={conversation.category || "general"}
                  onValueChange={(value) => onUpdateConversation({ category: value } as any)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prioridad</label>
                <Select
                  value={conversation.priority || "normal"}
                  onValueChange={(value) => onUpdateConversation({ priority: value } as any)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className={p.color}>{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estado</label>
                <Select
                  value={conversation.status || "active"}
                  onValueChange={(value) => onUpdateConversation({ status: value } as any)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Etiquetas</label>
                <div className="flex gap-1.5 mb-2">
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
                    className="h-8 text-xs"
                  />
                  <Button size="icon" onClick={handleAddTag} className="h-8 w-8 flex-shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {(conversation.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {conversation.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-0.5 hover:bg-foreground/10 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notas</label>
                <Textarea
                  value={conversation.notes || ""}
                  onChange={(e) => onUpdateConversation({ notes: e.target.value } as any)}
                  placeholder="Escribe notas sobre este contacto..."
                  className="min-h-[80px] text-xs resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <ActivityTimeline messages={messages} conversation={conversation} />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Creado: {new Date(conversation.createdAt).toLocaleDateString("es-ES")}</span>
          <span>{conversation.unreadCount} sin leer</span>
        </div>
      </div>
    </motion.div>
  );
}
