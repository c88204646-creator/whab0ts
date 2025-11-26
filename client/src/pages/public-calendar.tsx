import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, XCircle, Flame, ChevronUp, MessageCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/loading-spinner";
import { formatTo12Hour } from "@/lib/utils";
import { CalendarGrid } from "@/components/calendar-grid";
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
  const [, setLocation] = useLocation();
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
  const [timeZone, setTimeZone] = useState("America/Mexico_City");
  const { toast } = useToast();
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);
  
  // Detectar si vinimos desde admin
  const [fromAdmin, setFromAdmin] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFromAdmin(params.get("from") === "admin");
  }, []);

  // Función para extraer la bandera del nombre del país
  const getCountryFlag = (name: string): string => {
    const match = name.match(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/);
    return match ? match[0] : "";
  };

  // Helper function to get country flag from timezone
  const getTimezoneFlag = (timezone: string): string => {
    const flagMap: Record<string, string> = {
      "America/Mexico_City": "🇲🇽",
      "America/New_York": "🇺🇸",
      "America/Los_Angeles": "🇺🇸",
      "America/Chicago": "🇺🇸",
      "America/Denver": "🇺🇸",
      "America/Toronto": "🇨🇦",
      "America/Vancouver": "🇨🇦",
      "America/Sao_Paulo": "🇧🇷",
      "America/Buenos_Aires": "🇦🇷",
      "America/Bogota": "🇨🇴",
      "America/Lima": "🇵🇪",
      "America/Santiago": "🇨🇱",
      "America/Caracas": "🇻🇪",
      "America/Guatemala": "🇬🇹",
      "America/Costa_Rica": "🇨🇷",
      "America/Panama": "🇵🇦",
      "Europe/Madrid": "🇪🇸",
      "Europe/London": "🇬🇧",
      "Europe/Paris": "🇫🇷",
      "Europe/Berlin": "🇩🇪",
      "Europe/Rome": "🇮🇹",
      "Europe/Amsterdam": "🇳🇱",
      "Europe/Brussels": "🇧🇪",
      "Europe/Lisbon": "🇵🇹",
      "Asia/Tokyo": "🇯🇵",
      "Asia/Shanghai": "🇨🇳",
      "Asia/Dubai": "🇦🇪",
      "Asia/Singapore": "🇸🇬",
      "Asia/Hong_Kong": "🇭🇰",
      "Asia/Seoul": "🇰🇷",
      "Asia/Bangkok": "🇹🇭",
      "Asia/Kolkata": "🇮🇳",
      "Australia/Sydney": "🇦🇺",
      "Australia/Melbourne": "🇦🇺",
      "Pacific/Auckland": "🇳🇿",
    };
    return flagMap[timezone] || "🌍";
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
        setTimeZone(data.config.timeZone || "America/Mexico_City");
        setAvailability(data.availability);
        setEvents(data.events);
        return true; // Retornar true porque el calendario sí existe, solo está deshabilitado
      }
      
      // CASO 3: Todo bien
      setCalendarUnavailable(false);
      setUnavailableReason("");
      setPublicBookingDisabled(false);
      setConfig(data.config);
      setTimeZone(data.config.timeZone || "America/Mexico_City");
      setAvailability(data.availability);
      setEvents(data.events);
      console.log('✅ Calendar data loaded:', {
        config: data.config,
        availabilityCount: data.availability?.length || 0,
        availability: data.availability,
        eventsCount: data.events?.length || 0
      });
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

  // Debug: Log availability data
  useEffect(() => {
    if (availability.length > 0) {
      const availableDays = availability.map(slot => {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `${dayNames[slot.dayOfWeek]} (${slot.dayOfWeek}): ${slot.startTime}-${slot.endTime}`;
      });
      console.log('📅 Available days:', availableDays);
    }
  }, [availability]);

  // Get current date for comparison
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Prevent navigation to past months
  const canNavigatePrevious = year > currentYear || (year === currentYear && month > currentMonth);
  
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    // Create date at noon to avoid timezone issues with getDay()
    const d = new Date(year, month, i, 12, 0, 0, 0);
    calendarDays.push(d);
  }

  const getAvailableSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.isActive
    );

    if (dayAvailability.length === 0) return [];

    // Obtener hora actual
    const now = new Date();
    const isToday = 
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

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
        // Si es hoy, no mostrar horarios que ya pasaron
        if (isToday && current <= now) {
          current.setMinutes(current.getMinutes() + duration);
          continue;
        }

        const timeStr = formatTo12Hour(current.getHours(), current.getMinutes());

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

    const errors: { name?: string; whatsapp?: string; email?: string } = {};
    
    // Validaciones
    if (!contactName.trim()) {
      errors.name = "El nombre es requerido";
    }
    
    if (contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        errors.email = "El email no es válido";
      }
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
      // Parse time safely
      const timeParts = selectedTime.split(":");
      if (timeParts.length !== 2) {
        throw new Error("Formato de hora inválido");
      }
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error("La hora seleccionada no es válida");
      }
      
      // Ensure selectedDate is a valid Date
      if (!selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
        throw new Error("Fecha inválida seleccionada");
      }
      
      // Create start date time in local timezone
      const startDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hours,
        minutes,
        0,
        0
      );
      
      if (isNaN(startDateTime.getTime())) {
        console.error("Failed to create startDateTime:", { hours, minutes, selectedDate });
        throw new Error("No se pudo procesar la fecha y hora");
      }

      // Create end date time
      const endDateTime = new Date(startDateTime.getTime());
      endDateTime.setMinutes(endDateTime.getMinutes() + (config?.eventDurationMinutes || 60));

      console.log("Booking attempt:", {
        selectedDate: selectedDate.toISOString(),
        hours,
        minutes,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
      });

      const response = await fetch(`/api/calendar/public/book/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contactName,
          description: bookingNotes,
          contactName,
          contactPhone: fullWhatsApp,
          email: contactEmail || null,
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
      {/* Admin View Banner */}
      {fromAdmin && (
        <div className="flex-shrink-0 bg-primary/8 border-b border-primary/25 px-4 py-2.5">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0"></div>
              <p className="text-xs text-foreground/75">
                <span className="font-medium">Vista previa:</span> <span className="text-muted-foreground">Así ven tus clientes el calendario</span>
              </p>
            </div>
            <button
              onClick={() => setLocation("/calendar")}
              className="px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted/40 transition-colors flex-shrink-0 flex items-center gap-1.5"
              data-testid="button-back-to-dashboard"
            >
              <ChevronUp className="w-3 h-3" />
              Volver
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b border-border bg-background flex-shrink-0 gap-4 shadow-sm">
        {/* Left section - Avatar + Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar con iniciales */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-base font-bold text-white">
              {config.businessName?.charAt(0)?.toUpperCase() || "A"}
            </span>
          </div>
          
          {/* Info del negocio */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-foreground truncate">
                {config.businessName || "Agendar cita"}
              </h1>
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {config.businessDescription && (
                <p className="text-xs text-muted-foreground truncate max-w-48">
                  {config.businessDescription}
                </p>
              )}
              {config.eventDurationMinutes && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {config.eventDurationMinutes} min
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right section - Timezone + Info button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {config.timeZone && (
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
              <span className="text-sm">{getTimezoneFlag(config.timeZone)}</span>
              <span className="text-xs text-muted-foreground font-medium">
                {config.timeZone.split('/')[1]?.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 py-4 bg-muted/30 border-b border-border/40">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Disponibilidad */}
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 flex-shrink-0"></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Disponible</p>
                <p className="text-[11px] text-muted-foreground">Horarios libres</p>
              </div>
            </div>
            
            {/* Sin disponibilidad */}
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 mt-1 flex-shrink-0"></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Sin citas</p>
                <p className="text-[11px] text-muted-foreground">Día ocupado</p>
              </div>
            </div>
            
            {/* Hoy */}
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-lg bg-primary/25 border border-primary mt-1 flex-shrink-0"></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Hoy</p>
                <p className="text-[11px] text-muted-foreground">Fecha actual</p>
              </div>
            </div>
            
            {/* Pasado */}
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-lg bg-muted/15 border border-border/40 mt-1 flex-shrink-0"></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Pasado</p>
                <p className="text-[11px] text-muted-foreground">No disponible</p>
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
              <div className="space-y-1">
                <div>Estás por agendar una cita con <span className="font-semibold">{config?.businessName || "nuestro equipo"}</span>. Selecciona una fecha y horario disponibles de los mostrados en el calendario.{config?.eventDurationMinutes && <span> Duración de la cita: <span className="font-semibold">{config.eventDurationMinutes} minutos</span>.</span>}</div>
                <div className="text-xs text-foreground/70">Zona horaria: <span className="font-medium flex items-center gap-1.5 inline-flex">{getTimezoneFlag(timeZone)} <span>{timeZone.split('/')[1]?.replace(/_/g, ' ')}</span></span></div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2">
              <CalendarGrid
                year={year}
                month={month}
                monthName={monthName}
                weekDays={weekDays}
                calendarDays={calendarDays}
                canNavigatePrevious={canNavigatePrevious}
                onPrevMonth={() => setCurrentDate(new Date(year, month - 1))}
                onNextMonth={() => setCurrentDate(new Date(year, month + 1))}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setSelectedTime("");
                }}
                availability={availability}
                showEvents={false}
                hideAvailabilityIndicators={false}
              />
            </div>

            <div className="lg:col-span-1">
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
                  <CardContent className="p-0 flex flex-col h-full">
                    {availableSlots.length === 0 ? (
                      <div className="text-center py-8 flex flex-col items-center justify-center flex-1">
                        <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">
                          No hay horarios disponibles
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="px-4 py-3 border-b border-border/40 flex-shrink-0">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            Horarios disponibles
                          </p>
                        </div>
                        
                        <div className="max-h-56 overflow-y-auto px-4 py-3 custom-scrollbar">
                          <div className="grid grid-cols-3 gap-2">
                            {availableSlots.slice(0, 6).map((slot, idx) => {
                              const isPopular = idx < 4;
                              return (
                                <button
                                  key={slot}
                                  onClick={() => setSelectedTime(slot)}
                                  className={`relative group rounded-md px-2 py-2.5 text-xs font-semibold transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                                    selectedTime === slot
                                      ? "bg-primary text-primary-foreground border border-primary shadow-sm scale-105"
                                      : "bg-card border border-border/60 text-foreground hover:bg-muted/50 hover:border-border hover-elevate"
                                  }`}
                                  data-testid={`button-time-${slot}`}
                                >
                                  <span className="text-[11px] font-bold">{slot}</span>
                                  {isPopular && (
                                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-orange-500 flex items-center justify-center border-2 border-background shadow-sm flex-shrink-0">
                                      <Flame className="w-2 h-2 text-white fill-white" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {selectedTime && (
                          <div className="px-4 py-3 border-t border-border/40 flex-shrink-0 bg-muted/10">
                            <div className="mb-3 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                              <p className="text-xs text-foreground">
                                <span className="font-semibold">Horario seleccionado:</span>
                                <span className="ml-1.5 text-primary font-bold">{selectedTime}</span>
                              </p>
                            </div>
                            <Button
                              onClick={() => setShowBookingForm(true)}
                              className="w-full"
                              size="sm"
                              disabled={!config.isPublicBookingEnabled}
                              data-testid="button-confirm-booking"
                            >
                              Confirmar cita
                            </Button>
                          </div>
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

              <div>
                <Input
                  type="email"
                  placeholder="Email (opcional)"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    if (e.target.value.trim()) {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(e.target.value)) {
                        setFormErrors(prev => ({ ...prev, email: "Email inválido" }));
                      } else {
                        setFormErrors(prev => ({ ...prev, email: undefined }));
                      }
                    } else {
                      setFormErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  className={`text-xs h-7 bg-secondary/40 border-border ${formErrors.email ? 'border-destructive/50 focus-visible:ring-destructive/50' : ''}`}
                  data-testid="input-booking-email"
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive mt-0.5">{formErrors.email}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium mb-0.5 block">WhatsApp *</Label>
                <div className="flex gap-1">
                  {/* Selector de país personalizado - Muy compacto */}
                  <div className="relative w-min flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCountrySelectorOpen(!isCountrySelectorOpen)}
                      className="h-8 px-1.5 py-1 text-xs bg-secondary/40 border border-border rounded flex items-center justify-center font-bold uppercase hover:bg-secondary/50 active:bg-secondary/70 transition-colors duration-100 whitespace-nowrap"
                      data-testid="button-country-selector"
                    >
                      {whatsappCode && COUNTRY_CODES[whatsappCode] 
                        ? `${getCountryFlag(COUNTRY_CODES[whatsappCode].name)} +${whatsappCode}`
                        : "+"
                      }
                    </button>
                    
                    {isCountrySelectorOpen && (
                      <div className="absolute top-full left-0 mt-0.5 bg-background border border-border rounded shadow-lg z-50 overflow-hidden" style={{ width: '240px', maxHeight: '300px' }}>
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
                        <div className="overflow-y-auto" style={{ maxHeight: '260px' }}>
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
                                className="w-full text-xs py-1.5 px-2 text-left hover:bg-primary/10 active:bg-primary/15 transition-colors duration-75 flex items-center gap-1.5 whitespace-nowrap"
                                data-testid={`option-country-${code}`}
                              >
                                <span className="font-semibold uppercase text-foreground/85 text-xs">
                                  {getCountryFlag(format.name)} +{code} {format.name}
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
                    className={`flex-1 text-xs h-8 bg-secondary/40 border-border ${formErrors.whatsapp ? 'border-destructive/50 focus-visible:ring-destructive/50' : ''}`}
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
              <Label htmlFor="notes" className="text-xs">Descripción (opcional)</Label>
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
