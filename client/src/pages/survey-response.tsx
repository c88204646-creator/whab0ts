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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-600 dark:text-slate-400">Progreso</span>
              <span className="text-slate-700 dark:text-slate-300">{answeredQuestions} de {totalQuestions}</span>
            </div>
            <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6">
        <div className="w-full max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                {survey.description}
              </p>
            )}
            {(survey.questions || []).length > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">
                {totalQuestions} pregunta{totalQuestions !== 1 ? 's' : ''} • Toma aproximadamente {Math.ceil(totalQuestions * 0.5)} minuto{Math.ceil(totalQuestions * 0.5) !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Questions */}
          {(survey.questions || []).length === 0 ? (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-8 text-center border border-amber-200 dark:border-amber-800/30">
              <p className="text-slate-600 dark:text-slate-400 text-base">Esta encuesta aún no tiene preguntas</p>
            </div>
          ) : (
            <div className="space-y-8">
              {survey.questions.map((question: SurveyQuestion, idx: number) => (
                <div 
                  key={question.id}
                  className="bg-white dark:bg-slate-800/40 rounded-xl p-6 sm:p-8 border border-slate-200/60 dark:border-slate-700/50 hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-600/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  data-testid={`question-card-${question.id}`}
                >
                  {/* Question Number and Text */}
                  <Label htmlFor={`q-${question.id}`} className="block mb-5">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <span className="inline-flex items-center justify-center min-w-8 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="flex-1">
                        <span className="block text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-relaxed">
                          {question.question}
                          {question.isRequired && <span className="text-red-500 ml-1.5">*</span>}
                        </span>
                      </span>
                    </div>
                  </Label>

                  {/* Input Field */}
                  {question.type === "text" && (
                    <Input
                      id={`q-${question.id}`}
                      placeholder="Tu respuesta..."
                      value={answers[question.id] || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      data-testid={`input-answer-${question.id}`}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm px-3 py-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm px-3 py-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm px-3 py-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500 resize-none"
                    />
                  )}

                  {question.type === "date" && (
                    <Input
                      id={`q-${question.id}`}
                      type="date"
                      value={answers[question.id] || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      data-testid={`input-date-${question.id}`}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm px-3 py-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                    />
                  )}

                  {question.type === "select" && (
                    <>
                      {(question.options || []).length > 0 ? (
                        <Select value={answers[question.id] || ""} onValueChange={(value) => handleAnswerChange(question.id, value)}>
                          <SelectTrigger className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500">
                            <SelectValue placeholder="Selecciona una opción..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(question.options || []).map((option: string) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-slate-500 dark:text-slate-400 p-2 bg-slate-100 dark:bg-slate-800 rounded">
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
                          <div className="text-sm text-slate-500 dark:text-slate-400 p-2 bg-slate-100 dark:bg-slate-800 rounded">
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
                        <div className="text-sm text-slate-500 dark:text-slate-400 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          Sin opciones configuradas
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Button */}
              <div className="pt-8 mt-4 border-t border-slate-200 dark:border-slate-700/50">
                <Button
                  onClick={handleSubmitAnswers}
                  disabled={submitResponseMutation.isPending}
                  className="w-full h-12 sm:h-13 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  data-testid="button-submit-survey"
                >
                  {submitResponseMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
