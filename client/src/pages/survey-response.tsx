import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { SurveyQuestion, Survey } from "@shared/schema";

// Country codes mapping with format rules
interface CountryFormat {
  code: string;
  name: string;
  localDigits: number; // Expected local digits (excluding country code)
  prefix?: string; // Auto-add prefix if missing (e.g., "1" for Mexico)
}

const COUNTRY_CODES: Record<string, CountryFormat> = {
  "52": { code: "52", name: "México 🇲🇽", localDigits: 11, prefix: "1" },
  "1": { code: "1", name: "USA/Canadá 🇺🇸", localDigits: 10 },
  "34": { code: "34", name: "España 🇪🇸", localDigits: 9 },
  "55": { code: "55", name: "Brasil 🇧🇷", localDigits: 11 },
  "54": { code: "54", name: "Argentina 🇦🇷", localDigits: 10 },
  "57": { code: "57", name: "Colombia 🇨🇴", localDigits: 10 },
  "56": { code: "56", name: "Chile 🇨🇱", localDigits: 9 },
  "51": { code: "51", name: "Perú 🇵🇪", localDigits: 9 },
  "58": { code: "58", name: "Venezuela 🇻🇪", localDigits: 10 },
  "502": { code: "502", name: "Guatemala 🇬🇹", localDigits: 8 },
  "503": { code: "503", name: "El Salvador 🇸🇻", localDigits: 8 },
  "504": { code: "504", name: "Honduras 🇭🇳", localDigits: 8 },
  "505": { code: "505", name: "Nicaragua 🇳🇮", localDigits: 8 },
  "506": { code: "506", name: "Costa Rica 🇨🇷", localDigits: 8 },
  "507": { code: "507", name: "Panamá 🇵🇦", localDigits: 8 },
};

