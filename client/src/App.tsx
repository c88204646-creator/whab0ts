import { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { connectWebSocket, disconnectWebSocket } from "@/lib/websocket";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ConnectionsPage from "@/pages/connections";
import ConversationsPage from "@/pages/conversations";
import ChatbotsPage from "@/pages/chatbots";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    setUser(response);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(response));
    connectWebSocket();
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/register", { name, email, password });
    setUser(response);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(response));
    connectWebSocket();
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    disconnectWebSocket();
  };

  if (!isAuthenticated) {
    return authView === "login" ? (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthView("register")}
      />
    ) : (
      <RegisterPage
        onRegister={handleRegister}
        onSwitchToLogin={() => setAuthView("login")}
      />
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user || undefined} onLogout={handleLogout} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between h-16 px-6 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-hidden">
            <Switch>
              <Route path="/" component={() => <Redirect to="/conversations" />} />
              <Route path="/conversations" component={ConversationsPage} />
              <Route path="/connections" component={ConnectionsPage} />
              <Route path="/chatbots" component={ChatbotsPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
