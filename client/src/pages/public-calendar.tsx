import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { CalendarEvent, CalendarAvailability, CalendarConfig } from "@shared/schema";

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
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/calendar/public/${token}`);
        if (response.status === 403) {
          throw new Error("El calendario está desactivado por el propietario");
        }
        if (!response.ok) {
          throw new Error("Calendario no encontrado");
        }
        const data = await response.json();
        setConfig(data.config);
        setAvailability(data.availability);
        setEvents(data.events);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo cargar el calendario",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCalendarData();
    }
  }, [token, toast]);

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

  const handleBooking = async () => {
    if (!contactName.trim() || !contactPhone.trim() || !selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
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

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: config?.userId,
          title: contactName,
          description: bookingNotes,
          contactName,
          contactPhone,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          status: "pending",
          isActive: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al agendar cita");
      }

      toast({
        title: "¡Cita agendada!",
        description: "Tu cita ha sido reservada exitosamente",
      });

      setShowBookingForm(false);
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setBookingNotes("");
      setSelectedTime("");
      setSelectedDate(null);

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

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-foreground font-semibold">Calendario no encontrado</p>
          </CardContent>
        </Card>
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
          {/* Alert when booking is disabled */}
          {!config.isPublicBookingEnabled && (
            <Alert className="mb-6 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs text-foreground ml-2">
                El calendario está disponible para consulta, pero la agendación de citas no está habilitada en este momento. Por favor, intenta más tarde.
              </AlertDescription>
            </Alert>
          )}

          {/* Alert with availability info */}
          {config.isPublicBookingEnabled && (
            <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-xs text-foreground ml-2">
                Estás por agendar una cita con <span className="font-semibold">{config?.businessName || "nuestro equipo"}</span>. Selecciona una fecha y horario disponibles de los mostrados en el calendario.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="bg-card border-border">
                <CardHeader>
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
                                    ? "bg-primary/30 border-2 border-primary text-foreground"
                                    : isToday
                                      ? "bg-primary/20 border border-primary/50 text-primary-foreground"
                                      : "bg-primary/35 border border-primary/50 text-foreground hover-elevate"
                                }
                              `}
                            >
                              <span>{date.getDate()}</span>
                              {!isPast && (
                                <div className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5">
                                  {hasAvailability ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
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
              {selectedDate ? (
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
                        <div className="grid grid-cols-2 gap-2">
                          {availableSlots.map((slot) => (
                            <Button
                              key={slot}
                              variant={selectedTime === slot ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTime(slot)}
                              className="text-xs h-8 font-medium"
                            >
                              {slot}
                            </Button>
                          ))}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar cita</DialogTitle>
            <DialogDescription>
              {selectedDate?.toLocaleDateString("es-ES", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              a las {selectedTime}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-xs">Nombre completo *</Label>
              <Input
                id="name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Tu nombre"
                className="mt-1.5 text-xs h-8"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-xs">WhatsApp (con código país) *</Label>
              <Input
                id="phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1234567890"
                className="mt-1.5 text-xs h-8"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="tu@email.com"
                className="mt-1.5 text-xs h-8"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-xs">Notas adicionales</Label>
              <Textarea
                id="notes"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="¿Hay algo que debamos saber?"
                className="mt-1.5 text-xs h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowBookingForm(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleBooking} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
