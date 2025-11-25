import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { CalendarEvent, CalendarAvailability, CalendarConfig } from "@shared/schema";

// Country codes mapping with format rules
interface CountryFormat {
  code: string;
  name: string;
  localDigits: number;
  prefix?: string;
}

const COUNTRY_CODES: Record<string, CountryFormat> = {
  "1": { code: "1", name: "USA/Canadá 🇺🇸", localDigits: 10 },
  "34": { code: "34", name: "España 🇪🇸", localDigits: 9 },
  "44": { code: "44", name: "Reino Unido 🇬🇧", localDigits: 10 },
  "33": { code: "33", name: "Francia 🇫🇷", localDigits: 9 },
  "49": { code: "49", name: "Alemania 🇩🇪", localDigits: 11 },
  "39": { code: "39", name: "Italia 🇮🇹", localDigits: 10 },
  "31": { code: "31", name: "Países Bajos 🇳🇱", localDigits: 9 },
  "41": { code: "41", name: "Suiza 🇨🇭", localDigits: 9 },
  "43": { code: "43", name: "Austria 🇦🇹", localDigits: 10 },
  "46": { code: "46", name: "Suecia 🇸🇪", localDigits: 9 },
  "47": { code: "47", name: "Noruega 🇳🇴", localDigits: 8 },
  "45": { code: "45", name: "Dinamarca 🇩🇰", localDigits: 8 },
  "358": { code: "358", name: "Finlandia 🇫🇮", localDigits: 9 },
  "48": { code: "48", name: "Polonia 🇵🇱", localDigits: 9 },
  "36": { code: "36", name: "Hungría 🇭🇺", localDigits: 9 },
  "40": { code: "40", name: "Rumania 🇷🇴", localDigits: 9 },
  "30": { code: "30", name: "Grecia 🇬🇷", localDigits: 10 },
  "353": { code: "353", name: "Irlanda 🇮🇪", localDigits: 9 },
  "32": { code: "32", name: "Bélgica 🇧🇪", localDigits: 9 },
  "55": { code: "55", name: "Brasil 🇧🇷", localDigits: 11 },
  "54": { code: "54", name: "Argentina 🇦🇷", localDigits: 10 },
  "56": { code: "56", name: "Chile 🇨🇱", localDigits: 9 },
  "57": { code: "57", name: "Colombia 🇨🇴", localDigits: 10 },
  "51": { code: "51", name: "Perú 🇵🇪", localDigits: 9 },
  "58": { code: "58", name: "Venezuela 🇻🇪", localDigits: 10 },
  "595": { code: "595", name: "Paraguay 🇵🇾", localDigits: 9 },
  "598": { code: "598", name: "Uruguay 🇺🇾", localDigits: 8 },
  "591": { code: "591", name: "Bolivia 🇧🇴", localDigits: 8 },
  "593": { code: "593", name: "Ecuador 🇪🇨", localDigits: 9 },
  "52": { code: "52", name: "México 🇲🇽", localDigits: 11, prefix: "1" },
  "53": { code: "53", name: "Cuba 🇨🇺", localDigits: 8 },
  "502": { code: "502", name: "Guatemala 🇬🇹", localDigits: 8 },
  "503": { code: "503", name: "El Salvador 🇸🇻", localDigits: 8 },
  "504": { code: "504", name: "Honduras 🇭🇳", localDigits: 8 },
  "505": { code: "505", name: "Nicaragua 🇳🇮", localDigits: 8 },
  "506": { code: "506", name: "Costa Rica 🇨🇷", localDigits: 8 },
  "507": { code: "507", name: "Panamá 🇵🇦", localDigits: 8 },
  "60": { code: "60", name: "Malasia 🇲🇾", localDigits: 9 },
  "65": { code: "65", name: "Singapur 🇸🇬", localDigits: 8 },
  "66": { code: "66", name: "Tailandia 🇹🇭", localDigits: 9 },
  "62": { code: "62", name: "Indonesia 🇮🇩", localDigits: 11 },
  "63": { code: "63", name: "Filipinas 🇵🇭", localDigits: 10 },
  "81": { code: "81", name: "Japón 🇯🇵", localDigits: 10 },
  "82": { code: "82", name: "Corea del Sur 🇰🇷", localDigits: 10 },
  "886": { code: "886", name: "Taiwán 🇹🇼", localDigits: 9 },
  "852": { code: "852", name: "Hong Kong 🇭🇰", localDigits: 8 },
  "853": { code: "853", name: "Macao 🇲🇴", localDigits: 8 },
  "64": { code: "64", name: "Nueva Zelanda 🇳🇿", localDigits: 9 },
  "61": { code: "61", name: "Australia 🇦🇺", localDigits: 9 },
  "27": { code: "27", name: "Sudáfrica 🇿🇦", localDigits: 9 },
  "212": { code: "212", name: "Marruecos 🇲🇦", localDigits: 9 },
  "20": { code: "20", name: "Egipto 🇪🇬", localDigits: 10 },
  "234": { code: "234", name: "Nigeria 🇳🇬", localDigits: 10 },
  "254": { code: "254", name: "Kenia 🇰🇪", localDigits: 9 },
  "256": { code: "256", name: "Uganda 🇺🇬", localDigits: 9 },
  "971": { code: "971", name: "Emiratos Árabes 🇦🇪", localDigits: 9 },
  "966": { code: "966", name: "Arabia Saudí 🇸🇦", localDigits: 9 },
  "965": { code: "965", name: "Kuwait 🇰🇼", localDigits: 8 },
  "972": { code: "972", name: "Israel 🇮🇱", localDigits: 9 },
  "90": { code: "90", name: "Turquía 🇹🇷", localDigits: 10 },
  "91": { code: "91", name: "India 🇮🇳", localDigits: 10 },
  "92": { code: "92", name: "Pakistán 🇵🇰", localDigits: 10 },
  "880": { code: "880", name: "Bangladesh 🇧🇩", localDigits: 10 },
};

