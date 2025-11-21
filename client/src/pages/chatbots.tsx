import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Power, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Chatbot, ChatbotRule } from "@shared/schema";

export default function ChatbotsPage() {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [trigger, setTrigger] = useState("");
  const [response, setResponse] = useState("");
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeChatbotId, setActiveChatbotId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get active account from URL or first account
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accountId = params.get("accountId");
    if (accountId) {
      setActiveAccountId(accountId);
    }
  }, []);

  const { data: chatbots } = useQuery<Chatbot[]>({
    queryKey: ["/api/chatbots", activeAccountId],
    enabled: !!activeAccountId,
  });

  useEffect(() => {
    if (chatbots && chatbots.length > 0 && !activeChatbotId) {
      setActiveChatbotId(chatbots[0].id);
    }
  }, [chatbots, activeChatbotId]);

  const { data: rules } = useQuery<ChatbotRule[]>({
    queryKey: ["/api/chatbot-rules", activeChatbotId],
    enabled: !!activeChatbotId,
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: { chatbotId: string; trigger: string; response: string }) => {
      return apiRequest("POST", "/api/chatbot-rules", {
        ...data,
        isActive: true,
        priority: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot-rules"] });
      toast({
        title: "Regla creada",
        description: "La regla se creó correctamente",
      });
      setTrigger("");
      setResponse("");
      setIsRuleModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la regla",
        variant: "destructive",
      });
    },
  });

  const handleAddRule = () => {
    if (!activeChatbotId) return;
    
    createRuleMutation.mutate({
      chatbotId: activeChatbotId,
      trigger: trigger.trim(),
      response: response.trim(),
    });
  };

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-1 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Chatbots</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configura respuestas automáticas para tus conversaciones
            </p>
          </div>
          <Button onClick={() => setIsRuleModalOpen(true)} data-testid="button-add-rule">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Regla
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chatbot Principal</CardTitle>
                <CardDescription>
                  Gestiona las respuestas automáticas de tu chatbot
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="chatbot-active" className="text-sm">
                  {chatbots?.[0]?.isActive ? "Activo" : "Inactivo"}
                </Label>
                <Switch
                  id="chatbot-active"
                  checked={chatbots?.[0]?.isActive ?? true}
                  data-testid="switch-chatbot-active"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="welcome-message">Mensaje de Bienvenida</Label>
                <Textarea
                  id="welcome-message"
                  placeholder="Escribe el mensaje que se enviará cuando alguien inicie una conversación..."
                  className="mt-2"
                  defaultValue={chatbots?.[0]?.welcomeMessage || ""}
                  data-testid="textarea-welcome-message"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Este mensaje se enviará automáticamente al recibir el primer contacto
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button data-testid="button-save-welcome">
              Guardar Cambios
            </Button>
          </CardFooter>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Reglas de Respuesta Automática</h2>
            <Badge variant="secondary" data-testid="badge-rules-count">
              {rules?.length || 0} reglas
            </Badge>
          </div>

          {!rules || rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay reglas configuradas</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Crea reglas para responder automáticamente cuando los usuarios envíen palabras clave específicas
                </p>
                <Button onClick={() => setIsRuleModalOpen(true)} data-testid="button-add-first-rule">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Regla
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="hover-elevate" data-testid={`card-rule-${rule.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {rule.trigger}
                        </Badge>
                        {rule.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {rule.response}
                      </p>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Power className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <DialogContent data-testid="modal-add-rule">
          <DialogHeader>
            <DialogTitle>Nueva Regla de Respuesta</DialogTitle>
            <DialogDescription>
              Configura una palabra clave y la respuesta automática que se enviará
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="trigger">Palabra Clave (Trigger)</Label>
              <Input
                id="trigger"
                placeholder="Ej: hola, precio, horario"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className="mt-2"
                data-testid="input-trigger"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El chatbot responderá cuando detecte esta palabra
              </p>
            </div>

            <div>
              <Label htmlFor="response">Respuesta Automática</Label>
              <Textarea
                id="response"
                placeholder="Escribe la respuesta que se enviará..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="mt-2"
                rows={4}
                data-testid="textarea-response"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRuleModalOpen(false)}
              data-testid="button-cancel-rule"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddRule}
              disabled={!trigger.trim() || !response.trim()}
              data-testid="button-save-rule"
            >
              Guardar Regla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
