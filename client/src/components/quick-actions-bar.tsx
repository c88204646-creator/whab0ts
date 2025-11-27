import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Smile, 
  Paperclip, 
  Mic, 
  Image as ImageIcon, 
  FileText, 
  Sparkles, 
  Zap, 
  MessageSquare, 
  Clock, 
  Hash,
  AtSign,
  ChevronUp,
  X,
  Bot,
  Wand2,
  Hand,
  Heart,
  ThumbsUp
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AttachedFile {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'audio' | 'document';
}

interface QuickActionsBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSendWithFiles?: (files: File[], caption?: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  contactName?: string;
}

const QUICK_TEMPLATES = [
  {
    id: "greeting",
    icon: MessageSquare,
    label: "Saludo",
    text: "¡Hola! ¿Cómo puedo ayudarte hoy?",
  },
  {
    id: "thanks",
    icon: Sparkles,
    label: "Agradecimiento",
    text: "¡Gracias por tu mensaje! Te responderemos a la brevedad.",
  },
  {
    id: "followup",
    icon: Clock,
    label: "Seguimiento",
    text: "¡Hola! Solo quería dar seguimiento a nuestra conversación anterior. ¿Hay algo más en lo que pueda ayudarte?",
  },
  {
    id: "info",
    icon: FileText,
    label: "Más info",
    text: "¿Podrías proporcionarme más información sobre tu consulta para poder ayudarte mejor?",
  },
  {
    id: "closing",
    icon: Zap,
    label: "Cierre",
    text: "¡Excelente! Si tienes alguna otra pregunta, no dudes en escribirnos. ¡Que tengas un excelente día!",
  },
  {
    id: "support",
    icon: MessageSquare,
    label: "Soporte",
    text: "Estamos aquí para ayudarte. ¿Cuál es tu consulta específica?",
  },
  {
    id: "confirm",
    icon: Sparkles,
    label: "Confirmar",
    text: "Perfecto, he entendido tu solicitud. Procederé a ayudarte de inmediato.",
  },
  {
    id: "apology",
    icon: Clock,
    label: "Disculpa",
    text: "Disculpa la demora. Voy a resolver tu consulta de inmediato.",
  },
  {
    id: "availability",
    icon: FileText,
    label: "Disponibilidad",
    text: "¿Cuándo tienes disponibilidad para una llamada? Estoy listo para ayudarte.",
  },
  {
    id: "redirect",
    icon: Zap,
    label: "Derivación",
    text: "Te voy a transferir con un especialista que podrá ayudarte mejor.",
  },
  {
    id: "feedback",
    icon: MessageSquare,
    label: "Opinión",
    text: "¿Qué te parece? Nos gustaría conocer tu opinión.",
  },
  {
    id: "offer",
    icon: Sparkles,
    label: "Oferta",
    text: "Tenemos una oferta especial para ti. ¿Te gustaría conocer los detalles?",
  },
];

const AI_SUGGESTIONS = [
  {
    id: "suggest1",
    text: "Generar respuesta profesional",
    icon: Bot,
  },
  {
    id: "suggest2",
    text: "Resumir conversaci\u00f3n",
    icon: Wand2,
  },
  {
    id: "suggest3",
    text: "Sugerir siguiente paso",
    icon: Sparkles,
  },
];

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    label: "Sonrisas",
    icon: Smile,
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😌", "😔", "😑", "😐", "😶", "🥱", "😏", "😒", "😞", "😔", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "😈", "👿"],
  },
  {
    id: "hands",
    label: "Manos",
    icon: Hand,
    emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
  },
  {
    id: "hearts",
    label: "Corazones",
    icon: Heart,
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌", "💢", "💥"],
  },
  {
    id: "celebration",
    label: "Celebración",
    icon: Sparkles,
    emojis: ["🎉", "🎊", "🎈", "🎀", "🎁", "🏆", "🥇", "🥈", "🥉", "⭐", "🌟", "✨", "⚡", "🔥", "💥", "🎯", "🚀", "🎂", "🍰", "🧁", "🍾", "🥂"],
  },
  {
    id: "symbols",
    label: "Símbolos",
    icon: Zap,
    emojis: ["✅", "💡", "🔥", "💯", "🎯", "💪", "🌈", "🏆", "🛡️", "💬", "📧", "📈", "🌐", "⚡", "🔔", "📢", "📣", "🎪", "🎭", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🎸", "🥁"],
  },
];

const DEFAULT_EMOJIS = ["😊", "👍", "❤️", "🎉", "🚀", "✨", "💯", "🔥", "👏", "🙌"];

