import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

export default function NotificationsPanel() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [user] = useState<{ id: string } | null>(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    return userData?.id ? userData : null;
  });

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/notifications?userId=${user.id}`);
      if (!response.ok) throw new Error("Error fetching notifications");
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const unviewedCount = notifications.filter(n => !n.isViewed).length;

  const markAsViewedMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/view`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Error marking notification as viewed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error deleting notification");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
      toast({ title: "✓ Notificación eliminada" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar",
        variant: "destructive",
      });
    },
  });

  if (!user?.id) return null;

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        data-testid="button-notifications"
      >
        <Bell className="w-5 h-5" />
        {unviewedCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" data-testid={`badge-unviewed-${unviewedCount}`} />
        )}
      </Button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50"
          data-testid="panel-notifications"
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Notificaciones</h3>
              <span className="text-xs text-muted-foreground">
                {unviewedCount} {unviewedCount === 1 ? "nueva" : "nuevas"}
              </span>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay notificaciones
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover-elevate transition-colors ${
                      notification.isViewed
                        ? "bg-background"
                        : "bg-muted/30"
                    }`}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          {!notification.isViewed && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" data-testid={`indicator-unviewed-${notification.id}`} />
                          )}
                        </div>
                        {notification.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.isViewed && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => markAsViewedMutation.mutate(notification.id)}
                            disabled={markAsViewedMutation.isPending}
                            title="Marcar como leído"
                            data-testid={`button-mark-viewed-${notification.id}`}
                          >
                            <Check className="w-3.5 h-3.5 text-blue-500" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => deleteNotificationMutation.mutate(notification.id)}
                          disabled={deleteNotificationMutation.isPending}
                          title="Eliminar"
                          data-testid={`button-delete-notification-${notification.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
