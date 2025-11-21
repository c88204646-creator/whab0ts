import type { Message } from "@shared/schema";
import { Image, Play, File, Music, Users } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isOutgoing = message.direction === "outgoing";
  const time = new Date(message.timestamp).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getMediaIcon = (mediaType: string | null | undefined) => {
    switch (mediaType) {
      case "image":
        return <Image className="w-5 h-5 mr-2" />;
      case "video":
        return <Play className="w-5 h-5 mr-2" />;
      case "document":
        return <File className="w-5 h-5 mr-2" />;
      case "audio":
        return <Music className="w-5 h-5 mr-2" />;
      case "contact":
        return <Users className="w-5 h-5 mr-2" />;
      default:
        return null;
    }
  };

  const isMultimedia = message.mediaType && message.mediaType !== "text";

  return (
    <div
      className={`flex mb-4 ${isOutgoing ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-md px-4 py-2 rounded-2xl ${
          isOutgoing
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {isMultimedia && (
          <div className="flex items-center mb-1">
            <div className={isOutgoing ? "text-primary-foreground/80" : "text-muted-foreground/80"}>
              {getMediaIcon(message.mediaType)}
            </div>
            <span className={`text-xs font-medium ${isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {message.mediaType === "image" && "Imagen"}
              {message.mediaType === "video" && "Video"}
              {message.mediaType === "document" && "Documento"}
              {message.mediaType === "audio" && "Audio"}
              {message.mediaType === "contact" && "Contacto"}
            </span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={`text-xs ${isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {time}
          </span>
          {isOutgoing && (
            <span className="text-xs text-primary-foreground/70">
              {message.status === "read" ? "✓✓" : message.status === "delivered" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
