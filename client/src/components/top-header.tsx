import { useState } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import NotificationsPanel from "@/components/notifications-panel";

interface TopHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
  } | undefined;
  onLogout: () => void;
}

export function TopHeader({ user, onLogout }: TopHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
        <NotificationsPanel />

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
