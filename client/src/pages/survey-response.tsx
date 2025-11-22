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

  if (isLoading) return <div className="p-6">Cargando encuesta...</div>;
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
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border bg-gradient-to-b from-background/80 to-background">
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="mb-4" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{survey.title}</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-xl font-semibold">Encuesta No Disponible</h2>
              <p className="text-sm text-muted-foreground">
                {!survey.isActive 
                  ? "Esta encuesta ha sido desactivada y no acepta nuevas respuestas."
                  : "Esta encuesta ha expirado y no acepta nuevas respuestas."}
              </p>
              <Button onClick={() => window.history.back()} variant="outline" className="w-full">
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Section */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="mb-4" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{survey.title}</h1>
            {survey.description && (
              <p className="text-base text-muted-foreground mt-2">{survey.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8 space-y-6">
          {/* Survey Form */}
          <Card>
            <CardHeader className="border-b border-border/30 pb-4">
              <CardTitle>Completar Encuesta</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
            {/* Questions */}
            {(survey.questions || []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Esta encuesta aún no tiene preguntas</p>
              </div>
            ) : (
              survey.questions.map((question: SurveyQuestion, idx: number) => (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={`q-${question.id}`} className="font-semibold">
                    {idx + 1}. {question.question}
                    {question.isRequired && <span className="text-destructive">*</span>}
                  </Label>

                  {question.type === "text" && (
                    <Input
                      id={`q-${question.id}`}
                      placeholder="Tu respuesta..."
                      value={answers[question.id] || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      data-testid={`input-answer-${question.id}`}
                    />
                  )}

                  {question.type === "textarea" && (
                    <Textarea
                      id={`q-${question.id}`}
                      placeholder="Tu respuesta..."
                      value={answers[question.id] || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      data-testid={`textarea-answer-${question.id}`}
                      rows={4}
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
                </div>
              ))
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmitAnswers}
                disabled={submitResponseMutation.isPending}
                className="flex-1"
                size="lg"
                data-testid="button-continue-survey"
              >
                {submitResponseMutation.isPending ? "Procesando..." : "Continuar"}
              </Button>
            </div>
          </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Info Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Información de Contacto</DialogTitle>
            <DialogDescription>
              Por favor completa tu nombre y WhatsApp (requerido para registrarte)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="modal-name" className="text-sm">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modal-name"
                placeholder="Tu nombre"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                data-testid="input-modal-name"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="modal-whatsapp" className="text-sm">
                WhatsApp <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modal-whatsapp"
                placeholder="+1 234 567 8900"
                value={respondentWhatsapp}
                onChange={(e) => setRespondentWhatsapp(e.target.value)}
                data-testid="input-modal-whatsapp"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal-country" className="text-sm">País (Opcional)</Label>
                <Input
                  id="modal-country"
                  placeholder="Tu país"
                  value={respondentCountry}
                  onChange={(e) => setRespondentCountry(e.target.value)}
                  data-testid="input-modal-country"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="modal-city" className="text-sm">Ciudad (Opcional)</Label>
                <Input
                  id="modal-city"
                  placeholder="Tu ciudad"
                  value={respondentCity}
                  onChange={(e) => setRespondentCity(e.target.value)}
                  data-testid="input-modal-city"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContactModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={submitResponseMutation.isPending || !respondentName.trim() || !respondentWhatsapp.trim()}
              data-testid="button-submit-response"
            >
              {submitResponseMutation.isPending ? "Enviando..." : "Enviar Respuesta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
