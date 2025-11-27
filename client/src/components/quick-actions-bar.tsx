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
  // Saludos
  {
    id: "greeting_1",
    category: "Saludos",
    icon: MessageSquare,
    label: "Hola amable",
    text: "¡Hola! ¿Cómo puedo ayudarte hoy?",
  },
  {
    id: "greeting_2",
    category: "Saludos",
    icon: MessageSquare,
    label: "Bienvenida",
    text: "¡Bienvenido! Es un placer saludarte.",
  },
  {
    id: "greeting_3",
    category: "Saludos",
    icon: MessageSquare,
    label: "Buenos días",
    text: "¡Buenos días! Espero te encuentres bien.",
  },
  {
    id: "greeting_4",
    category: "Saludos",
    icon: MessageSquare,
    label: "¿Cómo estás?",
    text: "¿Cómo estás? Dime cómo puedo ayudarte.",
  },
  // Agradecimiento
  {
    id: "thanks_1",
    category: "Agradecimiento",
    icon: Heart,
    label: "Gracias básico",
    text: "¡Gracias por tu mensaje! Te responderemos a la brevedad.",
  },
  {
    id: "thanks_2",
    category: "Agradecimiento",
    icon: Heart,
    label: "Gracias por elegir",
    text: "¡Gracias por elegirnos! Estamos comprometidos a brindarte el mejor servicio.",
  },
  {
    id: "thanks_3",
    category: "Agradecimiento",
    icon: Heart,
    label: "Agradecido",
    text: "Te agradezco tu paciencia y comprensión. Trabajaremos para resolverlo.",
  },
  {
    id: "thanks_4",
    category: "Agradecimiento",
    icon: Heart,
    label: "Valoro tu confianza",
    text: "Valoro mucho tu confianza. Haré mi mejor esfuerzo para ayudarte.",
  },
  // Seguimiento
  {
    id: "followup_1",
    category: "Seguimiento",
    icon: Clock,
    label: "Seguimiento suave",
    text: "¡Hola! Solo quería dar seguimiento a nuestra conversación anterior. ¿Hay algo más en lo que pueda ayudarte?",
  },
  {
    id: "followup_2",
    category: "Seguimiento",
    icon: Clock,
    label: "Revisión de estado",
    text: "¿Cómo va todo con lo que hablamos? ¿Necesitas algún ajuste?",
  },
  {
    id: "followup_3",
    category: "Seguimiento",
    icon: Clock,
    label: "Próximo paso",
    text: "¿Avanzamos con el siguiente paso? Estoy aquí para apoyarte.",
  },
  {
    id: "followup_4",
    category: "Seguimiento",
    icon: Clock,
    label: "Recordatorio",
    text: "Solo te recordaba de nuestro compromiso. ¿Todo está en orden?",
  },
  // Información
  {
    id: "info_1",
    category: "Información",
    icon: FileText,
    label: "Más detalles",
    text: "¿Podrías proporcionarme más información sobre tu consulta para poder ayudarte mejor?",
  },
  {
    id: "info_2",
    category: "Información",
    icon: FileText,
    label: "Especificaciones",
    text: "Para poder asesorarte adecuadamente, me gustaría saber más detalles.",
  },
  {
    id: "info_3",
    category: "Información",
    icon: FileText,
    label: "Clarificación",
    text: "Solo necesito aclarar algunos puntos. ¿Podrías confirmar esto?",
  },
  {
    id: "info_4",
    category: "Información",
    icon: FileText,
    label: "Presupuesto",
    text: "¿Cuál es tu presupuesto estimado para poder ofrecerte las mejores opciones?",
  },
  // Cierre
  {
    id: "closing_1",
    category: "Cierre",
    icon: Zap,
    label: "Cierre amable",
    text: "¡Excelente! Si tienes alguna otra pregunta, no dudes en escribirnos. ¡Que tengas un excelente día!",
  },
  {
    id: "closing_2",
    category: "Cierre",
    icon: Zap,
    label: "Despedida",
    text: "Ha sido un placer ayudarte. Espero que todo funcione a tu satisfacción.",
  },
  {
    id: "closing_3",
    category: "Cierre",
    icon: Zap,
    label: "Éxito",
    text: "¡Adelante con tu proyecto! Confío en que todo saldrá bien.",
  },
  // Soporte
  {
    id: "support_1",
    category: "Soporte",
    icon: ThumbsUp,
    label: "Disponibilidad",
    text: "Estamos aquí para ayudarte. ¿Cuál es tu consulta específica?",
  },
  {
    id: "support_2",
    category: "Soporte",
    icon: ThumbsUp,
    label: "Problemas técnicos",
    text: "¿Tienes algún problema técnico? Cuéntame qué sucede y lo resolveremos juntos.",
  },
  {
    id: "support_3",
    category: "Soporte",
    icon: ThumbsUp,
    label: "Guía paso a paso",
    text: "Te guiaré paso a paso a través del proceso. Será rápido y fácil.",
  },
  // Confirmación
  {
    id: "confirm_1",
    category: "Confirmación",
    icon: ThumbsUp,
    label: "Entendido",
    text: "Perfecto, he entendido tu solicitud. Procederé a ayudarte de inmediato.",
  },
  {
    id: "confirm_2",
    category: "Confirmación",
    icon: ThumbsUp,
    label: "Aprobado",
    text: "Excelente, procederé con tu solicitud según lo conversado.",
  },
  {
    id: "confirm_3",
    category: "Confirmación",
    icon: ThumbsUp,
    label: "Registrado",
    text: "Perfecto, he registrado todos tus datos. Enseguida procedeemos.",
  },
  // Disculpa
  {
    id: "apology_1",
    category: "Disculpa",
    icon: Smile,
    label: "Disculpa por demora",
    text: "Disculpa la demora. Voy a resolver tu consulta de inmediato.",
  },
  {
    id: "apology_2",
    category: "Disculpa",
    icon: Smile,
    label: "Sentimos el inconveniente",
    text: "Sentimos el inconveniente que esto te ha causado. Lo arreglaremos pronto.",
  },
  {
    id: "apology_3",
    category: "Disculpa",
    icon: Smile,
    label: "Nuestro error",
    text: "Nuestro error, te pido disculpas. Procederemos a solucionarlo ahora mismo.",
  },
  // Disponibilidad
  {
    id: "availability_1",
    category: "Disponibilidad",
    icon: Clock,
    label: "Horario",
    text: "¿Cuándo tienes disponibilidad? Prefiero horarios entre 9 AM - 6 PM.",
  },
  {
    id: "availability_2",
    category: "Disponibilidad",
    icon: Clock,
    label: "Videoconferencia",
    text: "¿Te vendría bien una videollamada para discutir esto con más detalle?",
  },
  {
    id: "availability_3",
    category: "Disponibilidad",
    icon: Clock,
    label: "Agenda",
    text: "Déjame chequear mi agenda y te propongo algunos horarios.",
  },
  // Derivación
  {
    id: "redirect_1",
    category: "Derivación",
    icon: Zap,
    label: "Especialista",
    text: "Te voy a transferir con un especialista que podrá ayudarte mejor.",
  },
  {
    id: "redirect_2",
    category: "Derivación",
    icon: Zap,
    label: "Departamento",
    text: "Te derivaré con el departamento correcto para tu consulta.",
  },
  {
    id: "redirect_3",
    category: "Derivación",
    icon: Zap,
    label: "Otro equipo",
    text: "Creo que otro equipo está mejor capacitado para ayudarte. Los contactaré.",
  },
  // Opinión
  {
    id: "feedback_1",
    category: "Opinión",
    icon: MessageSquare,
    label: "¿Qué te parece?",
    text: "¿Qué te parece? Nos gustaría conocer tu opinión.",
  },
  {
    id: "feedback_2",
    category: "Opinión",
    icon: MessageSquare,
    label: "Calificación",
    text: "¿Cómo calificarías el servicio que recibiste?",
  },
  {
    id: "feedback_3",
    category: "Opinión",
    icon: MessageSquare,
    label: "Sugerencias",
    text: "¿Tienes alguna sugerencia para mejorar? Tu opinión es valiosa para nosotros.",
  },
  // Oferta
  {
    id: "offer_1",
    category: "Oferta",
    icon: Sparkles,
    label: "Oferta especial",
    text: "Tenemos una oferta especial para ti. ¿Te gustaría conocer los detalles?",
  },
  {
    id: "offer_2",
    category: "Oferta",
    icon: Sparkles,
    label: "Descuento",
    text: "Como cliente valioso, te ofrecemos un 20% de descuento. ¿Te interesa?",
  },
  {
    id: "offer_3",
    category: "Oferta",
    icon: Sparkles,
    label: "Promoción",
    text: "Tenemos una promoción vigente que puede interesarte. Déjame enviarte más info.",
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
              <div className="space-y-2">
                {Array.from(new Set(QUICK_TEMPLATES.map(t => t.category))).map((category) => (
                  <div key={category}>
                    <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">
                      {category}
                    </div>
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                      <div className="flex gap-1.5 pb-2 min-w-max px-2">
                        {QUICK_TEMPLATES.filter(t => t.category === category).map((template) => {
                          const Icon = template.icon;
                          return (
                            <motion.button
                              key={template.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => insertTemplate(template.text)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-transparent hover:bg-muted/50 text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0"
                              data-testid={`template-${template.id}`}
                            >
                              <Icon className="w-3 h-3 text-primary" />
                              {template.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
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
              <PopoverContent className="w-80 p-0 max-w-96" align="start" side="bottom">
                <Tabs value={activeEmojiTab} onValueChange={setActiveEmojiTab} className="w-full">
                  <div className="overflow-x-auto scrollbar-thin border-b bg-muted/50">
                    <TabsList className="w-full justify-start rounded-none px-2 py-1 flex-nowrap">
                      {EMOJI_CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        return (
                          <TabsTrigger key={cat.id} value={cat.id} className="text-[10px] py-1.5 px-2 flex-shrink-0" data-testid={`emoji-tab-${cat.id}`}>
                            <Icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline ml-1 text-[10px]">{cat.label}</span>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>
                  {EMOJI_CATEGORIES.map(category => (
                    <TabsContent key={category.id} value={category.id} className="p-2 m-0">
                      <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto scrollbar-thin">
                        {category.emojis.map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              insertEmoji(emoji);
                              setShowEmojis(false);
                            }}
                            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-muted rounded-md transition-colors hover:scale-110 transform"
                            data-testid={`emoji-${emoji}`}
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
              <div className="overflow-x-auto scrollbar-thin mb-2 -mx-3 px-3">
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
