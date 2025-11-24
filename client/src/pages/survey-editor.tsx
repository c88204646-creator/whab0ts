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
import { ArrowLeft, Copy, Check, BarChart3, AlertCircle, Plus, X, BarChart2, CheckCircle, MessageSquare, Clock, Send, MessageCircle, Edit2, Link2, Share2 } from "lucide-react";
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
  const [copiedUrl, setCopiedUrl] = useState(false);
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
    if (user?.id) setUserId(user.id);
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
      toast({ title: "Pregunta eliminada" });
    },
    onError: (error: any) => {
      setDeletingQuestionId(null);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/survey/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Enlace copiado al portapapeles" });
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

  if (isLoading) return <LoadingSpinner />;
  if (!survey) return <div className="p-6 text-destructive">Encuesta no encontrada</div>;

  if (!editTitle && survey?.title) {
    setEditTitle(survey.title);
    setEditDesc(survey.description || "");
    setIsActive(survey.isActive !== undefined ? survey.isActive : true);
  }

  const questionCount = (survey.questions || []).length;
  const responseCount = (survey.responses || []).length;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Compact Header */}
      <div className="border-b border-border bg-card px-3 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="h-8 w-8 flex-shrink-0" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-foreground truncate">{survey.title}</h1>
              <p className="text-xs text-muted-foreground/70 truncate">{survey.description || "Sin descripción"}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleCopyLink(surveyId)}
            disabled={questionCount === 0}
            data-testid={`button-share-survey-${surveyId}`}
            className="gap-2 h-8 text-xs flex-shrink-0"
          >
            {copiedId === surveyId ? (
              <>
                <Check className="w-3 h-3" />
                Copiado
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3" />
                Compartir
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Compact Metrics Bar */}
      <div className="border-b border-border bg-card px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="text-muted-foreground">Preguntas:</span>
              <span className="font-semibold text-foreground">{questionCount}</span>
            </div>
            <div className="w-px h-4 bg-border/40"></div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="text-muted-foreground">Respuestas:</span>
              <span className="font-semibold text-foreground">{responseCount}</span>
            </div>
            <div className="w-px h-4 bg-border/40"></div>
            <div className="flex items-center gap-1.5">
              {isActive ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              )}
              <span className="text-muted-foreground">Estado:</span>
              <span className="font-semibold text-foreground">{isActive ? "Activa" : "Pausada"}</span>
            </div>
          </div>
          {questionCount === 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-500 flex-shrink-0" />
              <span className="text-amber-700 dark:text-amber-300">Agrega preguntas</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <Tabs defaultValue="principal" className="w-full flex flex-col flex-1 overflow-hidden">
          {/* Tabs Navigation - Sticky */}
          <TabsList className="grid w-full grid-cols-6 flex-shrink-0 sticky top-0 z-10 bg-card border-b border-border px-3 h-9 gap-1 rounded-none">
            <TabsTrigger value="principal" className="text-xs h-8" data-testid="tab-principal">Principal</TabsTrigger>
            <TabsTrigger value="preguntas" className="text-xs h-8" data-testid="tab-preguntas">Preguntas</TabsTrigger>
            <TabsTrigger value="estadisticas" className="text-xs h-8" data-testid="tab-estadisticas">Estadísticas</TabsTrigger>
            <TabsTrigger value="contactos" className="text-xs h-8" data-testid="tab-contactos">Contactos</TabsTrigger>
            <TabsTrigger value="respuestas" className="text-xs h-8" data-testid="tab-respuestas">Respuestas</TabsTrigger>
            <TabsTrigger value="configuracion" className="text-xs h-8" data-testid="tab-configuracion">Config</TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            
            {/* Principal Tab */}
            <TabsContent value="principal" className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              <Card className="border-border/50">
                <CardHeader className="py-3 pb-2">
                  <CardTitle className="text-sm">Información de la Encuesta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Título</Label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => editTitle.trim() && updateSurveyMutation.mutate()}
                      className="h-8 text-xs"
                      placeholder="Título de la encuesta"
                      data-testid="input-edit-title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Descripción</Label>
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      onBlur={() => updateSurveyMutation.mutate()}
                      className="h-16 text-xs resize-none"
                      placeholder="Descripción (opcional)"
                      data-testid="textarea-edit-desc"
                    />
                  </div>

                  {/* URL Section */}
                  <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Link2 className="w-3 h-3" /> URL de la encuesta
                    </Label>
                    <div className="flex gap-1.5">
                      <code className="flex-1 text-xs bg-muted/50 px-2 py-1.5 rounded border border-border/40 font-mono truncate">
                        {`${window.location.origin}/survey/${surveyId}`}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          const url = `${window.location.origin}/survey/${surveyId}`;
                          navigator.clipboard.writeText(url);
                          setCopiedUrl(true);
                          setTimeout(() => setCopiedUrl(false), 2000);
                        }}
                      >
                        {copiedUrl ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preguntas Tab */}
            <TabsContent value="preguntas" className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              <AddQuestionForm
                onAdd={(question, type, isRequired, options) => {
                  createQuestionMutation.mutate({ question, type, isRequired, options });
                }}
                isLoading={createQuestionMutation.isPending}
                totalQuestions={survey.questions?.length || 0}
              />

              <div className="space-y-2">
                {(survey.questions || []).length === 0 ? (
                  <Card className="bg-muted/20 border-dashed">
                    <CardContent className="py-8 text-center">
                      <p className="text-sm font-medium text-foreground">No hay preguntas aún</p>
                    </CardContent>
                  </Card>
                ) : (
                  (survey.questions || []).map((question: SurveyQuestion, idx: number) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      number={idx + 1}
                      onEdit={handleEditQuestion}
                      onDelete={handleDeleteQuestion}
                      isDeletingId={deletingQuestionId}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Estadísticas Tab */}
            <TabsContent value="estadisticas" className="flex-1 overflow-y-auto custom-scrollbar p-3">
              <SurveyStatistics survey={survey} />
            </TabsContent>

            {/* Contactos Tab */}
            <TabsContent value="contactos" className="flex-1 overflow-y-auto custom-scrollbar p-3">
              <ContactsSection survey={survey} />
            </TabsContent>

            {/* Respuestas Tab */}
            <TabsContent value="respuestas" className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {!survey.responses || survey.responses.length === 0 ? (
                <Card className="bg-muted/20 border-dashed">
                  <CardContent className="py-8 text-center">
                    <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">No hay respuestas aún</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {survey.responses.map((response: any) => (
                    <ResponseCard
                      key={response.id}
                      response={response}
                      survey={survey}
                      onEdit={handleEditResponse}
                      onDelete={handleDeleteResponse}
                      isDeletingId={deletingResponseId}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Configuración Tab */}
            <TabsContent value="configuracion" className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              <ConfigurationPanel
                survey={survey}
                whatsappConfig={whatsappConfig}
                setWhatsappConfig={setWhatsappConfig}
                whatsappAccounts={whatsappAccounts}
                isActive={isActive}
                setIsActive={setIsActive}
                updateSurveyMutation={updateSurveyMutation}
              />
            </TabsContent>

          </div>
        </Tabs>
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/30 pb-3">
              <CardTitle className="text-sm">Editar Pregunta</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingQuestion(null)}
                className="h-7 w-7 p-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Texto de la Pregunta</Label>
                <Textarea
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  className="min-h-20 text-xs resize-none"
                  placeholder="Escribe tu pregunta aquí..."
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tipo de Pregunta</Label>
                <select
                  value={editQuestionType}
                  onChange={(e) => setEditQuestionType(e.target.value)}
                  className="w-full h-8 px-2 py-1 border border-border rounded text-xs bg-card"
                >
                  <option value="text">Texto Corto</option>
                  <option value="email">Email</option>
                  <option value="textarea">Texto Largo</option>
                  <option value="date">Fecha</option>
                  <option value="number">Número</option>
                  <option value="select">Selector</option>
                  <option value="radio">Radio</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>

              {["select", "checkbox", "radio"].includes(editQuestionType) && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Opciones (una por línea)</Label>
                  <Textarea
                    value={editQuestionOptions}
                    onChange={(e) => setEditQuestionOptions(e.target.value)}
                    className="min-h-16 text-xs resize-none"
                    placeholder="Opción 1&#10;Opción 2"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingQuestion(null)}
                  className="flex-1 h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveEditQuestion}
                  disabled={updateQuestionMutation.isPending}
                  className="flex-1 h-8 text-xs"
                >
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Response Modal */}
      {editingResponseId && survey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/30 pb-3">
              <CardTitle className="text-sm">Editar Respuesta</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingResponseId(null)}
                className="h-7 w-7 p-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              {(survey.questions || []).map((question: any) => (
                <div key={question.id} className="space-y-1 pb-2 border-b border-border/20">
                  <Label className="text-xs font-semibold line-clamp-2">{question.question}</Label>
                  {question.type === 'textarea' ? (
                    <Textarea
                      value={editingResponseAnswers[question.id] || ''}
                      onChange={(e) => setEditingResponseAnswers({
                        ...editingResponseAnswers,
                        [question.id]: e.target.value
                      })}
                      className="min-h-12 text-xs resize-none"
                    />
                  ) : (
                    <Input
                      type={question.type === 'email' ? 'email' : question.type === 'number' ? 'number' : 'text'}
                      value={editingResponseAnswers[question.id] || ''}
                      onChange={(e) => setEditingResponseAnswers({
                        ...editingResponseAnswers,
                        [question.id]: e.target.value
                      })}
                      className="h-8 text-xs"
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingResponseId(null)}
                  className="flex-1 h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => updateResponseMutation.mutate(editingResponseId)}
                  disabled={updateResponseMutation.isPending}
                  className="flex-1 h-8 text-xs"
                >
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ContactsSection({ survey }: { survey: any }) {
  const validContacts = (survey.responses || []).filter((r: any) => r.respondentName && r.respondentWhatsapp);

  return (
    <Card className="border-border/50">
      <CardHeader className="py-3 pb-2">
        <CardTitle className="text-sm">Base de Datos ({validContacts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {validContacts.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-muted-foreground">Sin contactos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b border-border/30">
                <tr>
                  <th className="px-2 py-2 text-left text-muted-foreground font-semibold">Nombre</th>
                  <th className="px-2 py-2 text-left text-muted-foreground font-semibold">WhatsApp</th>
                  <th className="px-2 py-2 text-left text-muted-foreground font-semibold">Ubicación</th>
                  <th className="px-2 py-2 text-left text-muted-foreground font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {validContacts.slice(0, 10).map((response: any) => (
                  <tr key={response.id} className="hover:bg-muted/20">
                    <td className="px-2 py-2 font-semibold text-foreground">{response.respondentName}</td>
                    <td className="px-2 py-2 text-primary">{response.respondentWhatsapp}</td>
                    <td className="px-2 py-2 text-foreground/70">
                      {response.respondentCity && response.respondentCountry
                        ? `${response.respondentCity}, ${response.respondentCountry}`
                        : "—"}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {new Date(response.createdAt).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResponseCard({ response, survey, onEdit, onDelete, isDeletingId }: any) {
  return (
    <Card className="border-border/50">
      <CardHeader className="py-2.5 pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">{response.respondentName || "Anónimo"}</p>
          {response.respondentWhatsapp && (
            <p className="text-xs text-primary">{response.respondentWhatsapp}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(response)}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(response.id)}
            disabled={isDeletingId === response.id}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-2 grid grid-cols-2 gap-2">
        {response.answers && Object.entries(response.answers).length > 0 ? (
          Object.entries(response.answers).map(([qId, ans]: [string, any], idx) => {
            const q = survey.questions?.find((q: any) => q.id === qId);
            return (
              <div key={idx} className="bg-muted/30 rounded p-2 border border-border/20">
                <p className="text-xs font-semibold text-primary line-clamp-1">{q?.question || "—"}</p>
                <p className="text-xs text-foreground/70 mt-0.5 line-clamp-2">{String(ans)}</p>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground col-span-2">Sin respuestas</p>
        )}
      </CardContent>
    </Card>
  );
}

function ConfigurationPanel({
  survey,
  whatsappConfig,
  setWhatsappConfig,
  whatsappAccounts,
  isActive,
  setIsActive,
  updateSurveyMutation,
}: any) {
  return (
    <Card className="border-border/50">
      <CardHeader className="py-3 pb-2">
        <CardTitle className="text-sm">Configuración</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border/30">
          <div>
            <p className="text-xs font-semibold text-foreground">Estado</p>
            <p className="text-xs text-muted-foreground mt-0.5">{isActive ? "Encuesta activa" : "Encuesta pausada"}</p>
          </div>
          <Button
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => setIsActive(!isActive)}
            className="h-7 text-xs"
          >
            {isActive ? "Activa" : "Pausada"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/20 border border-border/30 rounded p-2">
          <p className="font-semibold text-foreground mb-1">URL Pública:</p>
          <code className="break-all">{window.location.origin}/survey/{survey.customUrl || survey.id}</code>
        </div>
      </CardContent>
    </Card>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function SurveyStatistics({ survey }: { survey: any }) {
  if (!survey.responses || survey.responses.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Sin respuestas para mostrar estadísticas</p>
        </CardContent>
      </Card>
    );
  }

  const totalResponses = survey.responses.length;

  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <Card className="border-border/50">
        <CardContent className="py-2 grid grid-cols-2 gap-2">
          <div className="px-2 py-1.5 bg-muted/30 rounded border border-border/30">
            <p className="text-xs text-muted-foreground">Total Respuestas</p>
            <p className="text-xl font-bold text-foreground">{totalResponses}</p>
          </div>
          <div className="px-2 py-1.5 bg-muted/30 rounded border border-border/30">
            <p className="text-xs text-muted-foreground">Preguntas</p>
            <p className="text-xl font-bold text-foreground">{survey.questions?.length || 0}</p>
          </div>
        </CardContent>
      </Card>

      {/* Question Analysis */}
      {(survey.questions || []).slice(0, 3).map((question: any, idx: number) => {
        const responses = survey.responses.filter((r: any) => r.answers && r.answers[question.id]).map((r: any) => r.answers[question.id]);
        
        if (question.type === 'text' || question.type === 'textarea') {
          return (
            <Card key={question.id} className="border-border/50">
              <CardHeader className="py-2 pb-1.5">
                <CardTitle className="text-xs truncate">{question.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {responses.slice(0, 3).map((resp: any, i: number) => (
                  <p key={i} className="text-xs text-foreground/70 line-clamp-2 bg-muted/20 p-1.5 rounded">{resp}</p>
                ))}
              </CardContent>
            </Card>
          );
        }

        const distribution: any = {};
        responses.forEach((resp: any) => {
          const answer = String(resp);
          distribution[answer] = (distribution[answer] || 0) + 1;
        });

        const chartData = Object.entries(distribution).map(([name, value]) => ({
          name,
          value,
        }));

        return (
          <Card key={question.id} className="border-border/50">
            <CardHeader className="py-2 pb-1.5">
              <CardTitle className="text-xs truncate">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip contentStyle={{fontSize: '10px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))'}} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
