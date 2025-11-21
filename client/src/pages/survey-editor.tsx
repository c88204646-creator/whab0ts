import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Copy, Check } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { Survey, SurveyQuestion } from "@shared/schema";

export default function SurveyEditorPage() {
  const [match, params] = useRoute("/survey-edit/:id");
  const surveyId = params?.id;
  const { toast } = useToast();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("text");
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);

  const { data: survey, isLoading } = useQuery<any>({
    queryKey: [`/api/surveys/detail/${surveyId}`],
    enabled: !!surveyId,
  });

  const createQuestionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/survey-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId,
          question: newQuestion,
          type: newQuestionType,
          isRequired: newQuestionRequired,
          order: (survey?.questions?.length || 0),
        }),
      });
      if (!response.ok) throw new Error("Error creando pregunta");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      setNewQuestion("");
      setNewQuestionType("text");
      setNewQuestionRequired(true);
      toast({ title: "Pregunta agregada", description: "La pregunta se creó exitosamente" });
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
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/detail/${surveyId}`] });
      toast({ title: "Pregunta eliminada" });
    },
  });

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/survey/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Enlace copiado", description: "El enlace de la encuesta se copió al portapapeles" });
  };

  if (isLoading) return <div className="p-6">Cargando encuesta...</div>;
  if (!survey) return <div className="p-6 text-destructive">Encuesta no encontrada</div>;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto space-y-6 p-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{survey.title}</h1>
            {survey.description && (
              <p className="text-muted-foreground mt-1">{survey.description}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyLink(surveyId)}
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

        {/* Add Question Form */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Agregar Pregunta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-question" className="text-sm font-semibold">
                Pregunta
              </Label>
              <Input
                id="new-question"
                placeholder="Ej: ¿Cuál es tu edad?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                data-testid="input-new-question"
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="question-type" className="text-sm font-semibold">
                  Tipo de Pregunta
                </Label>
                <Select value={newQuestionType} onValueChange={setNewQuestionType}>
                  <SelectTrigger id="question-type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto Corto</SelectItem>
                    <SelectItem value="textarea">Texto Largo</SelectItem>
                    <SelectItem value="date">Fecha</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newQuestionRequired}
                    onChange={(e) => setNewQuestionRequired(e.target.checked)}
                    data-testid="checkbox-required"
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold">Requerida</span>
                </label>
              </div>
            </div>

            <Button
              onClick={() => {
                if (!newQuestion.trim()) {
                  toast({ title: "Error", description: "La pregunta es requerida", variant: "destructive" });
                  return;
                }
                createQuestionMutation.mutate();
              }}
              disabled={createQuestionMutation.isPending}
              className="w-full"
              data-testid="button-add-question"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createQuestionMutation.isPending ? "Agregando..." : "Agregar Pregunta"}
            </Button>
          </CardContent>
        </Card>

        {/* Questions List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Preguntas ({survey.questions?.length || 0})</h2>
          {(survey.questions || []).length === 0 ? (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="pt-8 pb-8 text-center">
                <p className="text-muted-foreground">No hay preguntas aún</p>
                <p className="text-sm text-muted-foreground mt-1">Agrega tu primera pregunta arriba</p>
              </CardContent>
            </Card>
          ) : (
            (survey.questions || []).map((question: SurveyQuestion, idx: number) => (
              <Card key={question.id} className="hover-elevate">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {idx + 1}. {question.question}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {question.type === "text" && "Texto Corto"}
                          {question.type === "textarea" && "Texto Largo"}
                          {question.type === "date" && "Fecha"}
                          {question.type === "number" && "Número"}
                        </Badge>
                        {question.isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            Requerida
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteQuestionMutation.mutate(question.id)}
                      data-testid={`button-delete-question-${question.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
