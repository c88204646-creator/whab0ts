import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Edit2, Zap, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/loading-spinner";

interface Assistant {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  model: string;
}

export default function AssistantsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", model: "gpt-4" });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) setUserId(user.id);
  }, []);

  const { data: assistants = [], isLoading, refetch } = useQuery<Assistant[]>({
    queryKey: ["/api/assistants", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch("/api/assistants");
      if (!response.ok) throw new Error("Error fetching assistants");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/assistants", formData);
    },
    onSuccess: () => {
      toast({ title: "Asistente creado" });
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      setShowForm(false);
      setFormData({ name: "", description: "", model: "gpt-4" });
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/assistants/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Asistente eliminado" });
      queryClient.invalidateQueries({ queryKey: ["/api/assistants"] });
      refetch();
    },
  });

  const filteredAssistants = assistants.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full bg-background min-h-0">
      <div className="flex-shrink-0 border-b px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Asistentes IA</h1>
              <p className="text-xs text-muted-foreground">Gestiona tus asistentes automáticos</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setFormData({ name: "", description: "", model: "gpt-4" });
              setEditingId(null);
              setShowForm(true);
            }}
            data-testid="button-new-assistant"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar asistentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredAssistants.length === 0 ? (
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="py-12 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">No hay asistentes</p>
              <p className="text-sm text-muted-foreground mt-2">Crea tu primer asistente IA</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAssistants.map((assistant) => (
              <Card key={assistant.id} data-testid={`card-assistant-${assistant.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{assistant.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{assistant.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant={assistant.enabled ? "default" : "secondary"} className="text-xs">
                          {assistant.enabled ? "Activo" : "Inactivo"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {assistant.model}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setLocation(`/assistants/${assistant.id}/flow`)}
                        data-testid={`button-edit-${assistant.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(assistant.id)}
                        data-testid={`button-delete-${assistant.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent data-testid="dialog-create-assistant">
          <DialogHeader>
            <DialogTitle>Nuevo Asistente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del asistente"
                data-testid="input-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción"
                data-testid="input-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !formData.name}
              data-testid="button-save"
            >
              {createMutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
