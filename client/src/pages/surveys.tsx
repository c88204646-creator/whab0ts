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
      <div className="max-w-7xl mx-auto space-y-4 p-4 pb-20">
        {/* Compact Header */}
        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-2xl font-bold">Encuestas</h1>
          </div>
          <Button onClick={() => setShowNewForm(true)} size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Nueva
          </Button>
        </div>

        {/* New Survey Form - Compact */}
        {showNewForm && (
          <Card className="border-primary/20 bg-muted/40">
            <CardHeader className="py-3 px-4 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Nueva Encuesta</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowNewForm(false);
                    setSurveyTitle("");
                    setSurveyDesc("");
                  }}
                  className="h-5 w-5 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              <div>
                <Label htmlFor="survey-title" className="text-xs font-semibold">Título</Label>
                <Input
                  id="survey-title"
                  placeholder="Ej: Satisfacción del Cliente"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  data-testid="input-survey-title"
                  autoFocus
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="survey-desc" className="text-xs font-semibold">Descripción</Label>
                <Textarea
                  id="survey-desc"
                  placeholder="Describe el propósito..."
                  value={surveyDesc}
                  onChange={(e) => setSurveyDesc(e.target.value)}
                  data-testid="textarea-survey-desc"
                  rows={2}
                  className="text-sm"
                />
              </div>
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
                size="sm"
                className="w-full"
                data-testid="button-create-survey"
              >
                {createSurveyMutation.isPending ? "Creando..." : "Crear"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Surveys Grid - Responsive */}
        {surveys.length === 0 ? (
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="py-8 text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">Crea tu primera encuesta</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
