import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
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
import ChatbotDetailsPage from "@/pages/chatbot-details";
import CalendarPage from "@/pages/calendar";
import SurveysPage from "@/pages/surveys";
import SurveyEditorPage from "@/pages/survey-editor";
import SurveyResponsePage from "@/pages/survey-response";
import SurveyResultsPage from "@/pages/survey-results";
import CustomDomainsPage from "@/pages/custom-domains";
import RaffleManagementPage from "@/pages/raffle-management";
import RaffleCreatePage from "@/pages/raffle-create";
import RaffleDetailsPage from "@/pages/raffle-details";
import RafflePublicPage from "@/pages/raffle-public";
import SettingsPage from "@/pages/settings";
import CRMClientsPage from "@/pages/crm-clients";
import CRMLeadsPage from "@/pages/crm-leads";
import CRMFacebookPage from "@/pages/crm-facebook";
import FacebookAutomationPage from "@/pages/facebook-automation";
import SalesFunnelPage from "@/pages/sales-funnel";
import NotFound from "@/pages/not-found";

function Router() {
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    // Give React time to render before checking auth
    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.id) {
            setUser(parsed);
            setIsAuthenticated(true);
          }
        } catch (e) {
          localStorage.removeItem("user");
        }
      }
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
  }, [isAuthenticated]);

  const handleLogin = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json());
    if (response?.id) {
      setUser(response);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(response));
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).then((r) => r.json());
    if (response?.id) {
      setUser(response);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(response));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    setAuthView("login");
  };

  if (!isReady) {
    return <div className="flex items-center justify-center h-screen bg-background" />;
  }

  // Check if this is a public survey route - render without sidebar (no authentication required)
  if (location && location.match(/^\/survey\/[^/]+(\/?|\/results)?$/)) {
    return (
      <Switch>
        <Route path="/survey/:id" component={SurveyResponsePage} />
        <Route path="/survey/:id/results" component={SurveyResultsPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Check if this is a public raffle route - render without sidebar (no authentication required)
  // But NOT if it's the create route
  if (location && location.match(/^\/raffle\/[^/]+$/) && !location.startsWith("/raffle/create")) {
    return (
      <Switch>
        <Route path="/raffle/:id" component={RafflePublicPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

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
        <div className="flex flex-col flex-1 min-h-0">
          <header className="flex items-center justify-between h-16 px-6 border-b border-border flex-shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 min-h-0 overflow-auto">
            <Switch>
              <Route path="/" component={() => <Redirect to="/connections" />} />
              <Route path="/conversations" component={ConversationsPage} />
              <Route path="/connections" component={ConnectionsPage} />
              <Route path="/chatbots" component={ChatbotsPage} />
              <Route path="/chatbots/:id" component={ChatbotDetailsPage} />
              <Route path="/calendar" component={CalendarPage} />
              <Route path="/surveys" component={SurveysPage} />
              <Route path="/survey-edit/:id" component={SurveyEditorPage} />
              <Route path="/sales-funnel" component={SalesFunnelPage} />
              <Route path="/custom-domains" component={CustomDomainsPage} />
              <Route path="/raffles" component={RaffleManagementPage} />
              <Route path="/raffle/create" component={RaffleCreatePage} />
              <Route path="/raffles/:id" component={RaffleDetailsPage} />
              <Route path="/crm/clients" component={CRMClientsPage} />
              <Route path="/crm/leads" component={CRMLeadsPage} />
              <Route path="/facebook" component={CRMFacebookPage} />
              <Route path="/facebook-automation" component={FacebookAutomationPage} />
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
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
