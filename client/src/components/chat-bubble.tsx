import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Download, 
  Check, 
  CheckCheck, 
  Clock,
  Image as ImageIcon,
  FileText,
  Video,
  Users,
  Mic,
  Volume2,
  Maximize2,
  X,
  Copy,
  Reply,
  Forward,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { Message } from "@shared/schema";

interface ChatBubbleProps {
  message: Message;
  showAvatar?: boolean;
  avatarUrl?: string;
  senderName?: string;
  onReply?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
}

const formatTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

function AudioWaveform({ isPlaying, progress }: { isPlaying: boolean; progress: number }) {
  const bars = 28;
  const heights = useRef(Array.from({ length: bars }, () => Math.random() * 0.6 + 0.3));
  
  return (
    <div className="flex items-center gap-0.5 h-8 px-1">
      {heights.current.map((height, i) => {
        const isActive = (i / bars) * 100 <= progress;
        return (
          <motion.div
            key={i}
            className={`w-0.5 rounded-full transition-colors duration-150 ${
              isActive ? "bg-current" : "bg-current/30"
            }`}
            initial={{ height: `${height * 100}%` }}
            animate={{
              height: isPlaying 
                ? [`${height * 100}%`, `${(height + 0.2) * 100}%`, `${height * 100}%`]
                : `${height * 100}%`,
            }}
            transition={{
              duration: 0.5,
              repeat: isPlaying ? Infinity : 0,
              delay: i * 0.02,
            }}
          />
        );
      })}
    </div>
  );
}

function AudioPlayer({ src, isOutgoing }: { src: string; isOutgoing: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 min-w-[200px] ${isOutgoing ? "" : ""}`}>
      <audio ref={audioRef} src={src} crossOrigin="anonymous" />
      
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlay}
        className={`h-9 w-9 rounded-full flex-shrink-0 ${
          isOutgoing 
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground" 
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </Button>

      <div className="flex-1 min-w-0">
        <div 
          className="cursor-pointer"
          onClick={handleSeek}
        >
          <AudioWaveform isPlaying={isPlaying} progress={progress} />
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] opacity-70">{formatDuration(currentTime || duration)}</span>
          <Volume2 className="w-3 h-3 opacity-50" />
        </div>
      </div>
    </div>
  );
}

function ImageViewer({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white/80 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <img 
            src={src} 
            alt="Imagen ampliada" 
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          <Button variant="secondary" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Descargar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StickerMessage({ url }: { url: string }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="p-1"
    >
      <img 
        src={url} 
        alt="Sticker" 
        className="w-32 h-32 object-contain"
        loading="lazy"
      />
    </motion.div>
  );
}

export function ChatBubble({
  message,
  showAvatar = false,
  avatarUrl,
  senderName,
  onReply,
  onForward,
  onDelete,
}: ChatBubbleProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const isOutgoing = message.direction === "outgoing";
  const time = formatTime(message.timestamp);
  
  const getStatusIcon = () => {
    switch (message.status) {
      case "read":
        return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5" />;
      case "sent":
        return <Check className="w-3.5 h-3.5" />;
      case "sending":
        return <Clock className="w-3.5 h-3.5 animate-pulse" />;
      default:
        return <Check className="w-3.5 h-3.5" />;
    }
  };

  const isSticker = message.mediaType === "sticker";
  const isImage = message.mediaType === "image" && message.mediaUrl;
  const isAudio = message.mediaType === "audio" && message.mediaUrl;
  const isVideo = message.mediaType === "video";
  const isDocument = message.mediaType === "document";
  const isContact = message.mediaType === "contact";

  if (isSticker && message.mediaUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOutgoing ? "justify-end" : "justify-start"} mb-1`}
        data-testid={`chat-bubble-${message.id}`}
      >
        <StickerMessage url={message.mediaUrl} />
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`flex ${isOutgoing ? "justify-end" : "justify-start"} mb-1 group relative`}
        data-testid={`chat-bubble-${message.id}`}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute top-0 ${isOutgoing ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"} flex items-center gap-1 z-10`}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background/80 backdrop-blur shadow-sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOutgoing ? "end" : "start"} className="w-40">
                  <DropdownMenuItem onClick={onReply}>
                    <Reply className="w-4 h-4 mr-2" />
                    Responder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content || "")}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onForward}>
                    <Forward className="w-4 h-4 mr-2" />
                    Reenviar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`
            relative max-w-xs md:max-w-sm lg:max-w-md rounded-2xl overflow-hidden
            ${isOutgoing 
              ? "bg-primary text-primary-foreground rounded-br-md" 
              : "bg-muted text-foreground rounded-bl-md"
            }
          `}
        >
          {isImage && (
            <div 
              className="relative cursor-pointer group/image"
              onClick={() => setShowImageViewer(true)}
            >
              <img 
                src={message.mediaUrl!} 
                alt="Imagen compartida" 
                className="w-full max-w-[280px] max-h-[280px] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
            </div>
          )}

          {isAudio && <AudioPlayer src={message.mediaUrl!} isOutgoing={isOutgoing} />}

          {isVideo && (
            <div className="relative">
              <div className="w-[280px] h-[160px] bg-black/20 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white">
                Video
              </div>
            </div>
          )}

          {isDocument && (
            <div className={`flex items-center gap-3 px-3 py-2 ${isOutgoing ? "bg-primary-foreground/10" : "bg-foreground/5"}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOutgoing ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                <FileText className={`w-5 h-5 ${isOutgoing ? "text-primary-foreground" : "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Documento</p>
                <p className={`text-[10px] ${isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  Toca para descargar
                </p>
              </div>
              <Download className={`w-4 h-4 ${isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
            </div>
          )}

          {isContact && (
            <div className={`flex items-center gap-3 px-3 py-2 ${isOutgoing ? "bg-primary-foreground/10" : "bg-foreground/5"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOutgoing ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                <Users className={`w-5 h-5 ${isOutgoing ? "text-primary-foreground" : "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Contacto compartido</p>
                <p className={`text-[10px] ${isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  Toca para ver
                </p>
              </div>
            </div>
          )}

          {message.content && (
            <div className="px-3 py-2">
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </p>
            </div>
          )}

          {message.mediaType === "audio" && message.transcription && (
            <div className={`px-3 py-2 border-t ${isOutgoing ? "border-primary-foreground/20" : "border-foreground/10"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Mic className="w-3 h-3 opacity-60" />
                <span className="text-[10px] font-medium opacity-70">Transcripci\u00f3n</span>
              </div>
              <p className="text-xs opacity-80 italic leading-relaxed">
                {message.transcription.substring(0, 150)}
                {message.transcription.length > 150 && "..."}
              </p>
            </div>
          )}

          <div className={`flex items-center justify-end gap-1 px-2 py-1 ${isImage && !message.content ? "absolute bottom-1 right-1 bg-black/40 rounded-lg backdrop-blur-sm" : ""}`}>
            <span className={`text-[10px] ${isImage && !message.content ? "text-white" : isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {time}
            </span>
            {isOutgoing && (
              <span className={isImage && !message.content ? "text-white" : "text-primary-foreground/70"}>
                {getStatusIcon()}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {showImageViewer && message.mediaUrl && (
        <ImageViewer src={message.mediaUrl} onClose={() => setShowImageViewer(false)} />
      )}
    </>
  );
}
