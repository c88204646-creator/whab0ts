import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  // Get country from browser geolocation
  useEffect(() => {
    const getCountry = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        setRespondentCountry(data.country_name || "");
        setRespondentCity(data.city || "");
      } catch (e) {
        console.error("Error getting location:", e);
      }
    };
    getCountry();
  }, []);

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
      setTimeout(() => {
        window.history.back();
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

  const handleSubmit = () => {
    // Validate required fields
    const requiredQuestions = (survey.questions || []).filter((q: SurveyQuestion) => q.isRequired);
    for (const q of requiredQuestions) {
      if (!answers[q.id]) {
        toast({ title: "Error", description: `Por favor responde: ${q.question}`, variant: "destructive" });
        return;
      }
    }
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
            {(survey.questions || []).map((question: SurveyQuestion, idx: number) => (
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
            ))}

            {/* Respondent Info */}
            <div className="border-t border-border/30 pt-6 space-y-4">
              <h3 className="font-semibold">Información del Respondiente (Opcional)</h3>
              
              <div>
                <Label htmlFor="name" className="text-sm">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Tu nombre"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  data-testid="input-respondent-name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp" className="text-sm">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="+1 234 567 8900"
                  value={respondentWhatsapp}
                  onChange={(e) => setRespondentWhatsapp(e.target.value)}
                  data-testid="input-respondent-whatsapp"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country" className="text-sm">País</Label>
                  <Input
                    id="country"
                    placeholder="Tu país"
                    value={respondentCountry}
                    onChange={(e) => setRespondentCountry(e.target.value)}
                    data-testid="input-respondent-country"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-sm">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Tu ciudad"
                    value={respondentCity}
                    onChange={(e) => setRespondentCity(e.target.value)}
                    data-testid="input-respondent-city"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitResponseMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-submit-response"
            >
              {submitResponseMutation.isPending ? "Enviando..." : "Enviar Respuesta"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
