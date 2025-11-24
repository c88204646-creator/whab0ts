import { useState } from "react";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface TopHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
  } | undefined;
  onLogout: () => void;
}

export function TopHeader({ user, onLogout }: TopHeaderProps) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: "message" | "survey" | "raffle" | "system";
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>>([
    {
      id: "1",
      type: "survey",
      title: "Nueva respuesta",
      message: "Alguien completó tu encuesta 'Satisfacción del cliente'",
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false,
    },
    {
      id: "2",
      type: "message",
      title: "Mensaje recibido",
      message: "Tienes 3 mensajes nuevos en WhatsApp",
      timestamp: new Date(Date.now() - 30 * 60000),
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "message":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "survey":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "raffle":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return "💬";
      case "survey":
        return "📊";
      case "raffle":
        return "🎁";
      default:
        return "ℹ️";
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background flex-shrink-0 gap-4">
      {/* Left section - Sidebar trigger */}
      <div className="flex items-center">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
      </div>

      {/* Center - Empty space */}
      <div className="flex-1" />

      {/* Right section - Notifications, Theme toggle, User menu */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 border-border">
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                  <h3 className="font-semibold text-sm">Notificaciones</h3>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} sin leer` : "Sin notificaciones nuevas"}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs h-7"
                    data-testid="button-mark-all-as-read"
                  >
                    Marcar todo
                  </Button>
                )}
              </div>

              {/* Notifications list */}
              <div className="max-h-96 overflow-y-auto divide-y divide-border/50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read ? "bg-muted/30" : ""
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                      data-testid={`notification-item-${notification.id}`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${getNotificationColor(
                            notification.type
                          )}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground line-clamp-1">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-border/50 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs w-full"
                    data-testid="button-view-all-notifications"
                  >
                    Ver todas
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-2 h-9"
              data-testid="button-user-menu"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage alt={user?.name} />
                <AvatarFallback className="text-xs font-semibold">
                  {getInitials(user?.name || "User")}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-xs font-medium max-w-32 truncate">
                {user?.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-xs font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-xs cursor-pointer"
              data-testid="menu-item-profile"
            >
              <User className="w-3.5 h-3.5" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-xs cursor-pointer"
              data-testid="menu-item-settings"
            >
              <Settings className="w-3.5 h-3.5" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive"
              onClick={onLogout}
              data-testid="menu-item-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
  });
}
