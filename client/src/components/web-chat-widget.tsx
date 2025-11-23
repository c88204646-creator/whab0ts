import { useState } from "react";
import { ChevronUp, Send, X } from "lucide-react";
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
    if (!input.trim()) return;
    
    setMessages([...messages, { type: "user", text: input }]);
    setInput("");
    
    // Simular respuesta del chatbot
    setTimeout(() => {
      setMessages(prev => [...prev, { type: "bot", text: "Gracias por tu mensaje. Estoy procesando tu consulta..." }]);
    }, 500);
  };

  return (
    <>
      {/* Widget Container */}
      <div 
        className={`fixed bottom-6 right-6 rounded-2xl shadow-2xl border border-border bg-background flex flex-col z-50 transition-all duration-300 ${
          isMinimized ? "w-72 h-16" : "w-80 h-96"
        }`}
        style={{
          backgroundColor: "white",
          borderColor: customColor + "20"
        }}
      >
        {/* Header */}
        <div 
          className="px-4 py-3 rounded-t-2xl text-white flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: customColor }}
        >
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight">{chatbotName}</h3>
            {!isMinimized && <p className="text-xs opacity-85">Siempre disponible</p>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 hover:bg-white/20 text-white"
              data-testid="button-minimize-widget"
            >
              <ChevronUp className={`w-4 h-4 transition-transform ${isMinimized ? "rotate-180" : ""}`} />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onClose}
              className="h-6 w-6 hover:bg-white/20 text-white"
              data-testid="button-close-widget-preview"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm leading-tight ${
                      msg.type === "user"
                        ? `text-white`
                        : "bg-muted text-foreground"
                    }`}
                    style={{
                      backgroundColor: msg.type === "user" ? customColor : undefined
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2 bg-background rounded-b-2xl flex-shrink-0">
              <Input
                placeholder="Escribe aquí..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 h-8 text-xs"
                data-testid="input-widget-message"
              />
              <Button
                size="icon"
                onClick={handleSend}
                className="h-8 w-8 flex-shrink-0"
                style={{ backgroundColor: customColor }}
                data-testid="button-widget-send"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
