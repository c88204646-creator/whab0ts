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
import { Loader, Zap, Heart, Shield, ThumbsUp, MessageCircle, Smile, CheckCircle2, AlertCircle, Sparkles, Activity, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    
    if (!hostname.includes("facebook.com")) {
      return false;
    }
    
    const pathname = urlObj.pathname.toLowerCase();
    
    const patterns = [
      /\/posts\/\d+/,
      /\/photos\/\d+/,
      /\/video\/\d+/,
      /\/watch\/\?v=\d+/,
      /\/photo\.php/,
      /\/permalink\/\d+/,
      /\/share\/\d+/,
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

  const { data: allAccounts = [], isLoading } = useQuery({
    queryKey: [`/api/facebook-accounts/${userId}`],
    enabled: !!userId,
  });

  const accounts = allAccounts.filter((account: any) => account.isActive !== false);

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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0 border border-red-500/20">
              <Sparkles className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground">Automatización de Posts</h1>
              <p className="text-xs text-muted-foreground/80">Automatiza comentarios en posts de Facebook</p>
            </div>
          </div>

          {/* Compact Metrics Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="px-3 py-2 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Cuentas</p>
              </div>
              <p className="text-xl font-bold text-foreground">{accounts.length}</p>
            </div>

            <div className="px-3 py-2 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-1.5 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Selectas</p>
              </div>
              <p className="text-xl font-bold text-foreground">{selectedAccounts.length}</p>
            </div>

            <div className="px-3 py-2 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <p className="text-xs text-muted-foreground font-medium">Disponibles</p>
              </div>
              <p className="text-xl font-bold text-foreground">{accounts.length - selectedAccounts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Main Alert Banner */}
            <Alert className="bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/20">
              <Info className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-sm font-semibold">Guía de automatización</AlertTitle>
              <AlertDescription className="text-xs">
                1) Ingresa URL válida del post • 2) Selecciona tipo de comentario • 3) Escribe el texto • 4) Elige cuentas • 5) Ejecuta
              </AlertDescription>
            </Alert>

            {/* Two Column Layout */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Left Column - Form Sections */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Section 1: URL Input */}
                <Card className="border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                      URL del Post
                    </CardTitle>
                    <CardDescription className="text-xs">Enlace a un post de Facebook</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Label htmlFor="post-url" className="text-xs font-semibold">
                          URL *
                        </Label>
                        {postUrl && (
                          <div className="flex items-center gap-1">
                            {isUrlValid ? (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Válida
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                <AlertCircle className="w-3 h-3" />
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
                        className={`h-9 text-sm ${isUrlValid ? "border-green-500/50" : postUrl ? "border-amber-500/50" : ""}`}
                      />
                    </div>
                    {!isUrlValid && postUrl && (
                      <Alert className="bg-amber-500/5 border-amber-500/20 py-2">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
                          URL de Facebook no válida. Ejemplo: https://facebook.com/username/posts/12345
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Section 2: Comment Type */}
                <Card className="border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                      Tipo de Comentario
                    </CardTitle>
                    <CardDescription className="text-xs">Selecciona la categoría del comentario</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-2">
                      {commentTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setCommentType(type.id)}
                            className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border-2 transition-all ${
                              commentType === type.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50 hover:bg-muted/30"
                            }`}
                            data-testid={`button-comment-type-${type.id}`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-xs font-medium text-center leading-tight">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Section 3: Comment Text */}
                <Card className="border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-1 h-1 bg-cyan-500 rounded-full"></span>
                      Texto del Comentario
                    </CardTitle>
                    <CardDescription className="text-xs">Mensaje que se publicará automáticamente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      id="comment-text"
                      placeholder="Escribe el comentario que se publicará automáticamente..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      data-testid="input-comment-text"
                      className="min-h-[100px] resize-none text-sm"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${commentText.length > 500 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {commentText.length} caracteres
                      </span>
                      {commentText.length > 500 && (
                        <span className="text-amber-600 dark:text-amber-400">Recomendado: máx 500</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Accounts & Execute */}
              <div className="space-y-4">
                
                {/* Section 4: Select Accounts */}
                <Card className="border border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                      Cuentas
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {selectedAccounts.length} de {accounts.length} seleccionadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                      {isLoading ? (
                        <div className="flex justify-center items-center py-6">
                          <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : accounts.length === 0 ? (
                        <Alert className="bg-muted/30 border-border/50 py-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <AlertDescription className="text-xs">
                            No hay cuentas vinculadas. Agrega desde Facebook.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        accounts.map((account: FacebookAccount) => (
                          <label
                            key={account.id}
                            className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 cursor-pointer hover-elevate transition-all"
                            data-testid={`checkbox-account-${account.id}`}
                          >
                            <Checkbox
                              checked={selectedAccounts.includes(account.id)}
                              onCheckedChange={() => toggleAccount(account.id)}
                            />
                            <span className="text-xs font-medium truncate flex-1">{account.accountName}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Validation Alert */}
                {selectedAccounts.length > 0 && (
                  <Alert className="bg-green-500/5 border-green-500/20 py-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                      {selectedAccounts.length} cuenta{selectedAccounts.length !== 1 ? 's' : ''} seleccionada{selectedAccounts.length !== 1 ? 's' : ''} para ejecutar
                    </AlertDescription>
                  </Alert>
                )}

                {/* Execute Button */}
                <Button
                  onClick={handleExecute}
                  disabled={automationMutation.isPending || !isUrlValid || !commentText.trim() || selectedAccounts.length === 0}
                  className="w-full gap-2 h-10 font-semibold"
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
                      <span>Ejecutar</span>
                    </>
                  )}
                </Button>

                {/* Requirements Checklist */}
                <Card className="border border-border/50 bg-muted/20">
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isUrlValid ? 'border-green-500 bg-green-500/10' : 'border-muted-foreground'}`}>
                          {isUrlValid && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                        </div>
                        <span className={isUrlValid ? 'text-foreground' : 'text-muted-foreground'}>URL válida</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${commentType ? 'border-green-500 bg-green-500/10' : 'border-muted-foreground'}`}>
                          {commentType && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                        </div>
                        <span className={commentType ? 'text-foreground' : 'text-muted-foreground'}>Tipo seleccionado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${commentText.trim() ? 'border-green-500 bg-green-500/10' : 'border-muted-foreground'}`}>
                          {commentText.trim() && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                        </div>
                        <span className={commentText.trim() ? 'text-foreground' : 'text-muted-foreground'}>Texto ingresado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedAccounts.length > 0 ? 'border-green-500 bg-green-500/10' : 'border-muted-foreground'}`}>
                          {selectedAccounts.length > 0 && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                        </div>
                        <span className={selectedAccounts.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>Cuentas selectas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
