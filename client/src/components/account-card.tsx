import { MessageCircle, Power, Smartphone, Clock, Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { WhatsappAccount } from "@shared/schema";

interface AccountCardProps {
  account: WhatsappAccount;
  onDisconnect: (accountId: string) => void;
}

export function AccountCard({ account, onDisconnect }: AccountCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "connected":
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          badge: "Conectado",
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        };
      case "disconnected":
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          badge: "Desconectado",
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950/30",
        };
      case "connecting":
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin" />,
          badge: "Conectando...",
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-950/30",
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          badge: status,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-950/30",
        };
    }
  };

  const statusConfig = getStatusConfig(account.status);

  const initials = account.deviceName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const lastActivityDate = account.lastActivity
    ? new Date(account.lastActivity).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sin actividad";

  const linkedDate = new Date(account.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="hover-elevate overflow-hidden transition-all duration-200" data-testid={`card-account-${account.id}`}>
      <div className={`${statusConfig.bgColor} px-6 py-4`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-background">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-semibold text-lg text-foreground truncate">{account.deviceName}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-medium">
                  {account.accountType === "business" ? "📊 Business" : "👤 Personal"}
                </Badge>
                <div className={`flex items-center gap-1 text-xs font-semibold ${statusConfig.color}`}>
                  {statusConfig.icon}
                  <span>{statusConfig.badge}</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDisconnect(account.id)}
            className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
            data-testid={`button-disconnect-${account.id}`}
          >
            <Power className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Phone Number */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-border">
          <Smartphone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Número de teléfono</p>
            <p className="font-mono text-sm font-semibold text-foreground mt-0.5">
              {account.phoneNumber || "No disponible"}
            </p>
          </div>
        </div>

        {/* Last Activity */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-border">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Última actividad</p>
            <p className="text-sm text-foreground mt-0.5">{lastActivityDate}</p>
          </div>
        </div>

        {/* Linked Date */}
        <div className="px-6 py-4 flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Vinculado desde</p>
            <p className="text-sm text-foreground mt-0.5">{linkedDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
