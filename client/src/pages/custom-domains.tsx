import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, AlertCircle, Copy, Check, Trash2, Globe, Link2, Unlink2, Loader, CheckCircle, XCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function CustomDomainsPage() {
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDomainForSurvey, setSelectedDomainForSurvey] = useState<string | null>(null);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [domainCheckError, setDomainCheckError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Default domain - detect from current location
  const DEFAULT_DOMAIN = typeof window !== 'undefined' ? window.location.origin : "https://encuestas.replit.app";

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

  const { data: domains = [], isLoading, refetch: refetchDomains } = useQuery<any[]>({
    queryKey: ["/api/custom-domains", userId],
    enabled: !!userId,
  });

  // Auto-refetch domains every 5 seconds to check verification status
  useEffect(() => {
    if (!userId || domains.length === 0) return;
    
    const hasPendingDomains = domains.some((d: any) => d.status === 'pending');
    if (!hasPendingDomains) return;

    const interval = setInterval(() => {
      refetchDomains();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [userId, domains, refetchDomains]);

  const { data: surveys = [] } = useQuery<any[]>({
    queryKey: [`/api/surveys/user/${userId}`, userId],
    enabled: !!userId,
  });

  const checkDomainAvailabilityMutation = useMutation({
    mutationFn: async (domain: string) => {
      const response = await fetch("/api/custom-domains/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      if (!response.ok) throw new Error("Error verificando dominio");
      return response.json();
    },
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
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error creando dominio");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-domains", userId] });
      setNewDomain("");
      setDomainCheckError(null);
      // Start verification polling for this domain
      setVerifyingDomainId(data.id);
      toast({ title: "Dominio agregado", description: "Verificando DNS automáticamente..." });
      
      // Attempt first verification after 2 seconds
      setTimeout(() => {
        verifyDomainMutation.mutate(data.id);
      }, 2000);
    },
    onError: (error: any) => {
      setDomainCheckError(error.message);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const response = await fetch(`/api/custom-domains/${domainId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.verified) {
        queryClient.invalidateQueries({ queryKey: ["/api/custom-domains", userId] });
        setVerifyingDomainId(null);
        toast({ 
          title: "Dominio verificado", 
          description: `${data.domain} ha sido verificado exitosamente!` 
        });
      }
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
          {/* Dominio Por Defecto - Compacto */}
          <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/30 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-0.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                Dominio Por Defecto
              </p>
              <p className="text-sm font-mono font-semibold text-foreground break-all">{DEFAULT_DOMAIN}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(DEFAULT_DOMAIN);
                toast({ title: "Dominio copiado" });
              }}
              className="flex-shrink-0 h-8 w-8 p-0 ml-2"
              data-testid="button-copy-default-domain"
            >
              {copiedId === 'default' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

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
                    <Card key={domain.id} className={`hover-elevate ${domain.status === 'failed' ? 'border-red-500/30' : domain.status === 'pending' ? 'border-yellow-500/30' : ''}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-lg font-semibold text-foreground break-all">{domain.domain}</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                  (domain.status === 'verified' || domain.status === 'active')
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                    : domain.status === 'failed'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                }`}>
                                  {domain.status === 'verified' ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      Verificado
                                    </>
                                  ) : domain.status === 'active' ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      Activo
                                    </>
                                  ) : domain.status === 'failed' ? (
                                    <>
                                      <XCircle className="w-3 h-3" />
                                      Error
                                    </>
                                  ) : verifyingDomainId === domain.id ? (
                                    <>
                                      <Loader className="w-3 h-3 animate-spin" />
                                      Verificando...
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-3 h-3" />
                                      Pendiente
                                    </>
                                  )}
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
                              {domain.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => verifyDomainMutation.mutate(domain.id)}
                                  disabled={verifyDomainMutation.isPending}
                                  title="Verificar dominio"
                                >
                                  {verifyDomainMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                </Button>
                              )}
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
                  Para que tu dominio personalizado funcione, necesitas configurar los registros DNS. Sin esto, el dominio no resolverá correctamente a tu encuesta.
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
                      onChange={(e) => {
                        setNewDomain(e.target.value);
                        setDomainCheckError(null);
                      }}
                      onBlur={() => {
                        if (newDomain && newDomain.length > 4) {
                          checkDomainAvailabilityMutation.mutate(newDomain);
                        }
                      }}
                      className="flex-1"
                      data-testid="input-new-domain"
                    />
                    <Button
                      onClick={() => newDomain && createDomainMutation.mutate(newDomain)}
                      disabled={!newDomain || createDomainMutation.isPending || checkDomainAvailabilityMutation.isPending}
                      data-testid="button-create-domain"
                    >
                      {createDomainMutation.isPending ? 'Agregando...' : 'Agregar'}
                    </Button>
                  </div>

                  {/* Domain availability feedback */}
                  {checkDomainAvailabilityMutation.data && (
                    <div className={`text-sm flex items-center gap-2 ${
                      checkDomainAvailabilityMutation.data.valid && checkDomainAvailabilityMutation.data.available
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {checkDomainAvailabilityMutation.data.valid && checkDomainAvailabilityMutation.data.available ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Dominio disponible
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          {checkDomainAvailabilityMutation.data.error}
                        </>
                      )}
                    </div>
                  )}

                  {domainCheckError && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {domainCheckError}
                    </p>
                  )}
                </div>

                {/* Instrucciones DNS */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-500/30 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Configurar tu dominio</h4>
                  </div>
                  <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">Tu dominio se registra en nuestro sistema, pero para que sea accesible públicamente, necesitas configurar un registro CNAME en tu proveedor DNS. Sigue estos pasos:</p>
                  
                  <ol className="list-decimal list-inside space-y-2 text-xs text-blue-800 dark:text-blue-200">
                    <li><strong>Ingresa tu dominio</strong> (ej: encuestas.miempresa.com)</li>
                    <li><strong>Ve a tu proveedor DNS</strong> (GoDaddy, Namecheap, CloudFlare, AWS Route53, etc.)</li>
                    <li>
                      <strong>Agrega un nuevo registro CNAME:</strong>
                      <div className="mt-2 p-3 bg-white dark:bg-background rounded border border-blue-500/50 space-y-2">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Nombre (Host):</p>
                          <div className="flex items-center justify-between gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                            <code className="text-xs font-mono">encuestas.miempresa.com</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 p-1"
                              onClick={() => {
                                navigator.clipboard.writeText("encuestas.miempresa.com");
                                toast({ title: "Copiado" });
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Tipo: CNAME</p>
                          <p className="text-xs text-muted-foreground">Valor:</p>
                          <div className="flex items-center justify-between gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                            <code className="text-xs font-mono">api.surveys.app</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 p-1"
                              onClick={() => {
                                navigator.clipboard.writeText("api.surveys.app");
                                toast({ title: "Copiado" });
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li><strong>Espera a la propagación DNS:</strong> Puede tomar 5 minutos a 48 horas (generalmente 15-30 minutos)</li>
                    <li><strong>Verifica el dominio:</strong> Haz clic en "Verificar" cuando hayas configurado el DNS - esto confirma que funciona</li>
                    <li><strong>Usa en encuestas:</strong> Después de verificar, tu dominio estará disponible para usar en encuestas</li>
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
                          className="h-9 px-3 py-1.5 border border-border rounded-md bg-card text-sm appearance-none cursor-pointer hover:bg-muted/50 hover:border-border/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
                
                {domains.length === 0 && (
                  <Alert className="border-yellow-500/40 bg-yellow-50 dark:bg-yellow-950/20 mt-4">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    <AlertDescription className="text-xs text-yellow-900 dark:text-yellow-200 ml-2">
                      No hay dominios personalizados aún. Crea uno en la sección de arriba para asignarlo a tus encuestas.
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
