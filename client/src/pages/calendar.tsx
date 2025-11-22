import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Check, X, Clock } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { CalendarEvent } from "@shared/schema";

export default function CalendarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isCalendarActive, setIsCalendarActive] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attendee, setAttendee] = useState("");
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
      toast({ title: "Evento creado" });
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
      toast({ title: "Evento eliminado" });
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
      toast({ title: "Evento actualizado" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setAttendee("");
  };

  const handleCreateEvent = () => {
    if (!title.trim() || !startTime || !endTime) {
      toast({ title: "Error", description: "Completa los campos requeridos", variant: "destructive" });
      return;
    }
    createEventMutation.mutate({ title, description, attendee });
  };

  const upcomingEvents = events
    .filter((e) => new Date(e.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const pastEvents = events
    .filter((e) => new Date(e.startTime) <= new Date())
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

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
                  {upcomingEvents.length} próxim{upcomingEvents.length !== 1 ? "as" : "a"} {upcomingEvents.length !== 1 ? "citas" : "cita"}
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

      <div className="max-w-7xl mx-auto space-y-6 p-6 pb-20">
        {/* Upcoming Events */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Próximas Citas</h2>
          </div>
          {upcomingEvents.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No hay citas próximas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>
                            📅 {new Date(event.startTime).toLocaleDateString("es-ES")}
                          </span>
                          <span>
                            🕐 {new Date(event.startTime).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {event.attendee && <span>👤 {event.attendee}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {event.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateEventMutation.mutate({ id: event.id, status: "confirmed" })}
                              data-testid={`button-confirm-${event.id}`}
                              className="h-8 px-2"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateEventMutation.mutate({ id: event.id, status: "cancelled" })}
                              data-testid={`button-cancel-${event.id}`}
                              className="h-8 px-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteEventMutation.mutate(event.id)}
                          data-testid={`button-delete-${event.id}`}
                          className="h-8 px-2"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Citas Pasadas</h2>
            <div className="space-y-3 opacity-60">
              {pastEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">{event.title}</h3>
                        <div className="flex gap-3 text-xs">
                          <span>
                            {new Date(event.startTime).toLocaleDateString("es-ES")}
                          </span>
                          {event.attendee && <span>👤 {event.attendee}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Event Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nueva Cita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="event-title">Título *</Label>
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
              <div>
                <Label htmlFor="event-attendee">Contacto</Label>
                <Input
                  id="event-attendee"
                  placeholder="Ej: +1234567890"
                  value={attendee}
                  onChange={(e) => setAttendee(e.target.value)}
                  data-testid="input-event-attendee"
                />
              </div>
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
                  disabled={createEventMutation.isPending || !title.trim() || !startTime || !endTime}
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
