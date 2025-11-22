import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { SurveyQuestion, Survey } from "@shared/schema";

export default function SurveyResponsePage() {
  const [match, params] = useRoute("/survey/:id");
  const surveyId = params?.id;
  const { toast } = useToast();
  
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: survey, isLoading } = useQuery<Survey>({
    queryKey: [`/api/surveys/detail/${surveyId}`],
    enabled: !!surveyId,
  });

  const submitResponseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/survey-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId,
          respondentName: null,
          respondentWhatsapp: null,
          respondentCountry: null,
          respondentCity: null,
          answers,
        }),
      });
      if (!response.ok) throw new Error("Error enviando respuesta");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Encuesta enviada", description: "¡Gracias por responder!" });
      setAnswers({});
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!survey) return <div className="p-6 text-destructive">Encuesta no encontrada</div>;

  // Validar que la encuesta esté activa
  const now = new Date();
  const isWithinDateRange = !survey.hasDateLimit || (
    (!survey.startDate || new Date(survey.startDate) <= now) &&
    (!survey.endDate || new Date(survey.endDate) >= now)
  );
  const canRespond = survey.isActive && isWithinDateRange;

  if (!canRespond) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-6">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">Encuesta No Disponible</h2>
                <p className="text-base text-muted-foreground">
                  {!survey.isActive 
                    ? "Esta encuesta ha sido desactivada y no acepta nuevas respuestas."
                    : "Esta encuesta ha expirado y no acepta nuevas respuestas."}
                </p>
              </div>
              <Button onClick={() => window.history.back()} className="w-full h-11">
                Volver
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmitAnswers = () => {
    const requiredQuestions = (survey.questions || []).filter((q: SurveyQuestion) => q.isRequired);
    for (const q of requiredQuestions) {
      if (!answers[q.id]) {
        toast({ title: "Error", description: `Por favor responde: ${q.question}`, variant: "destructive" });
        return;
      }
    }
    submitResponseMutation.mutate();
  };

  // Calculate progress
  const totalQuestions = (survey.questions || []).length;
  const answeredQuestions = Object.keys(answers).filter(key => answers[key]).length;
  const progressPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background/80 to-background border-b border-border backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Progreso</span>
              <span className="text-foreground">{answeredQuestions} de {totalQuestions}</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-4 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {survey.title}
                </h1>
                {survey.description && (
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {survey.description}
                  </p>
                )}
                {(survey.questions || []).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {totalQuestions} pregunta{totalQuestions !== 1 ? 's' : ''} • ~{Math.ceil(totalQuestions * 0.5)} min
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Questions */}
          {(survey.questions || []).length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-base font-medium text-foreground">No hay preguntas aún</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {survey.questions.map((question: SurveyQuestion, idx: number) => (
                <Card 
                  key={question.id}
                  className="hover-elevate animate-in fade-in slide-in-from-bottom-2 duration-500 relative"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  data-testid={`question-card-${question.id}`}
                >
                  <CardContent className="pt-4 pb-4 overflow-visible">
                    {/* Question Number and Text */}
                    <Label htmlFor={`q-${question.id}`} className="block mb-3">
                      <div className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-xs flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-semibold text-foreground">
                            {question.question}
                            {question.isRequired && <span className="text-destructive ml-1">*</span>}
                          </span>
                        </span>
                      </div>
                    </Label>

                    {/* Input Field */}
                    <div className="space-y-2">
                      {question.type === "text" && (
                        <Input
                          id={`q-${question.id}`}
                          placeholder="Tu respuesta..."
                          value={answers[question.id] || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          data-testid={`input-answer-${question.id}`}
                        />
                      )}

                      {question.type === "email" && (
                        <Input
                          id={`q-${question.id}`}
                          type="email"
                          placeholder="tu@email.com"
                          value={answers[question.id] || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          data-testid={`input-email-${question.id}`}
                        />
                      )}

                      {question.type === "textarea" && (
                        <Textarea
                          id={`q-${question.id}`}
                          placeholder="Tu respuesta..."
                          value={answers[question.id] || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          data-testid={`textarea-answer-${question.id}`}
                          rows={3}
                        />
                      )}

                      {question.type === "date" && (
                        <Input
                          id={`q-${question.id}`}
                          type="date"
                          value={answers[question.id] || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          data-testid={`input-date-${question.id}`}
                        />
                      )}

                      {question.type === "number" && (
                        <Input
                          id={`q-${question.id}`}
                          type="number"
                          placeholder="Número..."
                          value={answers[question.id] || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          data-testid={`input-number-${question.id}`}
                        />
                      )}

                      {question.type === "select" && (
                        <>
                          {(question.options || []).length > 0 ? (
                            <Select value={answers[question.id] || ""} onValueChange={(value) => handleAnswerChange(question.id, value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una opción..." />
                              </SelectTrigger>
                              <SelectContent className="z-50">
                                {(question.options || []).map((option: string) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="text-sm text-muted-foreground p-2 bg-muted/20 rounded">
                              Sin opciones configuradas
                            </div>
                          )}
                        </>
                      )}

                      {question.type === "radio" && (
                        <RadioGroup value={answers[question.id] || ""} onValueChange={(value) => handleAnswerChange(question.id, value)}>
                          <div className="space-y-2">
                            {(question.options || []).length > 0 ? (
                              (question.options || []).map((option: string) => (
                                <div key={option} className="flex items-center gap-2">
                                  <RadioGroupItem value={option} id={`radio-${question.id}-${option}`} />
                                  <Label htmlFor={`radio-${question.id}-${option}`} className="text-sm cursor-pointer font-normal">
                                    {option}
                                  </Label>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-muted-foreground p-2 bg-muted/20 rounded">
                                Sin opciones configuradas
                              </div>
                            )}
                          </div>
                        </RadioGroup>
                      )}

                      {question.type === "checkbox" && (
                        <div className="space-y-2">
                          {(question.options || []).length > 0 ? (
                            (question.options || []).map((option: string) => {
                              const values = answers[question.id] ? String(answers[question.id]).split(",") : [];
                              const isChecked = values.includes(option);
                              return (
                                <div key={option} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`checkbox-${question.id}-${option}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      let newValues = values;
                                      if (checked) {
                                        newValues = [...values, option];
                                      } else {
                                        newValues = values.filter(v => v !== option);
                                      }
                                      handleAnswerChange(question.id, newValues.join(","));
                                    }}
                                  />
                                  <Label htmlFor={`checkbox-${question.id}-${option}`} className="text-sm cursor-pointer font-normal">
                                    {option}
                                  </Label>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-sm text-muted-foreground p-2 bg-muted/20 rounded">
                              Sin opciones configuradas
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Submit Button */}
              <div className="pt-4 mt-2">
                <Button
                  onClick={handleSubmitAnswers}
                  disabled={submitResponseMutation.isPending}
                  className="w-full h-9"
                  data-testid="button-submit-survey"
                >
                  {submitResponseMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    "Enviar Respuesta"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
