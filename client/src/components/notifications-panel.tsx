import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Trash2, Check, MessageSquare, BarChart3, ShoppingCart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    refetchInterval: 5000,
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
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "order":
        return <ShoppingCart className="w-4 h-4 text-green-500" />;
      case "alert":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "reminder":
        return <BarChart3 className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (!user?.id) return null;

  return (
    <div className="relative">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-8 w-8"
        data-testid="button-notifications"
      >
        <Bell className="w-4 h-4" />
        {unviewedCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" data-testid={`badge-unviewed-${unviewedCount}`} />
        )}
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 bg-background border border-border rounded-md shadow-lg z-50"
          data-testid="panel-notifications"
        >
          <div className="p-3 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Notificaciones</h3>
            </div>
            {unviewedCount > 0 && (
              <span className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                {unviewedCount}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Sin notificaciones
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2.5 hover:bg-muted/40 transition-colors group ${
                      notification.isViewed ? "bg-background" : "bg-muted/20"
                    }`}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          {!notification.isViewed && (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" data-testid={`indicator-unviewed-${notification.id}`} />
                          )}
                        </div>
                        {notification.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
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
                      <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isViewed && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => markAsViewedMutation.mutate(notification.id)}
                            disabled={markAsViewedMutation.isPending}
                            title="Marcar como leído"
                            data-testid={`button-mark-viewed-${notification.id}`}
                          >
                            <Check className="w-3 h-3 text-blue-500" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => deleteNotificationMutation.mutate(notification.id)}
                          disabled={deleteNotificationMutation.isPending}
                          title="Eliminar"
                          data-testid={`button-delete-notification-${notification.id}`}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
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
