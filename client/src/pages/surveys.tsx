import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, BarChart3, X, Eye, Share2, Check, Pause, Play, Trash2, Users, Target, CheckCircle2, Globe, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Survey } from "@shared/schema";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

const resetForm = (setSurveyTitle: any, setSurveyDesc: any) => {
  setSurveyTitle("");
  setSurveyDesc("");
};

export default function SurveysPage() {
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDesc, setSurveyDesc] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedResultsId, setCopiedResultsId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleOpenModal = () => {
    resetForm(setSurveyTitle, setSurveyDesc);
    setShowNewForm(true);
  };

  const handleCloseModal = () => {
    setShowNewForm(false);
    resetForm(setSurveyTitle, setSurveyDesc);
  };

  const handleCopyResultsLink = (surveyId: string) => {
    const link = `${window.location.origin}/survey/${surveyId}/results`;
    navigator.clipboard.writeText(link);
    setCopiedResultsId(surveyId);
    setTimeout(() => setCopiedResultsId(null), 2000);
    toast({ title: "Enlace copiado", description: "El enlace de resultados se copió al portapapeles" });
  };

  if (!userId) {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserId(parsed.id);
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }

  const { data: surveys = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/surveys/${userId}`],
    enabled: !!userId,
  });

  const createSurveyMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        title: data.title,
        description: data.description,
        userId: data.userId,
        isActive: true,
      };
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Error creando encuesta");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/${userId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/surveys/${userId}`] });
      setSurveyTitle("");
      setSurveyDesc("");
      setShowNewForm(false);
      toast({ title: "Encuesta creada", description: "La encuesta se creó exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSurveyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/surveys/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando encuesta");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/${userId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/surveys/${userId}`] });
      toast({ title: "Encuesta eliminada" });
    },
  });

  const toggleSurveyMutation = useMutation({
    mutationFn: async (id: string) => {
      const survey = surveys.find(s => s.id === id);
      if (!survey) throw new Error("Encuesta no encontrada");
      const response = await fetch(`/api/surveys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !survey.isActive }),
      });
      if (!response.ok) throw new Error("Error actualizando encuesta");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/${userId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/surveys/${userId}`] });
      toast({ 
        title: data.isActive ? "Encuesta activada" : "Encuesta pausada",
        description: data.isActive ? "La encuesta está activa" : "La encuesta está pausada"
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCopyLink = (surveyId: string) => {
    const link = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(surveyId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Enlace copiado", description: "El enlace de la encuesta se copió al portapapeles" });
  };

  // Open custom domain linking modal
  const handleLinkCustomDomain = (surveyId: string) => {
    // Navigate to custom domains with survey ID
    navigate(`/custom-domains?surveyId=${surveyId}`);
  };

  if (isLoading) return <LoadingSpinner />;

  const activeSurveys = surveys.filter(s => s.isActive).length;
  const totalResponses = surveys.reduce((sum, s) => sum + ((s.responses || []).length), 0);
  
  // Filter surveys by search query
  const filteredSurveys = surveys.filter((survey: any) =>
    survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (survey.description && survey.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-foreground">Encuestas</h1>
                    <p className="text-xs text-muted-foreground">Crear y gestionar encuestas</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleOpenModal} data-testid="button-create-new-survey" size="sm" className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva encuesta</span>
              </Button>
            </div>

            {/* Alert Banner */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Crea y comparte encuestas a tus usuarios</p>
                  <p className="text-xs text-foreground/70 mt-0.5">Visualiza reportes detallados y análisis en tiempo real de tus resultados</p>
                </div>
                <Button onClick={handleOpenModal} variant="default" size="sm" className="flex-shrink-0 text-xs h-8" data-testid="button-create-from-banner">
                  Crear
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {surveys.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Total" value={surveys.length} icon={BarChart3} />
                  <StatCard label="Activas" value={activeSurveys} icon={CheckCircle2} />
                  <StatCard label="Respuestas" value={totalResponses} icon={Users} />
                  <StatCard label="Pausadas" value={surveys.length - activeSurveys} icon={Target} />
                </div>
              )}
              
              {/* Dominios Section */}
              <Button
                onClick={() => navigate("/custom-domains")}
                variant="outline"
                className="w-full justify-start h-auto p-3 hover-elevate"
                data-testid="button-go-to-domains"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Dominios Personalizados</p>
                    <p className="text-xs text-muted-foreground">Agrega dominios para tus encuestas</p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar encuestas por título o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
                data-testid="input-search-surveys"
              />
            </div>
          </div>

          {surveys.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No hay encuestas aún</p>
                <p className="text-sm text-muted-foreground mt-2">Crea tu primera encuesta para comenzar</p>
              </CardContent>
            </Card>
          ) : filteredSurveys.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No se encontraron encuestas</p>
                <p className="text-sm text-muted-foreground mt-2">Intenta ajustar tu búsqueda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Encuesta</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Descripción</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Preguntas</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Respuestas</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSurveys.map((survey: any, idx: number) => {
                    const questionsCount = (survey.questions || []).length;
                    const responsesCount = (survey.responses || []).length;
                    const hasQuestions = questionsCount > 0;
                    const isDeleting = deleteSurveyMutation.isPending && deleteSurveyMutation.variables === survey.id;
                    return (
                      <tr 
                        key={survey.id}
                        onClick={() => navigate(`/survey-edit/${survey.id}`)}
                        className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${
                          idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                        }`}
                        data-testid={`row-survey-${survey.id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/20 text-xs font-semibold">
                                {survey.title.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-semibold text-sm text-foreground">{survey.title}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-muted-foreground truncate">
                            {survey.description || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-medium text-foreground">{questionsCount}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-medium text-foreground">{responsesCount}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            survey.isActive 
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {survey.isActive ? 'Activa' : 'Pausada'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              onClick={() => navigate(`/survey-edit/${survey.id}`)}
                              className="h-8 gap-1"
                              data-testid={`button-edit-survey-${survey.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline text-xs">Ver</span>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleCopyLink(survey.id)}
                              disabled={!hasQuestions}
                              className="h-8 w-8 p-0"
                              data-testid={`button-share-survey-${survey.id}`}
                              title={hasQuestions ? "Copiar enlace" : "Sin preguntas"}
                            >
                              {copiedId === survey.id ? (
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <Share2 className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleCopyResultsLink(survey.id)}
                              disabled={responsesCount === 0}
                              className="h-8 w-8 p-0"
                              data-testid={`button-results-survey-${survey.id}`}
                              title={responsesCount > 0 ? "Copiar enlace de resultados" : "Sin respuestas"}
                            >
                              {copiedResultsId === survey.id ? (
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <BarChart3 className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleLinkCustomDomain(survey.id)}
                              className="h-8 w-8 p-0"
                              title="Usar dominio personalizado"
                              data-testid={`button-custom-domain-${survey.id}`}
                            >
                              <Globe className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleSurveyMutation.mutate(survey.id)}
                              className="h-8 w-8 p-0"
                              title={survey.isActive ? 'Pausar' : 'Reactivar'}
                              data-testid={`button-toggle-survey-${survey.id}`}
                            >
                              {survey.isActive ? (
                                <Pause className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Play className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteSurveyMutation.mutate(survey.id)}
                              disabled={isDeleting}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              data-testid={`button-delete-survey-${survey.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showNewForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Nueva Encuesta</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Información básica de la encuesta</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseModal}
                data-testid="button-close-create"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <CardContent className="p-5 space-y-3">
              <div>
                <Label htmlFor="modal-survey-title" className="text-sm font-semibold">Título *</Label>
                <Input
                  id="modal-survey-title"
                  placeholder="Ej: Satisfacción del Cliente"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  data-testid="input-modal-survey-title"
                  autoFocus
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="modal-survey-desc" className="text-sm font-semibold">Descripción</Label>
                <Textarea
                  id="modal-survey-desc"
                  placeholder="¿Cuál es el propósito de esta encuesta?"
                  value={surveyDesc}
                  onChange={(e) => setSurveyDesc(e.target.value)}
                  data-testid="input-modal-survey-desc"
                  rows={2}
                  className="mt-1.5 resize-none"
                />
              </div>
            </CardContent>

            <div className="p-5 border-t border-border flex gap-2">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1 h-9"
                data-testid="button-cancel-create"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!surveyTitle.trim()) {
                    toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
                    return;
                  }
                  createSurveyMutation.mutate({
                    title: surveyTitle,
                    description: surveyDesc,
                    userId: userId!,
                    isActive: true,
                  });
                }}
                disabled={createSurveyMutation.isPending || !surveyTitle.trim()}
                className="flex-1 h-9"
                data-testid="button-save-create"
              >
                {createSurveyMutation.isPending ? "Creando..." : "Crear"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
