import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { ArrowLeft, MessageSquare, TrendingUp, Zap, Bot, ShoppingCart, Headphones, Users, Briefcase, Sparkles, MessageCircle } from "lucide-react";
import { KnowledgeBaseManager } from "./knowledge-base";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Chatbot, WhatsappAccount } from "@shared/schema";

export default function ChatbotDetailsPage() {
  const [match, params] = useRoute("/chatbots/:id");
  const [userId, setUserId] = useState<string | null>(null);
  
  const [chatbotName, setChatbotName] = useState("");
  const [chatbotDescription, setChatbotDescription] = useState("");
  const [chatbotType, setChatbotType] = useState("general");
  const [chatbotAccountId, setChatbotAccountId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);
  }, []);

  if (!match) {
    return <div className="p-4">Chatbot no encontrado</div>;
  }

  const chatbotId = params?.id;

  const { data: chatbot, isLoading, isError, error } = useQuery<Chatbot>({
    queryKey: [`/api/chatbots/${chatbotId}`],
    queryFn: async () => {
      if (!chatbotId) throw new Error('ID no disponible');
      console.log('Fetching chatbot:', chatbotId);
      const response = await fetch(`/api/chatbots/${chatbotId}`);
      console.log('Chatbot response status:', response.status);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Chatbot no encontrado');
      }
      const data = await response.json();
      console.log('Chatbot loaded:', data);
      return data;
    },
    enabled: !!chatbotId,
    retry: false,
  });

  const { data: accounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts"],
    enabled: !!userId,
  });

  useEffect(() => {
    if (chatbot) {
      setChatbotName(chatbot.name);
      setChatbotDescription(chatbot.description || "");
      setChatbotType(chatbot.type || "general");
      setChatbotAccountId(chatbot.whatsappAccountId || null);
    }
  }, [chatbot]);

  const linkedAccount = accounts.find((a) => a.id === chatbotAccountId);

  const updateChatbotMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; type: string; whatsappAccountId: string | null }) => {
      return apiRequest(`/api/chatbots/${chatbotId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}`] });
      toast({ title: "Guardado", description: "Cambios guardados correctamente" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudieron guardar los cambios", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateChatbotMutation.mutate({
      name: chatbotName,
      description: chatbotDescription,
      type: chatbotType,
      whatsappAccountId: chatbotAccountId,
    });
  };

  if (isLoading) {
    return <div className="p-4">Cargando chatbot...</div>;
  }

  if (isError) {
    console.error('Error loading chatbot:', error);
    return <div className="p-4 text-red-500">Error: {error?.message || 'Chatbot no encontrado'}</div>;
  }

  if (!chatbot) {
    return <div className="p-4 text-red-500">Chatbot no encontrado (ID: {chatbotId})</div>;
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{chatbot.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tipo: <Badge variant="outline">{chatbot.type}</Badge>
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Mensajes Recibidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground mt-1">Sin datos aún</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Respuestas Automáticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground mt-1">Sin datos aún</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Tasa de Satisfacción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-xs text-muted-foreground mt-1">Sin datos aún</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="general" className="w-full">
            <div className="border-b border-border bg-background/50 px-6 py-4 rounded-t-lg">
              <TabsList className="w-full justify-start border-b-0 bg-transparent gap-8">
                <TabsTrigger value="general" className="relative text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:content-[''] after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-100">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <span>General</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="relative text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:content-[''] after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-100">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="relative text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:content-[''] after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Base de Conocimientos</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* General Tab */}
            <TabsContent value="general" className="p-6 space-y-6 mt-0">
              <Card className="bg-background/50 border-border/50">
                <CardHeader className="pb-4 border-b border-border/30">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    Información Básica
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Configuración principal del chatbot</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="detail-name" className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <span className="text-primary">*</span> Nombre
                    </Label>
                    <Input
                      id="detail-name"
                      placeholder="Ej: Chatbot de Soporte"
                      value={chatbotName}
                      onChange={(e) => setChatbotName(e.target.value)}
                      disabled={!isEditing}
                      data-testid="input-detail-name"
                      className="h-10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="detail-description" className="text-sm font-semibold mb-2 block">
                      Descripción
                    </Label>
                    <Input
                      id="detail-description"
                      placeholder="Describe el propósito de este chatbot..."
                      value={chatbotDescription}
                      onChange={(e) => setChatbotDescription(e.target.value)}
                      disabled={!isEditing}
                      data-testid="input-detail-description"
                      className="h-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {isEditing && (
                <Card className="bg-background/50 border-border/50">
                  <CardHeader className="pb-4 border-b border-border/30">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Tipo de Chatbot
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Selecciona la categoría que mejor describe este chatbot</p>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                      <div className="flex gap-3 min-w-min pb-2">
                        {[
                          { value: "general", label: "General", icon: Bot },
                          { value: "ventas", label: "Ventas", icon: ShoppingCart },
                          { value: "soporte", label: "Soporte", icon: Headphones },
                          { value: "asistencia", label: "Asistencia", icon: Users },
                          { value: "marketing", label: "Marketing", icon: Zap },
                          { value: "recursos_humanos", label: "RRHH", icon: Briefcase },
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => setChatbotType(value)}
                            className={`px-4 py-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all flex-shrink-0 ${
                              chatbotType === value
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                            }`}
                            data-testid={`button-type-${value}`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 pt-4 border-t border-border/30">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="lg" className="px-6">
                    Editar
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        if (chatbot) {
                          setChatbotName(chatbot.name);
                          setChatbotDescription(chatbot.description || "");
                        }
                      }}
                      variant="outline"
                      size="lg"
                      className="px-6"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateChatbotMutation.isPending}
                      size="lg"
                      className="px-6"
                      data-testid="button-save-details"
                    >
                      {updateChatbotMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="p-6 space-y-6 mt-0">
              <Card className="bg-background/50 border-border/50">
                <CardHeader className="pb-4 border-b border-border/30">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Vinculación de WhatsApp
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Conecta este chatbot a una cuenta de WhatsApp</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="detail-account" className="text-sm font-semibold mb-2 block">
                      Cuenta de WhatsApp
                    </Label>
                    {isEditing ? (
                      <Select value={chatbotAccountId || "none"} onValueChange={(value) => setChatbotAccountId(value === "none" ? null : value)}>
                        <SelectTrigger id="detail-account" data-testid="select-detail-account" className="h-10">
                          <SelectValue placeholder="Selecciona una cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin vincular</SelectItem>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.deviceName} - {account.phoneNumber || "Sin número"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                        {linkedAccount ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{linkedAccount.deviceName}</p>
                            <p className="text-sm text-muted-foreground">{linkedAccount.phoneNumber || "Sin número"}</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No hay cuenta vinculada</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      Este chatbot responderá a los mensajes de WhatsApp de la cuenta seleccionada
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 pt-4 border-t border-border/30">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="lg" className="px-6">
                    Cambiar Vinculación
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setChatbotAccountId(chatbot.whatsappAccountId);
                      }}
                      variant="outline"
                      size="lg"
                      className="px-6"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateChatbotMutation.isPending}
                      size="lg"
                      className="px-6"
                    >
                      {updateChatbotMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="knowledge" className="p-6 mt-0">
              <KnowledgeBaseManager chatbotId={chatbotId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
