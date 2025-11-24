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
import { Plus, ChevronLeft, ChevronRight, X, Trash2, AlertCircle, CheckCircle2, Calendar as CalendarIcon, Clock, XCircle, AlertOctagon, Inbox, Phone, User, Copy, Share2, Settings, Zap, AlertTriangle, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { CalendarEvent, CalendarAvailability, CalendarConfig } from "@shared/schema";

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
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteAvailabilityId, setDeleteAvailabilityId] = useState<string | null>(null);
  
  // Client/Lead selection state
  const [clientIdSelected, setClientIdSelected] = useState<string>("");
  const [leadIdSelected, setLeadIdSelected] = useState<string>("");
  const [clientMode, setClientMode] = useState<"search" | "manual" | "create">("search"); // search, manual, create
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientType, setSelectedClientType] = useState<"client" | "lead">("client");
  
  // Settings form state
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [eventDurationMinutes, setEventDurationMinutes] = useState(60);
  const [isPublicBookingEnabled, setIsPublicBookingEnabled] = useState(true);

  // Availability form state
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

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

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error creando evento");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar", userId] });
      resetForm();
      setShowNewForm(false);
      setSelectedDate(null);
      toast({ title: "Cita agendada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando evento");
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
    setEventDate("");
    setEventTime("09:00");
    setClientIdSelected("");
    setLeadIdSelected("");
    setClientMode("search");
    setClientSearch("");
    setSelectedClientType("client");
  };

  const handleCreateEvent = () => {
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

    createEventMutation.mutate({ 
      title, 
      description, 
      contactName, 
      contactPhone,
      clientId: clientIdSelected || undefined,
      leadId: leadIdSelected || undefined
    });
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
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border border-border/40 rounded-md">
                <Label htmlFor="calendar-toggle" className="text-xs font-semibold cursor-pointer">
                  {isCalendarActive ? "Activo" : "Inactivo"}
                </Label>
                <Switch
                  id="calendar-toggle"
                  checked={isCalendarActive}
                  onCheckedChange={(checked) => updateCalendarStatusMutation.mutate(checked)}
                  data-testid="switch-calendar-active"
                  disabled={updateCalendarStatusMutation.isPending}
                />
              </div>
              <Button onClick={() => setShowSettingsForm(true)} size="sm" variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Configurar</span>
              </Button>
              <Button onClick={() => {
                setEventDate("");
                setEventTime("09:00");
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

      <div className="flex-1 px-4 py-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarDays.map((date, idx) => {
                      const dayEvents = date ? getEventsForDate(date) : [];
                      const isToday = date && date.toDateString() === new Date().toDateString();
                      const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
                      const hasAvailability = date && availability.some(a => a.dayOfWeek === date.getDay() && a.isActive);

                      return (
                        <div key={idx}>
                          {date ? (
                            <button
                              onClick={() => {
                                setSelectedDate(date);
                                // Pre-fill the event date and open modal
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                setEventDate(`${year}-${month}-${day}`);
                                setEventTime("09:00");
                                setTitle("");
                                setDescription("");
                                setContactName("");
                                setContactPhone("");
                                setShowNewForm(true);
                              }}
                              data-testid={`day-${date.getDate()}`}
                              className={`
                                w-full p-2 rounded-lg text-sm font-medium
                                transition-all duration-200 flex flex-col items-start justify-start gap-1 h-24 overflow-hidden
                                relative
                                ${isToday
                                  ? "bg-primary/20 text-primary-foreground border border-primary/50"
                                  : isSelected
                                    ? "bg-primary/30 border-2 border-primary"
                                    : "bg-secondary/40 border border-border/60 hover-elevate"
                                }
                              `}
                            >
                              <span className="text-xs font-semibold w-full text-foreground">{date.getDate()}</span>
                              {hasAvailability && !isToday && !isSelected && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" title="Horarios disponibles"></div>
                              )}
                              <div className="w-full space-y-1">
                                {dayEvents.slice(0, 2).map((event) => (
                                  <div key={event.id} className="w-full">
                                    <div className="w-full text-xs bg-primary/70 text-primary-foreground rounded-md px-2 py-1 truncate font-medium">
                                      {event.title}
                                    </div>
                                  </div>
                                ))}
                                {dayEvents.length > 2 && (
                                  <div className="w-full text-xs text-muted-foreground px-2 py-0.5 font-medium">
                                    +{dayEvents.length - 2}
                                  </div>
                                )}
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
            </div>

            <div className="space-y-4">
              {selectedDate ? (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <Badge variant="outline" className="w-fit text-xs bg-secondary/50 text-foreground border-border/60">
                      {selectedDate.toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedDateEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <Inbox className="w-8 h-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground text-center">Sin eventos este día</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDateEvents.map((event) => (
                          <Card key={event.id} className="bg-secondary/40 border-border/60">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-xs flex-1">{event.title}</h4>
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
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">Haz click en un día para ver eventos</p>
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
                  <CardContent className="space-y-2">
                    <div className="text-xs text-muted-foreground">Comparte este enlace para que tus clientes agenderen citas:</div>
                    <div className="flex items-center gap-2 bg-secondary/40 border border-border/60 rounded-lg p-2">
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
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
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
                    <p className="text-xs font-medium text-muted-foreground mb-2">Horarios de atención</p>
                    {availability.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Sin horarios configurados</p>
                    ) : (
                      <div className="space-y-2">
                        {availability.map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between gap-2 p-2 bg-secondary/40 rounded-lg border border-border/60">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-foreground">{DAYS_OF_WEEK[slot.dayOfWeek]}</p>
                              <p className="text-xs text-muted-foreground">{slot.startTime} - {slot.endTime}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteAvailabilityId(slot.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cita</DialogTitle>
            <DialogDescription>¿Estás seguro de que deseas eliminar esta cita?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (deleteConfirmId) deleteEventMutation.mutate(deleteConfirmId);
            }}>
              {deleteEventMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Availability Dialog */}
      <Dialog open={deleteAvailabilityId !== null} onOpenChange={() => setDeleteAvailabilityId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar horario</DialogTitle>
            <DialogDescription>¿Estás seguro de que deseas eliminar este horario de atención?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteAvailabilityId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
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
                ? "bg-secondary/20 border-border" 
                : "bg-red-500/10 border-red-500/30"
            }`}>
              <Label htmlFor="public-booking" className={`text-xs cursor-pointer font-medium ${
                isPublicBookingEnabled 
                  ? "text-foreground" 
                  : "text-red-500"
              }`}>Habilitar reservas públicas</Label>
              <div className={`${isPublicBookingEnabled ? "" : "[&>button]:bg-red-500"}`}>
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

      {/* New Event Dialog - COMPLETELY UPDATED */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva cita</DialogTitle>
            <DialogDescription>Crea una nueva cita en tu calendario</DialogDescription>
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
            
            <div>
              <Label htmlFor="event-date" className="text-xs">Fecha *</Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => {
                  setEventDate(e.target.value);
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split("-");
                    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                    setSelectedDate(date);
                  }
                }}
                className="mt-1.5 text-xs h-8"
              />
              {eventDate && availableTimesForSelectedDate.length === 0 && (
                <p className="text-xs text-destructive mt-1">No hay horarios disponibles este día</p>
              )}
            </div>

            {eventDate && availableTimesForSelectedDate.length > 0 && (
              <div>
                <Label htmlFor="event-time" className="text-xs">Hora *</Label>
                <Select value={eventTime} onValueChange={setEventTime}>
                  <SelectTrigger id="event-time" className="mt-1.5 h-8 text-xs">
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimesForSelectedDate.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="description" className="text-xs">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles adicionales..."
                className="mt-1.5 text-xs h-16"
                rows={2}
              />
            </div>

            {/* Client/Lead Selection */}
            <div className="space-y-2">
              <Label className="text-xs">Cliente / Lead (opcional)</Label>
              <Select value={clientMode} onValueChange={(value: any) => setClientMode(value)}>
                <SelectTrigger className="h-8 text-xs">
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
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={selectedClientType} onValueChange={(value: any) => setSelectedClientType(value)}>
                    <SelectTrigger className="h-8 text-xs w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Clientes</SelectItem>
                      <SelectItem value="lead">Leads</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Buscar..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="flex-1 text-xs h-8"
                  />
                </div>
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                  {selectedClientType === "client" ? (
                    clients.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                      <p className="p-2 text-xs text-muted-foreground">No hay clientes</p>
                    ) : (
                      clients.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                        <div key={c.id} className="p-2 border-b border-border last:border-b-0 hover:bg-secondary/20 cursor-pointer text-xs" onClick={() => {
                          setClientIdSelected(c.id);
                          setLeadIdSelected("");
                          setContactName(`${c.firstName} ${c.lastName}`);
                          setContactPhone(c.phone || "");
                        }}>
                          <p className="font-medium">{c.firstName} {c.lastName}</p>
                          {c.phone && <p className="text-muted-foreground">{c.phone}</p>}
                        </div>
                      ))
                    )
                  ) : (
                    leads.filter(l => `${l.firstName} ${l.lastName}`.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                      <p className="p-2 text-xs text-muted-foreground">No hay leads</p>
                    ) : (
                      leads.filter(l => `${l.firstName} ${l.lastName}`.toLowerCase().includes(clientSearch.toLowerCase())).map(l => (
                        <div key={l.id} className="p-2 border-b border-border last:border-b-0 hover:bg-secondary/20 cursor-pointer text-xs" onClick={() => {
                          setClientIdSelected("");
                          setLeadIdSelected(l.id);
                          setContactName(`${l.firstName} ${l.lastName}`);
                          setContactPhone(l.phone || "");
                        }}>
                          <p className="font-medium">{l.firstName} {l.lastName}</p>
                          {l.phone && <p className="text-muted-foreground">{l.phone}</p>}
                        </div>
                      ))
                    )
                  )}
                </div>
                {(clientIdSelected || leadIdSelected) && (
                  <p className="text-xs text-primary">✓ {clientIdSelected ? "Cliente" : "Lead"} seleccionado</p>
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
                    className="mt-1.5 text-xs h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-phone" className="text-xs">Teléfono WhatsApp</Label>
                  <Input
                    id="manual-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Ej: +1234567890"
                    className="mt-1.5 text-xs h-8"
                  />
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
                    onChange={(e) => setContactName(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Input
                    placeholder="Apellido"
                    value={contactName.split(" ").slice(1).join(" ") || ""}
                    onChange={(e) => setContactName(`${contactName.split(" ")[0]} ${e.target.value}`.trim())}
                    className="text-xs h-8"
                  />
                </div>
                <Input
                  placeholder="Email"
                  type="email"
                  className="text-xs h-8"
                />
                <Input
                  placeholder="Teléfono"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="text-xs h-8"
                />
                <Select defaultValue="client">
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Crear como Cliente</SelectItem>
                    <SelectItem value="lead">Crear como Lead</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground italic">Se guardará al crear la cita</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewForm(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateEvent}
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
