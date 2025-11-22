import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Facebook, LinkIcon, Heart, MessageCircle, Zap, Loader } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FacebookAccount {
  id: string;
  accountName: string;
  status: string;
}

export default function FacebookAutomationPage() {
  const { toast } = useToast();
  const [postUrl, setPostUrl] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [actionType, setActionType] = useState<"like" | "comment" | "react">("like");
  const [commentText, setCommentText] = useState("");

  // Get user ID from localStorage
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = `guest-${Date.now()}`;
    localStorage.setItem("userId", userId);
  }

  const { data: accounts = [] } = useQuery<FacebookAccount[]>({
    queryKey: [`/api/facebook-accounts/${userId}`],
    enabled: !!userId,
  });

  const automationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/facebook-automation/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl,
          selectedAccounts,
          actionType,
          commentText: actionType === "comment" ? commentText : undefined,
        }),
      });
      if (!response.ok) throw new Error("Error ejecutando automatización");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "¡Éxito!",
        description: `Automatización ejecutada: ${data.results.length} acciones completadas`,
      });
      setPostUrl("");
      setSelectedAccounts([]);
      setCommentText("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Automatización de Posts
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sube URLs de posts y automatiza acciones con tus cuentas
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto p-4 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nueva Automatización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Post URL */}
              <div>
                <Label htmlFor="post-url" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  URL del Post de Facebook *
                </Label>
                <Input
                  id="post-url"
                  placeholder="https://facebook.com/..."
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  className="mt-2"
                  data-testid="input-post-url"
                />
              </div>

              {/* Action Type */}
              <div>
                <Label>Tipo de Acción *</Label>
                <Select value={actionType} onValueChange={(v: any) => setActionType(v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="like">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" /> Like
                      </div>
                    </SelectItem>
                    <SelectItem value="react">Reacción (❤️ 👍 😮 😢 😡)</SelectItem>
                    <SelectItem value="comment">Comentario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Comment Text */}
              {actionType === "comment" && (
                <div>
                  <Label htmlFor="comment">Texto del Comentario *</Label>
                  <textarea
                    id="comment"
                    placeholder="Escribe tu comentario..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full mt-2 p-2 border border-border rounded-md bg-background text-foreground min-h-[80px]"
                    data-testid="input-comment"
                  />
                </div>
              )}

              {/* Select Accounts */}
              <div>
                <Label className="mb-3 flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-500" />
                  Cuentas a Usar ({selectedAccounts.length} seleccionadas)
                </Label>
                {accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded">
                    No tienes cuentas de Facebook vinculadas. Agrega cuentas primero.
                  </p>
                ) : (
                  <div className="space-y-2 mt-3">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          checked={selectedAccounts.includes(account.id)}
                          onCheckedChange={() => toggleAccount(account.id)}
                          id={account.id}
                        />
                        <label htmlFor={account.id} className="cursor-pointer flex-1">
                          <p className="font-medium">{account.accountName}</p>
                          <p className="text-xs text-muted-foreground">{account.status}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Execute Button */}
              <Button
                onClick={() => automationMutation.mutate()}
                disabled={automationMutation.isPending || !postUrl || selectedAccounts.length === 0}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
