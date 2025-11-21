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
import { ArrowLeft } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { SurveyQuestion } from "@shared/schema";

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

  const { data: survey, isLoading } = useQuery({
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
    submitResponseMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{survey.title}</h1>
            {survey.description && (
              <p className="text-muted-foreground mt-1">{survey.description}</p>
            )}
          </div>
        </div>

        {/* Survey Form */}
        <Card>
          <CardHeader className="border-b border-border/30">
            <CardTitle>Responde la Encuesta</CardTitle>
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
            <Button
              onClick={handleSubmitAnswers}
              disabled={submitResponseMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-continue-survey"
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Información de Contacto</DialogTitle>
            <DialogDescription>
              Por favor completa tu información (opcional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="modal-name" className="text-sm">Nombre</Label>
              <Input
                id="modal-name"
                placeholder="Tu nombre"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                data-testid="input-modal-name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="modal-whatsapp" className="text-sm">WhatsApp</Label>
              <Input
                id="modal-whatsapp"
                placeholder="+1 234 567 8900"
                value={respondentWhatsapp}
                onChange={(e) => setRespondentWhatsapp(e.target.value)}
                data-testid="input-modal-whatsapp"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal-country" className="text-sm">País</Label>
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
                <Label htmlFor="modal-city" className="text-sm">Ciudad</Label>
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
              disabled={submitResponseMutation.isPending}
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
