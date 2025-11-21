import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Check, BarChart3, AlertCircle, Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { AddQuestionForm } from "@/components/add-question-form";
import { QuestionCard } from "@/components/question-card";
import type { Survey, SurveyQuestion } from "@shared/schema";

export default function SurveyEditorPage() {
  const [match, params] = useRoute("/survey-edit/:id");
  const surveyId = params?.id;
  const { toast } = useToast();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const { data: survey, isLoading } = useQuery<any>({
    queryKey: [`/api/surveys/detail/${surveyId}`],
    enabled: !!surveyId,
  });

  const updateSurveyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
        }),
      });
      if (!response.ok) throw new Error("Error actualizando encuesta");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      setIsEditingDetails(false);
      toast({ title: "Encuesta actualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: { question: string; type: string; isRequired: boolean }) => {
      const response = await fetch("/api/survey-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId,
          ...data,
          order: (survey?.questions?.length || 0),
        }),
      });
      if (!response.ok) throw new Error("Error creando pregunta");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      toast({ title: "Pregunta agregada correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await fetch(`/api/survey-questions/${questionId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando pregunta");
      return response.json();
    },
    onSuccess: () => {
      setDeletingQuestionId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      toast({ title: "Pregunta eliminada" });
    },
    onError: (error: any) => {
      setDeletingQuestionId(null);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDuplicateQuestion = (question: SurveyQuestion) => {
    createQuestionMutation.mutate({
      question: `${question.question} (Copia)`,
      type: question.type,
      isRequired: question.isRequired,
    });
  };

  const handleDeleteQuestion = (id: string) => {
    setDeletingQuestionId(id);
    deleteQuestionMutation.mutate(id);
  };

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/survey/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Enlace copiado al portapapeles" });
  };

  const handleSaveDetails = () => {
    if (!editTitle.trim()) {
      toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
      return;
    }
    updateSurveyMutation.mutate();
  };

  if (isLoading) return <div className="p-6">Cargando encuesta...</div>;
  if (!survey) return <div className="p-6 text-destructive">Encuesta no encontrada</div>;

  // Initialize edit state from survey
  if (!editTitle && survey?.title) {
    setEditTitle(survey.title);
    setEditDesc(survey.description || "");
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto space-y-6 p-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{survey.title}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyLink(surveyId)}
            disabled={(survey.questions || []).length === 0}
            data-testid={`button-share-survey-${surveyId}`}
          >
            {copiedId === surveyId ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Compartir
              </>
            )}
          </Button>
        </div>

        {/* Alert when no questions */}
        {(survey.questions || []).length === 0 && (
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertTitle className="text-amber-900 dark:text-amber-200">
              Tu encuesta necesita preguntas
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-300 mt-2">
              Agrega al menos una pregunta para poder compartir tu encuesta y recopilar respuestas. 
              <Button 
                variant="link" 
                size="sm" 
                className="ml-1 h-auto p-0 text-amber-700 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 underline"
                onClick={() => document.querySelector('[data-testid="button-add-question"]')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Agregar pregunta ahora
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Survey Details Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
            <CardTitle className="text-base">Detalles de la Encuesta</CardTitle>
            {!isEditingDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingDetails(true)}
                data-testid="button-edit-details"
              >
                Editar
              </Button>
            )}
          </CardHeader>

          <CardContent className="pt-6">
            {isEditingDetails ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title" className="text-sm font-semibold">
                    Título
                  </Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    data-testid="input-edit-title"
                    className="mt-2"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="edit-desc" className="text-sm font-semibold">
                    Descripción
                  </Label>
                  <Textarea
                    id="edit-desc"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    data-testid="textarea-edit-desc"
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSaveDetails}
                    disabled={updateSurveyMutation.isPending}
                    data-testid="button-save-details"
                  >
                    {updateSurveyMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingDetails(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Título</p>
                  <p className="font-semibold">{editTitle}</p>
                </div>
                {editDesc && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p className="text-sm">{editDesc}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Question Form */}
        <AddQuestionForm
          onAdd={(question, type, isRequired) => {
            createQuestionMutation.mutate({ question, type, isRequired });
          }}
          isLoading={createQuestionMutation.isPending}
          totalQuestions={survey.questions?.length || 0}
        />

        {/* Questions List */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Preguntas ({survey.questions?.length || 0})
            </h2>
          </div>

          {(survey.questions || []).length === 0 ? (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground font-medium">No hay preguntas aún</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Expande el formulario arriba para agregar tu primera pregunta
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(survey.questions || []).map((question: SurveyQuestion, idx: number) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  number={idx + 1}
                  onDelete={handleDeleteQuestion}
                  onDuplicate={handleDuplicateQuestion}
                  isDeletingId={deletingQuestionId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {(survey.questions || []).length > 0 && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-4 flex gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Total de Preguntas</p>
                <p className="text-2xl font-bold">{survey.questions?.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Respuestas Recibidas</p>
                <p className="text-2xl font-bold">{survey.responses?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
