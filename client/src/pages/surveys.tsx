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

  useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserId(parsed.id);
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }, []);

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
      <div className="max-w-6xl mx-auto space-y-6 p-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Encuestas</h1>
            <p className="text-muted-foreground mt-1">Crea y gestiona tus encuestas personalizadas</p>
          </div>
          <Button onClick={() => setShowNewForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Encuesta
          </Button>
        </div>

        {/* New Survey Form */}
        {showNewForm && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
            <CardHeader className="border-b border-primary/20 pb-4">
              <CardTitle className="flex items-center justify-between">
                <span>Crear Nueva Encuesta</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowNewForm(false);
                    setSurveyTitle("");
                    setSurveyDesc("");
                  }}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="survey-title" className="text-sm font-semibold block mb-2">
                  Título de la Encuesta
                </Label>
                <Input
                  id="survey-title"
                  placeholder="Ej: Satisfacción del Cliente"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  data-testid="input-survey-title"
                  autoFocus
                  className="text-base"
                />
              </div>
              <div>
                <Label htmlFor="survey-desc" className="text-sm font-semibold block mb-2">
                  Descripción (Opcional)
                </Label>
                <Textarea
                  id="survey-desc"
                  placeholder="Describe el propósito de la encuesta..."
                  value={surveyDesc}
                  onChange={(e) => setSurveyDesc(e.target.value)}
                  data-testid="textarea-survey-desc"
                  rows={3}
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
                  className="flex-1"
                  size="lg"
                  data-testid="button-create-survey"
                >
                  {createSurveyMutation.isPending ? "Creando..." : "Crear Encuesta"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Surveys Grid */}
        {surveys.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-medium">No hay encuestas aún</p>
              <p className="text-sm text-muted-foreground mt-1">Crea tu primera encuesta para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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
