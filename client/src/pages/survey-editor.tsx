import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Check, BarChart3, AlertCircle, Plus, X, BarChart2, CheckCircle, MessageSquare, Clock, Send, MessageCircle, Edit2 } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import { AddQuestionForm } from "@/components/add-question-form";
import { QuestionCard } from "@/components/question-card";
import type { Survey, SurveyQuestion } from "@shared/schema";

export default function SurveyEditorPage() {
  const [match, params] = useRoute("/survey-edit/:id");
  const surveyId = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSurveyUrl, setCopiedSurveyUrl] = useState<string | null>(null);
  const [copiedResultsUrl, setCopiedResultsUrl] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionType, setEditQuestionType] = useState("");
  const [editQuestionRequired, setEditQuestionRequired] = useState(true);
  const [editQuestionOptions, setEditQuestionOptions] = useState("");
  const [whatsappConfig, setWhatsappConfig] = useState<any>({ enabled: false, senderId: "", message: "" });
  const [whatsappAccounts, setWhatsappAccounts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [editingResponseAnswers, setEditingResponseAnswers] = useState<any>({});
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: survey, isLoading } = useQuery<any>({
    queryKey: [`/api/surveys/detail/${surveyId}`],
    enabled: !!surveyId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const { data: whatsappAccountsData } = useQuery<any[]>({
    queryKey: ['/api/whatsapp-accounts', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/whatsapp-accounts?userId=${userId}`);
      if (!response.ok) throw new Error("Error fetching WhatsApp accounts");
      return response.json();
    },
  });

  useEffect(() => {
    if (whatsappAccountsData) {
      setWhatsappAccounts(whatsappAccountsData);
    }
  }, [whatsappAccountsData]);

  useEffect(() => {
    if (survey) {
      setEditTitle(survey.title);
      setEditDesc(survey.description);
      setIsActive(survey.isActive);
      setWhatsappConfig(survey.whatsappConfig || { enabled: false, senderId: "", message: "" });
    }
  }, [survey]);

  const updateSurveyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          isActive,
          whatsappConfig,
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
    mutationFn: async (data: { question: string; type: string; isRequired: boolean; options?: string[] }) => {
      const response = await fetch("/api/survey-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId,
          question: data.question,
          type: data.type,
          isRequired: data.isRequired,
          options: data.options || [],
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
    mutationFn: async (data: { question: string; type: string; isRequired: boolean; options?: string[] }) => {
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
    setEditQuestionOptions((question.options || []).join("\n"));
  };

  const handleSaveEditQuestion = () => {
    if (!editQuestionText.trim()) {
      toast({ title: "Error", description: "La pregunta es requerida", variant: "destructive" });
      return;
    }
    const needsOptions = ["select", "checkbox", "radio"].includes(editQuestionType);
    if (needsOptions && !editQuestionOptions.trim()) {
      toast({ title: "Error", description: "Debes agregar opciones para este tipo de pregunta", variant: "destructive" });
      return;
    }
    const options = editQuestionOptions.trim() ? editQuestionOptions.split("\n").map(o => o.trim()).filter(o => o) : [];
    updateQuestionMutation.mutate({
      question: editQuestionText,
      type: editQuestionType,
      isRequired: editQuestionRequired,
      options,
    });
  };

  const handleDeleteQuestion = (id: string) => {
    setDeletingQuestionId(id);
    deleteQuestionMutation.mutate(id);
  };

  const deleteResponseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/survey-responses/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando respuesta");
      return response.json();
    },
    onSuccess: () => {
      setDeletingResponseId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      toast({ title: "Respuesta eliminada" });
    },
  });

  const updateResponseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/survey-responses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: editingResponseAnswers }),
      });
      if (!response.ok) throw new Error("Error actualizando respuesta");
      return response.json();
    },
    onSuccess: () => {
      setEditingResponseId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      toast({ title: "Respuesta actualizada" });
    },
  });

  const handleEditResponse = (response: any) => {
    setEditingResponseId(response.id);
    setEditingResponseAnswers(response.answers || {});
  };

  const handleDeleteResponse = (id: string) => {
    setDeletingResponseId(id);
    deleteResponseMutation.mutate(id);
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
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-background">
        <div className="px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Title Section */}
            <div className="flex items-start justify-between gap-4 mb-8">
              <div className="flex items-start gap-4 flex-1">
                <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="flex-shrink-0 mt-0.5" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <BarChart2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-foreground">{survey.title}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {survey.description || "Sin descripción"}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleCopyLink(surveyId)}
                disabled={(survey.questions || []).length === 0}
                data-testid={`button-share-survey-${surveyId}`}
                className="gap-2 flex-shrink-0"
              >
                {copiedId === surveyId ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Compartir
                  </>
                )}
              </Button>
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Preguntas */}
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Total</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{(survey.questions || []).length}</p>
              </div>

              {/* Activas */}
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-medium text-muted-foreground">Activas</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{survey.isActive ? 1 : 0}</p>
              </div>

              {/* Respuestas */}
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <p className="text-xs font-medium text-muted-foreground">Respuestas</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{(survey.responses || []).length}</p>
              </div>

              {/* Pausadas */}
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-medium text-muted-foreground">Pausadas</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{!survey.isActive ? 1 : 0}</p>
              </div>
            </div>

            {/* Alert when no questions */}
            {(survey.questions || []).length === 0 && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Agrega preguntas para poder compartir tu encuesta</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex-1 flex flex-col overflow-hidden">

        {/* Tabs */}
        <Tabs defaultValue="principal" className="w-full flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-6 flex-shrink-0 sticky top-0 z-10 px-8 pt-4">
            <TabsTrigger value="principal">Principal</TabsTrigger>
            <TabsTrigger value="preguntas">Preguntas</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            <TabsTrigger value="contactos">Contactos</TabsTrigger>
            <TabsTrigger value="respuestas">Respuestas</TabsTrigger>
            <TabsTrigger value="configuracion">Configuración</TabsTrigger>
          </TabsList>

          {/* Principal Tab */}
          <TabsContent value="principal" className="space-y-6 mt-4 overflow-y-auto flex-1 px-8 pb-20">
            {/* Survey Information Card */}
            <Card className="shadow-md">
              <CardHeader className="border-b border-border/20 bg-gradient-to-r from-muted/50 to-transparent py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold">Información de la Encuesta</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Gestiona los detalles y configuración de tu encuesta</p>
                  </div>
                  {updateSurveyMutation.isPending && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Guardando...</p>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 w-full overflow-visible">
                {/* Main Fields Section */}
                <div className="space-y-4 w-full">
                  {/* Título */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-title" className="text-sm font-semibold text-foreground">
                      Título de la Encuesta
                    </Label>
                    <Input
                      id="edit-title"
                      value={editTitle}
                      onChange={(e) => {
                        setEditTitle(e.target.value);
                        clearTimeout((window as any).titleTimeout);
                        (window as any).titleTimeout = setTimeout(() => {
                          if (e.target.value.trim()) {
                            updateSurveyMutation.mutate();
                          }
                        }, 1000);
                      }}
                      data-testid="input-edit-title"
                      className="text-sm font-medium"
                      placeholder="Ej: Encuesta de satisfacción del cliente"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-desc" className="text-sm font-semibold text-foreground">
                      Descripción (Opcional)
                    </Label>
                    <Textarea autoComplete="off"
                      id="edit-desc"
                      value={editDesc}
                      onChange={(e) => {
                        setEditDesc(e.target.value);
                        clearTimeout((window as any).descTimeout);
                        (window as any).descTimeout = setTimeout(() => {
                          updateSurveyMutation.mutate();
                        }, 1000);
                      }}
                      data-testid="textarea-edit-desc"
                      className="min-h-20 text-sm resize-none"
                      placeholder="Agrega detalles sobre el propósito de tu encuesta..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preguntas Tab */}
          <TabsContent value="preguntas" className="space-y-4 mt-4 overflow-y-auto flex-1 px-8 pb-20">
            {/* Add Question Form */}
            <AddQuestionForm
              onAdd={(question, type, isRequired, options) => {
                createQuestionMutation.mutate({ question, type, isRequired, options });
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
                <div className="space-y-2">
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
          <TabsContent value="estadisticas" className="space-y-4 mt-4 overflow-y-auto flex-1 px-8 pb-20">
            <SurveyStatistics survey={survey} />
          </TabsContent>

          {/* Contactos Tab */}
          <TabsContent value="contactos" className="space-y-4 mt-4 overflow-y-auto flex-1 px-8 pb-20">
            <Card className="shadow-md">
              <CardHeader className="border-b border-border/20 bg-gradient-to-r from-muted/50 to-transparent py-4">
                <div>
                  <CardTitle className="text-lg font-semibold">Base de Datos de Contactos</CardTitle>
                  {(() => {
                    const validContacts = (survey.responses || []).filter((r: any) => r.respondentName && r.respondentWhatsapp);
                    return validContacts.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{validContacts.length} contacto{validContacts.length !== 1 ? 's' : ''} registrado{validContacts.length !== 1 ? 's' : ''}</p>
                    );
                  })()}
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                {(() => {
                  const validContacts = (survey.responses || []).filter((r: any) => r.respondentName && r.respondentWhatsapp);
                  return (
                    <>
                      <Alert className="border-blue-500/40 bg-blue-50 dark:bg-blue-950/20 py-3 px-4">
                        <AlertTitle className="text-xs text-blue-900 dark:text-blue-200 m-0 font-medium">
                          Los contactos son respondientes que proporcionan su nombre y número de WhatsApp
                        </AlertTitle>
                      </Alert>

                      {validContacts.length === 0 ? (
                        <div className="py-8 text-center border border-border/30 rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">No hay contactos aún</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Los contactos aparecerán aquí cuando alguien complete tu encuesta con nombre y WhatsApp
                          </p>
                        </div>
                      ) : (
                        <div className="border border-border/30 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 border-b border-border/30 sticky top-0">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Nombre</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">WhatsApp</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Ubicación</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Fecha</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Respuestas</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/20">
                                {validContacts.map((response: any) => (
                                  <tr key={response.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3">
                                      <p className="font-semibold text-foreground">{response.respondentName || "—"}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="text-primary text-sm">{response.respondentWhatsapp || "—"}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="text-sm text-foreground">
                                        {response.respondentCity && response.respondentCountry ? (
                                          `${response.respondentCity}, ${response.respondentCountry}`
                                        ) : (
                                          response.respondentCity || response.respondentCountry || "—"
                                        )}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(response.createdAt).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'})}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3">
                                      {response.answers && Object.entries(response.answers).length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {Object.entries(response.answers).slice(0, 2).map(([questionId, answerText]: [string, any], ansIdx: number) => (
                                            <span key={ansIdx} className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20 max-w-xs truncate">
                                              {String(answerText).slice(0, 20)}...
                                            </span>
                                          ))}
                                          {Object.entries(response.answers).length > 2 && (
                                            <span className="inline-block px-2 py-1 bg-muted/30 text-muted-foreground text-xs rounded border border-border/30">
                                              +{Object.entries(response.answers).length - 2}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">—</p>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="max-h-96 overflow-y-auto" />
                        </div>
                        )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuración Tab */}
          <TabsContent value="configuracion" className="space-y-4 mt-4 overflow-y-auto flex-1 px-8 pb-20">
            <Card className="shadow-md">
              <CardHeader className="border-b border-border/20 bg-gradient-to-r from-muted/50 to-transparent py-4">
                <div>
                  <CardTitle className="text-lg font-semibold">Configuración de la Encuesta</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Gestiona los controles y automatizaciones de tu encuesta</p>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* URLs Públicas Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold">URLs Públicas</h3>
                  </div>

                  <div className="border border-border/40 bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-foreground/80">Comparte estas URLs para que otros puedan responder tu encuesta y ver los resultados</p>
                  </div>

                  <div className="space-y-3">
                    {/* Encuesta URL */}
                    <div className="flex items-center justify-between p-3 bg-muted/40 border border-border/40 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">URL de la Encuesta</p>
                        <p className="text-xs break-all text-foreground font-mono">{window.location.origin}/survey/{surveyId}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/survey/${surveyId}`);
                          setCopiedSurveyUrl("survey");
                          setTimeout(() => setCopiedSurveyUrl(null), 2000);
                          toast({ title: "URL copiada", description: "La URL de la encuesta se copió al portapapeles" });
                        }}
                        className="ml-2 flex-shrink-0"
                        data-testid="button-copy-survey-url"
                      >
                        {copiedSurveyUrl === "survey" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Resultados URL */}
                    <div className="flex items-center justify-between p-3 bg-muted/40 border border-border/40 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">URL de Estadísticas</p>
                        <p className="text-xs break-all text-foreground font-mono">{window.location.origin}/survey/{surveyId}/results</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/survey/${surveyId}/results`);
                          setCopiedResultsUrl("results");
                          setTimeout(() => setCopiedResultsUrl(null), 2000);
                          toast({ title: "URL copiada", description: "La URL de estadísticas se copió al portapapeles" });
                        }}
                        className="ml-2 flex-shrink-0"
                        data-testid="button-copy-results-url"
                      >
                        {copiedResultsUrl === "results" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Controles de Encuesta Section */}
                <div className="space-y-3">
                  {/* Section Header with Bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-primary rounded-full"></div>
                    <h3 className="text-sm font-semibold">Controles de Encuesta</h3>
                  </div>

                  {/* Info Card */}
                  <div className="border border-border/40 bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-foreground/80">Controla si tu encuesta está activa o pausada para que los usuarios puedan responder</p>
                  </div>
                  
                  {/* Survey Active Status */}
                  <div className="flex items-center justify-between p-4 bg-muted/40 border border-border/40 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-destructive'}`}></div>
                      <div>
                        <p className="font-semibold text-sm">{isActive ? 'Encuesta Activa' : 'Encuesta Desactivada'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isActive ? 'Los usuarios pueden responder tu encuesta' : 'Tu encuesta no está disponible para responder'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setIsActive(!isActive);
                        setTimeout(() => {
                          if (editTitle.trim()) {
                            updateSurveyMutation.mutate();
                          }
                        }, 100);
                      }}
                      disabled={updateSurveyMutation.isPending}
                      variant={isActive ? "default" : "outline"}
                      className="gap-2 flex-shrink-0"
                      data-testid="button-toggle-active"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>

                {/* WhatsApp Automation Section */}
                {whatsappAccounts.length > 0 && (
                  <div className="border-t border-border/20 pt-6 space-y-4">
                    {/* Section Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                        <MessageCircle className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold">Automatización WhatsApp</h3>
                    </div>

                    {/* WhatsApp Status */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-md">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${whatsappConfig.enabled ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">{whatsappConfig.enabled ? 'Activado' : 'Desactivado'}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setWhatsappConfig({...whatsappConfig, enabled: !whatsappConfig.enabled});
                          setTimeout(() => {
                            updateSurveyMutation.mutate();
                          }, 100);
                        }}
                        disabled={updateSurveyMutation.isPending}
                        variant={whatsappConfig.enabled ? "default" : "outline"}
                        size="sm"
                        className="gap-2 flex-shrink-0 text-xs"
                        data-testid="button-toggle-whatsapp"
                      >
                        {whatsappConfig.enabled ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>

                    {/* WhatsApp Configuration */}
                    {whatsappConfig.enabled && (
                      <div className="border border-border rounded-md p-4 space-y-4 mt-4">
                        {/* Info Card */}
                        <div className="bg-muted/30 border border-border rounded-md p-3 space-y-1.5">
                          <p className="text-xs font-semibold text-foreground">Importante:</p>
                          <p className="text-xs text-muted-foreground">El mensaje se enviará solo si el respondiente proporciona su nombre y número de WhatsApp.</p>
                        </div>

                        {/* WhatsApp Account Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp-account-select" className="text-xs font-semibold">
                            Número de Envío
                          </Label>

                          {whatsappAccounts.filter((acc: any) => acc.status === 'connected').length > 0 ? (
                            <select
                              id="whatsapp-account-select"
                              value={whatsappConfig.senderId || ""}
                              onChange={(e) => {
                                setWhatsappConfig({...whatsappConfig, senderId: e.target.value});
                                setTimeout(() => {
                                  updateSurveyMutation.mutate();
                                }, 100);
                              }}
                              className="w-full h-8 px-3 py-1.5 border border-border rounded-md bg-card text-xs cursor-pointer appearance-none hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary"
                              data-testid="select-whatsapp-account"
                            >
                              <option value="">Selecciona una cuenta</option>
                              {whatsappAccounts.filter((acc: any) => acc.status === 'connected').map((acc: any) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.deviceName} • {acc.phoneNumber || 'No verificado'}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="border border-border/40 bg-muted/30 rounded-lg p-4 space-y-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground">No tienes cuentas vinculadas</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Necesitas vincular una cuenta de WhatsApp para enviar mensajes automáticos.
                                </p>
                              </div>
                              <Button
                                onClick={() => setLocation("/whatsapp-accounts")}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs h-8"
                                data-testid="button-link-whatsapp-account"
                              >
                                Vincular Cuenta
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* WhatsApp Message */}
                        <div>
                          <Label htmlFor="whatsapp-message" className="text-xs font-semibold block mb-2">
                            Mensaje de Agradecimiento
                          </Label>
                          <Textarea autoComplete="off"
                            id="whatsapp-message"
                            value={whatsappConfig.message || ""}
                            onChange={(e) => {
                              setWhatsappConfig({...whatsappConfig, message: e.target.value});
                              clearTimeout((window as any).whatsappTimeout);
                              (window as any).whatsappTimeout = setTimeout(() => {
                                updateSurveyMutation.mutate();
                              }, 1000);
                            }}
                            className="min-h-20 text-xs resize-none"
                            placeholder={`¡Gracias por responder nuestra encuesta: ${editTitle}!`}
                            data-testid="textarea-whatsapp-message"
                          />
                          
                          {/* Variables Helper */}
                          <div className="mt-2.5 space-y-1.5">
                            <p className="text-xs font-semibold text-foreground">Variables:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                  { variable: "{{survey_name}}", label: "Nombre de la encuesta" },
                                  { variable: "{{survey_description}}", label: "Descripción de la encuesta" },
                                  { variable: "{{survey_url}}", label: "URL de la encuesta" },
                                  { variable: "{{respondent_name}}", label: "Nombre del respondente" },
                                ].map((item) => {
                                  const isAlreadyPresent = whatsappConfig.message?.includes(item.variable);
                                  return (
                                    <button
                                      key={item.variable}
                                      onClick={() => {
                                        // Check if variable already exists
                                        if (whatsappConfig.message?.includes(item.variable)) {
                                          toast({
                                            title: "Variable ya existe",
                                            description: `${item.variable} ya está en el mensaje. Elimínala si deseas agregarla de nuevo.`,
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        
                                        const textarea = document.getElementById("whatsapp-message") as HTMLTextAreaElement;
                                        if (textarea) {
                                          const start = textarea.selectionStart;
                                          const end = textarea.selectionEnd;
                                          const before = whatsappConfig.message?.substring(0, start) || "";
                                          const after = whatsappConfig.message?.substring(end) || "";
                                          const newMessage = before + item.variable + after;
                                          setWhatsappConfig({...whatsappConfig, message: newMessage});
                                          clearTimeout((window as any).whatsappTimeout);
                                          (window as any).whatsappTimeout = setTimeout(() => {
                                            updateSurveyMutation.mutate();
                                          }, 1000);
                                          setTimeout(() => {
                                            textarea.focus();
                                            textarea.setSelectionRange(start + item.variable.length, start + item.variable.length);
                                          }, 0);
                                        }
                                      }}
                                      className={`px-2 py-1 rounded text-xs transition-colors font-mono border ${
                                        isAlreadyPresent 
                                          ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
                                          : "bg-muted/50 text-foreground border-border hover:bg-muted/70 cursor-pointer"
                                      }`}
                                      type="button"
                                      title={isAlreadyPresent ? `${item.label} (ya agregada)` : item.label}
                                      disabled={isAlreadyPresent}
                                      data-testid={`button-insert-variable-${item.variable.replace(/[{}]/g, '')}`}
                                    >
                                      {item.variable} {isAlreadyPresent && "✓"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                          <div className="mt-2.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-md p-3">
                            <span>Se enviará automáticamente <strong>5 segundos después</strong></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Respuestas Tab */}
          <TabsContent value="respuestas" className="space-y-4 mt-4 overflow-y-auto flex-1 px-8 pb-20">
            <Card className="shadow-md">
              <CardHeader className="border-b border-border/20 bg-gradient-to-r from-muted/50 to-transparent py-4">
                <div>
                  <CardTitle className="text-lg font-semibold">Respuestas Recibidas</CardTitle>
                  {survey.responses && survey.responses.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">{survey.responses.length} respuesta{survey.responses.length !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {!survey.responses || survey.responses.length === 0 ? (
                  <div className="py-8 text-center border border-border/30 rounded-md">
                    <p className="text-sm font-medium text-muted-foreground">No hay respuestas aún</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Las respuestas aparecerán aquí cuando alguien complete tu encuesta
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {survey.responses.map((response: any, idx: number) => (
                      <div key={response.id} className="border border-border/40 rounded-lg bg-card/40 hover:bg-card/60 hover:border-border/60 transition-all p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-white">
                                  {(response.respondentName || "A").charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">{response.respondentName || "Anónimo"}</p>
                                {response.respondentWhatsapp && (
                                  <p className="text-xs text-primary">{response.respondentWhatsapp}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right mr-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                {new Date(response.createdAt).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'})}
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                {new Date(response.createdAt).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditResponse(response)}
                              className="h-8 w-8 p-0"
                              title="Editar respuesta"
                              data-testid={`button-edit-response-${response.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteResponse(response.id)}
                              disabled={deletingResponseId === response.id}
                              className="h-8 w-8 p-0"
                              title="Eliminar respuesta"
                              data-testid={`button-delete-response-${response.id}`}
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {/* Respuestas */}
                        {response.answers && Object.entries(response.answers).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(response.answers).map(([questionId, answerText]: [string, any], ansIdx: number) => {
                              const question = survey.questions?.find(q => q.id === questionId);
                              return (
                                <div key={ansIdx} className="bg-muted/20 rounded-lg p-3 border border-border/20">
                                  <p className="text-xs font-semibold text-primary line-clamp-1">{question?.question || "Sin pregunta"}</p>
                                  <p className="text-xs text-foreground/80 mt-1.5 line-clamp-3">{answerText || "Sin respuesta"}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-muted/10 rounded-lg p-3 border border-border/20">
                            <p className="text-xs text-muted-foreground italic">Sin respuestas registradas</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Edit Question Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/30">
                <div>
                  <CardTitle className="text-xl">Editar Pregunta</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Modifica los detalles de tu pregunta</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingQuestion(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Pregunta Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-question-text" className="text-sm font-semibold">
                    Texto de la Pregunta
                  </Label>
                  <Textarea autoComplete="off"
                    id="edit-question-text"
                    value={editQuestionText}
                    onChange={(e) => setEditQuestionText(e.target.value)}
                    className="mt-2 min-h-24 text-sm resize-none"
                    placeholder="Escribe tu pregunta aquí..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {editQuestionText.length} caracteres
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-border/20" />

                {/* Tipo de Pregunta Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-question-type" className="text-sm font-semibold">
                    Tipo de Pregunta
                  </Label>
                  <select
                    id="edit-question-type"
                    value={editQuestionType}
                    onChange={(e) => setEditQuestionType(e.target.value)}
                    className="mt-2 w-full h-9 px-3 py-1.5 border border-border rounded-md bg-card text-sm appearance-none cursor-pointer hover:bg-muted/50 hover:border-border/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="text">Texto Corto</option>
                    <option value="email">Email</option>
                    <option value="textarea">Texto Largo</option>
                    <option value="date">Fecha</option>
                    <option value="number">Número</option>
                    <option value="select">Selector (Dropdown)</option>
                    <option value="radio">Radio (Selección Única)</option>
                    <option value="checkbox">Checkbox (Selección Múltiple)</option>
                  </select>
                </div>

                {/* Opciones Section */}
                {["select", "checkbox", "radio"].includes(editQuestionType) && (
                  <div className="space-y-2 bg-muted/30 rounded-lg p-4 border border-border/30">
                    <Label htmlFor="edit-question-options" className="text-sm font-semibold">
                      Opciones (una por línea)
                    </Label>
                    <Textarea autoComplete="off"
                      id="edit-question-options"
                      value={editQuestionOptions}
                      onChange={(e) => setEditQuestionOptions(e.target.value)}
                      className="mt-2 min-h-24 text-sm resize-none"
                      placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Ingresa cada opción en una línea separada
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-border/20" />

                {/* Checkbox Section */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setEditQuestionRequired(!editQuestionRequired)}>
                  <Checkbox
                    id="edit-question-required"
                    checked={editQuestionRequired}
                    onCheckedChange={setEditQuestionRequired}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="edit-question-required" className="text-sm font-semibold cursor-pointer">
                      Pregunta Obligatoria
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {editQuestionRequired ? "El usuario debe responder esta pregunta" : "El usuario puede saltar esta pregunta"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-border/20">
                  <Button
                    variant="outline"
                    onClick={() => setEditingQuestion(null)}
                    className="flex-1 h-10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveEditQuestion}
                    disabled={updateQuestionMutation.isPending}
                    className="flex-1 h-10"
                  >
                    {updateQuestionMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Guardando...
                      </span>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Response Modal */}
        {editingResponseId && survey && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/30">
                <div>
                  <CardTitle className="text-xl">Editar Respuesta</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Modifica las respuestas del usuario</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingResponseId(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {(survey.questions || []).map((question: any) => (
                  <div key={question.id} className="space-y-2 pb-4 border-b border-border/20">
                    <Label className="text-sm font-semibold">{question.question}</Label>
                    {question.type === 'textarea' ? (
                      <Textarea autoComplete="off"
                        value={editingResponseAnswers[question.id] || ''}
                        onChange={(e) => setEditingResponseAnswers({
                          ...editingResponseAnswers,
                          [question.id]: e.target.value
                        })}
                        className="min-h-20 text-sm resize-none"
                      />
                    ) : question.type === 'text' || question.type === 'email' || question.type === 'number' ? (
                      <Input
                        type={question.type === 'email' ? 'email' : question.type === 'number' ? 'number' : 'text'}
                        value={editingResponseAnswers[question.id] || ''}
                        onChange={(e) => setEditingResponseAnswers({
                          ...editingResponseAnswers,
                          [question.id]: e.target.value
                        })}
                        className="text-sm"
                      />
                    ) : ['select', 'radio', 'checkbox'].includes(question.type) ? (
                      <select
                        value={editingResponseAnswers[question.id] || ''}
                        onChange={(e) => setEditingResponseAnswers({
                          ...editingResponseAnswers,
                          [question.id]: e.target.value
                        })}
                        className="w-full h-9 px-3 py-1.5 border border-border rounded-md bg-card text-sm appearance-none cursor-pointer"
                      >
                        <option value="">Selecciona una opción</option>
                        {(() => {
                          try {
                            return JSON.parse(question.options).map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ));
                          } catch {
                            return [];
                          }
                        })()}
                      </select>
                    ) : (
                      <Input
                        type={question.type}
                        value={editingResponseAnswers[question.id] || ''}
                        onChange={(e) => setEditingResponseAnswers({
                          ...editingResponseAnswers,
                          [question.id]: e.target.value
                        })}
                        className="text-sm"
                      />
                    )}
                  </div>
                ))}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-border/20">
                  <Button
                    variant="outline"
                    onClick={() => setEditingResponseId(null)}
                    className="flex-1 h-10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => updateResponseMutation.mutate(editingResponseId)}
                    disabled={updateResponseMutation.isPending}
                    className="flex-1 h-10"
                  >
                    {updateResponseMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Guardando...
                      </span>
                    ) : (
                      "Guardar Cambios"
                    )}
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
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
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
