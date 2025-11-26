import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Building2, 
  Package, 
  Briefcase, 
  HelpCircle, 
  Calendar, 
  Shield,
  Save,
  Plus,
  Trash2,
  Loader2,
  Bot,
  Mic
} from "lucide-react";

interface CompanyProfile {
  name: string;
  description: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  businessHours: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  inStock: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationMinutes: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

interface CalendarPolicy {
  enabled: boolean;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  linkedCalendarUserId: string;
  autoConfirm: boolean;
}

interface ToolPermissions {
  canCheckAvailability: boolean;
  canBookAppointments: boolean;
  canCreateLead: boolean;
  canAccessClientData: boolean;
}

interface AgentPersonality {
  tone: string;
  greeting: string;
  farewell: string;
  onHoldMessage: string;
  transferMessage: string;
}

interface Voice {
  voice_id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
  description: string | null;
  voiceId: string;
  voiceName: string | null;
  language: string;
  companyProfile: CompanyProfile | null;
  products: Product[] | null;
  services: Service[] | null;
  faqs: FAQ[] | null;
  calendarPolicy: CalendarPolicy | null;
  toolPermissions: ToolPermissions | null;
  personality: AgentPersonality | null;
}

const defaultCompanyProfile: CompanyProfile = {
  name: "",
  description: "",
  industry: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  businessHours: "Lunes a Viernes 9:00 - 18:00",
};

const defaultCalendarPolicy: CalendarPolicy = {
  enabled: true,
  minNoticeMinutes: 60,
  maxAdvanceDays: 30,
  linkedCalendarUserId: "",
  autoConfirm: true,
};

const defaultToolPermissions: ToolPermissions = {
  canCheckAvailability: true,
  canBookAppointments: true,
  canCreateLead: true,
  canAccessClientData: false,
};

const defaultPersonality: AgentPersonality = {
  tone: "profesional",
  greeting: "¡Hola! Gracias por llamar. ¿En qué puedo ayudarle hoy?",
  farewell: "Gracias por su llamada. ¡Que tenga un excelente día!",
  onHoldMessage: "Un momento por favor, estoy verificando la información.",
  transferMessage: "Lo transfiero con uno de nuestros asesores. Un momento.",
};

export default function AIVoiceAgentConfigPage() {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const agentId = params.id;

  const userId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}").id;
    } catch {
      return null;
    }
  }, []);

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(defaultCompanyProfile);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [calendarPolicy, setCalendarPolicy] = useState<CalendarPolicy>(defaultCalendarPolicy);
  const [toolPermissions, setToolPermissions] = useState<ToolPermissions>(defaultToolPermissions);
  const [personality, setPersonality] = useState<AgentPersonality>(defaultPersonality);
  const [basicInfo, setBasicInfo] = useState({ name: "", description: "", voiceId: "", voiceName: "", language: "es" });
  const [hasChanges, setHasChanges] = useState(false);

  const { data: agent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: ["/api/ai-voice/agents", agentId],
    enabled: !!agentId,
  });

  const { data: voices = [] } = useQuery<Voice[]>({
    queryKey: ["/api/ai-voice/voices"],
  });

  useEffect(() => {
    if (agent) {
      setBasicInfo({
        name: agent.name || "",
        description: agent.description || "",
        voiceId: agent.voiceId || "",
        voiceName: agent.voiceName || "",
        language: agent.language || "es",
      });
      setCompanyProfile(agent.companyProfile || defaultCompanyProfile);
      setProducts(agent.products || []);
      setServices(agent.services || []);
      setFaqs(agent.faqs || []);
      setCalendarPolicy(agent.calendarPolicy || defaultCalendarPolicy);
      setToolPermissions(agent.toolPermissions || defaultToolPermissions);
      setPersonality(agent.personality || defaultPersonality);
    }
  }, [agent]);

  const updateAgentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/ai-voice/agents/${agentId}?userId=${userId}`, {
        name: basicInfo.name,
        description: basicInfo.description,
        voiceId: basicInfo.voiceId,
        voiceName: basicInfo.voiceName,
        language: basicInfo.language,
        companyProfile,
        products,
        services,
        faqs,
        calendarPolicy,
        toolPermissions,
        personality,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-voice/agents"] });
      setHasChanges(false);
      toast({
        title: "Cambios guardados",
        description: "La configuración del agente ha sido actualizada",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al guardar los cambios",
        variant: "destructive",
      });
    },
  });

  const addProduct = () => {
    setProducts([...products, {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      price: 0,
      currency: "MXN",
      category: "",
      inStock: true,
    }]);
    setHasChanges(true);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    setHasChanges(true);
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    setHasChanges(true);
  };

  const addService = () => {
    setServices([...services, {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      price: 0,
      currency: "MXN",
      durationMinutes: 60,
    }]);
    setHasChanges(true);
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
    setHasChanges(true);
  };

  const updateService = (id: string, field: keyof Service, value: any) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
    setHasChanges(true);
  };

  const addFAQ = () => {
    setFaqs([...faqs, {
      id: crypto.randomUUID(),
      question: "",
      answer: "",
      tags: [],
    }]);
    setHasChanges(true);
  };

  const removeFAQ = (id: string) => {
    setFaqs(faqs.filter(f => f.id !== id));
    setHasChanges(true);
  };

  const updateFAQ = (id: string, field: keyof FAQ, value: any) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
    setHasChanges(true);
  };

  if (agentLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-6 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/ai-voice-agents")}
                data-testid="button-back"
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 border border-red-400/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-foreground truncate">{basicInfo.name || "Agente IA"}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Configuración completa del agente</p>
              </div>
            </div>
            <Button
              onClick={() => updateAgentMutation.mutate()}
              disabled={updateAgentMutation.isPending || !hasChanges}
              className="flex-shrink-0 gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              data-testid="button-save-agent"
              size="sm"
            >
              {updateAgentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Guardar</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1 mb-6 bg-muted/50 p-1 w-full">
            <TabsTrigger value="basic" className="flex items-center gap-2" data-testid="tab-basic">
              <Bot className="w-4 h-4" />
              <span className="hidden md:inline">Básico</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2" data-testid="tab-company">
              <Building2 className="w-4 h-4" />
              <span className="hidden md:inline">Empresa</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2" data-testid="tab-products">
              <Package className="w-4 h-4" />
              <span className="hidden md:inline">Productos</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2" data-testid="tab-services">
              <Briefcase className="w-4 h-4" />
              <span className="hidden md:inline">Servicios</span>
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-2" data-testid="tab-faqs">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden md:inline">FAQs</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2" data-testid="tab-calendar">
              <Calendar className="w-4 h-4" />
              <span className="hidden md:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2" data-testid="tab-permissions">
              <Shield className="w-4 h-4" />
              <span className="hidden md:inline">Permisos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-red-600" />
                  Información Básica
                </CardTitle>
                <CardDescription>Configura el nombre, voz e idioma del agente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Agente</Label>
                    <Input
                      id="name"
                      value={basicInfo.name}
                      onChange={(e) => { setBasicInfo({ ...basicInfo, name: e.target.value }); setHasChanges(true); }}
                      placeholder="Ej: Asistente de Ventas"
                      data-testid="input-agent-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select 
                      value={basicInfo.language} 
                      onValueChange={(v) => { setBasicInfo({ ...basicInfo, language: v }); setHasChanges(true); }}
                    >
                      <SelectTrigger data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={basicInfo.description}
                    onChange={(e) => { setBasicInfo({ ...basicInfo, description: e.target.value }); setHasChanges(true); }}
                    placeholder="Describe brevemente el propósito de este agente"
                    rows={2}
                    data-testid="input-agent-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Voz</Label>
                  <Select 
                    value={basicInfo.voiceId} 
                    onValueChange={(v) => {
                      const voice = voices.find((vo: any) => vo.voice_id === v);
                      setBasicInfo({ ...basicInfo, voiceId: v, voiceName: voice?.name || "" });
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger data-testid="select-voice">
                      <SelectValue placeholder="Selecciona una voz" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice: any) => (
                        <SelectItem key={voice.voice_id} value={voice.voice_id}>
                          <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4" />
                            {voice.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-red-600" />
                  Personalidad
                </CardTitle>
                <CardDescription>Define cómo se comportará el agente durante las llamadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tono</Label>
                  <Select 
                    value={personality.tone} 
                    onValueChange={(v) => { setPersonality({ ...personality, tone: v }); setHasChanges(true); }}
                  >
                    <SelectTrigger data-testid="select-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profesional">Profesional</SelectItem>
                      <SelectItem value="amigable">Amigable</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="greeting">Saludo Inicial</Label>
                  <Textarea
                    id="greeting"
                    value={personality.greeting}
                    onChange={(e) => { setPersonality({ ...personality, greeting: e.target.value }); setHasChanges(true); }}
                    placeholder="Mensaje de bienvenida al contestar la llamada"
                    rows={2}
                    data-testid="input-greeting"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farewell">Despedida</Label>
                  <Textarea
                    id="farewell"
                    value={personality.farewell}
                    onChange={(e) => { setPersonality({ ...personality, farewell: e.target.value }); setHasChanges(true); }}
                    placeholder="Mensaje de despedida al terminar la llamada"
                    rows={2}
                    data-testid="input-farewell"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="onHold">Mensaje de Espera</Label>
                    <Textarea
                      id="onHold"
                      value={personality.onHoldMessage}
                      onChange={(e) => { setPersonality({ ...personality, onHoldMessage: e.target.value }); setHasChanges(true); }}
                      placeholder="Mientras busca información"
                      rows={2}
                      data-testid="input-onhold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer">Mensaje de Transferencia</Label>
                    <Textarea
                      id="transfer"
                      value={personality.transferMessage}
                      onChange={(e) => { setPersonality({ ...personality, transferMessage: e.target.value }); setHasChanges(true); }}
                      placeholder="Al transferir a un humano"
                      rows={2}
                      data-testid="input-transfer"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-red-600" />
                  Perfil de la Empresa
                </CardTitle>
                <CardDescription>Información que el agente usará para responder preguntas sobre la empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input
                      id="companyName"
                      value={companyProfile.name}
                      onChange={(e) => { setCompanyProfile({ ...companyProfile, name: e.target.value }); setHasChanges(true); }}
                      placeholder="Ej: Mi Empresa S.A. de C.V."
                      data-testid="input-company-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industria</Label>
                    <Input
                      id="industry"
                      value={companyProfile.industry}
                      onChange={(e) => { setCompanyProfile({ ...companyProfile, industry: e.target.value }); setHasChanges(true); }}
                      placeholder="Ej: Servicios de Salud"
                      data-testid="input-industry"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyDesc">Descripción de la Empresa</Label>
                  <Textarea
                    id="companyDesc"
                    value={companyProfile.description}
                    onChange={(e) => { setCompanyProfile({ ...companyProfile, description: e.target.value }); setHasChanges(true); }}
                    placeholder="Breve descripción de lo que hace la empresa"
                    rows={3}
                    data-testid="input-company-description"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={companyProfile.address}
                      onChange={(e) => { setCompanyProfile({ ...companyProfile, address: e.target.value }); setHasChanges(true); }}
                      placeholder="Dirección física"
                      data-testid="input-address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Teléfono</Label>
                    <Input
                      id="companyPhone"
                      value={companyProfile.phone}
                      onChange={(e) => { setCompanyProfile({ ...companyProfile, phone: e.target.value }); setHasChanges(true); }}
                      placeholder="+52 555 123 4567"
                      data-testid="input-company-phone"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyProfile.email}
                      onChange={(e) => { setCompanyProfile({ ...companyProfile, email: e.target.value }); setHasChanges(true); }}
                      placeholder="contacto@empresa.com"
                      data-testid="input-company-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      value={companyProfile.website}
                      onChange={(e) => { setCompanyProfile({ ...companyProfile, website: e.target.value }); setHasChanges(true); }}
                      placeholder="https://www.empresa.com"
                      data-testid="input-website"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Horario de Atención</Label>
                  <Input
                    id="hours"
                    value={companyProfile.businessHours}
                    onChange={(e) => { setCompanyProfile({ ...companyProfile, businessHours: e.target.value }); setHasChanges(true); }}
                    placeholder="Lunes a Viernes 9:00 - 18:00"
                    data-testid="input-hours"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-red-600" />
                    Productos
                  </CardTitle>
                  <CardDescription>Lista de productos que el agente puede ofrecer</CardDescription>
                </div>
                <Button onClick={addProduct} size="sm" data-testid="button-add-product">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay productos configurados</p>
                    <p className="text-sm">Agrega productos para que el agente pueda informar sobre ellos</p>
                  </div>
                ) : (
                  products.map((product, index) => (
                    <div key={product.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-muted-foreground">Producto #{index + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeProduct(product.id)}
                          data-testid={`button-remove-product-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <Input
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                          placeholder="Nombre del producto"
                          data-testid={`input-product-name-${index}`}
                        />
                        <Input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateProduct(product.id, "price", parseFloat(e.target.value) || 0)}
                          placeholder="Precio"
                          data-testid={`input-product-price-${index}`}
                        />
                        <Input
                          value={product.category}
                          onChange={(e) => updateProduct(product.id, "category", e.target.value)}
                          placeholder="Categoría"
                          data-testid={`input-product-category-${index}`}
                        />
                      </div>
                      <Textarea
                        value={product.description}
                        onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                        placeholder="Descripción del producto"
                        rows={2}
                        data-testid={`input-product-description-${index}`}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-red-600" />
                    Servicios
                  </CardTitle>
                  <CardDescription>Lista de servicios que el agente puede ofrecer y agendar</CardDescription>
                </div>
                <Button onClick={addService} size="sm" data-testid="button-add-service">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Servicio
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay servicios configurados</p>
                    <p className="text-sm">Agrega servicios para que el agente pueda informar y agendar citas</p>
                  </div>
                ) : (
                  services.map((service, index) => (
                    <div key={service.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-muted-foreground">Servicio #{index + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeService(service.id)}
                          data-testid={`button-remove-service-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <Input
                          value={service.name}
                          onChange={(e) => updateService(service.id, "name", e.target.value)}
                          placeholder="Nombre del servicio"
                          data-testid={`input-service-name-${index}`}
                        />
                        <Input
                          type="number"
                          value={service.price}
                          onChange={(e) => updateService(service.id, "price", parseFloat(e.target.value) || 0)}
                          placeholder="Precio"
                          data-testid={`input-service-price-${index}`}
                        />
                        <Input
                          type="number"
                          value={service.durationMinutes}
                          onChange={(e) => updateService(service.id, "durationMinutes", parseInt(e.target.value) || 60)}
                          placeholder="Duración (min)"
                          data-testid={`input-service-duration-${index}`}
                        />
                      </div>
                      <Textarea
                        value={service.description}
                        onChange={(e) => updateService(service.id, "description", e.target.value)}
                        placeholder="Descripción del servicio"
                        rows={2}
                        data-testid={`input-service-description-${index}`}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faqs" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-red-600" />
                    Preguntas Frecuentes
                  </CardTitle>
                  <CardDescription>Respuestas predefinidas a preguntas comunes</CardDescription>
                </div>
                <Button onClick={addFAQ} size="sm" data-testid="button-add-faq">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar FAQ
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay FAQs configuradas</p>
                    <p className="text-sm">Agrega preguntas frecuentes para respuestas rápidas y precisas</p>
                  </div>
                ) : (
                  faqs.map((faq, index) => (
                    <div key={faq.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-muted-foreground">FAQ #{index + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeFAQ(faq.id)}
                          data-testid={`button-remove-faq-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <Input
                        value={faq.question}
                        onChange={(e) => updateFAQ(faq.id, "question", e.target.value)}
                        placeholder="¿Cuál es la pregunta?"
                        data-testid={`input-faq-question-${index}`}
                      />
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => updateFAQ(faq.id, "answer", e.target.value)}
                        placeholder="Respuesta del agente"
                        rows={3}
                        data-testid={`input-faq-answer-${index}`}
                      />
                      <Input
                        value={faq.tags.join(", ")}
                        onChange={(e) => updateFAQ(faq.id, "tags", e.target.value.split(",").map(t => t.trim()))}
                        placeholder="Tags (separados por coma)"
                        data-testid={`input-faq-tags-${index}`}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  Política de Calendario
                </CardTitle>
                <CardDescription>Configura cómo el agente maneja las citas y reservas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Habilitar Agendamiento</p>
                    <p className="text-sm text-muted-foreground">Permitir que el agente agende citas</p>
                  </div>
                  <Switch
                    checked={calendarPolicy.enabled}
                    onCheckedChange={(v) => { setCalendarPolicy({ ...calendarPolicy, enabled: v }); setHasChanges(true); }}
                    data-testid="switch-calendar-enabled"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Confirmar Automáticamente</p>
                    <p className="text-sm text-muted-foreground">Las citas se confirman sin revisión manual</p>
                  </div>
                  <Switch
                    checked={calendarPolicy.autoConfirm}
                    onCheckedChange={(v) => { setCalendarPolicy({ ...calendarPolicy, autoConfirm: v }); setHasChanges(true); }}
                    data-testid="switch-auto-confirm"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Anticipación Mínima (minutos)</Label>
                    <Input
                      type="number"
                      value={calendarPolicy.minNoticeMinutes}
                      onChange={(e) => { setCalendarPolicy({ ...calendarPolicy, minNoticeMinutes: parseInt(e.target.value) || 60 }); setHasChanges(true); }}
                      data-testid="input-min-notice"
                    />
                    <p className="text-xs text-muted-foreground">Tiempo mínimo antes de una cita</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo días de anticipación</Label>
                    <Input
                      type="number"
                      value={calendarPolicy.maxAdvanceDays}
                      onChange={(e) => { setCalendarPolicy({ ...calendarPolicy, maxAdvanceDays: parseInt(e.target.value) || 30 }); setHasChanges(true); }}
                      data-testid="input-max-advance"
                    />
                    <p className="text-xs text-muted-foreground">Hasta cuántos días en el futuro</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Permisos de Herramientas
                </CardTitle>
                <CardDescription>Controla qué acciones puede realizar el agente durante las llamadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Consultar Disponibilidad</p>
                    <p className="text-sm text-muted-foreground">Verificar horarios disponibles en el calendario</p>
                  </div>
                  <Switch
                    checked={toolPermissions.canCheckAvailability}
                    onCheckedChange={(v) => { setToolPermissions({ ...toolPermissions, canCheckAvailability: v }); setHasChanges(true); }}
                    data-testid="switch-check-availability"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Agendar Citas</p>
                    <p className="text-sm text-muted-foreground">Crear nuevas citas en el calendario</p>
                  </div>
                  <Switch
                    checked={toolPermissions.canBookAppointments}
                    onCheckedChange={(v) => { setToolPermissions({ ...toolPermissions, canBookAppointments: v }); setHasChanges(true); }}
                    data-testid="switch-book-appointments"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Registrar Leads</p>
                    <p className="text-sm text-muted-foreground">Capturar datos de prospectos interesados</p>
                  </div>
                  <Switch
                    checked={toolPermissions.canCreateLead}
                    onCheckedChange={(v) => { setToolPermissions({ ...toolPermissions, canCreateLead: v }); setHasChanges(true); }}
                    data-testid="switch-create-lead"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Acceder a Datos de Clientes</p>
                    <p className="text-sm text-muted-foreground">Consultar información de clientes existentes</p>
                  </div>
                  <Switch
                    checked={toolPermissions.canAccessClientData}
                    onCheckedChange={(v) => { setToolPermissions({ ...toolPermissions, canAccessClientData: v }); setHasChanges(true); }}
                    data-testid="switch-access-clients"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
