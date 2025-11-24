import { useState } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, CheckCircle2 } from "lucide-react";

export default function PublicCalendarPage({ customUrl }: { customUrl: string }) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [`/api/public/calendar/${customUrl}`],
    queryFn: () => apiRequest(`/api/public/calendar/${customUrl}`),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (appointmentData) =>
      apiRequest("/api/public/appointments", {
        method: "POST",
        body: JSON.stringify(appointmentData),
      }),
    onSuccess: () => {
      toast({ title: "Cita programada exitosamente", description: "Te contactaremos pronto" });
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setWhatsappPhone("");
      setSelectedDate("");
      setSelectedTime("");
    },
  });

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !selectedDate || !selectedTime) {
      toast({ title: "Por favor completa todos los campos requeridos" });
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const duration = data?.settings?.appointmentDuration || 30;
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    createAppointmentMutation.mutate({
      userId: data?.settings?.userId,
      clientName,
      clientEmail,
      clientPhoneNumber: clientPhone,
      whatsappPhoneNumber: whatsappPhone,
      title: "Cita Programada",
      startTime: startDateTime,
      endTime: endDateTime,
      status: "pending",
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando calendario...</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Calendario no encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>El calendario solicitado no existe o está no disponible.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const settings = data.settings;
  const slots = data.slots || [];
  const availableTimesByDay = {};

  slots.forEach((slot) => {
    if (!availableTimesByDay[slot.dayOfWeek]) {
      availableTimesByDay[slot.dayOfWeek] = [];
    }
    availableTimesByDay[slot.dayOfWeek].push({
      start: slot.startTime,
      end: slot.endTime,
    });
  });

  const getAvailableTimesForDate = (dateStr: string) => {
    if (!dateStr) return [];
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    return availableTimesByDay[dayOfWeek] || [];
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + (settings?.minimumDaysInAdvance || 0));
    return today.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + (settings?.maximumDaysInAdvance || 30));
    return today.toISOString().split("T")[0];
  };

  const availableTimes = getAvailableTimesForDate(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Agendar una Cita</h1>
          {settings.description && <p className="text-muted-foreground">{settings.description}</p>}
        </div>

        {/* Main Card */}
        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleBookAppointment} className="space-y-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Tu Información</h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Nombre *</label>
                  <Input
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Tu nombre completo"
                    data-testid="input-client-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="tu@email.com"
                    data-testid="input-client-email"
                  />
                </div>

                {settings.requirePhoneNumber && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Teléfono {settings.requirePhoneNumber && "*"}
                    </label>
                    <Input
                      required={settings.requirePhoneNumber}
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      data-testid="input-client-phone"
                    />
                  </div>
                )}

                {settings.requireWhatsapp && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      WhatsApp {settings.requireWhatsapp && "*"}
                    </label>
                    <Input
                      required={settings.requireWhatsapp}
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      data-testid="input-whatsapp-phone"
                    />
                  </div>
                )}
              </div>

              {/* Selección de Fecha y Hora */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Selecciona una Fecha y Hora</h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Fecha *</label>
                  <Input
                    required
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    data-testid="input-appointment-date"
                  />
                  {availableTimes.length === 0 && selectedDate && (
                    <p className="text-sm text-amber-600 mt-2">
                      No hay horarios disponibles para este día
                    </p>
                  )}
                </div>

                {availableTimes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Hora *</label>
                    <select
                      required
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md"
                      data-testid="select-appointment-time"
                    >
                      <option value="">Selecciona una hora</option>
                      {availableTimes.map((slot) => (
                        <option key={slot.start} value={slot.start}>
                          {slot.start} - {slot.end}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createAppointmentMutation.isPending}
                data-testid="button-book-appointment"
              >
                {createAppointmentMutation.isPending ? "Agendando..." : "Agendar Cita"}
              </Button>
            </form>

            {createAppointmentMutation.isSuccess && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="w-5 h-5" />
                Cita agendada exitosamente
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
