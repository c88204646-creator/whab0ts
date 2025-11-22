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
import { Plus, ChevronLeft, ChevronRight, X, Trash2, AlertCircle, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { countries, validatePhoneNumber, formatPhoneNumber } from "@/lib/countries";
import type { CalendarEvent } from "@shared/schema";

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
  const [countryCode, setCountryCode] = useState("+34");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [phoneValidation, setPhoneValidation] = useState<{ valid: boolean; message: string } | null>(null);
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

  // Validate phone number in real-time
  useEffect(() => {
    if (phoneNumber) {
      const validation = validatePhoneNumber(countryCode, phoneNumber);
      setPhoneValidation(validation);
    } else {
      setPhoneValidation(null);
    }
  }, [phoneNumber, countryCode]);

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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setCountryCode("+34");
    setPhoneNumber("");
    setContactName("");
    setPhoneValidation(null);
  };

  const handleCreateEvent = () => {
    if (!title.trim() || !startTime || !endTime) {
      toast({ title: "Error", description: "Completa título, inicio y fin", variant: "destructive" });
      return;
    }
    if (!phoneValidation?.valid) {
      toast({ title: "Error", description: "El número de WhatsApp no es válido", variant: "destructive" });
      return;
    }
    if (!contactName.trim()) {
      toast({ title: "Error", description: "Ingresa el nombre del contacto", variant: "destructive" });
      return;
    }

    const fullPhone = formatPhoneNumber(countryCode, phoneNumber);
    createEventMutation.mutate({
      title,
      description,
      contactName,
      contactPhone: fullPhone,
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

  const monthName = new Date(year, month).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDayDoubleClick = (date: Date) => {
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
                    const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();

                    return (
                      <div key={idx}>
                        {date ? (
                          <button
                            onClick={() => handleDayClick(date)}
                            onDoubleClick={() => handleDayDoubleClick(date)}
                            data-testid={`day-${date.getDate()}`}
                            className={`
                              w-full aspect-square p-2 rounded-md text-sm font-medium
                              transition-all duration-200 relative flex flex-col items-center justify-center
                              ${isToday
                                ? "bg-primary text-primary-foreground"
                                : isSelected
                                  ? "bg-accent/20 border-2 border-accent"
                                  : "bg-card border border-border hover:bg-muted"
                              }
                            `}
                          >
                            <span className="text-xs mb-1">{date.getDate()}</span>
                            {hasEvent ? (
                              <svg
                                className="w-3 h-3 text-accent fill-current"
                                viewBox="0 0 24 24"
                                data-testid={`event-indicator-${date.getDate()}`}
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                              </svg>
                            ) : (
                              <svg
                                className="w-3 h-3 text-muted-foreground fill-current"
                                viewBox="0 0 24 24"
                                data-testid={`no-event-indicator-${date.getDate()}`}
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
                              </svg>
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
                              {event.contactPhone && <p>📱 {event.contactPhone}</p>}
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
                    Haz click en un día para ver eventos
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
              {/* Contact Name */}
              <div>
                <Label htmlFor="contact-name">Nombre del contacto *</Label>
                <Input
                  id="contact-name"
                  placeholder="Ej: Juan García"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  data-testid="input-contact-name"
                />
              </div>

              {/* WhatsApp Number Input */}
              <div>
                <Label className="mb-2 block">Número de WhatsApp *</Label>
                <div className="flex gap-2">
                  {/* Country Code Select */}
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[120px]" data-testid="select-country">
                      <SelectValue placeholder="País" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code} data-testid={`option-country-${c.country}`}>
                          <span className="flex items-center gap-2">
                            {c.flag} {c.code}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Phone Number Input */}
                  <div className="flex-1">
                    <Input
                      placeholder="Número telefónico"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      data-testid="input-phone-number"
                      type="tel"
                    />
                  </div>
                </div>

                {/* Phone Validation Indicator */}
                {phoneNumber && phoneValidation && (
                  <div
                    className={`flex items-center gap-2 mt-2 text-xs ${
                      phoneValidation.valid
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                    data-testid={`validation-${phoneValidation.valid ? "success" : "error"}`}
                  >
                    {phoneValidation.valid ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {phoneValidation.message}
                  </div>
                )}

                {/* Full Number Display */}
                {phoneValidation?.valid && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <span className="text-muted-foreground">Número completo: </span>
                    <span className="font-mono font-medium">{formatPhoneNumber(countryCode, phoneNumber)}</span>
                  </div>
                )}
              </div>

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
                  disabled={createEventMutation.isPending || !title.trim() || !startTime || !endTime || !contactName || !phoneValidation?.valid}
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