export function QuickActionsBar({
  value,
  onChange,
  onSend,
  onSendWithFiles,
  isLoading = false,
  placeholder = "Escribe tu mensaje...",
  contactName,
}: QuickActionsBarProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [activeEmojiTab, setActiveEmojiTab] = useState("smileys");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): AttachedFile['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachedFiles: AttachedFile[] = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      type: getFileType(file),
    }));
    setAttachedFiles(prev => [...prev, ...newAttachedFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => {
      const file = prev[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSendWithAttachments = () => {
    if (attachedFiles.length > 0 && onSendWithFiles) {
      onSendWithFiles(attachedFiles.map(f => f.file), value.trim() || undefined);
      setAttachedFiles([]);
      onChange('');
    } else if (value.trim()) {
      onSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendWithAttachments();
    }
  };

  const insertTemplate = (text: string) => {
    const personalizedText = contactName 
      ? text.replace(/¡Hola!/g, `¡Hola ${contactName.split(" ")[0]}!`)
      : text;
    onChange(value + personalizedText);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji);
    textareaRef.current?.focus();
  };

  const handleAISuggestion = (suggestionId: string) => {
    setShowAI(false);
  };

  return (
    <div className="border-t border-border bg-card">
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Respuestas rápidas</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTemplates(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <div className="flex gap-2 pb-2 min-w-max">
                  {QUICK_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <motion.button
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => insertTemplate(template.text)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        <Icon className="w-3.5 h-3.5 text-primary" />
                        {template.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showAI && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-medium text-muted-foreground">Asistente IA</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAI(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {AI_SUGGESTIONS.map((suggestion) => {
                  const Icon = suggestion.icon;
                  return (
                    <motion.button
                      key={suggestion.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAISuggestion(suggestion.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-xs font-medium text-violet-600 dark:text-violet-400 transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {suggestion.text}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3">
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${showTemplates ? "bg-primary/10 text-primary" : ""}`}
                  onClick={() => {
                    setShowTemplates(!showTemplates);
                    setShowAI(false);
                  }}
                >
                  <Zap className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Respuestas rápidas</TooltipContent>
            </Tooltip>

            <Popover open={showEmojis} onOpenChange={setShowEmojis}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Smile className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Tabs value={activeEmojiTab} onValueChange={setActiveEmojiTab} className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b bg-muted/50 px-2 py-1">
                    {EMOJI_CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <TabsTrigger key={cat.id} value={cat.id} className="text-[10px] py-1.5 px-2">
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline ml-1 text-[10px]">{cat.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {EMOJI_CATEGORIES.map(category => (
                    <TabsContent key={category.id} value={category.id} className="p-2 m-0">
                      <div className="grid grid-cols-8 gap-0.5 max-h-56 overflow-y-auto scrollbar-thin">
                        {category.emojis.map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              insertEmoji(emoji);
                              setShowEmojis(false);
                            }}
                            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-muted rounded-md transition-colors hover:scale-110 transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${attachedFiles.length > 0 ? "bg-primary/10 text-primary" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adjuntar archivo</TooltipContent>
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex-1 relative">
            {attachedFiles.length > 0 && (
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent mb-2 -mx-3 px-3">
                <div className="flex gap-1.5 pb-1.5 min-w-max">
                  {attachedFiles.map((attached, index) => (
                    <div key={index} className="relative group flex-shrink-0">
                      {attached.type === 'image' && attached.preview ? (
                        <img 
                          src={attached.preview} 
                          alt={attached.file.name}
                          className="h-12 w-12 object-cover rounded-md border border-border"
                        />
                      ) : (
                        <div className="h-12 w-12 flex flex-col items-center justify-center rounded-md border border-border bg-muted/50">
                          {attached.type === 'video' && <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                          {attached.type === 'audio' && <Mic className="w-4 h-4 text-muted-foreground" />}
                          {attached.type === 'document' && <FileText className="w-4 h-4 text-muted-foreground" />}
                          <span className="text-[7px] text-muted-foreground mt-0.5 px-0.5 truncate max-w-full">
                            {attached.file.name.split('.').pop()?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => removeFile(index)}
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedFiles.length > 0 ? "Agrega un mensaje (opcional)..." : placeholder}
              disabled={isLoading}
              className="min-h-[40px] max-h-[120px] py-2.5 pr-12 text-sm resize-none"
              rows={1}
            />
            <div className="absolute right-2 bottom-2">
              <Button
                size="icon"
                onClick={handleSendWithAttachments}
                disabled={isLoading || (!value.trim() && attachedFiles.length === 0)}
                className="h-8 w-8 rounded-full"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-medium">Atajos:</span>
          <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono">
            Enter
          </Badge>
          <span className="text-[10px] text-muted-foreground">enviar</span>
          <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono">
            Shift+Enter
          </Badge>
          <span className="text-[10px] text-muted-foreground">nueva línea</span>
        </div>
      </div>
    </div>
  );
}
