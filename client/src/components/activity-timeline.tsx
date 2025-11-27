import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Image as ImageIcon, Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation, Message } from "@shared/schema";

interface ActivityTimelineProps {
  messages: Message[];
  conversation: Conversation;
}

export function ActivityTimeline({ messages, conversation }: ActivityTimelineProps) {
  const recentMessages = messages.slice(-10).reverse();

  const activities = [
    {
      id: "created",
      type: "system",
      title: "Conversación iniciada",
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
    <Card className="border rounded-md bg-card">
      <ScrollArea className="h-48">
        <div className="p-3 space-y-2">
          <AnimatePresence>
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-2 pb-2 border-b border-border/50 last:border-0"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-tight">{activity.title}</p>
                    {"content" in activity && activity.content && (
                      <p className="text-[9px] text-muted-foreground truncate mt-0.5">{activity.content}</p>
                    )}
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5">
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
          </AnimatePresence>
        </div>
      </ScrollArea>
    </Card>
  );
}
