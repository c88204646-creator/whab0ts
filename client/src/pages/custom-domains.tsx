import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, AlertCircle, Copy, Check, Trash2, Globe, Link2, Unlink2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function CustomDomainsPage() {
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDomainForSurvey, setSelectedDomainForSurvey] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Default domain (Replit subdomain)
  const DEFAULT_DOMAIN = "encuestas.replit.app";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id) setUserId(parsed.id);
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }, []);

  const { data: domains = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/custom-domains", userId],
    enabled: !!userId,
  });

  const { data: surveys = [] } = useQuery<any[]>({
    queryKey: [`/api/surveys/user/${userId}`, userId],
    enabled: !!userId,
  });

  const createDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const response = await fetch("/api/custom-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          domain: domain.trim(),
          description: `Dominio personalizado: ${domain}`,
        }),
      });
      if (!response.ok) throw new Error("Error creando dominio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains", userId] });
      setNewDomain("");
      toast({ title: "Dominio agregado", description: "El dominio se creó exitosamente. Verifica tu DNS." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/custom-domains/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando dominio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains", userId] });
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/user/${userId}`, userId] });
      toast({ title: "Dominio eliminado" });
    },
  });

  const linkDomainToSurveyMutation = useMutation({
    mutationFn: async (data: { surveyId: string; customDomainId: string | null }) => {
      const response = await fetch(`/api/surveys/${data.surveyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomainId: data.customDomainId }),
      });
      if (!response.ok) throw new Error("Error vinculando dominio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/user/${userId}`, userId] });
      setSelectedDomainForSurvey(null);
      toast({ title: "Dominio vinculado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/surveys")}
                  className="h-10 w-10"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-foreground">Dominios Personalizados</h1>
                      <p className="text-xs text-muted-foreground">Administra tus dominios para usar en encuestas</p>
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={() => document.getElementById("add-domain-section")?.scrollIntoView({ behavior: "smooth" })} size="sm" className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar Dominio</span>
              </Button>
            </div>

            {domains.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-medium">Total</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{domains.length}</p>
                </div>
                <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-xs text-muted-foreground font-medium">Verificados</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{domains.filter((d: any) => d.status === 'verified').length}</p>
                </div>
                <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-xs text-muted-foreground font-medium">Pendientes</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{domains.filter((d: any) => d.status !== 'verified').length}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Dominio Por Defecto */}
          <Card className="border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="border-b border-blue-500/20">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Dominio Por Defecto
              </CardTitle>
              <p className="text-xs text-blue-900 dark:text-blue-200 mt-0.5">Tu dominio actual para todas las encuestas</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-background border border-blue-500/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">URL Base</p>
                  <p className="text-lg font-mono font-semibold text-foreground break-all">{DEFAULT_DOMAIN}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Todas tus encuestas están disponibles en este dominio por defecto
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(DEFAULT_DOMAIN);
                    toast({ title: "Dominio copiado" });
                  }}
                  className="flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dominios Listados */}
          {domains.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No hay dominios aún</p>
                <p className="text-sm text-muted-foreground mt-2">Crea tu primer dominio para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Tus Dominios Personalizados</h2>
              <div className="grid gap-3">
                {domains.map((domain: any) => {
                  const surveysUsingDomain = surveys.filter((s: any) => s.customDomainId === domain.id);
                  return (
                    <Card key={domain.id} className="hover-elevate">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-lg font-semibold text-foreground break-all">{domain.domain}</p>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                  domain.status === 'verified'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                }`}>
                                  {domain.status === 'verified' ? 'Verificado' : 'Pendiente'}
                                </span>
                              </div>
                              {domain.description && (
                                <p className="text-sm text-muted-foreground mb-2">{domain.description}</p>
                              )}
                              {domain.lastVerifiedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Verificado: {new Date(domain.lastVerifiedAt).toLocaleDateString('es-ES')}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(domain.domain);
                                  setCopiedId(domain.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                data-testid={`button-copy-domain-${domain.id}`}
                              >
                                {copiedId === domain.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteDomainMutation.mutate(domain.id)}
                                disabled={deleteDomainMutation.isPending}
                                data-testid={`button-delete-domain-${domain.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Encuestas usando este dominio */}
                          {surveysUsingDomain.length > 0 && (
                            <div className="pt-2 border-t border-border/30">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                Encuestas usando este dominio ({surveysUsingDomain.length})
                              </p>
                              <div className="space-y-1">
                                {surveysUsingDomain.map((survey: any) => (
                                  <div key={survey.id} className="text-xs bg-muted/30 p-2 rounded flex items-center justify-between">
                                    <span className="text-foreground truncate">{survey.title}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => linkDomainToSurveyMutation.mutate({ surveyId: survey.id, customDomainId: null })}
                                      disabled={linkDomainToSurveyMutation.isPending}
                                      title="Desvinc dominio"
                                    >
                                      <Unlink2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agregar Nuevo Dominio */}
          <Card id="add-domain-section">
            <CardHeader className="border-b border-border/30">
              <CardTitle>Agregar Nuevo Dominio</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Alert className="border-blue-500/40 bg-blue-50 dark:bg-blue-950/20">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                <AlertDescription className="text-sm text-blue-900 dark:text-blue-200 ml-2">
                  Después de agregar el dominio, deberás verificarlo mediante un registro CNAME en tu proveedor DNS.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="domain-input" className="text-sm font-semibold block mb-2">
                    Dominio
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="domain-input"
                      type="text"
                      placeholder="ejemplo.tuempresa.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="flex-1"
                      data-testid="input-new-domain"
                    />
                    <Button
                      onClick={() => newDomain && createDomainMutation.mutate(newDomain)}
                      disabled={!newDomain || createDomainMutation.isPending}
                      data-testid="button-create-domain"
                    >
                      {createDomainMutation.isPending ? 'Agregando...' : 'Agregar'}
                    </Button>
                  </div>
                </div>

                {/* Instrucciones DNS */}
                <div className="p-4 bg-muted/50 border border-border/30 rounded-lg space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Cómo verificar tu dominio:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Ve a tu proveedor DNS (GoDaddy, Namecheap, CloudFlare, etc.)</li>
                    <li>Agrega un nuevo registro <strong>CNAME</strong> con estos valores:
                      <div className="mt-2 p-2 bg-background rounded border border-border/50 font-mono text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <code>encuestas.tudominio.com → api.surveys.app</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6"
                            onClick={() => {
                              navigator.clipboard.writeText("encuestas.tudominio.com CNAME api.surveys.app");
                              toast({ title: "Copiado" });
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </li>
                    <li>Espera a que se propague (puede tomar hasta 48 horas, pero generalmente es más rápido)</li>
                    <li>El dominio se verificará automáticamente cuando la propagación se complete</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conectar Dominios a Encuestas */}
          {surveys.length > 0 && (
            <Card>
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Conectar Dominios a Encuestas
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Asigna dominios personalizados a tus encuestas</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  {surveys.map((survey: any) => (
                    <div key={survey.id} className="p-4 border border-border/30 rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{survey.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Dominio actual: {survey.customDomainId ? domains.find((d: any) => d.id === survey.customDomainId)?.domain || 'Desconocido' : DEFAULT_DOMAIN}
                          </p>
                        </div>
                        <select
                          value={survey.customDomainId || ""}
                          onChange={(e) => {
                            const domainId = e.target.value || null;
                            linkDomainToSurveyMutation.mutate({ surveyId: survey.id, customDomainId: domainId });
                          }}
                          disabled={linkDomainToSurveyMutation.isPending || domains.filter((d: any) => d.status === 'verified').length === 0}
                          className="px-3 py-2 border border-input rounded-lg bg-background text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <option value="">{DEFAULT_DOMAIN}</option>
                          {domains.filter((d: any) => d.status === 'verified').map((domain: any) => (
                            <option key={domain.id} value={domain.id}>
                              {domain.domain}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                
                {domains.filter((d: any) => d.status !== 'verified').length > 0 && (
                  <Alert className="border-yellow-500/40 bg-yellow-50 dark:bg-yellow-950/20 mt-4">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    <AlertDescription className="text-xs text-yellow-900 dark:text-yellow-200 ml-2">
                      Solo los dominios verificados pueden ser asignados a encuestas. Verifica tus dominios pendientes en DNS.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
