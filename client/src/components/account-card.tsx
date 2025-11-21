import { MessageCircle, Power, Smartphone } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { WhatsappAccount } from "@shared/schema";

interface AccountCardProps {
  account: WhatsappAccount;
  onDisconnect: (accountId: string) => void;
}

export function AccountCard({ account, onDisconnect }: AccountCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "disconnected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "connecting":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado";
      case "disconnected":
        return "Desconectado";
      case "connecting":
        return "Conectando...";
      default:
        return status;
    }
  };

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

  return (
    <Card className="hover-elevate overflow-hidden" data-testid={`card-account-${account.id}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{account.deviceName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {account.accountType === "business" ? "Business" : "Personal"}
                </Badge>
                <Badge className={`text-xs ${getStatusColor(account.status)}`}>
                  {getStatusText(account.status)}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDisconnect(account.id)}
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            data-testid={`button-disconnect-${account.id}`}
          >
            <Power className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Número:</span>
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
              {account.phoneNumber || "No disponible"}
            </code>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Última actividad:</span>
            <span className="text-xs">{lastActivityDate}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Vinculado el{" "}
            {new Date(account.createdAt).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 bg-muted/30 pt-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            {account.status === "connected" ? "✓ Listo para usar" : "⚠️ Requiere reconexión"}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
