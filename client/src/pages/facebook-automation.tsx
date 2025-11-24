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
import { Loader, Zap, Heart, Shield, ThumbsUp, MessageCircle, Smile, CheckCircle2, AlertCircle, Sparkles, Activity } from "lucide-react";

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
    <div className="flex flex-col bg-background">
      {/* Professional Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0 border border-red-500/20">
              <Sparkles className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground">Automatización de Posts</h1>
              <p className="text-xs text-muted-foreground/80">Automatiza comentarios y acciones en posts de Facebook</p>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Total Accounts */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Cuentas Totales</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
            </div>

            {/* Selected Count */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Seleccionadas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{selectedAccounts.length}</p>
            </div>

            {/* Available */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <p className="text-xs text-muted-foreground font-medium">Disponibles</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{accounts.length - selectedAccounts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            {/* Alert Banner */}
            <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 rounded-lg p-3 mb-6">
              <p className="text-sm font-semibold text-foreground">Automatiza acciones en posts</p>
              <p className="text-xs text-foreground/70 mt-0.5">Selecciona cuentas, escribe un comentario y ejecuta automáticamente en múltiples posts</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Automatización</CardTitle>
                    <CardDescription>URL del post y tipo de comentario</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* URL Input */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Label htmlFor="post-url" className="text-sm font-semibold">URL del Post *</Label>
                        {postUrl && (
                          <div className="flex items-center gap-1">
                            {isUrlValid ? (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Válida
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Inválida
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
                        className={`h-10 ${isUrlValid ? "border-green-500" : postUrl ? "border-amber-500" : ""}`}
                      />
                    </div>

                    {/* Comment Type Selection */}
                    <div>
                      <Label className="text-sm font-semibold block mb-3">Tipo de Comentario *</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {commentTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              onClick={() => setCommentType(type.id)}
                              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                                commentType === type.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50 hover:bg-muted/30"
                              }`}
                              data-testid={`button-comment-type-${type.id}`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-xs font-medium text-center leading-tight">{type.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comment Text */}
                    <div>
                      <Label htmlFor="comment-text" className="text-sm font-semibold block mb-2">Texto del Comentario *</Label>
                      <Textarea
                        id="comment-text"
                        placeholder="Escribe el comentario que se publicará automáticamente..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        data-testid="input-comment-text"
                        className="min-h-[140px] resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-2">{commentText.length} caracteres</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Accounts & Execute */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Seleccionar Cuentas</CardTitle>
                    <CardDescription className="text-xs">{selectedAccounts.length} de {accounts.length} seleccionadas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : accounts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No hay cuentas vinculadas</p>
                        <p className="text-xs text-muted-foreground/60 mt-2">Ve a Facebook para agregar cuentas</p>
                      </div>
                    ) : (
                      accounts.map((account: FacebookAccount) => (
                        <label
                          key={account.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 cursor-pointer hover-elevate transition-all"
                          data-testid={`checkbox-account-${account.id}`}
                        >
                          <Checkbox
                            checked={selectedAccounts.includes(account.id)}
                            onCheckedChange={() => toggleAccount(account.id)}
                          />
                          <span className="text-sm font-medium truncate">{account.accountName}</span>
                        </label>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={handleExecute}
                  disabled={automationMutation.isPending || !isUrlValid || !commentText.trim() || selectedAccounts.length === 0}
                  className="w-full gap-2 h-10"
                  data-testid="button-execute-automation"
                >
                  {automationMutation.isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Ejecutando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Ejecutar Automatización</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
