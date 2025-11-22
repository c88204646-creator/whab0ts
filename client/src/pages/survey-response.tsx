import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { SurveyQuestion, Survey } from "@shared/schema";

export default function SurveyResponsePage() {
  const [match, params] = useRoute("/survey/:id");
  const surveyId = params?.id;
  const { toast } = useToast();
  
  const [respondentName, setRespondentName] = useState("");
  const [respondentWhatsapp, setRespondentWhatsapp] = useState("");
  const [respondentCountry, setRespondentCountry] = useState("");
  const [respondentCity, setRespondentCity] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showContactModal, setShowContactModal] = useState(false);

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
          respondentName: respondentName || null,
          respondentWhatsapp: respondentWhatsapp || null,
          respondentCountry: respondentCountry || null,
          respondentCity: respondentCity || null,
          answers,
        }),
      });
      if (!response.ok) throw new Error("Error enviando respuesta");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Encuesta enviada", description: "¡Gracias por responder!" });
      setAnswers({});
      setRespondentName("");
      setRespondentWhatsapp("");
      setShowContactModal(false);
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
    setShowContactModal(true);
  };

  const handleFinalSubmit = () => {
    if (!respondentName.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (!respondentWhatsapp.trim()) {
      toast({ title: "Error", description: "El WhatsApp es requerido", variant: "destructive" });
      return;
    }
    submitResponseMutation.mutate();
  };

  // Calculate progress
  const totalQuestions = (survey.questions || []).length;
  const answeredQuestions = Object.keys(answers).filter(key => answers[key]).length;
  const progressPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-4 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Progreso</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{answeredQuestions} de {totalQuestions}</span>
            </div>
            <div className="h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="w-full max-w-xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {survey.description}
              </p>
            )}
          </div>

          {/* Questions */}
          {(survey.questions || []).length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 text-center border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400 text-sm">Esta encuesta aún no tiene preguntas</p>
            </div>
          ) : (
            <div className="space-y-5">
              {survey.questions.map((question: SurveyQuestion, idx: number) => (
                <div 
                  key={question.id}
                  className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-5 border border-slate-200 dark:border-slate-800"
                  data-testid={`question-card-${question.id}`}
                >
                  {/* Question Number and Text */}
                  <Label htmlFor={`q-${question.id}`} className="block mb-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-semibold text-xs flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-base font-semibold text-slate-900 dark:text-white">
                        {question.question}
                        {question.isRequired && <span className="text-red-500">*</span>}
                      </span>
                    </span>
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
                </div>
              ))}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSubmitAnswers}
                  disabled={submitResponseMutation.isPending}
                  className="w-full h-10 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white"
                  data-testid="button-continue-survey"
                >
                  {submitResponseMutation.isPending ? "Procesando..." : "Continuar"}
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
            <p>Tus respuestas son confidenciales</p>
          </div>
        </div>
      </div>

      {/* Contact Info Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">Completa tu Información</DialogTitle>
            <DialogDescription className="text-sm">
              Necesitamos tus datos para registrar tu respuesta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="modal-name" className="text-sm font-medium text-slate-900 dark:text-white">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="modal-name"
                placeholder="Tu nombre"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                data-testid="input-modal-name"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal-whatsapp" className="text-sm font-medium text-slate-900 dark:text-white">
                WhatsApp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="modal-whatsapp"
                placeholder="Tu número"
                value={respondentWhatsapp}
                onChange={(e) => setRespondentWhatsapp(e.target.value)}
                data-testid="input-modal-whatsapp"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="modal-country" className="text-xs font-medium text-slate-900 dark:text-white">País</Label>
                <Input
                  id="modal-country"
                  placeholder="País"
                  value={respondentCountry}
                  onChange={(e) => setRespondentCountry(e.target.value)}
                  data-testid="input-modal-country"
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-city" className="text-xs font-medium text-slate-900 dark:text-white">Ciudad</Label>
                <Input
                  id="modal-city"
                  placeholder="Ciudad"
                  value={respondentCity}
                  onChange={(e) => setRespondentCity(e.target.value)}
                  data-testid="input-modal-city"
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowContactModal(false)}
              className="h-9 text-sm"
              data-testid="button-cancel-contact"
            >
              Atrás
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={submitResponseMutation.isPending || !respondentName.trim() || !respondentWhatsapp.trim()}
              className="h-9 text-sm bg-blue-500 hover:bg-blue-600 text-white"
              data-testid="button-submit-response"
            >
              {submitResponseMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
