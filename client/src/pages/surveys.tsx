import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, BarChart3, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { SurveyCard } from "@/components/survey-card";
import type { Survey } from "@shared/schema";

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
  const { toast } = useToast();

  const handleOpenModal = () => {
    resetForm(setSurveyTitle, setSurveyDesc);
    setShowNewForm(true);
  };

  const handleCloseModal = () => {
    setShowNewForm(false);
    resetForm(setSurveyTitle, setSurveyDesc);
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
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Encuestas</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {surveys.length} creada{surveys.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={handleOpenModal} data-testid="button-create-new-survey" size="sm" className="gap-1 h-8">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Nueva</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-2 p-3 pb-20">
        {surveys.length === 0 ? (
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium text-foreground">No hay encuestas aún</p>
              <p className="text-sm text-muted-foreground mt-2">Crea tu primera encuesta para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4">
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

      {showNewForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Nueva Encuesta</h2>
                <p className="text-sm text-muted-foreground mt-1">Información básica de la encuesta</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseModal}
                data-testid="button-close-create"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="modal-survey-title">Título *</Label>
                <Input
                  id="modal-survey-title"
                  placeholder="Ej: Satisfacción del Cliente"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  data-testid="input-modal-survey-title"
                  autoFocus
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="modal-survey-desc">Descripción</Label>
                <Textarea
                  id="modal-survey-desc"
                  placeholder="¿Cuál es el propósito de esta encuesta?"
                  value={surveyDesc}
                  onChange={(e) => setSurveyDesc(e.target.value)}
                  data-testid="input-modal-survey-desc"
                  rows={3}
                  className="mt-2"
                />
              </div>
            </CardContent>

            <div className="p-6 border-t border-border flex gap-2">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1"
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
                  });
                }}
                disabled={createSurveyMutation.isPending || !surveyTitle.trim()}
                className="flex-1"
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