export default function SurveyResponsePage() {
  const [match, params] = useRoute("/survey/:id");
  const surveyId = params?.id;
  const { toast } = useToast();
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showRespondentModal, setShowRespondentModal] = useState(false);
  const [respondentName, setRespondentName] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("52"); // Default to Mexico
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappValidation, setWhatsappValidation] = useState<string | null>(null);
  const [respondentCountry, setRespondentCountry] = useState("");
  const [respondentCity, setRespondentCity] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Auto-detect location and country code on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            const country = data.address?.country || "";
            setRespondentCountry(country);
            setRespondentCity(data.address?.city || data.address?.town || data.address?.village || "");
            
            // Auto-detect country code based on country name
            if (country.toLowerCase().includes("mexico")) {
              setWhatsappCode("52");
            } else if (country.toLowerCase().includes("spain")) {
              setWhatsappCode("34");
            } else if (country.toLowerCase().includes("brazil")) {
              setWhatsappCode("55");
            } else if (country.toLowerCase().includes("argentina")) {
              setWhatsappCode("54");
            } else if (country.toLowerCase().includes("colombia")) {
              setWhatsappCode("57");
            } else if (country.toLowerCase().includes("chile")) {
              setWhatsappCode("56");
            } else if (country.toLowerCase().includes("peru")) {
              setWhatsappCode("51");
            }
          } catch (error) {
            console.log("No se pudo obtener ubicación");
          }
        },
        () => {
          console.log("Geolocalización denegada");
        }
      );
    }
  }, []);

  const { data: survey, isLoading } = useQuery<Survey>({
    queryKey: [`/api/surveys/detail/${surveyId}`],
    enabled: !!surveyId,
  });

  // Function to validate WhatsApp number in real-time
  const validateWhatsAppNumber = (number: string): boolean => {
    if (!number) return false;
    // Remove spaces and check if only digits
    const cleaned = number.trim().replace(/\s+/g, '');
    return /^\d{10,}$/.test(cleaned); // At least 10 digits
  };

  // Function to compile full WhatsApp number with automatic formatting
  const getFullWhatsAppNumber = (): string | null => {
    if (!whatsappNumber.trim()) return null;
    
    console.log(`[WhatsApp] getFullWhatsAppNumber() called with input: "${whatsappNumber}" (${whatsappNumber.length} chars)`);
    
    // Remove ALL whitespace and special characters from number
    let cleanNumber = whatsappNumber
      .trim()
      .replace(/\s+/g, '')      // Remove all whitespace
      .replace(/[-()]/g, '')    // Remove dashes and parentheses
      .replace(/[@+]/g, '')     // Remove @ and + if present
      .replace(/\./g, '');      // Remove dots
    
    console.log(`[WhatsApp] After cleaning: "${cleanNumber}" (${cleanNumber.length} digits)`);
    
    // Also clean the country code (in case it has spaces)
    const cleanCode = whatsappCode.trim().replace(/\D/g, ''); // Remove non-digits
    
    console.log(`[WhatsApp] Country code: "${cleanCode}"`);
    
    // Validate it's only digits and has minimum length
    if (!/^\d+$/.test(cleanNumber)) {
      console.error(`[WhatsApp] Invalid: contains non-digit characters`);
      return null;
    }
    
    // Get format rules for this country
    const countryFormat = COUNTRY_CODES[cleanCode];
    if (!countryFormat) {
      console.error(`[WhatsApp] Invalid country code: ${cleanCode}`);
      return null;
    }
    
    const expectedLocalDigits = countryFormat.localDigits;
    const prefix = countryFormat.prefix;
    
    console.log(`[WhatsApp] Country format: expects ${expectedLocalDigits} local digits, prefix: "${prefix || 'none'}"`);
    
    // Auto-add prefix if needed (e.g., "1" for Mexico)
    if (prefix && cleanNumber.length === expectedLocalDigits - prefix.length) {
      console.log(`[WhatsApp] Auto-adding prefix "${prefix}" to number`);
      cleanNumber = prefix + cleanNumber;
    }
    
    // Validate final local number length
    if (cleanNumber.length < 8) {
      console.error(`[WhatsApp] Invalid: too short (${cleanNumber.length} < 8 digits)`);
      return null;
    }
    
    if (cleanNumber.length !== expectedLocalDigits) {
      console.error(`[WhatsApp] Invalid: expected ${expectedLocalDigits} local digits, got ${cleanNumber.length}`);
      return null;
    }
    
    // Return with NO spaces or formatting - just digits
    const fullNumber = `${cleanCode}${cleanNumber}`;
    console.log(`[WhatsApp] FINAL COMPILED NUMBER: ${fullNumber} (${fullNumber.length} total digits = code:${cleanCode.length} + local:${cleanNumber.length})`);
    return fullNumber;
  };

  const submitResponseMutation = useMutation({
    mutationFn: async () => {
      // Get full WhatsApp number with code
      const fullWhatsApp = getFullWhatsAppNumber();
      
      if (whatsappNumber && !fullWhatsApp) {
        throw new Error("El número de WhatsApp no es válido. Debe tener al menos 10 dígitos.");
      }
      
      const response = await fetch("/api/survey-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId,
          respondentName: respondentName || null,
          respondentWhatsapp: fullWhatsApp || null,
          respondentCountry: respondentCountry || null,
          respondentCity: respondentCity || null,
          answers,
        }),
      });
      if (!response.ok) throw new Error("Error enviando respuesta");
      return response.json();
    },
    onSuccess: () => {
      setAnswers({});
      setIsSubmitted(true);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!survey) return <div className="p-6 text-destructive">Encuesta no encontrada</div>;

  // Show thank you screen after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="shadow-xl border-0">
            <CardContent className="p-12 text-center space-y-8">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Thank you message */}
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground">
                  ¡Gracias por responder!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Tu respuesta ha sido registrada exitosamente
                </p>
              </div>

              {/* Survey title */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Encuesta respondida:</p>
                <p className="text-base font-semibold text-foreground">{survey.title}</p>
              </div>

              {/* Message */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hemos guardado tus respuestas. Apreciamos tu tiempo y contribución para mejorar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
    setShowRespondentModal(true);
  };
  
  const handleSubmitWithData = () => {
    submitResponseMutation.mutate();
    setShowRespondentModal(false);
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
                            <Select 
                              value={answers[question.id] || ""} 
                              onValueChange={(value) => {
                                console.log("Select changed:", question.id, value);
                                handleAnswerChange(question.id, value);
                              }}
                            >
                              <SelectTrigger className="cursor-pointer">
                                <SelectValue placeholder="Selecciona una opción..." />
                              </SelectTrigger>
                              <SelectContent className="z-50 max-h-64">
                                {(question.options || []).map((option: string) => (
                                  <SelectItem key={`${question.id}-${option}`} value={option}>
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

      {/* Respondent Data Modal */}
      {showRespondentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Comparte Tus Datos (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info Section */}
              <div className="bg-blue-50/10 border border-blue-500/20 rounded-lg p-3 flex gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Esta información es completamente opcional.</p>
                  <p>Comparte tus datos para recibir resultados y actualizaciones de esta encuesta. También es posible que recibas un mensaje de WhatsApp si fue asignado.</p>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <Label htmlFor="respondent-name" className="text-sm font-semibold">
                  Nombre (opcional)
                </Label>
                <Input
                  id="respondent-name"
                  placeholder="Tu nombre..."
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* WhatsApp Field with Country Code */}
              <div>
                <Label className="text-sm font-semibold">
                  WhatsApp (opcional)
                </Label>
                <div className="flex gap-2 mt-2">
                  {/* Country Code Select */}
                  <Select value={whatsappCode} onValueChange={setWhatsappCode}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COUNTRY_CODES).map(([code, { name }]) => (
                        <SelectItem key={code} value={code}>
                          +{code} {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Phone Number Input */}
                  <Input
                    placeholder="Tu número (se auto-completa)"
                    value={whatsappNumber}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      console.log(`[WhatsApp Input] User typed: "${inputValue}" (${inputValue.length} characters)`);
                      setWhatsappNumber(inputValue);
                      // Real-time validation feedback
                      if (inputValue) {
                        const cleanedForValidation = inputValue.replace(/\s+/g, '').replace(/[-()@+.]/g, '');
                        console.log(`[WhatsApp Input] Cleaned for validation: "${cleanedForValidation}" (${cleanedForValidation.length} digits)`);
                        if (validateWhatsAppNumber(inputValue)) {
                          setWhatsappValidation(null);
                        } else {
                          setWhatsappValidation("Mínimo 8 dígitos");
                        }
                      } else {
                        setWhatsappValidation(null);
                      }
                    }}
                    type="tel"
                    className="flex-1"
                    maxLength={20}
                  />
                </div>
                
                {/* Full Number Preview and Validation */}
                {whatsappNumber && (
                  <div className="mt-2 p-2 bg-muted/30 rounded border border-border/50">
                    {getFullWhatsAppNumber() ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-sm font-medium text-foreground">
                          +{getFullWhatsAppNumber()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-destructive">
                        {whatsappValidation || "Número inválido"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Location Info (Auto-detected) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    País (detectado)
                  </Label>
                  <div className="text-sm font-medium mt-1 p-2 bg-muted/30 rounded border border-border/50">
                    {respondentCountry || "Detectando..."}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Ciudad (detectada)
                  </Label>
                  <div className="text-sm font-medium mt-1 p-2 bg-muted/30 rounded border border-border/50">
                    {respondentCity || "Detectando..."}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRespondentModal(false);
                    setRespondentName("");
                    setWhatsappNumber("");
                    setWhatsappCode("52");
                    submitResponseMutation.mutate();
                  }}
                  className="flex-1"
                >
                  Enviar Anónimamente
                </Button>
                <Button
                  onClick={handleSubmitWithData}
                  disabled={submitResponseMutation.isPending}
                  className="flex-1"
                >
                  {submitResponseMutation.isPending ? "Enviando..." : "Compartir y Enviar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
