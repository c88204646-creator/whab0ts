import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { MessageSquare, Power, Trash2 } from "lucide-react";
import type { WhatsappAccount } from "@shared/schema";

interface AccountCardProps {
  account: WhatsappAccount;
  onViewChats: (accountId: string) => void;
  onDisconnect: (accountId: string) => void;
}

export function AccountCard({ account, onViewChats, onDisconnect }: AccountCardProps) {
  const accountTypeLabel = account.accountType === "business" ? "Business" : "Normal";
  
  return (
    <Card className="hover-elevate" data-testid={`card-account-${account.id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {account.deviceName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate" data-testid="text-device-name">
              {account.deviceName}
            </h3>
            <Badge variant="secondary" className="text-xs mt-1">
              {accountTypeLabel}
            </Badge>
          </div>
        </div>
        <StatusBadge status={account.status as "connected" | "disconnected" | "pending"} />
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="space-y-2">
          {account.phoneNumber && (
            <div>
              <p className="text-xs text-muted-foreground">Número</p>
              <p className="text-sm font-mono" data-testid="text-phone-number">
                {account.phoneNumber}
              </p>
            </div>
          )}
          {account.lastActive && (
            <div>
              <p className="text-xs text-muted-foreground">Última actividad</p>
              <p className="text-sm">
                {new Date(account.lastActive).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 flex-wrap">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => onViewChats(account.id)}
          disabled={account.status !== "connected"}
          data-testid="button-view-chats"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Ver Chats
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDisconnect(account.id)}
          disabled={account.status === "disconnected"}
          data-testid="button-disconnect"
        >
          <Power className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