// Mapping de zona horaria a código de país
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "America/Mexico_City": "52",
  "America/New_York": "1",
  "America/Los_Angeles": "1",
  "America/Toronto": "1",
  "America/Argentina/Buenos_Aires": "54",
  "America/Sao_Paulo": "55",
  "America/Santiago": "56",
  "America/Bogota": "57",
  "America/Lima": "51",
  "America/Caracas": "58",
  "America/Guatemala": "502",
  "America/El_Salvador": "503",
  "America/Tegucigalpa": "504",
  "America/Managua": "505",
  "America/Costa_Rica": "506",
  "America/Panama": "507",
  "America/Havana": "53",
  "Europe/Madrid": "34",
  "Europe/London": "44",
  "Europe/Paris": "33",
  "Europe/Berlin": "49",
  "Europe/Rome": "39",
  "Europe/Amsterdam": "31",
  "Europe/Zurich": "41",
  "Europe/Vienna": "43",
  "Europe/Stockholm": "46",
  "Europe/Oslo": "47",
  "Europe/Copenhagen": "45",
  "Europe/Helsinki": "358",
  "Europe/Warsaw": "48",
  "Europe/Budapest": "36",
  "Europe/Bucharest": "40",
  "Europe/Athens": "30",
  "Europe/Dublin": "353",
  "Europe/Brussels": "32",
  "Europe/Istanbul": "90",
  "Asia/Kolkata": "91",
  "Asia/Karachi": "92",
  "Asia/Bangkok": "66",
  "Asia/Jakarta": "62",
  "Asia/Manila": "63",
  "Asia/Tokyo": "81",
  "Asia/Seoul": "82",
  "Asia/Shanghai": "886",
  "Asia/Hong_Kong": "852",
  "Asia/Macau": "853",
  "Asia/Kuala_Lumpur": "60",
  "Asia/Singapore": "65",
  "Asia/Dhaka": "880",
  "Africa/Johannesburg": "27",
  "Africa/Cairo": "20",
  "Africa/Lagos": "234",
  "Africa/Nairobi": "254",
  "Africa/Kampala": "256",
  "Africa/Casablanca": "212",
  "Pacific/Auckland": "64",
  "Australia/Sydney": "61",
  "Asia/Dubai": "971",
  "Asia/Riyadh": "966",
  "Asia/Kuwait": "965",
  "Asia/Jerusalem": "972",
};

