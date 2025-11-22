import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Check, BarChart3, AlertCircle, Plus, X } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
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
  const [isActive, setIsActive] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionType, setEditQuestionType] = useState("");
  const [editQuestionRequired, setEditQuestionRequired] = useState(true);

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
          isActive,
        }),
      });
      if (!response.ok) throw new Error("Error actualizando encuesta");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
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
      queryClient.refetchQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      toast({ title: "Pregunta agregada correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: { question: string; type: string; isRequired: boolean }) => {
      if (!editingQuestion) throw new Error("No question selected");
      const response = await fetch(`/api/survey-questions/${editingQuestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error actualizando pregunta");
      return response.json();
    },
    onSuccess: () => {
      setEditingQuestion(null);
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      toast({ title: "Pregunta actualizada" });
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
      queryClient.refetchQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
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

  const handleEditQuestion = (question: SurveyQuestion) => {
    setEditingQuestion(question);
    setEditQuestionText(question.question);
    setEditQuestionType(question.type);
    setEditQuestionRequired(question.isRequired);
  };

  const handleSaveEditQuestion = () => {
    if (!editQuestionText.trim()) {
      toast({ title: "Error", description: "La pregunta es requerida", variant: "destructive" });
      return;
    }
    updateQuestionMutation.mutate({
      question: editQuestionText,
      type: editQuestionType,
      isRequired: editQuestionRequired,
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

  if (isLoading) return <LoadingSpinner />;
  if (!survey) return <div className="p-6 text-destructive">Encuesta no encontrada</div>;

  // Initialize edit state from survey
  if (!editTitle && survey?.title) {
    setEditTitle(survey.title);
    setEditDesc(survey.description || "");
    setIsActive(survey.isActive !== undefined ? survey.isActive : true);
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="mb-4" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{survey.title}</h1>
              </div>
              <Button
                size="lg"
                onClick={() => handleCopyLink(surveyId)}
                disabled={(survey.questions || []).length === 0}
                data-testid={`button-share-survey-${surveyId}`}
                className="gap-2 flex-shrink-0"
              >
                {copiedId === surveyId ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Compartir
                  </>
                )}
              </Button>
            </div>

            {/* Alert when no questions */}
            {(survey.questions || []).length === 0 && (
              <Alert className="border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 mt-4 py-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                <AlertTitle className="text-xs text-amber-900 dark:text-amber-200 m-0">
                  Agrega preguntas para poder compartir tu encuesta
                </AlertTitle>
              </Alert>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4 p-8 pb-20">

        {/* Tabs */}
        <Tabs defaultValue="principal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="principal">Principal</TabsTrigger>
            <TabsTrigger value="preguntas">Preguntas</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            <TabsTrigger value="contactos">Contactos</TabsTrigger>
            <TabsTrigger value="respuestas">Respuestas</TabsTrigger>
          </TabsList>

          {/* Principal Tab */}
          <TabsContent value="principal" className="space-y-4 mt-4">
            {/* Survey Details Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/30">
                <CardTitle>Detalles de la Encuesta</CardTitle>
                {!isEditingDetails && (
                  <Button
                    variant="ghost"
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
                    <div className="space-y-4 border-t border-border/30 pt-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is-active"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="is-active" className="text-sm font-semibold cursor-pointer">
                          Encuesta Activa
                        </Label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
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
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase">Título</p>
                      <p className="text-base font-semibold mt-2">{editTitle}</p>
                    </div>
                    {editDesc && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase">Descripción</p>
                        <p className="text-sm mt-2 text-foreground">{editDesc}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-destructive'}`}></div>
                      <p className="text-sm font-medium">{isActive ? 'Encuesta Activa' : 'Encuesta Desactivada'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preguntas Tab */}
          <TabsContent value="preguntas" className="space-y-4 mt-4">
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
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Preguntas ({survey.questions?.length || 0})
                </h2>
              </div>

              {(survey.questions || []).length === 0 ? (
                <Card className="bg-muted/20 border-dashed">
                  <CardContent className="py-12 text-center">
                    <p className="text-base font-medium text-foreground">No hay preguntas aún</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Usa el formulario de arriba para agregar preguntas
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
                      onEdit={handleEditQuestion}
                      onDelete={handleDeleteQuestion}
                      onDuplicate={handleDuplicateQuestion}
                      isDeletingId={deletingQuestionId}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Estadísticas Tab */}
          <TabsContent value="estadisticas" className="space-y-4 mt-4">
            <SurveyStatistics survey={survey} />
          </TabsContent>

          {/* Contactos Tab */}
          <TabsContent value="contactos" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Base de Datos de Contactos</h3>
                {survey.responses && survey.responses.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">{survey.responses.length} contacto{survey.responses.length !== 1 ? 's' : ''} registrado{survey.responses.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>

            <Alert className="border-blue-500/40 bg-blue-50 dark:bg-blue-950/20 py-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
              <AlertTitle className="text-xs text-blue-900 dark:text-blue-200 m-0">
                Los contactos son respondientes que proporcionan su nombre y número de WhatsApp
              </AlertTitle>
            </Alert>

            {!survey.responses || survey.responses.length === 0 ? (
              <div className="py-8 text-center border border-border/30 rounded-md">
                <p className="text-sm font-medium text-muted-foreground">No hay contactos aún</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Los contactos aparecerán aquí cuando alguien complete tu encuesta
                </p>
              </div>
            ) : (
              <div className="border border-border/30 rounded-md overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <div className="divide-y divide-border/30">
                    {survey.responses.map((response: any, idx: number) => (
                      <div key={response.id} className="p-4 bg-muted/10 hover:bg-muted/20 transition-colors">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Información del contacto */}
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground font-semibold uppercase">Nombre</p>
                              <p className="text-sm font-semibold text-foreground">{response.respondentName || "No proporcionado"}</p>
                            </div>
                            {response.respondentWhatsapp && (
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold uppercase">WhatsApp</p>
                                <p className="text-sm text-primary">{response.respondentWhatsapp}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-muted-foreground font-semibold uppercase">Fecha</p>
                              <p className="text-xs text-foreground">
                                {new Date(response.createdAt).toLocaleDateString('es-ES', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'})} - {new Date(response.createdAt).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                              </p>
                            </div>
                          </div>

                          {/* Respuestas del contacto */}
                          <div className="space-y-2">
                            {response.answers && Object.entries(response.answers).length > 0 ? (
                              <div>
                                <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Respuestas</p>
                                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                                  {Object.entries(response.answers).map(([questionId, answer]: [string, any], ansIdx: number) => (
                                    <div key={ansIdx} className="text-xs bg-muted/20 p-2 rounded border border-border/30">
                                      <p className="font-semibold text-primary/80 line-clamp-1">{answer.question || "Sin pregunta"}</p>
                                      <p className="text-muted-foreground mt-0.5 line-clamp-2">{answer.answer || "Sin respuesta"}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs text-muted-foreground">Sin respuestas registradas</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Respuestas Tab */}
          <TabsContent value="respuestas" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Respuestas Recibidas</h3>
                {survey.responses && survey.responses.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">{survey.responses.length} respuesta{survey.responses.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            {!survey.responses || survey.responses.length === 0 ? (
              <div className="py-8 text-center border border-border/30 rounded-md">
                <p className="text-sm font-medium text-muted-foreground">No hay respuestas aún</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Las respuestas aparecerán aquí cuando alguien complete tu encuesta
                </p>
              </div>
            ) : (
              <div className="border border-border/30 rounded-md overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <div className="divide-y divide-border/30">
                    {survey.responses.map((response: any, idx: number) => (
                      <div key={response.id} className="p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{response.respondentName || "Anónimo"}</p>
                            {response.respondentWhatsapp && (
                              <p className="text-xs text-muted-foreground">{response.respondentWhatsapp}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {new Date(response.createdAt).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'})}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(response.createdAt).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                            </p>
                          </div>
                        </div>
                        {response.answers && Object.entries(response.answers).length > 0 && (
                          <div className="space-y-2">
                            {Object.entries(response.answers).map(([questionId, answer]: [string, any], ansIdx: number) => (
                              <div key={ansIdx} className="text-xs">
                                <p className="font-semibold text-primary/80">{answer.question || "Sin pregunta"}</p>
                                <p className="text-muted-foreground mt-0.5 line-clamp-2">{answer.answer || "Sin respuesta"}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Question Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle>Editar Pregunta</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingQuestion(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-question-text" className="text-sm font-semibold">Pregunta</Label>
                  <Textarea
                    id="edit-question-text"
                    value={editQuestionText}
                    onChange={(e) => setEditQuestionText(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-question-type" className="text-sm font-semibold">Tipo</Label>
                  <select
                    id="edit-question-type"
                    value={editQuestionType}
                    onChange={(e) => setEditQuestionType(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="text">Texto Corto</option>
                    <option value="textarea">Texto Largo</option>
                    <option value="date">Fecha</option>
                    <option value="number">Número</option>
                    <option value="select">Selector</option>
                    <option value="checkbox">Casillas</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-question-required"
                    checked={editQuestionRequired}
                    onChange={(e) => setEditQuestionRequired(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="edit-question-required" className="text-sm font-semibold cursor-pointer">
                    Pregunta Obligatoria
                  </Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditingQuestion(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveEditQuestion}
                    disabled={updateQuestionMutation.isPending}
                    className="flex-1"
                  >
                    {updateQuestionMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function SurveyStatistics({ survey }: { survey: any }) {
  if (!survey.responses || survey.responses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No hay respuestas aún para mostrar estadísticas</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular estadísticas generales
  const totalResponses = survey.responses.length;
  const totalQuestions = survey.questions?.length || 0;
  const completionRate = totalQuestions > 0 ? Math.round((totalResponses / totalQuestions) * 100) : 0;
  const avgCompletionTime = Math.round(
    (survey.responses.reduce((sum: number, r: any) => sum + (r.completionTime || 0), 0) / totalResponses) / 1000
  );

  // Calcular tasa de finalización por pregunta
  const questionCompletionRates = (survey.questions || []).map((q: any) => {
    const answeredCount = survey.responses.filter((r: any) => r.answers && r.answers[q.id]).length;
    return {
      question: q.question.substring(0, 25) + (q.question.length > 25 ? '...' : ''),
      completion: Math.round((answeredCount / totalResponses) * 100),
      answered: answeredCount,
      total: totalResponses,
    };
  });

  // Calcular distribución de respuestas por pregunta
  const questionAnalysis = (survey.questions || []).map((q: any, idx: number) => {
    const responses = survey.responses
      .filter((r: any) => r.answers && r.answers[q.id])
      .map((r: any) => r.answers[q.id]);

    if (q.type === 'text' || q.type === 'textarea') {
      return {
        id: q.id,
        question: q.question,
        type: q.type,
        totalResponses: responses.length,
        responses,
      };
    }

    // Contar opciones para otros tipos
    const distribution: any = {};
    responses.forEach((resp: any) => {
      const answer = String(resp);
      distribution[answer] = (distribution[answer] || 0) + 1;
    });

    const distributionData = Object.entries(distribution).map(([answer, count]: [string, any]) => ({
      name: answer,
      value: count,
      percentage: Math.round((count / responses.length) * 100),
    })).sort((a: any, b: any) => b.value - a.value);

    return {
      id: q.id,
      question: q.question,
      type: q.type,
      totalResponses: responses.length,
      distribution: distributionData,
    };
  });

  return (
    <div className="space-y-4">
      {/* Métricas Generales - Compactas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Respuestas</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{totalResponses}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/50">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Preguntas</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalQuestions}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/50">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Tasa</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{completionRate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Avg</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{avgCompletionTime}s</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasa de Finalización por Pregunta - Tabla compacta */}
      <Card>
        <CardHeader className="border-b border-border/30 pb-3">
          <CardTitle className="text-base">Tasa de Finalización por Pregunta</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 bg-background/50 overflow-hidden">
          <div className="space-y-3">
            {questionCompletionRates.map((qc: any, idx: number) => (
              <div key={idx} className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-foreground font-medium truncate flex-1">{qc.question}</span>
                  <span className="text-primary font-bold flex-shrink-0">{qc.completion}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex-shrink-0">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all"
                    style={{ width: `${qc.completion}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análisis Detallado por Pregunta */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Reporte Detallado de Preguntas</h3>
        {questionAnalysis.map((q: any, idx: number) => (
          <Card key={q.id} className="overflow-hidden border border-border/50 rounded-md">
            <CardHeader className="bg-muted/5 border-b border-border/20 py-3 px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary">P{idx + 1}</span>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {q.type === 'textarea' ? 'Texto largo' : q.type === 'text' ? 'Texto' : q.type === 'date' ? 'Fecha' : 'Número'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold line-clamp-2 text-foreground">{q.question}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Respuestas</p>
                  <p className="text-xl font-bold text-primary">{q.totalResponses}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {q.type === 'text' || q.type === 'textarea' ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Respuestas Recibidas</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {q.responses.slice(0, 5).map((resp: any, respIdx: number) => (
                      <div key={respIdx} className="p-2 bg-muted/20 rounded text-xs border border-border/30 line-clamp-2">
                        {resp}
                      </div>
                    ))}
                    {q.responses.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        +{q.responses.length - 5} más
                      </p>
                    )}
                  </div>
                </div>
              ) : q.distribution && q.distribution.length > 0 ? (
                <div className="space-y-3">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={q.distribution} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2">
                    {q.distribution.slice(0, 4).map((dist: any, distIdx: number) => (
                      <div key={distIdx} className="p-2.5 bg-muted/20 rounded-md text-xs border border-border/30">
                        <p className="font-semibold text-foreground line-clamp-1">{dist.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-muted-foreground">{dist.value} resp</span>
                          <span className="font-bold text-primary">{dist.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sin respuestas registradas</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
