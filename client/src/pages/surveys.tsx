import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, BarChart3, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { SurveyCard } from "@/components/survey-card";
import type { Survey } from "@shared/schema";

export default function SurveysPage() {
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDesc, setSurveyDesc] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

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

  const { data: surveys = [], isLoading } = useQuery<Survey[]>({
    queryKey: [`/api/surveys/${userId}`],
    enabled: !!userId,
  });

  const createSurveyMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; userId: string }) => {
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

  const handleCopyLink = (surveyId: string) => {
    const link = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(surveyId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Enlace copiado", description: "El enlace de la encuesta se copió al portapapeles" });
  };

  if (isLoading) return <div className="p-6">Cargando encuestas...</div>;

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Encuestas</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Crea y gestiona tus encuestas para recopilar información valiosa
                </p>
              </div>
              <Button onClick={() => setShowNewForm(true)} data-testid="button-create-new-survey" size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                <span>Nueva Encuesta</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 p-8 pb-20">
        {/* New Survey Form */}
        {showNewForm && (
          <Card className="border-primary/20">
            <CardHeader className="pb-4 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <CardTitle>Nueva Encuesta</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowNewForm(false);
                    setSurveyTitle("");
                    setSurveyDesc("");
                  }}
                  data-testid="button-close-form"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="survey-title" className="text-sm font-semibold">Título de la Encuesta</Label>
                <Input
                  id="survey-title"
                  placeholder="Ej: Satisfacción del Cliente"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  data-testid="input-survey-title"
                  autoFocus
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="survey-desc" className="text-sm font-semibold">Descripción</Label>
                <Textarea
                  id="survey-desc"
                  placeholder="Describe el propósito y contexto de tu encuesta..."
                  value={surveyDesc}
                  onChange={(e) => setSurveyDesc(e.target.value)}
                  data-testid="textarea-survey-desc"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2 pt-2">
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
                    });
                  }}
                  disabled={createSurveyMutation.isPending}
                  data-testid="button-create-survey"
                >
                  {createSurveyMutation.isPending ? "Creando..." : "Crear Encuesta"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewForm(false);
                    setSurveyTitle("");
                    setSurveyDesc("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Surveys Grid */}
        {surveys.length === 0 ? (
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium text-foreground">No hay encuestas aún</p>
              <p className="text-sm text-muted-foreground mt-2">Crea tu primera encuesta para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey: any) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                questionsCount={(survey.questions || []).length}
                responsesCount={(survey.responses || []).length}
                copiedId={copiedId}
                isDeletingId={deleteSurveyMutation.isPending ? survey.id : undefined}
                onEdit={(id) => navigate(`/survey-edit/${id}`)}
                onShare={handleCopyLink}
                onDelete={(id) => deleteSurveyMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
