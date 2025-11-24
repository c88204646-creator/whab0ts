import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader, Zap, Heart, Shield, ThumbsUp, MessageCircle, Smile, CheckCircle2, AlertCircle } from "lucide-react";

interface FacebookAccount {
  id: string;
  accountName: string;
  facebookId: string;
}

const commentTypes = [
  { id: "defense", label: "Defensa", icon: Shield },
  { id: "thanks", label: "Agradecimiento", icon: Heart },
  { id: "positive", label: "Positividad", icon: Smile },
  { id: "response", label: "Respuesta", icon: MessageCircle },
  { id: "support", label: "Apoyo", icon: ThumbsUp },
];

const isValidFacebookPostUrl = (url: string): boolean => {
  if (!url.trim()) return false;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Validar que sea un dominio de Facebook
    if (!hostname.includes("facebook.com")) {
      return false;
    }
    
    const pathname = urlObj.pathname.toLowerCase();
    
    // Patrones válidos de URLs de posts de Facebook
    const patterns = [
      /\/posts\/\d+/,           // /posts/123456
      /\/photos\/\d+/,          // /photos/123456
      /\/video\/\d+/,           // /video/123456
      /\/watch\/\?v=\d+/,       // /watch/?v=123456
      /\/photo\.php/,           // /photo.php?fbid=...
      /\/permalink\/\d+/,       // /permalink/123456
      /\/share\/\d+/,           // /share/123456
    ];
    
    return patterns.some(pattern => pattern.test(pathname)) || 
           /[?&]fbid=\d+/.test(url);
    
  } catch (e) {
    return false;
  }
};

export default function FacebookAutomationPage() {
  const { toast } = useToast();
  const [postUrl, setPostUrl] = useState("");
  const [isUrlValid, setIsUrlValid] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [commentType, setCommentType] = useState("defense");
  const [commentText, setCommentText] = useState("");

  const handleUrlChange = (url: string) => {
    setPostUrl(url);
    setIsUrlValid(isValidFacebookPostUrl(url));
  };

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
      const response = await apiRequest("POST", "/api/facebook-automation/execute", data);
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
    <div className="h-full bg-background">
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground">Automatización de Posts</h1>
                <p className="text-xs text-muted-foreground">Automatizar acciones en posts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Datos del Post</CardTitle>
                <CardDescription>URL y tipo de acción a ejecutar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="post-url">URL del Post *</Label>
                    {postUrl && (
                      <div className="flex items-center gap-1">
                        {isUrlValid ? (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Válida
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            URL inválida
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Input
                    id="post-url"
                    placeholder="https://facebook.com/..."
                    value={postUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    data-testid="input-post-url"
                    className={`mt-2 ${isUrlValid ? "border-green-500" : postUrl ? "border-amber-500" : ""}`}
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
                  <Textarea
                    id="comment-text"
                    placeholder="Escribe el comentario aquí..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    data-testid="input-comment-text"
                    className="mt-2 min-h-[150px] resize-vertical"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{commentText.length} caracteres</p>
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
    </div>
  );
}
