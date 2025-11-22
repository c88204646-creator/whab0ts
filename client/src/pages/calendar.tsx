import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronLeft, ChevronRight, X, MessageSquare, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { CalendarEvent, Conversation } from "@shared/schema";

export default function CalendarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isCalendarActive, setIsCalendarActive] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: [`/api/calendar/${userId}`],
    enabled: !!userId,
    refetchInterval: 5000,
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 10000,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Error creando evento");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calendar/${userId}`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/calendar/${userId}`] });
      toast({ title: "Cita eliminada" });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: { id: string; status: string }) => {
      const response = await fetch(`/api/calendar/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: data.status }),
      });
      if (!response.ok) throw new Error("Error actualizando evento");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/calendar/${userId}`] });
      toast({ title: "Cita actualizada" });
    },
  });

  const handleSelectContact = (conversationId: string) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv) {
      setSelectedContactId(conversationId);
      setContactName(conv.contactName || "");
      setContactPhone(conv.contactNumber || "");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setSelectedContactId("");
    setContactName("");
    setContactPhone("");
  };

  const handleCreateEvent = () => {
    if (!title.trim() || !startTime || !endTime) {
      toast({ title: "Error", description: "Completa título, inicio y fin", variant: "destructive" });
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      toast({ title: "Error", description: "Selecciona un contacto", variant: "destructive" });
      return;
    }
    createEventMutation.mutate({ title, description, contactName, contactPhone });
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

  const monthName = new Date(year, month).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setStartTime(date.toISOString().slice(0, 16));
    setEndTime(date.toISOString().slice(0, 16));
    setShowNewForm(true);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (isLoading) return <div className="p-6">Cargando calendario...</div>;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Calendario</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {events.length} cita{events.length !== 1 ? "s" : ""} registrada{events.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-md border border-border">
                  <input
                    type="checkbox"
                    id="calendar-active"
                    checked={isCalendarActive}
                    onChange={(e) => setIsCalendarActive(e.target.checked)}
                    className="w-4 h-4"
                    data-testid="checkbox-calendar-active"
                  />
                  <Label htmlFor="calendar-active" className="text-xs font-semibold cursor-pointer m-0">
                    Activo
                  </Label>
                </div>
                <Button onClick={() => setShowNewForm(true)} data-testid="button-add-event" size="sm" className="gap-1 h-8">
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Nueva cita</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousMonth}
                    data-testid="button-prev-month"
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <CardTitle className="capitalize">{monthName}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    data-testid="button-next-month"
                    className="h-8 w-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Week days header */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((date, idx) => {
                    const hasEvent = date && hasEventOnDate(date);
                    const isToday =
                      date &&
                      date.toDateString() === new Date().toDateString();

                    return (
                      <div key={idx}>
                        {date ? (
                          <button
                            onClick={() => handleDayClick(date)}
                            data-testid={`day-${date.getDate()}`}
                            className={`
                              w-full aspect-square p-2 rounded-md text-sm font-medium
                              transition-all duration-200 relative
                              ${isToday
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border hover:bg-muted"
                              }
                              ${hasEvent ? "ring-2 ring-accent" : ""}
                            `}
                          >
                            <span className="text-xs">{date.getDate()}</span>
                            {hasEvent && (
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                <svg
                                  className="w-2 h-2 text-accent fill-current"
                                  viewBox="0 0 8 8"
                                  data-testid={`event-dot-${date.getDate()}`}
                                >
                                  <circle cx="4" cy="4" r="4" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ) : (
                          <div className="w-full aspect-square" />
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {selectedDate.toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDateEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Sin eventos este día
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateEvents.map((event) => (
                        <Card key={event.id} className="bg-muted/50">
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
                              <p>
                                🕐{" "}
                                {new Date(event.startTime).toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {event.contactName && <p>👤 {event.contactName}</p>}
                            </div>
                            <div className="mt-2 pt-2 border-t border-border">
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  event.status === "confirmed"
                                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                    : event.status === "cancelled"
                                      ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                      : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                                }`}
                              >
                                {event.status === "confirmed" ? "✓ Confirmada" : event.status === "cancelled" ? "✗ Cancelada" : "⏳ Pendiente"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted/20 border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Selecciona un día para ver o crear eventos
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
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
              {/* Contact Selection */}
              <div>
                <Label htmlFor="contact-select" className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Contacto de WhatsApp *
                </Label>
                <Select value={selectedContactId} onValueChange={handleSelectContact}>
                  <SelectTrigger id="contact-select" data-testid="select-contact">
                    <SelectValue placeholder="Selecciona un contacto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {conversations.map((conv) => (
                      <SelectItem key={conv.id} value={conv.id} data-testid={`option-contact-${conv.id}`}>
                        {conv.contactName} ({conv.contactNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Info Display */}
              {contactName && (
                <div className="bg-card border border-border rounded-md p-3 space-y-2">
                  <div className="text-sm">
                    <Label className="text-xs text-muted-foreground">Nombre</Label>
                    <p className="font-medium">{contactName}</p>
                  </div>
                  <div className="text-sm">
                    <Label className="text-xs text-muted-foreground">WhatsApp</Label>
                    <p className="font-medium">{contactPhone}</p>
                  </div>
                </div>
              )}

              {/* Event Details */}
              <div>
                <Label htmlFor="event-title">Título de la cita *</Label>
                <Input
                  id="event-title"
                  placeholder="Ej: Reunión con cliente"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-event-title"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="event-description">Descripción</Label>
                <Textarea
                  id="event-description"
                  placeholder="Detalles de la cita..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-event-description"
                  rows={2}
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="event-start">Inicio *</Label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    data-testid="input-event-start"
                  />
                </div>
                <div>
                  <Label htmlFor="event-end">Fin *</Label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    data-testid="input-event-end"
                  />
                </div>
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
                  disabled={createEventMutation.isPending || !title.trim() || !startTime || !endTime || !contactName}
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
