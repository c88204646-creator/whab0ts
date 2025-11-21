import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, MessageSquare, TrendingUp, Zap } from "lucide-react";
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
  const [location, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  
  const [chatbotName, setChatbotName] = useState("");
  const [chatbotDescription, setChatbotDescription] = useState("");
  const [chatbotWelcome, setChatbotWelcome] = useState("");
  const [chatbotAccountId, setChatbotAccountId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const { toast } = useToast();

  // Extract chatbot ID from URL path
  const chatbotId = location.split("/").pop();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: chatbot, isLoading } = useQuery<Chatbot>({
    queryKey: ["/api/chatbots", chatbotId],
    queryFn: async () => {
      if (!chatbotId || chatbotId === "chatbots") return null;
      const response = await fetch(`/api/chatbots/${chatbotId}`);
      if (!response.ok) throw new Error("Chatbot not found");
      return response.json();
    },
    enabled: !!chatbotId && chatbotId !== "chatbots",
    retry: 1,
  });

  const { data: accounts = [] } = useQuery<WhatsappAccount[]>({
    queryKey: ["/api/whatsapp-accounts"],
    queryFn: async () => {
      const response = await fetch(`/api/whatsapp-accounts`);
      if (!response.ok) return [];
      return response.json();
    },
    retry: 1,
  });

  useEffect(() => {
    if (chatbot) {
      setChatbotName(chatbot.name);
      setChatbotDescription(chatbot.description || "");
      setChatbotWelcome(chatbot.welcomeMessage || "");
      setChatbotAccountId(chatbot.whatsappAccountId);
    }
  }, [chatbot]);

  const updateChatbotMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; welcomeMessage: string; whatsappAccountId: string | null }) => {
      return apiRequest("PATCH", `/api/chatbots/${chatbotId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", chatbotId] });
      toast({
        title: "Actualizado",
        description: "La configuración se guardó correctamente",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!chatbotName.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }
    updateChatbotMutation.mutate({
      name: chatbotName.trim(),
      description: chatbotDescription.trim(),
      welcomeMessage: chatbotWelcome.trim(),
      whatsappAccountId: chatbotAccountId,
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Chatbot no encontrado</p>
          <Button onClick={() => navigate("/chatbots")} variant="outline">
            Volver a Chatbots
          </Button>
        </div>
      </div>
    );
  }

  const linkedAccount = accounts.find((acc) => acc.id === chatbot.whatsappAccountId);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/chatbots")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{chatbot.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">{chatbot.description}</p>
              </div>
              <Badge variant={chatbot.isActive ? "default" : "secondary"}>
                {chatbot.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Mensajes Totales
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
            <Card>
              <Tabs defaultValue="general" className="w-full">
                <div className="border-b border-border px-6 pt-6">
                  <TabsList className="w-full justify-start border-b-0">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                    <TabsTrigger value="knowledge">Base de Conocimientos</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="general" className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="detail-name">Nombre *</Label>
                    <Input
                      id="detail-name"
                      value={chatbotName}
                      onChange={(e) => setChatbotName(e.target.value)}
                      disabled={!isEditing}
                      data-testid="input-detail-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="detail-description">Descripción</Label>
                    <Input
                      id="detail-description"
                      value={chatbotDescription}
                      onChange={(e) => setChatbotDescription(e.target.value)}
                      disabled={!isEditing}
                      data-testid="input-detail-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="detail-welcome">Mensaje de Bienvenida</Label>
                    <Textarea
                      id="detail-welcome"
                      value={chatbotWelcome}
                      onChange={(e) => setChatbotWelcome(e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                      data-testid="textarea-detail-welcome"
                    />
                  </div>

                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline">
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
                              setChatbotWelcome(chatbot.welcomeMessage || "");
                            }
                          }}
                          variant="outline"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={updateChatbotMutation.isPending}
                          data-testid="button-save-details"
                        >
                          {updateChatbotMutation.isPending ? "Guardando..." : "Guardar"}
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="whatsapp" className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="detail-account">Vincular WhatsApp</Label>
                    {isEditing ? (
                      <Select value={chatbotAccountId || "none"} onValueChange={(value) => setChatbotAccountId(value === "none" ? null : value)}>
                        <SelectTrigger id="detail-account" data-testid="select-detail-account">
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
                      <div className="p-3 bg-muted/50 rounded border border-border">
                        {linkedAccount ? (
                          <p className="font-medium text-foreground">{linkedAccount.deviceName} ({linkedAccount.phoneNumber})</p>
                        ) : (
                          <p className="text-muted-foreground">No vinculado</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Selecciona una cuenta de WhatsApp para que este chatbot responda en esa plataforma
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline">
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
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={updateChatbotMutation.isPending}
                        >
                          {updateChatbotMutation.isPending ? "Guardando..." : "Guardar"}
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="knowledge" className="p-6">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Base de conocimientos próximamente</p>
                    <p className="text-sm text-muted-foreground">Aquí podrás agregar documentos y respuestas frecuentes</p>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
