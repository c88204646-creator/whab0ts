import { useState } from "react";
import { ChevronUp, Send, X, MessageCircle, Calendar, Phone, Mail, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WebChatWidgetProps {
  title: string;
  description: string;
  customColor: string;
  onClose: () => void;
  acceptingBookings: boolean;
  availableProducts: string[];
}

type WidgetStep = "welcome" | "info" | "products" | "appointment" | "confirmation";

export function WebChatWidget({ 
  title, 
  description, 
  customColor, 
  onClose, 
  acceptingBookings,
  availableProducts 
}: WebChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<WidgetStep>("welcome");
  const [visitorData, setVisitorData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [appointmentData, setAppointmentData] = useState({
    date: "",
    time: "",
  });
  const [messages, setMessages] = useState<{ type: "user" | "bot"; text: string }[]>([]);

  const addMessage = (type: "user" | "bot", text: string) => {
    setMessages(prev => [...prev, { type, text }]);
  };

  const handleNextStep = (step: WidgetStep) => {
    setCurrentStep(step);
  };

  const handleSubmitInfo = () => {
    if (!visitorData.name || !visitorData.email || !visitorData.phone) {
      addMessage("bot", "Por favor, completa todos los campos");
      return;
    }
    addMessage("user", `Hola, soy ${visitorData.name}`);
    setTimeout(() => {
      addMessage("bot", `Gracias ${visitorData.name}. Perfecto, veamos nuestros productos y servicios. ¿Cuál te interesa?`);
    }, 1000);
    handleNextStep("products");
  };

  const handleProductSelect = (product: string) => {
    setSelectedProducts(prev => 
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
  };

  const handleBookAppointment = () => {
    if (selectedProducts.length === 0) {
      addMessage("bot", "Por favor, selecciona al menos un producto");
      return;
    }
    addMessage("user", `Me interesan: ${selectedProducts.join(", ")}`);
    setTimeout(() => {
      addMessage("bot", "Excelente. Ahora, ¿cuándo te gustaría agendar una llamada?");
    }, 1000);
    handleNextStep("appointment");
  };

  const handleConfirmAppointment = () => {
    if (!appointmentData.date || !appointmentData.time) {
      addMessage("bot", "Por favor, selecciona fecha y hora");
      return;
    }
    addMessage("user", `Perfecto para el ${appointmentData.date} a las ${appointmentData.time}`);
    setTimeout(() => {
      addMessage("bot", "¡Listo! Hemos agendado tu cita. Te contactaremos pronto a " + visitorData.email);
    }, 1000);
    handleNextStep("confirmation");
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  // Estado cerrado: botón circular flotante
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center group relative"
          style={{
            backgroundColor: customColor,
            boxShadow: `0 8px 24px ${customColor}40`
          }}
          data-testid="button-open-widget"
        >
          <MessageSquare className="w-6 h-6 text-white" />
          
          {/* Pulso de animación */}
          <div 
            className="absolute inset-0 rounded-full animate-pulse opacity-30"
            style={{ backgroundColor: customColor }}
          />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-3 px-3 py-2 rounded-lg text-white text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ backgroundColor: customColor }}>
            {title}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-2 h-2"
              style={{ backgroundColor: customColor }} />
          </div>
        </button>
      </div>
    );
  }

  // Estado abierto: widget compacto
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 pointer-events-auto">
      <div 
        className="rounded-2xl shadow-2xl border flex flex-col overflow-hidden bg-white dark:bg-slate-950 transition-all duration-300"
        style={{
          borderColor: customColor + "20",
          boxShadow: `0 20px 50px ${customColor}25`
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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{title}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></div>
                <p className="text-xs opacity-90 font-medium">En línea</p>
              </div>
            </div>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleClose}
            className="h-8 w-8 hover:bg-white/15 text-white transition-colors flex-shrink-0"
            data-testid="button-close-widget"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50/50 dark:from-slate-900/50 to-background flex flex-col max-h-96">
          {/* Welcome Step */}
          {currentStep === "welcome" && (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <h2 className="text-base font-bold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Button
                onClick={() => {
                  addMessage("bot", "¿Cuál es tu nombre?");
                  handleNextStep("info");
                }}
                style={{ backgroundColor: customColor }}
                className="w-full text-white text-sm h-9"
              >
                Comenzar Chat
              </Button>
            </div>
          )}

          {/* Info Step */}
          {currentStep === "info" && (
            <div className="space-y-3 flex flex-col">
              {messages.length > 0 && (
                <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                          msg.type === "user"
                            ? "text-white rounded-br-none"
                            : "bg-muted text-foreground rounded-bl-none border border-border/50"
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
              )}
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1 mb-1">
                    <User className="w-3 h-3" /> Nombre
                  </label>
                  <Input
                    placeholder="Tu nombre..."
                    value={visitorData.name}
                    onChange={(e) => setVisitorData({...visitorData, name: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <Input
                    placeholder="tu@email.com"
                    type="email"
                    value={visitorData.email}
                    onChange={(e) => setVisitorData({...visitorData, email: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1 mb-1">
                    <Phone className="w-3 h-3" /> Teléfono
                  </label>
                  <Input
                    placeholder="+1234567890"
                    value={visitorData.phone}
                    onChange={(e) => setVisitorData({...visitorData, phone: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>
                <Button
                  onClick={handleSubmitInfo}
                  style={{ backgroundColor: customColor }}
                  className="w-full text-white text-xs h-8"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Products Step */}
          {currentStep === "products" && (
            <div className="space-y-3">
              {messages.length > 0 && (
                <div className="space-y-2 max-h-20 overflow-y-auto">
                  {messages.slice(-2).map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                          msg.type === "user"
                            ? "text-white rounded-br-none"
                            : "bg-muted text-foreground rounded-bl-none border border-border/50"
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
              )}
              <p className="text-xs text-muted-foreground font-semibold">Selecciona los que te interesan:</p>
              <div className="space-y-2">
                {availableProducts.map(product => (
                  <button
                    key={product}
                    onClick={() => handleProductSelect(product)}
                    className={`w-full p-2 rounded-lg border-2 text-left text-xs font-medium transition-colors ${
                      selectedProducts.includes(product)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-border/30 hover:border-border/50"
                    }`}
                  >
                    {product}
                  </button>
                ))}
              </div>
              {acceptingBookings && (
                <Button
                  onClick={handleBookAppointment}
                  style={{ backgroundColor: customColor }}
                  className="w-full text-white text-xs h-8"
                >
                  Agendar Cita
                </Button>
              )}
            </div>
          )}

          {/* Appointment Step */}
          {currentStep === "appointment" && (
            <div className="space-y-3">
              {messages.slice(-1).map((msg, idx) => (
                <div key={idx} className="flex justify-start">
                  <div className="max-w-xs px-3 py-2 rounded-lg text-xs bg-muted text-foreground rounded-bl-none border border-border/50">
                    {msg.text}
                  </div>
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" /> Fecha
                </label>
                <Input
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" /> Hora
                </label>
                <Input
                  type="time"
                  value={appointmentData.time}
                  onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                  className="h-8 text-xs"
                />
              </div>
              <Button
                onClick={handleConfirmAppointment}
                style={{ backgroundColor: customColor }}
                className="w-full text-white text-xs h-8"
              >
                Confirmar Cita
              </Button>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === "confirmation" && (
            <div className="space-y-3 flex flex-col justify-center flex-1">
              {messages.slice(-1).map((msg, idx) => (
                <div key={idx} className="flex justify-start">
                  <div className="max-w-xs px-3 py-2 rounded-lg text-xs bg-muted text-foreground rounded-bl-none border border-border/50">
                    {msg.text}
                  </div>
                </div>
              ))}
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-500/30 rounded-lg">
                <p className="text-xs font-semibold text-green-900 dark:text-green-200">¡Cita agendada!</p>
                <p className="text-xs text-green-800 dark:text-green-300 mt-1">
                  Te contactaremos el {appointmentData.date} a las {appointmentData.time}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Clock icon component
const Clock = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);
