import type { Message } from "@shared/schema";
import { Image, Play, File, Music, Users, Download } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const handleDownloadAudio = () => {
    if (message.mediaUrl) {
      const link = document.createElement("a");
      link.href = message.mediaUrl;
      link.download = `audio_${new Date().getTime()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
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
      className={`flex mb-1 ${isOutgoing ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-sm rounded-lg overflow-hidden text-xs ${
          isOutgoing
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {/* Media Content */}
        {message.mediaType === "image" && message.mediaUrl && (
          <img 
            src={message.mediaUrl} 
            alt="Imagen compartida" 
            className="w-full max-h-64 object-cover"
            data-testid="message-image"
          />
        )}
        
        {/* Audio Player */}
        {message.mediaType === "audio" && message.mediaUrl && (
          <div className="p-3 min-w-80" data-testid="message-audio">
            <AudioPlayer
              src={message.mediaUrl}
              title="Audio compartido"
              isOutgoing={isOutgoing}
              onDownload={handleDownloadAudio}
            />
          </div>
        )}
        
        {/* Media Header */}
        {isMultimedia && (message.mediaType !== "image" || !message.mediaUrl) && message.mediaType !== "audio" && (
          <div className="flex items-center gap-1 px-2 py-1">
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
        
        {/* Audio Header (when no mediaUrl) */}
        {message.mediaType === "audio" && !message.mediaUrl && (
          <div className="flex items-center gap-1 px-2 py-1">
            <div className={isOutgoing ? "text-primary-foreground/80" : "text-muted-foreground/80"}>
              {getMediaIcon(message.mediaType)}
            </div>
            <span className={`text-xs font-medium ${isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              Audio
            </span>
          </div>
        )}
        
        {/* Text Content */}
        <div className={`px-2 py-1 ${message.mediaType === "image" && message.mediaUrl ? "pb-0.5" : ""}`}>
          <p className="text-xs whitespace-pre-wrap break-words leading-tight">{message.content}</p>
        </div>
        
        {/* Timestamp and Status */}
        <div className="flex items-center justify-end gap-0.5 px-2 py-0.5">
          <span className={isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"}>
            {time}
          </span>
          {isOutgoing && (
            <span className="text-primary-foreground/70">
              {message.status === "read" ? "✓✓" : message.status === "delivered" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
