import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronLeft, ChevronRight, X, Trash2, AlertCircle, CheckCircle2, Calendar as CalendarIcon, Clock, XCircle, AlertOctagon, Inbox, Phone, User, Copy, Share2, Settings, Zap, AlertTriangle, Search, Eye, Edit3, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { formatTo12Hour } from "@/lib/utils";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { CalendarEvent, CalendarAvailability, CalendarConfig } from "@shared/schema";

interface CountryFormat {
  code: string;
  name: string;
  localDigits: number;
  prefix?: string;
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

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

export default function CalendarPage() {
  const [, setLocation] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [isCalendarActive, setIsCalendarActive] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("52");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappValidation, setWhatsappValidation] = useState<string | null>(null);
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [eventDate, setEventDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [eventTime, setEventTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteAvailabilityId, setDeleteAvailabilityId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Client/Lead selection state
  const [clientIdSelected, setClientIdSelected] = useState<string>("");
  const [leadIdSelected, setLeadIdSelected] = useState<string>("");
  const [clientMode, setClientMode] = useState<"search" | "manual" | "create">("search"); // search, manual, create
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientType, setSelectedClientType] = useState<"client" | "lead">("client");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientType, setNewClientType] = useState<"client" | "lead">("client");
  
  // Calendar day click action state
  const [dateActionMode, setDateActionMode] = useState<"view" | "create" | null>(null);
  const [selectedDateHasAvailability, setSelectedDateHasAvailability] = useState(false);
  
  // Settings form state
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [eventDurationMinutes, setEventDurationMinutes] = useState(60);
  const [isPublicBookingEnabled, setIsPublicBookingEnabled] = useState(true);
  const [timeZone, setTimeZone] = useState("America/Mexico_City");

  // Availability form state
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  
  // Calendar picker state for event creation
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [originalEventDate, setOriginalEventDate] = useState<string>("");
  
