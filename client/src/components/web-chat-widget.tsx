import { useState } from "react";
import { X, Send } from "lucide-react";
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
    <div 
      className="fixed bottom-6 right-6 w-96 h-[500px] rounded-lg shadow-2xl border border-border bg-background flex flex-col z-50"
      style={{
        backgroundColor: "white",
        borderColor: customColor + "30"
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 rounded-t-lg text-white flex items-center justify-between"
        style={{ backgroundColor: customColor }}
      >
        <div>
          <h3 className="font-semibold text-sm">{chatbotName}</h3>
          <p className="text-xs opacity-90">Siempre disponible</p>
        </div>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
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
      <div className="border-t border-border p-3 flex gap-2 bg-background">
        <Input
          placeholder="Escribe aquí..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-9 text-sm"
          data-testid="input-widget-message"
        />
        <Button
          size="icon"
          onClick={handleSend}
          className="h-9 w-9"
          style={{ backgroundColor: customColor }}
          data-testid="button-widget-send"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
