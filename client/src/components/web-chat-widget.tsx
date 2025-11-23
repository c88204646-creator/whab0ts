import { useState } from "react";
import { ChevronUp, Send, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WebChatWidgetProps {
  chatbotName: string;
  customColor: string;
  onClose: () => void;
}

export function WebChatWidget({ chatbotName, customColor, onClose }: WebChatWidgetProps) {
  const [messages, setMessages] = useState<{ type: "user" | "bot"; text: string }[]>([
    { type: "bot", text: "¡Hola! Soy un asistente de IA. ¿Cómo puedo ayudarte?" }
  ]);
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    setMessages(prev => [...prev, { type: "user", text: trimmed }]);
    setInput("");
    
    // Simular respuesta del chatbot
    setTimeout(() => {
      setMessages(prev => [...prev, { type: "bot", text: "Gracias por tu mensaje. Estoy procesando tu consulta..." }]);
    }, 800);
  };

  return (
    <>
      {/* Widget Container */}
      <div 
        className={`fixed bottom-6 right-6 rounded-3xl shadow-2xl border flex flex-col z-50 transition-all duration-300 overflow-hidden ${
          isMinimized ? "w-72 h-14" : "w-96 h-[32rem]"
        }`}
        style={{
          backgroundColor: "#ffffff",
          borderColor: customColor + "15",
          boxShadow: `0 10px 40px ${customColor}15`
        }}
        data-testid="widget-container"
      >
        {/* Header */}
        <div 
          className="px-5 py-4 text-white flex items-center justify-between flex-shrink-0"
          style={{ 
            backgroundColor: customColor,
            backgroundImage: `linear-gradient(135deg, ${customColor} 0%, ${customColor}dd 100%)`
          }}
        >
          <div className="min-w-0 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{chatbotName}</h3>
              {!isMinimized && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-300"></div>
                  <p className="text-xs opacity-90 font-medium">En línea</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 hover:bg-white/15 text-white transition-colors"
              data-testid="button-minimize-widget"
            >
              <ChevronUp className={`w-4 h-4 transition-transform ${isMinimized ? "rotate-180" : ""}`} />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onClose}
              className="h-8 w-8 hover:bg-white/15 text-white transition-colors"
              data-testid="button-close-widget-preview"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages & Input */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-muted/30 to-background">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-medium ${
                      msg.type === "user"
                        ? `text-white rounded-br-sm`
                        : "bg-muted text-foreground rounded-bl-sm border border-border/50"
                    }`}
                    style={{
                      backgroundColor: msg.type === "user" ? customColor : undefined
                    }}
                    data-testid={`message-${msg.type}-${idx}`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Footer */}
            <div className="border-t border-border/20 px-4 py-3.5 flex gap-2.5 bg-background flex-shrink-0">
              <Input
                placeholder="Escribe tu mensaje..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 h-9 text-sm border-border/50 bg-muted/30 placeholder:text-muted-foreground/60 focus:bg-muted/50 rounded-lg"
                data-testid="input-widget-message"
                autoComplete="off"
              />
              <button
                onClick={handleSend}
                className="h-9 w-9 flex-shrink-0 rounded-lg flex items-center justify-center text-white hover:shadow-lg transition-all duration-200 active:scale-95"
                style={{ 
                  backgroundColor: customColor,
                  boxShadow: `0 2px 8px ${customColor}40`
                }}
                data-testid="button-widget-send"
                type="button"
                title="Enviar"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