  // Accordion state for events list
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    } else {
      setUserId("3a4189a2-1f3c-430f-b3c5-c63521fc7a61");
    }
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/calendar/${userId}`);
      if (!response.ok) throw new Error("Error fetching events");
      return response.json();
    },
    refetchInterval: 5000, // Actualizar cada 5 segundos para capturar citas públicas nuevas
  });

  const { data: availability = [] } = useQuery<CalendarAvailability[]>({
    queryKey: ["/api/calendar/availability", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/calendar/availability/${userId}`);
      if (!response.ok) throw new Error("Error fetching availability");
      return response.json();
    }
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/clients/${userId}`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/leads/${userId}`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: calendarConfig } = useQuery<CalendarConfig>({
    queryKey: ["/api/calendar/config", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/calendar/config/${userId}`);
      if (!response.ok) throw new Error("Error fetching config");
      return response.json();
    }
  });

  const { data: linkStats } = useQuery({
    queryKey: ["/api/calendar/stats", calendarConfig?.publicShareToken],
    enabled: !!calendarConfig?.publicShareToken,
    queryFn: async () => {
      const response = await fetch(`/api/calendar/stats/${calendarConfig?.publicShareToken}`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  useEffect(() => {
    if (calendarConfig) {
      setBusinessName(calendarConfig.businessName || "");
      setBusinessDescription(calendarConfig.businessDescription || "");
      setEventDurationMinutes(calendarConfig.eventDurationMinutes || 60);
      setIsPublicBookingEnabled(calendarConfig.isPublicBookingEnabled ?? true);
      setIsCalendarActive(calendarConfig.isActive ?? true);
      setTimeZone(calendarConfig.timeZone || "America/Mexico_City");
    }
  }, [calendarConfig]);

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!eventDate || !eventTime) {
        throw new Error("Fecha y hora requeridas");
      }
      const [year, month, day] = eventDate.split("-");
      const [hours, minutes] = eventTime.split(":");
      
      // Create local date first
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
      
      // Adjust for timezone offset to preserve local time when converting to ISO
      // getTimezoneOffset returns minutes west of UTC (positive for west, negative for east)
      // To convert local time to UTC equivalent, we SUBTRACT the offset
      const offset = localDate.getTimezoneOffset() * 60000;
      const startDateTime = new Date(localDate.getTime() - offset);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + eventDurationMinutes);

      const method = editingEventId ? "PATCH" : "POST";
      const url = editingEventId ? `/api/calendar/${editingEventId}` : "/api/calendar";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          ...(method === "POST" && { userId }),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || (editingEventId ? "Error actualizando cita" : "Error creando cita"));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar", userId] });
      resetForm();
      setShowNewForm(false);
      setEditingEventId(null);
      setSelectedDate(null);
      toast({ 
        title: editingEventId ? "✓ Cita actualizada correctamente" : "✓ ¡Felicidades! Nueva cita agendada", 
        description: editingEventId ? "Los cambios han sido guardados" : "Tu cita ha sido registrada exitosamente en el sistema"
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando cita");
      return response.json();
    },
    onSuccess: () => {
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/calendar", userId] });
      toast({ title: "✓ Cita eliminada", description: "Se ha removido correctamente del calendario" });
    },
  });

  const updateCalendarStatusMutation = useMutation({
    mutationFn: async (active: boolean) => {
      const response = await fetch("/api/calendar/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: active }),
      });
      if (!response.ok) throw new Error("Error actualizando estado");
      return response.json();
    },
    onSuccess: (data) => {
      setIsCalendarActive(data.isActive);
      toast({
        title: data.isActive ? "✓ Calendario activado" : "✓ Calendario desactivado",
        description: data.isActive ? "Tu calendario está listo para recibir citas" : "Tu calendario se ha pausado correctamente",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/calendar/config/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          businessDescription,
          eventDurationMinutes: parseInt(eventDurationMinutes.toString()),
          isPublicBookingEnabled,
          timeZone,
        }),
      });
      if (!response.ok) throw new Error("Error actualizando configuración");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/config", userId] });
      setShowSettingsForm(false);
      toast({ title: "✓ Configuración actualizada", description: "Los cambios han sido guardados exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createAvailabilityMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/calendar/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          dayOfWeek: parseInt(selectedDayOfWeek),
          startTime,
          endTime,
          isActive: true,
        }),
      });
      if (!response.ok) throw new Error("Error creando disponibilidad");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/availability", userId] });
      setShowAvailabilityForm(false);
      toast({ title: "✓ Horario agregado", description: "Tu disponibilidad ha sido registrada correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/calendar/availability/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error eliminando disponibilidad");
      }
      return response.json();
    },
    onSuccess: () => {
      setDeleteAvailabilityId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/availability", userId] });
      toast({ title: "✓ Horario eliminado", description: "Se ha removido correctamente de tu disponibilidad" });
    },
    onError: (error: any) => {
      toast({ 
        title: "⚠️ No se puede eliminar", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContactName("");
    setContactPhone("");
    setWhatsappCode("52");
    setWhatsappNumber("");
    setWhatsappValidation(null);
    setEventDate("");
    setOriginalEventDate("");
    const now = new Date();
    setEventTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setClientIdSelected("");
    setLeadIdSelected("");
    setClientMode("search");
    setClientSearch("");
    setSelectedClientType("client");
    setNewClientEmail("");
    setNewClientType("client");
    setEditingEventId(null);
    setCalendarMonth(new Date().getMonth());
    setCalendarYear(new Date().getFullYear());
  };

  const handleEditEvent = (event: any) => {
    setTitle(event.title);
    setDescription(event.description || "");
    setContactName(event.contactName || "");
    setContactPhone(event.contactPhone || "");
    setEditingEventId(event.id);
    
    // Parse the ISO string without timezone conversion
    // The startTime was saved with timezone adjustment, so we parse it directly
    const isoStr = event.startTime;
    const [datePart, timePart] = isoStr.split('T');
    const timeOnly = timePart.split('.')[0];
    
    setEventDate(datePart);
    setOriginalEventDate(datePart);
    setEventTime(timeOnly);
    
    // Pre-select the calendar month/year for the mini calendar
    const [year, month, day] = datePart.split('-');
    setCalendarMonth(parseInt(month) - 1);
    setCalendarYear(parseInt(year));
    
    // Load client/lead information
    if (event.clientId) {
      setClientIdSelected(event.clientId);
      setLeadIdSelected("");
      setClientMode("search");
      setSelectedClientType("client");
    } else if (event.leadId) {
      setLeadIdSelected(event.leadId);
      setClientIdSelected("");
      setClientMode("search");
      setSelectedClientType("lead");
    } else if (event.contactPhone) {
      // If there's a phone but no client/lead ID, it's manual mode
      setClientMode("manual");
      setClientIdSelected("");
      setLeadIdSelected("");
    } else {
      setClientMode("search");
      setClientIdSelected("");
      setLeadIdSelected("");
    }
    
    // Reset WhatsApp fields for manual mode
    if (event.contactPhone) {
      // Try to extract country code from phone (basic logic)
      setWhatsappCode("52"); // Default to Mexico
      setWhatsappNumber(event.contactPhone.replace(/\D/g, '').slice(-10)); // Extract last 10 digits
    }
    
    setShowNewForm(true);
  };

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "El título es requerido", variant: "destructive" });
      return;
    }
    if (!eventDate) {
      toast({ title: "Error", description: "La fecha es requerida", variant: "destructive" });
      return;
    }
    
    // Validate that the date is not in the past (unless editing)
    if (!editingEventId) {
      const [year, month, day] = eventDate.split("-");
      const selectedDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      selectedDateTime.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDateTime < today) {
        toast({ 
          title: "Error", 
          description: "No puedes agendar citas en días pasados", 
          variant: "destructive" 
        });
        return;
      }
    }
    
    // Validate availability for the selected date
    // When editing, only validate if the date has CHANGED to a different day
    const isDateChanged = editingEventId && eventDate !== originalEventDate;
    const shouldValidateAvailability = !editingEventId || isDateChanged;
    
    if (shouldValidateAvailability) {
      const [year, month, day] = eventDate.split("-");
      const selectedDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dayOfWeek = selectedDateTime.getDay();
      
      const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek && a.isActive);
      if (dayAvailability.length === 0) {
        toast({ 
          title: "Error", 
          description: `No hay horarios disponibles el ${DAYS_OF_WEEK[dayOfWeek]}`, 
          variant: "destructive" 
        });
        return;
      }
    }

    // If creating new client/lead, validate WhatsApp and create it first
    let finalClientId = clientIdSelected;
    let finalLeadId = leadIdSelected;
    let fullWhatsApp = null;

    if (clientMode === "create" && contactName.trim()) {
      fullWhatsApp = getFullWhatsAppNumber();
      if (!fullWhatsApp) {
        toast({
          title: "Error",
          description: "El número de WhatsApp no es válido",
          variant: "destructive",
        });
        return;
      }

      try {
        const [firstName, ...lastNameParts] = contactName.split(" ");
        const lastName = lastNameParts.join(" ") || "";

        const endpoint = newClientType === "client" ? "/api/clients" : "/api/leads";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            firstName,
            lastName,
            email: newClientEmail || undefined,
            phone: fullWhatsApp,
            notes: "",
          }),
        });

        if (!response.ok) throw new Error("Error creando cliente");
        const newClient = await response.json();

        if (newClientType === "client") {
          finalClientId = newClient.id;
        } else {
          finalLeadId = newClient.id;
        }

        // Invalidate cache so it appears in CRM
        queryClient.invalidateQueries({ queryKey: ["/api/clients", userId] });
        queryClient.invalidateQueries({ queryKey: ["/api/leads", userId] });
        
        toast({ 
          title: `✓ ${newClientType === "client" ? "Cliente" : "Lead"} creado correctamente`, 
          description: `Se ha registrado exitosamente en tu CRM` 
        });
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    createEventMutation.mutate({ 
      title, 
      description, 
      contactName, 
      contactPhone: fullWhatsApp || undefined,
      clientId: finalClientId || undefined,
      leadId: finalLeadId || undefined
    });
  };

  const getCountryFlag = (name: string): string => {
    const match = name.match(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/);
    return match ? match[0] : "";
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

  const getAvailableTimesForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek && a.isActive);
    
    if (dayAvailability.length === 0) return [];

    const times: string[] = [];
    for (const slot of dayAvailability) {
      const [startHour, startMin] = slot.startTime.split(":").map(Number);
      const [endHour, endMin] = slot.endTime.split(":").map(Number);

      let current = new Date(date);
      current.setHours(startHour, startMin, 0, 0);
      const end = new Date(date);
      end.setHours(endHour, endMin, 0, 0);

      while (current < end) {
        const timeStr = formatTo12Hour(current.getHours(), current.getMinutes());
        
        // Check if slot is booked
        const isBooked = events.some(e => {
          const eStart = new Date(e.startTime);
          return eStart.getFullYear() === date.getFullYear() &&
                 eStart.getMonth() === date.getMonth() &&
                 eStart.getDate() === date.getDate() &&
                 eStart.getHours() === current.getHours() &&
                 eStart.getMinutes() === current.getMinutes();
        });

        if (!isBooked) {
          times.push(timeStr);
        }
        current.setMinutes(current.getMinutes() + eventDurationMinutes);
      }
    }
    return times;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getUTCFullYear() === date.getFullYear() &&
        eventDate.getUTCMonth() === date.getMonth() &&
        eventDate.getUTCDate() === date.getDate()
      );
    });
  };

  const monthName = new Date(year, month).toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const availableTimesForSelectedDate = selectedDate ? getAvailableTimesForDate(selectedDate) : [];

  const publicUrl = calendarConfig?.publicShareToken ? `${window.location.origin}/public-calendar/${calendarConfig.publicShareToken}` : "";

  if (eventsLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col bg-background">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Buttons */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Citas</h1>
                <p className="text-xs text-muted-foreground/80">Gestiona y comparte tu calendario de disponibilidad</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 border border-border/40 rounded-md transition-colors ${isCalendarActive ? 'bg-muted/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <Label htmlFor="calendar-toggle" className={`text-xs font-semibold cursor-pointer ${isCalendarActive ? 'text-foreground' : 'text-red-500'}`}>
                  {isCalendarActive ? "Activo" : "Inactivo"}
                </Label>
                <Switch
                  id="calendar-toggle"
                  checked={isCalendarActive}
                  onCheckedChange={(checked) => updateCalendarStatusMutation.mutate(checked)}
                  data-testid="switch-calendar-active"
                  disabled={updateCalendarStatusMutation.isPending}
                  className={isCalendarActive ? "" : "data-[state=unchecked]:bg-red-500"}
                />
              </div>
              <Button onClick={() => setShowSettingsForm(true)} size="sm" variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Configurar</span>
              </Button>
              <Button onClick={() => {
                setEventDate("");
                const now = new Date();
                setEventTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
                setShowNewForm(true);
              }} data-testid="button-add-event" size="sm" className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva cita</span>
              </Button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {/* Total Citas */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{events.length}</p>
            </div>

            {/* Próximas */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Próximas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{events.filter((e: any) => new Date(e.startTime) > new Date()).length}</p>
            </div>

            {/* Completadas */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Completadas</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{events.filter((e: any) => e.status === "completed").length}</p>
            </div>

            {/* Disponibilidades */}
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">Horarios</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{availability.length}</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-3">
              <Share2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Comparte tu calendario por WhatsApp</p>
                <p className="text-xs text-foreground/70 mt-1">Tus clientes pueden agendar citas directamente. Configura tus horarios de atención para que solo vean horas disponibles.</p>
              </div>
            </div>
          </div>

          {!isPublicBookingEnabled && (
            <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Agendación de citas desactivada</p>
                  <p className="text-xs text-foreground/70 mt-1">Actívala en la configuración para que tus clientes puedan reservar citas.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-2 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentDate(new Date(year, month - 1))}
                      data-testid="button-prev-month"
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="inline-flex items-center px-4 py-2 bg-secondary/40 border border-border/70 rounded-lg">
                      <span className="text-xs font-bold text-foreground uppercase">{monthName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentDate(new Date(year, month + 1))}
                      data-testid="button-next-month"
                      className="h-8 w-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-0.5 mb-2">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-[10px] font-bold text-muted-foreground/80 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map((date, idx) => {
                      const dayEvents = date ? getEventsForDate(date) : [];
                      const isToday = date && date.toDateString() === new Date().toDateString();
                      const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
                      const hasAvailability = date ? availability.some(a => a.dayOfWeek === date.getDay() && a.isActive) : false;
                      // Check if date is in the past
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isPast = date ? (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() < today.getTime()) : false;

                      return (
                        <div key={idx}>
                          {date ? (
                            <button
                              onClick={() => {
                                if (!isPast) {
                                  setSelectedDate(date);
                                  setSelectedDateHasAvailability(hasAvailability);
                                  setDateActionMode("view");
                                }
                              }}
                              disabled={isPast}
                              data-testid={`day-${date.getDate()}`}
                              className={`
                                w-full aspect-square p-0.5 rounded text-[10px] font-medium
                                transition-all duration-200 flex flex-col items-start justify-start gap-0.5 overflow-hidden
                                relative
                                ${isPast
                                  ? "bg-muted/20 border border-border/30 text-muted-foreground/50 cursor-not-allowed opacity-50"
                                  : isToday
                                  ? "bg-primary/20 text-primary-foreground border border-primary/50"
                                  : isSelected
                                    ? "bg-primary/30 border-2 border-primary"
                                    : "bg-secondary/40 border border-border/60 hover-elevate"
                                }
                              `}
                            >
                              <div className="flex items-center justify-between w-full flex-shrink-0">
                                <span className="text-[10px] font-semibold text-foreground">{date.getDate()}</span>
                                <div className="absolute top-0.5 right-0.5">
                                  {hasAvailability ? (
                                    <CheckCircle2 className="w-2 h-2 text-primary" />
                                  ) : (
                                    <XCircle className="w-2 h-2 text-muted-foreground/60" />
                                  )}
                                </div>
                              </div>
                              <div className="w-full space-y-0.5 overflow-y-auto max-h-4">
                                {dayEvents.map((event: any) => (
                                  <div key={event.id} className="w-full">
                                    <div className={`w-full text-[9px] rounded px-0.5 py-0 truncate font-medium whitespace-nowrap flex items-center gap-0.5 bg-primary/70 text-primary-foreground`}>
                                      {event.isPublicBooking && (
                                        <svg className="w-1.5 h-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 10a2 2 0 104 0 2 2 0 00-4 0z" />
                                        </svg>
                                      )}
                                      {event.title}
                                    </div>
                                  </div>
                                ))}
                              </div>
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
              
              <Alert className="bg-blue-500/10 border-blue-500/30 text-foreground mt-4">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <AlertDescription className="text-xs">
                  <span className="font-semibold text-blue-500 mr-2">Indicadores de disponibilidad:</span>
                  <span className="flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-primary" /> = Disponible para agendar citas
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-muted-foreground/60" /> = No disponible
                  </span>
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-2">
              {selectedDate ? (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit text-xs bg-secondary/50 text-foreground border-border/60">
                      {selectedDate.toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {selectedDateEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-4 gap-2">
                        <Inbox className="w-6 h-6 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground text-center">Sin citas</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(() => {
                          const dateKey = selectedDate?.toISOString().split('T')[0] || '';
                          const isExpanded = expandedDays.has(dateKey);
                          const visibleEvents = isExpanded ? selectedDateEvents : selectedDateEvents.slice(0, 1);
                          const hiddenCount = Math.max(0, selectedDateEvents.length - 1);

                          return (
                            <>
                              {visibleEvents.map((event: any) => (
                                <Card key={event.id} className={`border-border/60 bg-secondary/40 transition-all duration-200`}>
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                        <h4 className="font-semibold text-xs truncate flex-1">{event.title}</h4>
                                        {event.isPublicBooking ? (
                                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 h-fit py-0.5 px-1.5 flex-shrink-0 whitespace-nowrap">
                                            Reserva Web
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-[10px] bg-secondary/30 text-muted-foreground border-border/60 h-fit py-0.5 px-1.5 flex-shrink-0 whitespace-nowrap">
                                            Teams
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {!event.isPublicBooking && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEditEvent(event)}
                                            data-testid={`button-edit-event-${event.id}`}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Edit3 className="w-3 h-3 text-muted-foreground" />
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setDeleteConfirmId(event.id)}
                                          data-testid={`button-delete-event-${event.id}`}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Trash2 className="w-3 h-3 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                    {event.description && (
                                      <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                                    )}
                                    <div className="text-xs text-muted-foreground space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        <p>
                                          {new Date(event.startTime).toLocaleTimeString("es-ES", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      </div>
                                      {event.contactName && (
                                        <div className="flex items-center gap-2">
                                          <User className="w-3 h-3" />
                                          <p>{event.contactName}</p>
                                        </div>
                                      )}
                                      {event.contactPhone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-3 h-3" />
                                          <p>{event.contactPhone}</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                              {hiddenCount > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedDays);
                                    if (isExpanded) {
                                      newExpanded.delete(dateKey);
                                    } else {
                                      newExpanded.add(dateKey);
                                    }
                                    setExpandedDays(newExpanded);
                                  }}
                                  className="w-full text-xs py-1 h-auto"
                                  data-testid={`button-toggle-events-${dateKey}`}
                                >
                                  {isExpanded ? "Mostrar menos" : `+${hiddenCount} evento${hiddenCount !== 1 ? 's' : ''}`}
                                </Button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-secondary/30 border-dashed border-border/50">
                  <CardContent className="py-3 text-center">
                    <p className="text-xs text-muted-foreground">Haz click en un día</p>
                  </CardContent>
                </Card>
              )}

              {/* Public URL Card */}
              {publicUrl ? (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Enlace público
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {availability.length === 0 ? (
                      <Alert className="bg-yellow-500/10 border-yellow-500/30">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <AlertDescription className="text-xs text-yellow-700">
                          Configura tu disponibilidad horaria para que tus clientes puedan agendar citas en el enlace público.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="text-xs text-muted-foreground">Comparte este enlace para que tus clientes agenderen citas:</div>
                    )}
                    <div className="flex items-center gap-2 bg-muted/30 border border-border/60 rounded-lg p-2">
                      <input
                        type="text"
                        value={publicUrl}
                        readOnly
                        className="text-xs flex-1 outline-none text-foreground truncate transparent-input"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(publicUrl);
                          toast({ title: "✓ Enlace copiado", description: "Listo para compartir con tus clientes" });
                          fetch(`/api/calendar/stats/share/${calendarConfig?.publicShareToken}`, { method: "POST" });
                        }}
                        className="h-6 w-6 p-0"
                        data-testid="button-copy-link"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    {linkStats && availability.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs px-3 py-1 bg-muted/50 flex-1 min-w-[90px] justify-center gap-1.5">
                            <span className="text-muted-foreground text-[10px]">Compartidas</span>
                            <span className="font-bold text-foreground text-xs">{formatNumber(linkStats.timesShared || 0)}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs px-3 py-1 bg-muted/50 flex-1 min-w-[90px] justify-center gap-1.5">
                            <span className="text-muted-foreground text-[10px]">Visitas</span>
                            <span className="font-bold text-foreground text-xs">{formatNumber(linkStats.timesVisited || 0)}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs px-3 py-1 bg-muted/50 flex-1 min-w-[90px] justify-center gap-1.5">
                            <span className="text-muted-foreground text-[10px]">Conversión</span>
                            <span className="font-bold text-primary text-xs">{linkStats.timesVisited > 0 ? Math.round((linkStats.bookingsCompleted / linkStats.timesVisited) * 100) : 0}%</span>
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation("/calendar/analytics")}
                          className="w-full text-xs h-7 gap-1.5"
                          data-testid="button-view-analytics"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Ver analíticas detalladas
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {/* Availability Card - Current Configuration */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs">Configuración actual</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setShowAvailabilityForm(true)}
                      className="h-8 px-2 gap-1.5 text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availability.length === 0 && (
                    <Alert className="bg-amber-500/10 border-amber-500/30 py-2 px-3">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <AlertDescription className="text-xs text-foreground/90 ml-2">
                        Configura horarios de atención para que funcione el calendario público.
                      </AlertDescription>
                    </Alert>
                  )}
                  {businessName && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Negocio</p>
                      <p className="text-xs text-foreground font-semibold">{businessName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Duración de citas</p>
                    <p className="text-xs text-foreground font-semibold">{eventDurationMinutes} minutos</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Zona horaria</p>
                    <p className="text-xs text-foreground font-semibold">{timeZone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Horarios de atención</p>
                    {availability.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-1">Sin horarios configurados</p>
                    ) : (
                      <div className="max-h-[92px] overflow-y-auto custom-scrollbar pr-1">
                        <div className="space-y-1">
                          {availability.map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded-sm border border-border/50 hover-elevate transition-all">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground">{DAYS_OF_WEEK[slot.dayOfWeek]}</p>
                                <p className="text-xs text-muted-foreground">{slot.startTime} - {slot.endTime}</p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteAvailabilityId(slot.id)}
                                className="flex-shrink-0 h-6 w-6"
                                data-testid={`button-delete-availability-${slot.id}`}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Event Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm">Eliminar cita</DialogTitle>
            <DialogDescription className="text-xs">¿Estás seguro de que deseas eliminar esta cita?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={() => {
              if (deleteConfirmId) deleteEventMutation.mutate(deleteConfirmId);
            }}>
              {deleteEventMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Availability Dialog */}
      <Dialog open={deleteAvailabilityId !== null} onOpenChange={() => setDeleteAvailabilityId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm">Eliminar horario</DialogTitle>
            <DialogDescription className="text-xs">¿Estás seguro de que deseas eliminar este horario?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteAvailabilityId(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={() => {
              if (deleteAvailabilityId) deleteAvailabilityMutation.mutate(deleteAvailabilityId);
            }}>
              {deleteAvailabilityMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsForm} onOpenChange={setShowSettingsForm}>
        <DialogContent className="max-w-xs w-[95vw] bg-card border-border">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm">Configuración del calendario</DialogTitle>
            <DialogDescription className="text-xs">Personaliza tu calendario público</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="business-name" className="text-xs font-medium">Nombre de negocio</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Mi negocio"
                className="h-8 text-xs bg-secondary/40 border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="business-desc" className="text-xs font-medium">Descripción</Label>
              <Textarea
                id="business-desc"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Describe tu negocio..."
                className="text-xs h-8 bg-secondary/40 border-border resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration" className="text-xs font-medium">Duración de citas (min)</Label>
              <Input
                id="duration"
                type="number"
                value={eventDurationMinutes}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  // Asegurar que el valor esté entre 15 y 240
                  if (value >= 15 && value <= 240) {
                    setEventDurationMinutes(value);
                  } else if (value < 15) {
                    setEventDurationMinutes(15);
                  } else if (value > 240) {
                    setEventDurationMinutes(240);
                  }
                }}
                min="15"
                max="240"
                className="h-8 text-xs bg-secondary/40 border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone" className="text-xs font-medium">Zona horaria</Label>
              <Select value={timeZone} onValueChange={setTimeZone}>
                <SelectTrigger id="timezone" className="h-8 text-xs bg-secondary/40 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  <SelectItem value="America/Mexico_City">📍 México - America/Mexico_City</SelectItem>
                  <SelectItem value="America/New_York">📍 USA Este - America/New_York</SelectItem>
                  <SelectItem value="America/Los_Angeles">📍 USA Oeste - America/Los_Angeles</SelectItem>
                  <SelectItem value="America/Toronto">📍 Canadá - America/Toronto</SelectItem>
                  <SelectItem value="America/Sao_Paulo">📍 Brasil - America/Sao_Paulo</SelectItem>
                  <SelectItem value="Europe/Madrid">📍 España - Europe/Madrid</SelectItem>
                  <SelectItem value="Europe/London">📍 UK - Europe/London</SelectItem>
                  <SelectItem value="Europe/Paris">📍 Francia - Europe/Paris</SelectItem>
                  <SelectItem value="Europe/Berlin">📍 Alemania - Europe/Berlin</SelectItem>
                  <SelectItem value="Asia/Tokyo">📍 Japón - Asia/Tokyo</SelectItem>
                  <SelectItem value="Asia/Shanghai">📍 China - Asia/Shanghai</SelectItem>
                  <SelectItem value="Asia/Dubai">📍 Emiratos - Asia/Dubai</SelectItem>
                  <SelectItem value="Australia/Sydney">📍 Australia - Australia/Sydney</SelectItem>
                  <SelectItem value="Pacific/Auckland">📍 Nueva Zelanda - Pacific/Auckland</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={`flex items-center justify-between gap-2 p-2.5 border rounded-md transition-all ${
              isPublicBookingEnabled 
                ? "bg-primary/10 border-primary/30" 
                : "bg-secondary/40 border-border"
            }`}>
              <Label htmlFor="public-booking" className="text-xs cursor-pointer font-medium flex-1 text-foreground">{isPublicBookingEnabled ? "Desactivar" : "Activar"} reservas</Label>
              <Switch
                id="public-booking"
                checked={isPublicBookingEnabled}
                onCheckedChange={setIsPublicBookingEnabled}
                data-testid="switch-public-booking"
                className={`flex-shrink-0 ${!isPublicBookingEnabled ? 'data-[state=unchecked]:!bg-red-500' : ''}`}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2 flex flex-col-reverse sm:flex-row">
            <Button variant="ghost" size="sm" onClick={() => setShowSettingsForm(false)} className="h-8 text-xs w-full sm:w-auto">Cancelar</Button>
            <Button
              size="sm"
              onClick={() => updateConfigMutation.mutate()}
              disabled={updateConfigMutation.isPending}
              className="h-8 text-xs w-full sm:w-auto"
            >
              {updateConfigMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={showAvailabilityForm} onOpenChange={setShowAvailabilityForm}>
        <DialogContent className="max-w-xs w-[95vw] sm:max-w-sm bg-card border-border p-4">
          <DialogHeader className="pb-3 space-y-1">
            <DialogTitle className="text-sm">Agregar horario de atención</DialogTitle>
            <DialogDescription className="text-xs">Configura un nuevo horario de disponibilidad</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="day-select" className="text-xs font-medium">Día de la semana</Label>
              <Select value={selectedDayOfWeek} onValueChange={setSelectedDayOfWeek}>
                <SelectTrigger id="day-select" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="start-time" className="text-xs font-medium">Inicio</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 text-xs w-full border-border"
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-time" className="text-xs font-medium">Fin</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 text-xs w-full border-border"
                  data-testid="input-end-time"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-3 flex flex-col-reverse sm:flex-row">
            <Button variant="outline" size="sm" onClick={() => setShowAvailabilityForm(false)} className="h-8 text-xs w-full sm:w-auto">Cancelar</Button>
            <Button
              size="sm"
              onClick={() => createAvailabilityMutation.mutate()}
              disabled={createAvailabilityMutation.isPending}
              className="h-8 text-xs w-full sm:w-auto"
              data-testid="button-add-availability"
            >
              {createAvailabilityMutation.isPending ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Action Dialog - View or Create Event */}
      <Dialog open={dateActionMode !== null} onOpenChange={() => setDateActionMode(null)}>
        <DialogContent className="max-w-xs p-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm">¿Qué deseas hacer?</DialogTitle>
            <DialogDescription className="text-xs">
              {selectedDate?.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                setDateActionMode(null);
              }}
              className="h-8 justify-start text-xs"
            >
              <Eye className="w-3 h-3 mr-1.5" />
              Ver citas
            </Button>
            {selectedDateHasAvailability && (
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedDate) {
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    setEventDate(`${year}-${month}-${day}`);
                    // Sincronizar mini calendario con la fecha seleccionada
                    setCalendarMonth(selectedDate.getMonth());
                    setCalendarYear(selectedDate.getFullYear());
                    const now = new Date();
                    setEventTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
                    setTitle("");
                    setDescription("");
                    setContactName("");
                    setContactPhone("");
                    setDateActionMode(null);
                    setShowNewForm(true);
                  }
                }}
                className="h-8 justify-start text-xs"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                Crear cita
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Event Dialog - COMPLETELY UPDATED */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="w-[95vw] sm:max-w-sm bg-card border-border p-0 flex flex-col max-h-[90vh] sm:max-h-screen">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle>{editingEventId ? "Editar cita" : "Nueva cita"}</DialogTitle>
            <DialogDescription>{editingEventId ? "Actualiza los detalles de tu cita" : "Crea una nueva cita en tu calendario"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 px-4 py-4">
            <div>
              <Label htmlFor="title" className="text-xs">Título de la cita *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Consulta con cliente"
                className="mt-1.5 text-xs h-8"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-xs">Fecha *</Label>
              
              {/* Mini Calendar */}
              <div className="border border-border rounded-lg bg-secondary/20 p-3">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(calendarYear - 1);
                      } else {
                        setCalendarMonth(calendarMonth - 1);
                      }
                    }}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <p className="text-xs font-semibold text-foreground">
                    {new Date(calendarYear, calendarMonth).toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase()}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(calendarYear + 1);
                      } else {
                        setCalendarMonth(calendarMonth + 1);
                      }
                    }}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                    <div key={day} className="text-center text-[9px] font-semibold text-muted-foreground py-0.5">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {(() => {
                    const firstDay = new Date(calendarYear, calendarMonth, 1);
                    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                    const startingDayOfWeek = firstDay.getDay();
                    const days = [];

                    // Empty cells for days before month starts
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(null);
                    }

                    // Days of month
                    for (let i = 1; i <= daysInMonth; i++) {
                      days.push(new Date(calendarYear, calendarMonth, i));
                    }

                    return days.map((date, idx) => {
                      if (!date) {
                        return <div key={`empty-${idx}`} />;
                      }

                      const dayOfWeek = date.getDay();
                      const hasAvailability = availability.some((a) => a.dayOfWeek === dayOfWeek && a.isActive);
                      
                      // Check if date is in the past - compare dates without time
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dateForComparison = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      dateForComparison.setHours(0, 0, 0, 0);
                      const isPast = dateForComparison < today;
                      
                      // Comparar fechas de forma robusta sin UTC
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                      const isSelected = eventDate === dateStr;
                      const isToday = date.toDateString() === new Date().toDateString();

                      return (
                        <button
                          key={`day-${idx}`}
                          onClick={() => {
                            if (isPast) {
                              toast({ title: "Error", description: "No puedes agendar en días pasados", variant: "destructive" });
                              return;
                            }
                            if (!hasAvailability) {
                              toast({ title: "Error", description: `No hay disponibilidad los ${["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][dayOfWeek]}`, variant: "destructive" });
                              return;
                            }
                            setEventDate(dateStr);
                            setSelectedDate(date);
                          }}
                          disabled={isPast || !hasAvailability}
                          className={`
                            w-full aspect-square p-1 rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center justify-center relative border
                            ${isPast ? "bg-background text-muted-foreground cursor-not-allowed opacity-40 border-border/30" : !hasAvailability ? "bg-background text-muted-foreground cursor-not-allowed border-border/30" : isSelected ? "bg-primary text-primary-foreground border-primary" : isToday ? "bg-background border-primary/60 text-foreground" : "bg-background border-border/50 text-foreground hover:border-border/70"}
                          `}
                        >
                          <span>{date.getDate()}</span>
                          {!isPast && (
                            <div>
                              {hasAvailability ? (
                                <CheckCircle2 className={`w-2 h-2 ${isSelected ? "text-white" : "text-primary"}`} />
                              ) : (
                                <XCircle className={`w-2 h-2 ${isSelected ? "text-white" : "text-muted-foreground/60"}`} />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {eventDate && availableTimesForSelectedDate.length === 0 && (
                <p className="text-xs text-destructive">No hay horarios disponibles este día</p>
              )}
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/30 text-foreground mt-3">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <AlertDescription className="text-xs">
                <span className="font-semibold text-blue-500 mr-2">Indicadores de disponibilidad:</span>
                <span className="flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-primary" /> = Disponible para agendar citas
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-muted-foreground/60" /> = No disponible
                </span>
              </AlertDescription>
            </Alert>

            {availability.length === 0 && (
              <Alert className="bg-blue-500/10 border-blue-500/30 py-2">
                <AlertCircle className="h-3 w-3 text-blue-500" />
                <AlertDescription className="text-xs text-foreground ml-2">
                  Para seleccionar más días, configura tu horario de funcionamiento en la sección de <span className="font-semibold">Configuración del calendario</span>.
                </AlertDescription>
              </Alert>
            )}

            {eventDate && availableTimesForSelectedDate.length > 0 && (
              <div className="space-y-3">
                <Label htmlFor="event-time" className="text-xs font-medium">Hora *</Label>
                <div className="border border-border rounded-md bg-secondary/20 px-2 py-2 overflow-x-auto">
                  <div className="flex gap-1.5 min-w-min">
                    {availableTimesForSelectedDate.map((time) => (
                      <Badge
                        key={time}
                        variant={eventTime === time ? "default" : "outline"}
                        className={`text-xs px-2 py-0.5 cursor-pointer hover-elevate whitespace-nowrap ${eventTime === time ? 'bg-primary text-primary-foreground' : ''}`}
                        onClick={() => setEventTime(time)}
                        data-testid={`badge-time-${time}`}
                      >
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="description" className="text-xs">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles adicionales..."
                className="mt-1.5 text-xs h-16 bg-secondary/40 border-border"
                rows={2}
              />
            </div>

            {/* Client/Contact Info - Card Style */}
            <div className="p-3 bg-secondary/20 border border-border rounded-lg space-y-3">
              <p className="text-xs text-muted-foreground font-medium">Información de contacto (opcional)</p>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    placeholder="Nombre"
                    value={contactName.split(" ")[0] || ""}
                    onChange={(e) => {
                      const parts = contactName.split(" ");
                      setContactName(`${e.target.value} ${parts.slice(1).join(" ")}`.trim());
                    }}
                    className="text-xs h-8 bg-secondary/40 border-border"
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Apellido"
                    value={contactName.split(" ").slice(1).join(" ") || ""}
                    onChange={(e) => {
                      const firstName = contactName.split(" ")[0];
                      setContactName(`${firstName} ${e.target.value}`.trim());
                    }}
                    className="text-xs h-8 bg-secondary/40 border-border"
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <Input
                type="email"
                placeholder="Email (opcional)"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                className="text-xs h-8 bg-secondary/40 border-border"
                data-testid="input-contact-email"
              />

              <div>
                <Label className="text-xs font-medium mb-1.5 block">WhatsApp (opcional)</Label>
                <div className="flex gap-1">
                  {/* Selector de país personalizado */}
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
                        setWhatsappValidation(validateWhatsAppNumber(value, whatsappCode) ? "valid" : "invalid");
                      } else {
                        setWhatsappValidation(null);
                      }
                    }}
                    placeholder="Número"
                    className="flex-1 text-xs h-8 bg-secondary/40 border-border"
                    data-testid="input-whatsapp-number"
                  />
                </div>
                {whatsappValidation === "invalid" && (
                  <p className="text-xs text-destructive mt-1">Número inválido</p>
                )}
                {whatsappValidation === "valid" && (
                  <p className="text-xs text-green-500 mt-1">✓ Válido</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="px-4 py-4 border-t border-border flex-shrink-0">
            <Button size="sm" variant="ghost" onClick={() => setShowNewForm(false)} className="h-8 text-xs">Cancelar</Button>
            <Button
              size="sm"
              onClick={handleCreateEvent}
              disabled={createEventMutation.isPending}
              className="h-8 text-xs"
            >
              {createEventMutation.isPending ? (editingEventId ? "Actualizando..." : "Creando...") : (editingEventId ? "Actualizar" : "Crear")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
