import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader, Zap, MessageSquare, Megaphone, Headphones, HelpCircle, Star } from "lucide-react";

interface FacebookAccount {
  id: string;
  accountName: string;
  facebookId: string;
}

const commentTypes = [
  { id: "general", label: "General", icon: MessageSquare },
  { id: "promotion", label: "Promoción", icon: Megaphone },
  { id: "support", label: "Soporte", icon: Headphones },
  { id: "question", label: "Consulta", icon: HelpCircle },
  { id: "opinion", label: "Opinión", icon: Star },
];

export default function FacebookAutomationPage() {
  const { toast } = useToast();
  const [postUrl, setPostUrl] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [commentType, setCommentType] = useState("general");
  const [commentText, setCommentText] = useState("");

  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = `guest-${Date.now()}`;
    localStorage.setItem("userId", userId);
  }

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: [`/api/facebook-accounts/${userId}`],
    enabled: !!userId,
  });

  const automationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/facebook-automation/execute", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Automatización completada",
        description: `${data.completed} de ${data.results.length} cuentas ejecutadas exitosamente`,
      });
      setPostUrl("");
      setSelectedAccounts([]);
      setCommentText("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleExecute = () => {
    if (!postUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingresa la URL del post",
      });
      return;
    }

    if (!commentText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingresa el texto del comentario",
      });
      return;
    }

    if (selectedAccounts.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona al menos una cuenta",
      });
      return;
    }

    automationMutation.mutate({
      postUrl,
      selectedAccounts,
      actionType: "comment",
      commentType,
      commentText,
    });
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="w-8 h-8" />
          Automatización de Posts
        </h1>
        <p className="text-muted-foreground">Automatiza acciones en posts de Facebook usando tus cuentas vinculadas</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos del Post</CardTitle>
              <CardDescription>URL y tipo de acción a ejecutar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="post-url">URL del Post *</Label>
                <Input
                  id="post-url"
                  placeholder="https://facebook.com/..."
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  data-testid="input-post-url"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Tipo de Comentario *</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {commentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setCommentType(type.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all ${
                          commentType === type.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                        data-testid={`button-comment-type-${type.id}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium text-center">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="comment-text">Texto del Comentario *</Label>
                <Input
                  id="comment-text"
                  placeholder="Escribe el comentario..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  data-testid="input-comment-text"
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cuentas</CardTitle>
              <CardDescription>{selectedAccounts.length} seleccionadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader className="w-5 h-5 animate-spin" />
                </div>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay cuentas vinculadas. Ve a Cuentas de Facebook para agregar.
                </p>
              ) : (
                accounts.map((account: FacebookAccount) => (
                  <label
                    key={account.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer hover-elevate"
                    data-testid={`checkbox-account-${account.id}`}
                  >
                    <Checkbox
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={() => toggleAccount(account.id)}
                    />
                    <span className="text-sm font-medium">{account.accountName}</span>
                  </label>
                ))
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleExecute}
            disabled={automationMutation.isPending}
            className="w-full gap-2"
            size="lg"
            data-testid="button-execute-automation"
          >
            {automationMutation.isPending ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Ejecutar Automatización
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
