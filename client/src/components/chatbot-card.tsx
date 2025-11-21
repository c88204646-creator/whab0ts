import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Settings, Trash2 } from "lucide-react";
import type { Chatbot } from "@shared/schema";

interface ChatbotCardProps {
  chatbot: Chatbot;
  onConfig: (id: string) => void;
  onDelete: (id: string) => void;
  isDeletingId?: string | null;
}

const CHATBOT_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  general: { label: "General", icon: "🤖", color: "from-blue-500 to-blue-600" },
  customer_service: { label: "Servicio al Cliente", icon: "👥", color: "from-green-500 to-green-600" },
  sales: { label: "Ventas", icon: "💰", color: "from-purple-500 to-purple-600" },
  support: { label: "Soporte", icon: "🛠️", color: "from-orange-500 to-orange-600" },
  ecommerce: { label: "E-commerce", icon: "🛒", color: "from-pink-500 to-pink-600" },
  booking: { label: "Reservas", icon: "📅", color: "from-indigo-500 to-indigo-600" },
};

export function ChatbotCard({
  chatbot,
  onConfig,
  onDelete,
  isDeletingId,
}: ChatbotCardProps) {
  const typeInfo = CHATBOT_TYPES[chatbot.type] || CHATBOT_TYPES.general;
  const isDeleting = isDeletingId === chatbot.id;

  return (
    <Card className="hover-elevate overflow-hidden transition-all duration-200 h-full flex flex-col group">
      {/* Header with type icon */}
      <div className={`h-20 bg-gradient-to-r ${typeInfo.color} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-pattern" />
        <div className="text-5xl">{typeInfo.icon}</div>
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Name & Status */}
        <div className="flex items-start justify-between gap-2 min-h-10">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate" data-testid={`text-chatbot-name-${chatbot.id}`}>
              {chatbot.name}
            </h3>
            {chatbot.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {chatbot.description}
              </p>
            )}
          </div>
          <Badge variant={chatbot.isActive ? "default" : "secondary"} className="flex-shrink-0 text-xs">
            {chatbot.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        {/* Type Badge */}
        <div>
          <Badge variant="outline" className="text-xs">
            {typeInfo.label}
          </Badge>
        </div>

        {/* Connection Status */}
        {chatbot.whatsappAccountId ? (
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Conectado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Sin conectar</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-border/50">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onConfig(chatbot.id)}
            className="w-10"
            data-testid={`button-config-chatbot-${chatbot.id}`}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(chatbot.id)}
            disabled={isDeleting}
            className="w-10"
            data-testid={`button-delete-chatbot-${chatbot.id}`}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
