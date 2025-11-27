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
  Wand2
} from "lucide-react";
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

interface QuickActionsBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  placeholder?: string;
  contactName?: string;
}

const QUICK_TEMPLATES = [
  {
    id: "greeting",
    icon: MessageSquare,
    label: "Saludo",
    text: "\u00a1Hola! \u00bfC\u00f3mo puedo ayudarte hoy?",
  },
  {
    id: "thanks",
    icon: Sparkles,
    label: "Agradecimiento",
    text: "\u00a1Gracias por tu mensaje! Te responderemos a la brevedad.",
  },
  {
    id: "followup",
    icon: Clock,
    label: "Seguimiento",
    text: "\u00a1Hola! Solo quer\u00eda dar seguimiento a nuestra conversaci\u00f3n anterior. \u00bfHay algo m\u00e1s en lo que pueda ayudarte?",
  },
  {
    id: "info",
    icon: FileText,
    label: "M\u00e1s info",
    text: "\u00bfPodr\u00edas proporcionarme m\u00e1s informaci\u00f3n sobre tu consulta para poder ayudarte mejor?",
  },
  {
    id: "closing",
    icon: Zap,
    label: "Cierre",
    text: "\u00a1Excelente! Si tienes alguna otra pregunta, no dudes en escribirnos. \u00a1Que tengas un excelente d\u00eda!",
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

const COMMON_EMOJIS = [
  "\ud83d\udc4b", "\ud83d\ude0a", "\ud83d\udc4d", "\u2764\ufe0f", "\ud83d\ude4f", "\ud83c\udf89", "\ud83d\ude80", "\ud83d\udcaf",
  "\u2705", "\ud83d\udca1", "\ud83d\udd25", "\ud83c\udf1f", "\ud83d\ude0d", "\ud83e\udd14", "\ud83d\udc4c", "\ud83d\udcaa",
  "\u2728", "\ud83c\udf08", "\ud83c\udfaf", "\ud83d\udee1\ufe0f", "\ud83d\udcac", "\ud83d\udce7", "\ud83d\udcc8", "\ud83c\udf10",
];

export function QuickActionsBar({
  value,
  onChange,
  onSend,
  isLoading = false,
  placeholder = "Escribe tu mensaje...",
  contactName,
}: QuickActionsBarProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      onSend();
    }
  };

  const insertTemplate = (text: string) => {
    const personalizedText = contactName 
      ? text.replace(/\u00a1Hola!/g, `\u00a1Hola ${contactName.split(" ")[0]}!`)
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
                <span className="text-xs font-medium text-muted-foreground">Respuestas r\u00e1pidas</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTemplates(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <motion.button
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => insertTemplate(template.text)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      {template.label}
                    </motion.button>
                  );
                })}
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
                  className={`h-9 w-9 ${showTemplates ? "bg-primary/10 text-primary" : ""}`}
                  onClick={() => {
                    setShowTemplates(!showTemplates);
                    setShowAI(false);
                  }}
                >
                  <Zap className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Respuestas r\u00e1pidas</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 ${showAI ? "bg-violet-500/10 text-violet-600" : ""}`}
                  onClick={() => {
                    setShowAI(!showAI);
                    setShowTemplates(false);
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Asistente IA</TooltipContent>
            </Tooltip>

            <Popover open={showEmojis} onOpenChange={setShowEmojis}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="grid grid-cols-8 gap-1">
                  {COMMON_EMOJIS.map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        insertEmoji(emoji);
                        setShowEmojis(false);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Paperclip className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adjuntar archivo</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="min-h-[40px] max-h-[120px] py-2.5 pr-12 text-sm resize-none"
              rows={1}
            />
            <div className="absolute right-2 bottom-2">
              <Button
                size="icon"
                onClick={onSend}
                disabled={isLoading || !value.trim()}
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

        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-muted-foreground">Atajos:</span>
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
            Enter
          </Badge>
          <span className="text-[10px] text-muted-foreground">enviar</span>
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
            Shift+Enter
          </Badge>
          <span className="text-[10px] text-muted-foreground">nueva l\u00ednea</span>
        </div>
      </div>
    </div>
  );
}
