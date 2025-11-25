import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Plus, ChevronLeft, ChevronRight, X, Trash2, AlertCircle, CheckCircle2, Calendar as CalendarIcon, Clock, XCircle, AlertOctagon, Inbox, Phone, User, Copy, Share2, Settings, Zap, AlertTriangle, Search, Eye, Edit3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
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

  // Availability form state
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  
  // Calendar picker state for event creation
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

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
    }
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
    }
  }, [calendarConfig]);

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!eventDate || !eventTime) {
        throw new Error("Fecha y hora requeridas");
      }
      const [year, month, day] = eventDate.split("-");
      const [hours, minutes] = eventTime.split(":");
      
      const startDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
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
      toast({ title: editingEventId ? "Cita actualizada" : "Cita agendada exitosamente" });
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
      toast({ title: "Cita eliminada" });
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
        title: data.isActive ? "Calendario activado" : "Calendario desactivado",
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
        }),
      });
      if (!response.ok) throw new Error("Error actualizando configuración");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/config", userId] });
      setShowSettingsForm(false);
      toast({ title: "Configuración actualizada" });
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
      toast({ title: "Horario de atención agregado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/calendar/availability/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando disponibilidad");
      return response.json();
    },
    onSuccess: () => {
      setDeleteAvailabilityId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/availability", userId] });
      toast({ title: "Horario eliminado" });
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
  };

  const handleEditEvent = (event: any) => {
    setTitle(event.title);
    setDescription(event.description || "");
    setContactName(event.contactName || "");
    setContactPhone(event.contactPhone || "");
    setEditingEventId(event.id);
    
    const startDate = new Date(event.startTime);
    setEventDate(`${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`);
    setEventTime(`${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`);
    
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
    
    // Validate availability for selected time
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
        
        toast({ title: `${newClientType === "client" ? "Cliente" : "Lead"} creado exitosamente` });
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
        const timeStr = `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`;
        
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
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-xs font-bold text-muted-foreground/80 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, idx) => {
                      const dayEvents = date ? getEventsForDate(date) : [];
                      const isToday = date && date.toDateString() === new Date().toDateString();
                      const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
                      const hasAvailability = date ? availability.some(a => a.dayOfWeek === date.getDay() && a.isActive) : false;

                      return (
                        <div key={idx}>
                          {date ? (
                            <button
                              onClick={() => {
                                setSelectedDate(date);
                                setSelectedDateHasAvailability(hasAvailability);
                                setDateActionMode("view");
                              }}
                              data-testid={`day-${date.getDate()}`}
                              className={`
                                w-full p-0.5 rounded text-xs font-medium
                                transition-all duration-200 flex flex-col items-start justify-start gap-0.5 h-10 overflow-hidden
                                relative
                                ${isToday
                                  ? "bg-primary/20 text-primary-foreground border border-primary/50"
                                  : isSelected
                                    ? "bg-primary/30 border-2 border-primary"
                                    : "bg-secondary/40 border border-border/60 hover-elevate"
                                }
                              `}
                            >
                              <div className="flex items-center justify-between w-full flex-shrink-0">
                                <span className="text-xs font-semibold text-foreground">{date.getDate()}</span>
                                <div className="absolute top-0.5 right-0.5">
                                  {hasAvailability ? (
                                    <CheckCircle2 className="w-2.5 h-2.5 text-primary" />
                                  ) : (
                                    <XCircle className="w-2.5 h-2.5 text-muted-foreground/60" />
                                  )}
                                </div>
                              </div>
                              <div className="w-full space-y-0.5 overflow-y-auto max-h-6">
                                {dayEvents.map((event: any) => (
                                  <div key={event.id} className="w-full">
                                    <div className={`w-full text-xs rounded px-1 py-0 truncate font-medium whitespace-nowrap flex items-center gap-1 ${
                                      event.isPublicBooking 
                                        ? "bg-cyan-500/70 text-cyan-50" 
                                        : "bg-primary/70 text-primary-foreground"
                                    }`}>
                                      {event.isPublicBooking && (
                                        <svg className="w-2.5 h-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
                      <div className="space-y-1.5">
                        {selectedDateEvents.map((event: any) => (
                          <Card key={event.id} className={`border-border/60 ${
                            event.isPublicBooking 
                              ? "bg-cyan-500/20 border border-cyan-500/30" 
                              : "bg-secondary/40"
                          }`}>
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 flex-1">
                                  {event.isPublicBooking && (
                                    <svg className="w-3 h-3 flex-shrink-0 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 10a2 2 0 104 0 2 2 0 00-4 0z" />
                                    </svg>
                                  )}
                                  <h4 className="font-semibold text-xs">{event.title}</h4>
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
              {publicUrl && availability.length > 0 ? (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Enlace público
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs text-muted-foreground">Comparte este enlace para que tus clientes agenderen citas:</div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-border/60 rounded-lg p-2">
                      <input
                        type="text"
                        value={publicUrl}
                        readOnly
                        className="text-xs bg-transparent flex-1 outline-none text-foreground truncate"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(publicUrl);
                          toast({ title: "Enlace copiado" });
                          fetch(`/api/calendar/stats/share/${calendarConfig?.publicShareToken}`, { method: "POST" });
                        }}
                        className="h-6 w-6 p-0"
                        data-testid="button-copy-link"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    {linkStats && (
                      <div className="flex gap-2 pt-2 border-t border-border/30 flex-wrap">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración del calendario</DialogTitle>
            <DialogDescription>Personaliza cómo funciona tu calendario público</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="business-name" className="text-xs">Nombre de negocio</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Mi negocio"
                className="mt-1.5 text-xs h-8"
              />
            </div>
            <div>
              <Label htmlFor="business-desc" className="text-xs">Descripción</Label>
              <Textarea
                id="business-desc"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Describe tu negocio..."
                className="mt-1.5 text-xs h-20"
              />
            </div>
            <div>
              <Label htmlFor="duration" className="text-xs">Duración de citas (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={eventDurationMinutes}
                onChange={(e) => setEventDurationMinutes(parseInt(e.target.value))}
                min="15"
                max="240"
                className="mt-1.5 text-xs h-8"
              />
            </div>
            <div className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
              isPublicBookingEnabled 
                ? "bg-primary/10 border-primary/30" 
                : "bg-red-500/10 border-red-500/30"
            }`}>
              <Label htmlFor="public-booking" className={`text-xs cursor-pointer font-medium ${
                isPublicBookingEnabled 
                  ? "text-foreground" 
                  : "text-red-500"
              }`}>{isPublicBookingEnabled ? "Desactivar" : "Activar"} reservas públicas</Label>
              <div className={`${isPublicBookingEnabled ? "" : "[&>button]:!bg-red-500 [&>button]:border-red-500"}`}>
                <Switch
                  id="public-booking"
                  checked={isPublicBookingEnabled}
                  onCheckedChange={setIsPublicBookingEnabled}
                  data-testid="switch-public-booking"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSettingsForm(false)}>Cancelar</Button>
            <Button
              onClick={() => updateConfigMutation.mutate()}
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={showAvailabilityForm} onOpenChange={setShowAvailabilityForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar horario de atención</DialogTitle>
            <DialogDescription>Configura un nuevo horario de disponibilidad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="day-select" className="text-xs">Día de la semana</Label>
              <Select value={selectedDayOfWeek} onValueChange={setSelectedDayOfWeek}>
                <SelectTrigger id="day-select" className="mt-1.5 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start-time" className="text-xs">Inicio</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1.5 text-xs h-8"
                />
              </div>
              <div>
                <Label htmlFor="end-time" className="text-xs">Fin</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1.5 text-xs h-8"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAvailabilityForm(false)}>Cancelar</Button>
            <Button
              onClick={() => createAvailabilityMutation.mutate()}
              disabled={createAvailabilityMutation.isPending}
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEventId ? "Editar cita" : "Nueva cita"}</DialogTitle>
            <DialogDescription>{editingEventId ? "Actualiza los detalles de tu cita" : "Crea una nueva cita en tu calendario"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
              <div className="border border-border rounded-lg bg-secondary/20 p-3 space-y-3">
                {/* Month Navigation */}
                <div className="flex items-center justify-between">
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
                <div className="grid grid-cols-7 gap-1">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
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
                      const isPast = date < new Date() && date.toDateString() !== new Date().toDateString();
                      const isSelected = eventDate === date.toISOString().split("T")[0];
                      const isToday = date.toDateString() === new Date().toDateString();

                      return (
                        <button
                          key={`day-${idx}`}
                          onClick={() => {
                            if (!isPast && hasAvailability) {
                              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                              setEventDate(dateStr);
                              setSelectedDate(date);
                            }
                          }}
                          disabled={isPast || !hasAvailability}
                          className={`
                            w-full p-1.5 rounded text-xs font-medium transition-all cursor-pointer flex items-center justify-between relative
                            ${isPast ? "bg-muted/40 text-muted-foreground cursor-not-allowed opacity-50" : !hasAvailability ? "bg-secondary/20 text-muted-foreground cursor-not-allowed" : isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/50 border border-primary/70 text-foreground" : "bg-primary/35 border border-primary/50 text-foreground hover:bg-primary/45"}
                          `}
                        >
                          <span>{date.getDate()}</span>
                          {!isPast && (
                            <div>
                              {hasAvailability ? (
                                <CheckCircle2 className={`w-2.5 h-2.5 ${isSelected ? "text-white" : "text-primary"}`} />
                              ) : (
                                <XCircle className={`w-2.5 h-2.5 ${isSelected ? "text-white" : "text-muted-foreground/60"}`} />
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
              <div className="space-y-2">
                <Label htmlFor="event-time" className="text-xs">Hora *</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="mt-1.5 text-xs h-8 bg-secondary/40 border-border"
                />
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground mb-1">Disponibles: {availableTimesForSelectedDate.length} horas</p>
                  <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar max-w-[110px]">
                    {availableTimesForSelectedDate.map((time) => (
                      <Badge
                        key={time}
                        variant="outline"
                        className="text-xs px-1.5 py-0.5 cursor-pointer hover-elevate flex-shrink-0"
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

            {/* Client/Lead Selection */}
            <div className="space-y-2">
              <Label className="text-xs">Cliente / Lead (opcional)</Label>
              <Select value={clientMode} onValueChange={(value: any) => setClientMode(value)}>
                <SelectTrigger className="h-8 text-xs bg-secondary/40 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="search">Seleccionar existente</SelectItem>
                  <SelectItem value="manual">Solo nombre manual</SelectItem>
                  <SelectItem value="create">Crear nuevo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search existing client/lead */}
            {clientMode === "search" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tipo</Label>
                  <Select value={selectedClientType} onValueChange={(value: any) => setSelectedClientType(value)}>
                    <SelectTrigger className="h-8 text-xs w-full bg-secondary/40 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Clientes</SelectItem>
                      <SelectItem value="lead">Leads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Buscar</Label>
                  <Input
                    placeholder={`Buscar ${selectedClientType === 'client' ? 'clientes' : 'leads'}...`}
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="text-xs h-8 bg-secondary/40 border-border"
                  />
                </div>

                <div className="border border-border rounded-lg bg-secondary/20 max-h-48 overflow-y-auto">
                  {selectedClientType === "client" ? (
                    clients.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                      <p className="p-3 text-xs text-muted-foreground text-center">No hay clientes</p>
                    ) : (
                      clients.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                        <div key={c.id} className="p-3 border-b border-border/50 last:border-b-0 hover:bg-secondary/40 cursor-pointer text-xs transition-colors" onClick={() => {
                          setClientIdSelected(c.id);
                          setLeadIdSelected("");
                          setContactName(`${c.firstName} ${c.lastName}`);
                          setContactPhone(c.phone || "");
                        }}>
                          <p className="font-semibold text-foreground">{c.firstName} {c.lastName}</p>
                          {c.phone && <p className="text-muted-foreground text-xs mt-0.5">{c.phone}</p>}
                        </div>
                      ))
                    )
                  ) : (
                    leads.filter(l => `${l.firstName} ${l.lastName}`.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                      <p className="p-3 text-xs text-muted-foreground text-center">No hay leads</p>
                    ) : (
                      leads.filter(l => `${l.firstName} ${l.lastName}`.toLowerCase().includes(clientSearch.toLowerCase())).map(l => (
                        <div key={l.id} className="p-3 border-b border-border/50 last:border-b-0 hover:bg-secondary/40 cursor-pointer text-xs transition-colors" onClick={() => {
                          setClientIdSelected("");
                          setLeadIdSelected(l.id);
                          setContactName(`${l.firstName} ${l.lastName}`);
                          setContactPhone(l.phone || "");
                        }}>
                          <p className="font-semibold text-foreground">{l.firstName} {l.lastName}</p>
                          {l.phone && <p className="text-muted-foreground text-xs mt-0.5">{l.phone}</p>}
                        </div>
                      ))
                    )
                  )}
                </div>
                {(clientIdSelected || leadIdSelected) && (
                  <div className="p-2 bg-primary/10 border border-primary/30 rounded text-xs text-primary font-medium">
                    ✓ {clientIdSelected ? "Cliente" : "Lead"} seleccionado
                  </div>
                )}
              </div>
            )}

            {/* Manual name entry */}
            {clientMode === "manual" && (
              <>
                <div>
                  <Label htmlFor="manual-name" className="text-xs">Nombre del cliente</Label>
                  <Input
                    id="manual-name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nombre completo"
                    className="mt-1.5 text-xs h-8 bg-secondary/40 border-border"
                  />
                </div>
                <div>
                  <Label className="text-xs">WhatsApp</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Select value={whatsappCode} onValueChange={setWhatsappCode}>
                      <SelectTrigger className="h-8 text-xs bg-secondary/40 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COUNTRY_CODES).map(([code, format]) => (
                          <SelectItem key={code} value={code} className="text-xs">
                            {format.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      className="col-span-2 text-xs h-8 bg-secondary/40 border-border"
                    />
                  </div>
                  {whatsappValidation === "invalid" && (
                    <p className="text-xs text-destructive mt-1">Número inválido</p>
                  )}
                  {whatsappValidation === "valid" && (
                    <p className="text-xs text-green-500 mt-1">✓ Válido</p>
                  )}
                </div>
              </>
            )}

            {/* Create new client/lead inline */}
            {clientMode === "create" && (
              <div className="p-3 bg-secondary/20 border border-border rounded-lg space-y-3">
                <p className="text-xs text-muted-foreground mb-2">Crear cliente o lead directamente</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nombre"
                    value={contactName.split(" ")[0] || ""}
                    onChange={(e) => {
                      const parts = contactName.split(" ");
                      setContactName(`${e.target.value} ${parts.slice(1).join(" ")}`.trim());
                    }}
                    className="text-xs h-8 bg-secondary/40 border-border"
                  />
                  <Input
                    placeholder="Apellido"
                    value={contactName.split(" ").slice(1).join(" ") || ""}
                    onChange={(e) => {
                      const firstName = contactName.split(" ")[0];
                      setContactName(`${firstName} ${e.target.value}`.trim());
                    }}
                    className="text-xs h-8 bg-secondary/40 border-border"
                  />
                </div>
                <Input
                  placeholder="Email (opcional)"
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="text-xs h-8 bg-secondary/40 border-border"
                />
                <div>
                  <Label className="text-xs">WhatsApp</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Select value={whatsappCode} onValueChange={setWhatsappCode}>
                      <SelectTrigger className="h-8 text-xs bg-secondary/40 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COUNTRY_CODES).map(([code, format]) => (
                          <SelectItem key={code} value={code} className="text-xs">
                            {format.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      className="col-span-2 text-xs h-8 bg-secondary/40 border-border"
                    />
                  </div>
                  {whatsappValidation === "invalid" && (
                    <p className="text-xs text-destructive mt-1">Número inválido</p>
                  )}
                  {whatsappValidation === "valid" && (
                    <p className="text-xs text-green-500 mt-1">✓ Válido</p>
                  )}
                </div>
                <Select value={newClientType} onValueChange={(value: any) => setNewClientType(value)}>
                  <SelectTrigger className="h-8 text-xs bg-secondary/40 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Crear como Cliente</SelectItem>
                    <SelectItem value="lead">Crear como Lead</SelectItem>
                  </SelectContent>
                </Select>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">Se guardará automáticamente en el CRM al crear la cita</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewForm(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateEvent}
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? (editingEventId ? "Actualizando..." : "Creando...") : (editingEventId ? "Actualizar" : "Crear")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
