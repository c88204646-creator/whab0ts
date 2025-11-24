import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Lock, Zap, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/loading-spinner";

interface AIProvider {
  id: string;
  userId: string;
  name: string;
  provider: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
}

const PROVIDER_OPTIONS = [
  { value: "chatgpt", label: "ChatGPT", icon: "🔷" },
  { value: "gemini", label: "Gemini IA", icon: "🔶" },
  { value: "gemini-free", label: "Gemini IA (Gratis)", icon: "✨" },
];

const providerNames: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini IA",
  "gemini-free": "Gemini IA (Gratis)",
};

export default function AIProvidersPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", provider: "chatgpt", apiKey: "" });
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) setUserId(user.id);
  }, []);

  const { data: providers = [], isLoading } = useQuery<AIProvider[]>({
    queryKey: ["/api/ai-providers", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/ai-providers?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch providers");
      return response.json();
    },
    enabled: !!userId,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User not found");
      return apiRequest("POST", "/api/ai-providers", {
        userId,
        name: formData.name,
        provider: formData.provider,
        apiKey: formData.apiKey,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-providers", userId] });
      toast({ title: "Proveedor creado", description: "El proveedor de IA fue creado exitosamente" });
      setFormData({ name: "", provider: "openai", apiKey: "" });
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No provider selected");
      return apiRequest("PATCH", `/api/ai-providers/${editingId}`, {
        name: formData.name,
        provider: formData.provider,
        apiKey: formData.apiKey,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-providers", userId] });
      toast({ title: "Actualizado", description: "El proveedor fue actualizado" });
      setFormData({ name: "", provider: "openai", apiKey: "" });
      setEditingId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/ai-providers/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-providers", userId] });
      toast({ title: "Eliminado", description: "El proveedor fue eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const provider = providers.find(p => p.id === id);
      return apiRequest("PATCH", `/api/ai-providers/${id}`, {
        isActive: !provider?.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-providers", userId] });
    },
  });

  if (!userId) return <LoadingSpinner />;

  const handleEdit = (provider: AIProvider) => {
    const providerValue = provider.provider === "openai" ? "chatgpt" : provider.provider === "anthropic" ? "gemini-free" : provider.provider;
    setFormData({ name: provider.name, provider: providerValue, apiKey: provider.apiKey });
    setEditingId(provider.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.provider || !formData.apiKey) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }
    editingId ? updateMutation.mutate() : createMutation.mutate();
  };

  const getProviderIcon = (provider: string) => {
    const opt = PROVIDER_OPTIONS.find(o => o.value === provider);
    return opt?.icon || "⚙️";
  };

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Proveedores de IA</h1>
                <p className="text-xs text-muted-foreground/80">Configura tus proveedores y luego asígnalos a chatbots</p>
              </div>
            </div>
            <Button onClick={() => { setEditingId(null); setFormData({ name: "", provider: "chatgpt", apiKey: "" }); setShowForm(true); }} className="gap-2" data-testid="button-add-provider">
              <Plus className="w-4 h-4" />
              Nuevo Proveedor
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold">{providers.length}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <p className="text-xs text-muted-foreground mb-1">Activos</p>
              <p className="text-2xl font-bold text-green-600">{providers.filter(p => p.isActive).length}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <p className="text-xs text-muted-foreground mb-1">Inactivos</p>
              <p className="text-2xl font-bold text-orange-600">{providers.filter(p => !p.isActive).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <LoadingSpinner />
          ) : providers.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/20">
              <CardContent className="py-12 text-center">
                <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <p className="text-muted-foreground font-medium mb-4">No has configurado proveedores aún</p>
                <Button onClick={() => { setEditingId(null); setFormData({ name: "", provider: "chatgpt", apiKey: "" }); setShowForm(true); }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar Primer Proveedor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {providers.map((provider) => (
                <Card key={provider.id} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Logo & Name */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-3xl">{getProviderIcon(provider.provider)}</div>
                        <div>
                          <p className="font-bold text-foreground">{provider.name}</p>
                          <p className="text-xs text-muted-foreground">{providerNames[provider.provider]}</p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-3">
                        {provider.isActive ? (
                          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactivo
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleMutation.mutate(provider.id)}
                          className="hover:bg-primary/10"
                          data-testid={`button-toggle-provider-${provider.id}`}
                        >
                          {provider.isActive ? "✓" : "○"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(provider)}
                          className="hover:bg-blue-500/10"
                          data-testid={`button-edit-provider-${provider.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(provider.id)}
                          className="hover:bg-destructive/10 text-destructive"
                          data-testid={`button-delete-provider-${provider.id}`}
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
      </div>

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Proveedor" : "Nuevo Proveedor de IA"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Nombre del Proveedor</Label>
              <Input placeholder="Mi OpenAI" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Proveedor</Label>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, provider: option.value })}
                    className={`px-3 py-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                      formData.provider === option.value
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/50 bg-muted/30 hover:border-primary/50"
                    }`}
                    data-testid={`button-provider-${option.value}`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-xs font-semibold text-center leading-tight">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">API Key</Label>
              <div className="relative mt-1.5">
                <Input type={showPassword ? "text" : "password"} placeholder="sk-..." value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className="pr-10" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Tu API key se encripta de forma segura</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="gap-2">
              {editingId ? "Actualizar" : "Crear"} Proveedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
