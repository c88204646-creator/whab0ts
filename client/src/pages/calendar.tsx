import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronLeft, ChevronRight, X, Trash2, AlertCircle, CheckCircle2, Calendar as CalendarIcon, Clock, XCircle, AlertOctagon, Inbox } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { CalendarEvent } from "@shared/schema";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

export default function CalendarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isCalendarActive, setIsCalendarActive] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    } else {
      // Fallback for testing - use default user ID
      setUserId("3a4189a2-1f3c-430f-b3c5-c63521fc7a61");
    }
  }, []);

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar", userId],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/calendar/${userId}`);
      if (!response.ok) throw new Error("Error fetching events");
      return response.json();
    }
  });


  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const [year, month, day] = eventDate.split("-");
      const startDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 9, 0);
      const endDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 10, 0);

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
      queryClient.invalidateQueries({ queryKey: ["/api/calendar", userId] });
      queryClient.refetchQueries({ queryKey: ["/api/calendar", userId] });
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
        description: data.isActive ? "El calendario está activo" : "El calendario está pausado",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
  };

  const handleCreateEvent = () => {
    if (!title.trim() || !eventDate) {
      toast({ title: "Error", description: "Completa el título y la fecha", variant: "destructive" });
      return;
    }

    createEventMutation.mutate({
      title,
      description,
    });
  };

  // Calendar grid generation
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

  const hasEventOnDate = (date: Date) => {
    if (!date) return false;
    return events.some((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const monthName = new Date(year, month).toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDayDoubleClick = (date: Date) => {
    setSelectedDate(date);
    // Poner la fecha seleccionada
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    setEventDate(`${year}-${month}-${day}`);
    setStartHour("09");
    setStartMinute("00");
    setEndHour("10");
    setEndMinute("00");
    setShowNewForm(true);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-foreground">Citas</h1>
                    <p className="text-xs text-muted-foreground">Crear y gestionar citas</p>
                  </div>
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
                <Button onClick={() => {
                  // Mostrar fecha actual por defecto
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, "0");
                  const day = String(today.getDate()).padStart(2, "0");
                  setEventDate(`${year}-${month}-${day}`);
                  setShowNewForm(true);
                }} data-testid="button-add-event" size="sm" className="gap-2 h-9">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nueva cita</span>
                </Button>
              </div>
            </div>

            {/* Alert Banner */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-foreground">Gestiona tus citas de forma eficiente</p>
              <p className="text-xs text-foreground/70 mt-0.5">Crea citas con validación de WhatsApp y mantén el seguimiento de todas tus reuniones programadas</p>
            </div>

            <div className="space-y-3">
              {events.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="Total" value={events.length} icon={CalendarIcon} />
                  <StatCard label="Próximas" value={events.filter((e: any) => new Date(e.startTime) > new Date()).length} icon={Clock} />
                  <StatCard label="Completadas" value={events.filter((e: any) => e.status === "completed").length} icon={CheckCircle2} />
                  <StatCard label="Canceladas" value={events.filter((e: any) => e.status === "cancelled").length} icon={AlertCircle} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousMonth}
                    data-testid="button-prev-month"
                    className="h-8 w-8 hover:bg-secondary/50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="inline-flex items-center px-4 py-2 bg-secondary/40 border border-border/70 rounded-lg">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {monthName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    data-testid="button-next-month"
                    className="h-8 w-8 hover:bg-secondary/50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs font-bold text-muted-foreground/80 py-2 uppercase">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((date, idx) => {
                    const dayEvents = date ? getEventsForDate(date) : [];
                    const isToday =
                      date &&
                      date.toDateString() === new Date().toDateString();
                    const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();

                    return (
                      <div key={idx}>
                        {date ? (
                          <button
                            onClick={() => handleDayClick(date)}
                            onDoubleClick={() => handleDayDoubleClick(date)}
                            data-testid={`day-${date.getDate()}`}
                            className={`
                              w-full p-2 rounded-lg text-sm font-medium
                              transition-all duration-200 relative flex flex-col items-start justify-start gap-1 h-auto min-h-16
                              ${isToday
                                ? "bg-primary/20 text-primary-foreground border border-primary/50"
                                : isSelected
                                  ? "bg-primary/30 border-2 border-primary"
                                  : "bg-secondary/40 border border-border/60 hover:bg-secondary/60"
                              }
                            `}
                          >
                            <span className="text-xs font-semibold w-full text-foreground">{date.getDate()}</span>
                            <div className="w-full space-y-1">
                              {dayEvents.slice(0, 2).map((event) => (
                                <div
                                  key={event.id}
                                  className="w-full"
                                  data-testid={`event-badge-${event.id}`}
                                >
                                  <div className="w-full text-xs bg-primary/70 text-primary-foreground rounded-md px-2 py-1 truncate font-medium cursor-pointer hover:bg-primary/80 transition-colors">
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

            {/* Selected Date Events Sidebar */}
            <div>
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
                      <p className="text-sm text-muted-foreground text-center">
                        Sin eventos este día
                      </p>
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
                                onClick={() => deleteEventMutation.mutate(event.id)}
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
                                <Clock className="w-3 h-3 text-muted-foreground/70" />
                                <p>
                                  {new Date(event.startTime).toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              {event.contactName && (
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3 text-muted-foreground/70" />
                                  <p>{event.contactName}</p>
                                </div>
                              )}
                              {event.contactPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3 text-muted-foreground/70" />
                                  <p>{event.contactPhone}</p>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 pt-2 border-t border-border">
                              <div
                                className={`text-xs font-medium px-2 py-1.5 rounded-full flex items-center gap-1 w-fit ${
                                  event.status === "confirmed"
                                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                    : event.status === "cancelled"
                                      ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                      : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                                }`}
                              >
                                {event.status === "confirmed" ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Confirmada</span>
                                  </>
                                ) : event.status === "cancelled" ? (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    <span>Cancelada</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertOctagon className="w-3 h-3" />
                                    <span>Pendiente</span>
                                  </>
                                )}
                              </div>
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
                  <p className="text-sm text-muted-foreground">
                    Haz click en un día para ver eventos
                  </p>
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Nueva Cita</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowNewForm(false);
                  resetForm();
                }}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Details */}
              <div>
                <Label htmlFor="event-title">Título de la cita *</Label>
                <Input
                  id="event-title"
                  placeholder="Ej: Reunión con cliente"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-event-title"
                />
              </div>
              <div>
                <Label htmlFor="event-description">Descripción (incluir hora si es necesario)</Label>
                <Textarea
                  id="event-description"
                  placeholder="Detalles de la cita, hora, ubicación, etc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-event-description"
                  rows={3}
                />
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="event-date">Fecha de la cita *</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  data-testid="input-event-date"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewForm(false);
                    resetForm();
                  }}
                  className="flex-1"
                  data-testid="button-cancel-event"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateEvent}
                  disabled={createEventMutation.isPending || !title.trim() || !eventDate}
                  className="flex-1"
                  data-testid="button-save-event"
                >
                  {createEventMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
