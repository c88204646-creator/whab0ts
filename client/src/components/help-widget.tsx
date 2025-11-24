import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Search, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords: string[];
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "1",
    title: "¿Cómo conectar una cuenta de WhatsApp?",
    category: "conversations",
    content: "1. Ve a Conexiones\n2. Haz clic en 'Agregar Cuenta'\n3. Escanea el código QR con tu teléfono\n4. Confirma el acceso",
    keywords: ["conexión", "whatsapp", "cuenta", "conectar", "qr"]
  },
  {
    id: "2",
    title: "Gestionar conversaciones",
    category: "conversations",
    content: "Las conversaciones se clasifican automáticamente por categoría (Ventas, Soporte, etc.).\n\n- Puedes cambiar la categoría manualmente\n- Asigna prioridad (Baja, Normal, Alta, Urgente)\n- Usa tags para organizar chats",
    keywords: ["conversaciones", "gestionar", "categoría", "prioridad", "tags"]
  },
  {
    id: "3",
    title: "Crear y gestionar chatbots",
    category: "chatbots",
    content: "Los chatbots automatizan respuestas:\n\n1. Ve a Chatbots\n2. Crea un nuevo chatbot\n3. Agrega reglas (disparadores)\n4. Vincula una base de conocimiento\n5. El chatbot responde automáticamente según las reglas",
    keywords: ["chatbot", "automatización", "reglas", "respuestas", "crear"]
  },
  {
    id: "4",
    title: "Base de conocimiento para chatbots",
    category: "chatbots",
    content: "La base de conocimiento permite que los chatbots den respuestas precisas:\n\n1. Ve a tu chatbot\n2. Abre 'Base de Conocimiento'\n3. Organiza por categorías\n4. Agrega artículos con respuestas\n5. El chatbot usa esto para responder preguntas",
    keywords: ["base conocimiento", "kb", "respuestas", "chatbot", "artículos"]
  },
  {
    id: "5",
    title: "Agendar citas en el Calendario",
    category: "calendar",
    content: "El calendario integrado con WhatsApp:\n\n1. Ve a Calendario\n2. Selecciona una fecha\n3. Haz clic en 'Nueva Cita'\n4. Ingresa los detalles\n5. Se sincroniza automáticamente con WhatsApp",
    keywords: ["calendario", "citas", "agendar", "eventos", "fechas"]
  },
  {
    id: "6",
    title: "Crear encuestas",
    category: "surveys",
    content: "Las encuestas permiten recopilar opiniones:\n\n1. Ve a Encuestas\n2. Haz clic en 'Nueva Encuesta'\n3. Agrega preguntas (múltiple opción, texto, etc.)\n4. Genera un enlace público\n5. Comparte con clientes para responder",
    keywords: ["encuesta", "survey", "preguntas", "opiniones", "respuestas"]
  },
  {
    id: "7",
    title: "Gestionar rifas y sorteos",
    category: "raffles",
    content: "Sistema completo de rifas:\n\n1. Crea una rifa con detalles\n2. Define boletos y precios\n3. Agrega una página pública\n4. Los clientes compran boletos\n5. Verifica pagos y elige ganador",
    keywords: ["rifa", "sorteo", "boletos", "ventas", "ganador"]
  },
  {
    id: "8",
    title: "CRM - Gestionar clientes y leads",
    category: "crm",
    content: "Organiza tu base de clientes:\n\n- Clientes: Relaciones establecidas\n- Leads: Prospectos nuevos\n- Puedes cambiar el estado de cada contacto\n- Asigna propiedades personalizadas\n- Realiza seguimiento de interacciones",
    keywords: ["crm", "clientes", "leads", "contactos", "base datos"]
  },
  {
    id: "9",
    title: "Analytics - Embudo de Ventas",
    category: "analytics",
    content: "Visualiza tu embudo de ventas:\n\n- Los chats se clasifican automáticamente en 5 categorías\n- Ventas: Prospectos interesados\n- Soporte: Consultas técnicas\n- Quejas: Problemas de clientes\n- VIP: Clientes importantes\n- Consultas: Preguntas generales\n\nObserva el flujo de conversiones.",
    keywords: ["analytics", "embudo", "ventas", "clasificación", "categorías"]
  },
  {
    id: "10",
    title: "¿Cómo funciona la clasificación automática?",
    category: "analytics",
    content: "El sistema analiza los mensajes y los clasifica automáticamente:\n\n- Detecta palabras clave relacionadas\n- Usa patrones de conversación\n- Asigna confianza (0-100%)\n- Se mejora con más datos\n- Puedes corregir manualmente",
    keywords: ["clasificación", "automática", "análisis", "patrones", "ia"]
  },
  {
    id: "11",
    title: "Características de seguridad",
    category: "general",
    content: "Tu plataforma está protegida:\n\n- Las contraseñas se cifran\n- Las sesiones se protegen con tokens\n- Los datos están en servidores seguros\n- No compartimos datos con terceros\n- Cumplimos con estándares de privacidad",
    keywords: ["seguridad", "privacidad", "datos", "protección", "cifrado"]
  },
  {
    id: "12",
    title: "Contacto y soporte",
    category: "general",
    content: "¿Necesitas ayuda adicional?\n\n- Este widget de ayuda está disponible 24/7\n- Busca por palabras clave\n- Consulta el artículo relevante para tu pregunta\n- Si no encuentras respuesta, reporta el problema",
    keywords: ["soporte", "ayuda", "contacto", "problema", "asistencia"]
  }
];

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>(HELP_ARTICLES);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = HELP_ARTICLES.filter((article) => {
      const query = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.keywords.some(k => k.toLowerCase().includes(query))
      );
    });
    setFilteredArticles(filtered);
  }, [searchQuery]);

  const categoryColors: Record<string, string> = {
    conversations: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    chatbots: "bg-green-500/20 text-green-600 dark:text-green-400",
    calendar: "bg-red-500/20 text-red-600 dark:text-red-400",
    surveys: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    raffles: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    crm: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
    analytics: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    general: "bg-gray-500/20 text-gray-600 dark:text-gray-400"
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-help-widget"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center hover-elevate"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-xl flex flex-col max-h-96" data-testid="help-widget-window">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
            {selectedArticle ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1 hover:bg-primary-foreground/20 rounded transition-colors"
                  data-testid="button-back-help"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-semibold text-sm truncate">{selectedArticle.title}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {selectedArticle.category}
                  </Badge>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold">Centro de Ayuda</h3>
                <p className="text-xs text-primary-foreground/80 mt-1">Aprende a usar la plataforma</p>
              </div>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {selectedArticle ? (
              <div className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedArticle.content}
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Palabras clave:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors group"
                      data-testid={`help-article-${article.id}`}
                    >
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {article.title}
                      </p>
                      <Badge className={`mt-2 text-xs ${categoryColors[article.category]}`}>
                        {article.category}
                      </Badge>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No se encontraron artículos</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Search Input */}
          {!selectedArticle && (
            <div className="border-t border-border p-3 bg-muted/30 rounded-b-lg">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar artículos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  data-testid="input-help-search"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