export default function PublicCalendarPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<CalendarConfig | null>(null);
  const [availability, setAvailability] = useState<CalendarAvailability[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("52");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappValidation, setWhatsappValidation] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarUnavailable, setCalendarUnavailable] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState("");
  const [publicBookingDisabled, setPublicBookingDisabled] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState<{ date: Date; time: string } | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; whatsapp?: string }>({});
  const { toast } = useToast();
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);

  // Función para extraer la bandera del nombre del país
  const getCountryFlag = (name: string): string => {
    const match = name.match(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/);
    return match ? match[0] : "";
  };

  // Función para detectar automáticamente el código de país del usuario
  const detectUserCountryCode = (): string => {
    try {
      // Intentar obtener zona horaria del usuario
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const detectedCode = TIMEZONE_TO_COUNTRY[timezone];
      if (detectedCode && COUNTRY_CODES[detectedCode]) {
        return detectedCode;
      }
    } catch (e) {
      console.warn("No se pudo detectar zona horaria");
    }
    // Por defecto, retornar 52 (México)
    return "52";
  };

  // Función para validar disponibilidad del calendario
  const validateCalendarAvailability = async () => {
    try {
      const response = await fetch(`/api/calendar/public/${token}`);
      if (response.status === 403) {
        setCalendarUnavailable(true);
        setUnavailableReason("El calendario ha sido desactivado por el propietario");
        setShowBookingForm(false);
        return false;
      }
      if (!response.ok) {
        setCalendarUnavailable(true);
        setUnavailableReason("El calendario no está disponible");
        setShowBookingForm(false);
        return false;
      }
      const data = await response.json();
      
      // CASO 1: Calendario desactivado completamente
      if (!data.config.isActive) {
        setCalendarUnavailable(true);
        setUnavailableReason("El calendario ha sido desactivado");
        setPublicBookingDisabled(false);
        setShowBookingForm(false);
        return false;
      }
      
      // CASO 2: Calendario activo pero agendación pública deshabilitada
      if (!data.config.isPublicBookingEnabled) {
        setCalendarUnavailable(false);
        setUnavailableReason("");
        setPublicBookingDisabled(true);
        setShowBookingForm(false);
        setConfig(data.config);
        setAvailability(data.availability);
        setEvents(data.events);
        return true; // Retornar true porque el calendario sí existe, solo está deshabilitado
      }
      
      // CASO 3: Todo bien
      setCalendarUnavailable(false);
      setUnavailableReason("");
      setPublicBookingDisabled(false);
      setConfig(data.config);
      setAvailability(data.availability);
      setEvents(data.events);
      return true;
    } catch (error) {
      setCalendarUnavailable(true);
      setUnavailableReason("Error validando disponibilidad del calendario");
      setShowBookingForm(false);
      return false;
    }
  };

  // Carga inicial
  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        const isAvailable = await validateCalendarAvailability();
        if (!isAvailable) {
          setCalendarUnavailable(true);
        }
      } catch (error: any) {
        setCalendarUnavailable(true);
        setUnavailableReason(error.message || "No se pudo cargar el calendario");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCalendarData();
    }
  }, [token]);

  // Detectar automáticamente el código de país del usuario al cargar
  useEffect(() => {
    const detectedCode = detectUserCountryCode();
    setWhatsappCode(detectedCode);
  }, []);

  // Validación periódica más frecuente (2s cuando está en formulario, 5s normal)
  useEffect(() => {
    if (!token || loading) return;

    // Validación más frecuente cuando está llenando el formulario
    const validationInterval = showBookingForm ? 2000 : 5000;

    const interval = setInterval(() => {
      validateCalendarAvailability();
    }, validationInterval);

    return () => clearInterval(interval);
  }, [token, loading, showBookingForm]);

  // Resetear estados de validación cuando se abre el modal
  useEffect(() => {
    if (showBookingForm) {
      setFormErrors({});
    }
  }, [showBookingForm]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  const getAvailableSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.isActive
    );

    if (dayAvailability.length === 0) return [];

    // Generate time slots based on availability
    const slots = [];
    for (const slot of dayAvailability) {
      const [startHour, startMin] = slot.startTime.split(":").map(Number);
      const [endHour, endMin] = slot.endTime.split(":").map(Number);

      let current = new Date(date);
      current.setHours(startHour, startMin, 0, 0);
      const end = new Date(date);
      end.setHours(endHour, endMin, 0, 0);

      const duration = config?.eventDurationMinutes || 60;

      while (current < end) {
        const timeStr = `${String(current.getHours()).padStart(2, "0")}:${String(
          current.getMinutes()
        ).padStart(2, "0")}`;

        // Check if this slot is already booked
        const isBooked = events.some((event) => {
          const eventStart = new Date(event.startTime);
          return (
            eventStart.getFullYear() === date.getFullYear() &&
            eventStart.getMonth() === date.getMonth() &&
            eventStart.getDate() === date.getDate() &&
            eventStart.getHours() === current.getHours() &&
            eventStart.getMinutes() === current.getMinutes()
          );
        });

        if (!isBooked) {
          slots.push(timeStr);
        }

        current.setMinutes(current.getMinutes() + duration);
      }
    }

    return slots;
  };

  const validateWhatsAppNumber = (number: string, code: string): boolean => {
    if (!number) return false;
    const cleaned = number.trim().replace(/\s+/g, '');
    const countryFormat = COUNTRY_CODES[code];
    if (!countryFormat) return false;
    const expectedLength = countryFormat.prefix 
      ? countryFormat.localDigits - countryFormat.prefix.length 
      : countryFormat.localDigits;
    return /^\d+$/.test(cleaned) && cleaned.length === expectedLength;
  };

  const getFullWhatsAppNumber = (): string | null => {
    if (!whatsappNumber.trim()) return null;
    
    let cleanNumber = whatsappNumber
      .trim()
      .replace(/\s+/g, '')
      .replace(/[-()]/g, '')
      .replace(/[@+]/g, '')
      .replace(/\./g, '');
    
    const cleanCode = whatsappCode.trim().replace(/\D/g, '');
    
    if (!/^\d+$/.test(cleanNumber)) {
      return null;
    }
    
    const countryFormat = COUNTRY_CODES[cleanCode];
    if (!countryFormat) {
      return null;
    }
    
    const expectedLocalDigits = countryFormat.localDigits;
    const prefix = countryFormat.prefix;
    
    if (prefix && cleanNumber.length === expectedLocalDigits - prefix.length) {
      cleanNumber = prefix + cleanNumber;
    }
    
    if (cleanNumber.length < 8) {
      return null;
    }
    
    if (cleanNumber.length !== expectedLocalDigits) {
      return null;
    }
    
    return `${cleanCode}${cleanNumber}`;
  };

  const handleBooking = async () => {
    // Resetear errores
    setFormErrors({});
    
    // Validar que el calendario siga disponible ANTES de procesar
    const isAvailable = await validateCalendarAvailability();
    if (!isAvailable) {
      toast({
        title: "⚠️ Calendario desactivado",
        description: unavailableReason || "El calendario ya no está disponible",
        variant: "destructive",
      });
      return;
    }

    const errors: { name?: string; whatsapp?: string } = {};
    
    // Validaciones
    if (!contactName.trim()) {
      errors.name = "El nombre es requerido";
    }
    
    if (!whatsappNumber.trim()) {
      errors.whatsapp = "El número de WhatsApp es requerido";
    } else if (whatsappValidation === "invalid") {
      // Si ya mostramos "inválido" al usuario, no permitir agendamiento
      errors.whatsapp = "El número de WhatsApp no es válido";
    } else if (!whatsappValidation || whatsappValidation !== "valid") {
      // Si aún no se ha validado completamente, forzar validación
      const isValid = validateWhatsAppNumber(whatsappNumber, whatsappCode);
      console.warn("WhatsApp validation on submit:", { whatsappNumber, whatsappCode, isValid, whatsappValidation });
      if (!isValid) {
        errors.whatsapp = "El número de WhatsApp no es válido";
      }
    }
    
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Selecciona una fecha y hora",
        variant: "destructive",
      });
      return;
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const fullWhatsApp = getFullWhatsAppNumber();
    if (!fullWhatsApp) {
      const errorMsg = "El número de WhatsApp no es válido";
      setFormErrors({ whatsapp: errorMsg });
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(
        endDateTime.getMinutes() + (config?.eventDurationMinutes || 60)
      );

      const response = await fetch(`/api/calendar/public/book/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contactName,
          description: bookingNotes,
          contactName,
          contactPhone: fullWhatsApp,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al agendar cita");
      }

      // Mostrar animación de éxito temporalmente
      setSuccessAnimation({ date: selectedDate!, time: selectedTime });

      toast({
        title: "¡Cita agendada!",
        description: "Tu cita ha sido reservada exitosamente",
      });

      setShowBookingForm(false);
      setContactName("");
      setWhatsappNumber("");
      setContactEmail("");
      setBookingNotes("");
      setSelectedTime("");
      setSelectedDate(null);
      setFormErrors({});
      setWhatsappValidation(null);

      // Remover animación después de 3 segundos
      setTimeout(() => setSuccessAnimation(null), 3000);

      // Refresh events
      const fetchResponse = await fetch(`/api/calendar/public/${token}`);
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setEvents(data.events);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Mostrar página de no disponible SOLO si el calendario está completamente desactivado
  // NO mostrar si es publicBookingDisabled (en ese caso mostramos el calendario con banner amarillo)
  if (calendarUnavailable) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-background/80 to-background">
          <div className="px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    Calendario no disponible
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card border-border border-red-500/30 bg-red-500/5">
              <CardContent className="py-12 text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                <div>
                  <p className="text-foreground font-semibold mb-2 text-lg">
                    {unavailableReason || "Calendario no disponible"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {unavailableReason === "El calendario ha sido desactivado" 
                      ? "El propietario ha desactivado temporalmente la agendación de citas." 
                      : unavailableReason === "La agendación de citas ha sido deshabilitada"
                      ? "La agendación de citas ha sido deshabilitada por el propietario."
                      : unavailableReason || "Por favor, intenta más tarde o contacta al propietario."}
                  </p>
                </div>
                <div className="pt-4">
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                    className="gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Recargar página
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (availability.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-background/80 to-background">
          <div className="px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    {config.businessName || "Agendar cita"}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                <div>
                  <p className="text-foreground font-semibold mb-2">Calendario no disponible</p>
                  <p className="text-sm text-muted-foreground">
                    El propietario del calendario aún no ha configurado los horarios de atención. Por favor, intenta más tarde.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const availableSlots = selectedDate ? getAvailableSlots(selectedDate) : [];
  const monthName = new Date(year, month).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  }).toUpperCase();
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {config.businessName || "Agendar cita"}
                </h1>
                {config.businessDescription && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.businessDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Alert with availability info - shown when calendar is active (whether booking enabled or not) */}
          <Alert className="mb-6 bg-blue-500/10 border-blue-500/30 py-2 px-3">
            <AlertCircle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <AlertDescription className="text-xs text-foreground/90 ml-2">
              Estás por agendar una cita con <span className="font-semibold">{config?.businessName || "nuestro equipo"}</span>. Selecciona una fecha y horario disponibles de los mostrados en el calendario.{config?.eventDurationMinutes && <span> Duración de la cita: <span className="font-semibold">{config.eventDurationMinutes} minutos</span>.</span>}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentDate(new Date(year, month - 1))}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-bold text-foreground">{monthName}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentDate(new Date(year, month + 1))}
                      className="h-8 w-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-0.5 mb-2">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-semibold text-muted-foreground/70 py-1"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map((date, idx) => {
                      const isToday =
                        date && date.toDateString() === new Date().toDateString();
                      const isSelected =
                        date &&
                        selectedDate &&
                        date.toDateString() === selectedDate.toDateString();
                      const hasAvailability =
                        date &&
                        availability.some(
                          (slot) =>
                            slot.dayOfWeek === date.getDay() && slot.isActive
                        );
                      const isPast = date && date < new Date();

                      return (
                        <div key={idx}>
                          {date ? (
                            <button
                              onClick={() => {
                                if (!isPast && hasAvailability) {
                                  setSelectedDate(date);
                                }
                              }}
                              disabled={isPast || !hasAvailability || !config.isPublicBookingEnabled}
                              className={`
                                w-full p-1 rounded text-xs font-semibold
                                transition-all duration-200 h-8 flex items-center justify-center relative
                                ${isPast || !hasAvailability
                                  ? "bg-muted/40 text-muted-foreground cursor-not-allowed opacity-50"
                                  : isSelected
                                    ? "bg-primary text-white border-0"
                                    : isToday
                                      ? "bg-primary/20 border border-primary/50 text-primary-foreground"
                                      : "bg-primary/35 border border-primary/50 text-foreground hover-elevate"
                                }
                              `}
                            >
                              <span>{date.getDate()}</span>
                              {!isPast && (
                                <div className="absolute top-0.5 right-0.5">
                                  {hasAvailability ? (
                                    <CheckCircle2 className="w-3 h-3 text-primary" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-muted-foreground/60" />
                                  )}
                                </div>
                              )}
                            </button>
                          ) : (
                            <div className="w-full" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              {successAnimation ? (
                <Card className="bg-green-500/10 border-green-500/30 border-2 animate-pulse">
                  <CardContent className="py-12 text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="animate-bounce">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">¡Cita confirmada!</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {successAnimation.date.toLocaleDateString("es-ES", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-lg font-bold text-primary mt-2">
                        {successAnimation.time}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : selectedDate ? (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      {selectedDate.toLocaleDateString("es-ES", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {availableSlots.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">
                          No hay horarios disponibles
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground/70">
                          Horarios disponibles:
                        </p>
                        <div className="max-h-[108px] overflow-y-auto pr-1">
                          <div className="grid grid-cols-2 gap-1.5">
                            {availableSlots.map((slot, idx) => {
                              const isPopular = idx < 4;
                              return (
                                <div key={slot} className="relative">
                                  {isPopular && (
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-full" />
                                  )}
                                  <Button
                                    variant={selectedTime === slot ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedTime(slot)}
                                    className={`text-xs h-8 font-medium w-full ${isPopular ? "pl-2" : ""}`}
                                  >
                                    {slot}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {selectedTime && (
                          <Button
                            onClick={() => setShowBookingForm(true)}
                            className="w-full mt-3"
                            size="sm"
                            disabled={!config.isPublicBookingEnabled}
                          >
                            Confirmar cita
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-secondary/30 border-dashed border-border/50">
                  <CardContent className="py-8 text-center">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground">
                      Selecciona una fecha para ver horarios disponibles
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="w-[95vw] sm:max-w-xs bg-card border-border p-0 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
          <DialogHeader className="px-3 pt-3 pb-0 flex-shrink-0">
            <DialogTitle className="text-sm">Agendar cita</DialogTitle>
            <DialogDescription className="text-xs">
              {selectedDate?.toLocaleDateString("es-ES", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              a las {selectedTime}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto flex-1 px-3 py-2 pr-1.5">
            {/* Info Alert */}
            <Alert className="bg-blue-500/10 border-blue-500/20 py-2 px-2">
              <AlertCircle className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />
              <AlertDescription className="text-xs text-blue-500/90 ml-1.5">
                Agregar información detallada en Notas nos ayuda a entender mejor sobre qué trata tu consulta
              </AlertDescription>
            </Alert>

            {/* Contact Info Card */}
            <div className="p-2 bg-secondary/20 border border-border rounded-lg space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Tus datos de contacto</p>
              
              <div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    placeholder="Nombre *"
                    value={contactName.split(" ")[0] || ""}
                    onChange={(e) => {
                      const parts = contactName.split(" ");
                      setContactName(`${e.target.value} ${parts.slice(1).join(" ")}`.trim());
                      if (e.target.value.trim()) {
                        setFormErrors(prev => ({ ...prev, name: undefined }));
                      }
                    }}
                    className={`text-xs h-8 bg-secondary/40 border-border ${formErrors.name ? 'border-destructive/50 focus-visible:ring-destructive/50' : ''}`}
                    data-testid="input-booking-name"
                  />
                  <Input
                    placeholder="Apellido"
                    value={contactName.split(" ").slice(1).join(" ") || ""}
                    onChange={(e) => {
                      const firstName = contactName.split(" ")[0];
                      setContactName(`${firstName} ${e.target.value}`.trim());
                    }}
                    className="text-xs h-8 bg-secondary/40 border-border"
                    data-testid="input-booking-lastname"
                  />
                </div>
                {formErrors.name && (
                  <p className="text-xs text-destructive mt-0.5">{formErrors.name}</p>
                )}
              </div>

              <Input
                type="email"
                placeholder="Email (opcional)"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="text-xs h-7 bg-secondary/40 border-border"
                data-testid="input-booking-email"
              />

              <div>
                <Label className="text-xs font-medium mb-0.5 block">WhatsApp *</Label>
                <div className="grid grid-cols-3 gap-1">
                  {/* Selector de país personalizado - Compacto y elegante */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCountrySelectorOpen(!isCountrySelectorOpen)}
                      className="h-8 w-full text-xs bg-secondary/40 border border-border rounded px-2 flex items-center justify-center font-bold uppercase hover:bg-secondary/50 active:bg-secondary/70 transition-colors duration-100"
                      data-testid="button-country-selector"
                    >
                      {whatsappCode && COUNTRY_CODES[whatsappCode] 
                        ? `${getCountryFlag(COUNTRY_CODES[whatsappCode].name)} +${whatsappCode}`
                        : "País"
                      }
                    </button>
                    
                    {isCountrySelectorOpen && (
                      <div className="absolute top-full left-0 right-0 mt-0.5 bg-background border border-border rounded shadow-lg z-50 overflow-hidden w-max min-w-full">
                        <div className="p-1.5 border-b border-border/40 bg-secondary/5">
                          <input
                            type="text"
                            placeholder="Buscar..."
                            value={countrySearchTerm}
                            onChange={(e) => setCountrySearchTerm(e.target.value)}
                            className="w-full text-xs h-6 px-2 py-0.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                            autoFocus
                            data-testid="input-country-search"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {Object.entries(COUNTRY_CODES)
                            .filter(([_, format]) => format.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) || _.includes(countrySearchTerm))
                            .map(([code, format]) => (
                              <button
                                key={code}
                                type="button"
                                onClick={() => {
                                  setWhatsappCode(code);
                                  setIsCountrySelectorOpen(false);
                                  setCountrySearchTerm("");
                                }}
                                className="w-full text-xs py-1.5 px-2 text-left hover:bg-primary/10 active:bg-primary/15 transition-colors duration-75 flex items-center gap-1.5"
                                data-testid={`option-country-${code}`}
                              >
                                <span className="font-semibold uppercase text-foreground/85 text-xs">
                                  {getCountryFlag(format.name)} +{code}
                                </span>
                              </button>
                            ))}
                          {Object.entries(COUNTRY_CODES).filter(([_, format]) => format.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) || _.includes(countrySearchTerm)).length === 0 && (
                            <div className="text-xs text-muted-foreground p-2 text-center">
                              Sin resultados
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Input
                    value={whatsappNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setWhatsappNumber(value);
                      if (value) {
                        const isValid = validateWhatsAppNumber(value, whatsappCode);
                        setWhatsappValidation(isValid ? "valid" : "invalid");
                        if (isValid) {
                          setFormErrors(prev => ({ ...prev, whatsapp: undefined }));
                        }
                      } else {
                        setWhatsappValidation(null);
                      }
                    }}
                    placeholder="Número *"
                    className={`col-span-2 text-xs h-8 bg-secondary/40 border-border ${formErrors.whatsapp ? 'border-destructive/50 focus-visible:ring-destructive/50' : ''}`}
                    data-testid="input-booking-whatsapp"
                  />
                </div>
                {formErrors.whatsapp && (
                  <p className="text-xs text-destructive mt-1">{formErrors.whatsapp}</p>
                )}
                {!formErrors.whatsapp && whatsappValidation === "invalid" && (
                  <p className="text-xs text-destructive mt-1">Número inválido</p>
                )}
                {!formErrors.whatsapp && whatsappValidation === "valid" && (
                  <p className="text-xs text-green-500 mt-1">✓ Válido</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="text-xs">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Detalles adicionales sobre tu cita..."
                className="mt-1 text-xs h-12 resize-none"
                data-testid="textarea-booking-notes"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 px-3 py-3 border-t border-border flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookingForm(false)}
              disabled={isSubmitting}
              className="h-7 text-xs"
              data-testid="button-booking-cancel"
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleBooking} disabled={isSubmitting} className="h-7 text-xs" data-testid="button-booking-submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Agendando...
                </>
              ) : (
                "Agendar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
