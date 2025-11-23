import { useState, useEffect } from "react";
import { FakeNotification, generateFakeNotification } from "@/lib/fake-notifications";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2 } from "lucide-react";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<FakeNotification[]>([]);

  useEffect(() => {
    // Generate initial notifications después de 2 segundos
    const initialTimer = setTimeout(() => {
      const initial = generateFakeNotification();
      setNotifications([initial]);
    }, 2000);

    // Add new notifications every 10-12 seconds (más lento)
    const interval = setInterval(() => {
      const newNotification = generateFakeNotification();
      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        // Keep only last 2 notifications (menos cantidad)
        return updated.slice(0, 2);
      });
    }, 10000 + Math.random() * 2000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 pointer-events-none z-[9999] flex flex-col items-end">
      {notifications.map((notif) => (
        <NotificationItem key={notif.id} notification={notif} />
      ))}
    </div>
  );
}

function NotificationItem({ notification }: { notification: FakeNotification }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Auto-remove after 5 seconds
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        transform transition-all duration-500 ease-in-out
        ${
          isExiting
            ? "translate-x-96 opacity-0"
            : "translate-x-0 opacity-100"
        }
      `}
    >
      <div className="bg-card border border-border/50 rounded-lg shadow-xl p-3 backdrop-blur-sm max-w-sm pointer-events-auto hover:shadow-2xl transition-shadow">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback
                className={`bg-gradient-to-br ${notification.avatar} text-white font-bold text-xs`}
              >
                {notification.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">
                {notification.name}
              </p>
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {notification.city}, {notification.country}
            </p>
            <p className="text-xs text-muted-foreground/70 truncate mt-1">
              se registró en WhatsApp CRM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
