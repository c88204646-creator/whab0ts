import { useState, useEffect } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSettingsSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Mexico_City", "America/Argentina/Buenos_Aires", "America/Sao_Paulo",
  "Europe/London", "Europe/Paris", "Europe/Madrid", "Europe/Berlin", "Europe/Rome",
  "Asia/Tokyo", "Asia/Hong_Kong", "Asia/Singapore", "Asia/Bangkok", "Asia/Dubai",
  "Australia/Sydney", "Australia/Melbourne"
];

const DAYS_OF_WEEK = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
];

export default function AppointmentSettingsPage() {
  const { toast } = useToast();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [, navigate] = useLocation();
  const [urlError, setUrlError] = useState("");
  const [urlChecking, setUrlChecking] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/appointment-settings", user.id],
    queryFn: () => apiRequest(`/api/appointment-settings?userId=${user.id}`),
  });

  const { data: slots } = useQuery({
    queryKey: ["/api/appointment-slots", settings?.id],
    queryFn: () => settings?.id ? apiRequest(`/api/appointment-slots?settingsId=${settings.id}`) : [],
    enabled: !!settings?.id,
  });

  const form = useForm({
    resolver: zodResolver(insertAppointmentSettingsSchema),
    defaultValues: {
      userId: user.id,
      appointmentDuration: 30,
      bufferTime: 0,
      maximumDaysInAdvance: 30,
      minimumDaysInAdvance: 0,
      timezone: "UTC",
      allowMultipleAppointmentsPerDay: true,
      requirePhoneNumber: true,
      requireWhatsapp: true,
      customUrl: "",
      description: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        userId: settings.userId,
        appointmentDuration: settings.appointmentDuration,
        bufferTime: settings.bufferTime,
        maximumDaysInAdvance: settings.maximumDaysInAdvance,
        minimumDaysInAdvance: settings.minimumDaysInAdvance,
        timezone: settings.timezone,
        allowMultipleAppointmentsPerDay: settings.allowMultipleAppointmentsPerDay,
        requirePhoneNumber: settings.requirePhoneNumber,
        requireWhatsapp: settings.requireWhatsapp,
        customUrl: settings.customUrl,
        description: settings.description,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data) => apiRequest("/api/appointment-settings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: "Configuración guardada" });
      queryClient.invalidateQueries({ queryKey: ["/api/appointment-settings"] });
    },
  });

  const checkUrlAvailability = async (url: string) => {
    if (!url) return;
    setUrlChecking(true);
    try {
      const res = await apiRequest(`/api/appointment-settings/check-url/${url}`);
      if (!res.available) {
        setUrlError("Esta URL ya está en uso");
      } else {
        setUrlError("");
      }
    } catch (error) {
      setUrlError("Error al verificar disponibilidad");
    }
    setUrlChecking(false);
  };

  const handleUrlChange = (value: string) => {
    form.setValue("customUrl", value);
    if (value.length > 3) {
      checkUrlAvailability(value);
    }
  };

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <div className="p-8">Cargando...</div>;

  const calendarUrl = settings?.customUrl ? `${window.location.origin}/calendar/${settings.customUrl}` : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Citas</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus horarios disponibles y preferencias de citas
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* URL Compartible */}
          <Card>
            <CardHeader>
              <CardTitle>URL de tu Calendario</CardTitle>
              <CardDescription>Los clientes pueden reservar citas desde este enlace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL personalizada</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-3 bg-muted text-sm rounded-l-md border border-r-0">
                          calendarios/
                        </span>
                        <Input
                          {...field}
                          placeholder="mi-calendario"
                          onChange={(e) => handleUrlChange(e.target.value)}
                          className="rounded-l-none"
                        />
                      </div>
                    </FormControl>
                    {urlError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{urlError}</p>}
                    {!urlError && field.value && !urlChecking && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />URL disponible</p>}
                  </FormItem>
                )}
              />

              {calendarUrl && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Link para compartir:</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 break-all">{calendarUrl}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(calendarUrl);
                      toast({ title: "Enlace copiado" });
                    }}
                    data-testid="button-copy-calendar-link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuración General */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Descripción de tus citas" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración de la cita (minutos)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="15" step="15" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bufferTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo entre citas (minutos)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="5" />
                    </FormControl>
                    <FormDescription>Tiempo de descanso entre citas consecutivas</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona horaria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimumDaysInAdvance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mínimo días de anticipación</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maximumDaysInAdvance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo días de anticipación</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Requisitos */}
          <Card>
            <CardHeader>
              <CardTitle>Requisitos para las citas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.watch("requirePhoneNumber")}
                  onChange={(e) => form.setValue("requirePhoneNumber", e.target.checked)}
                  data-testid="checkbox-require-phone"
                />
                <label>Requerir número de teléfono</label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.watch("requireWhatsapp")}
                  onChange={(e) => form.setValue("requireWhatsapp", e.target.checked)}
                  data-testid="checkbox-require-whatsapp"
                />
                <label>Requerir número de WhatsApp</label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.watch("allowMultipleAppointmentsPerDay")}
                  onChange={(e) => form.setValue("allowMultipleAppointmentsPerDay", e.target.checked)}
                  data-testid="checkbox-allow-multiple"
                />
                <label>Permitir múltiples citas el mismo día</label>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" data-testid="button-save-settings">
            Guardar Configuración
          </Button>
        </form>
      </Form>
    </div>
  );
}
