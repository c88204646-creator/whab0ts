import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopHeader } from "@/components/top-header";
import { ThemeProvider } from "@/lib/theme-provider";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import ConversationsPage from "@/pages/conversations";
import ConnectionsPage from "@/pages/connections";
import ChatbotsPage from "@/pages/chatbots";
import ChatbotDetailsPage from "@/pages/chatbot-details";
import AIProvidersPage from "@/pages/ai-providers";
import CalendarPage from "@/pages/calendar";
import SurveysPage from "@/pages/surveys";
import SurveyEditorPage from "@/pages/survey-editor";
import SalesFunnelPage from "@/pages/sales-funnel";
import CustomDomainsPage from "@/pages/custom-domains";
import RaffleManagementPage from "@/pages/raffle-management";
import RaffleCreatePage from "@/pages/raffle-create";
import RaffleDetailsPage from "@/pages/raffle-details";
import CRMClientsPage from "@/pages/crm-clients";
import CRMLeadsPage from "@/pages/crm-leads";
import CRMFacebookPage from "@/pages/crm-facebook";
import FacebookAutomationPage from "@/pages/facebook-automation";
import TeamsPage from "@/pages/teams";
import RolesCreatorPage from "@/pages/roles-creator";
import StoreManagementPage from "@/pages/store-management";
import ProductsPage from "@/pages/products";
import StoreSelectorPage from "@/pages/store-selector";
import ProductsSelectorPage from "@/pages/products-selector";
import StoreProductsPage from "@/pages/store-products";
import StoreOrdersPage from "@/pages/store-orders";
import PublicStorePage from "@/pages/public-store";
import StoreCheckoutPage from "@/pages/store-checkout";
import TasksPage from "@/pages/tasks";
import SettingsPage from "@/pages/settings";
import PublicCalendarPage from "@/pages/public-calendar";
import CalendarAnalyticsPage from "@/pages/calendar-analytics";
import TeamLoginPage from "@/pages/team-login";
import NotFound from "@/pages/not-found";

type User = { 
  id: string; 
  name: string; 
  email: string;
  role?: string;
  teamInfo?: any;
  moduleAccess?: any;
};

function ProtectedRoute({ component: Component }: { component: any }) {
  const userData = localStorage.getItem("user");
  
  // If no valid authentication, don't render the component
  if (!userData) {
    return <NotFound />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/conversations" component={ConversationsPage} />
      <Route path="/connections" component={ConnectionsPage} />
      <Route path="/chatbots" component={ChatbotsPage} />
      <Route path="/chatbots/:id" component={ChatbotDetailsPage} />
      <Route path="/ai-providers" component={AIProvidersPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/calendar/analytics" component={CalendarAnalyticsPage} />
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
      <Route path="/teams" component={TeamsPage} />
      <Route path="/teams/roles" component={RolesCreatorPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/products/manage" component={ProductsSelectorPage} />
      <Route path="/orders" component={StoreSelectorPage} />
      <Route path="/stores" component={StoreManagementPage} />
      <Route path="/stores/:id/products">
        {({ id }) => <StoreProductsPage storeId={id || ""} />}
      </Route>
      <Route path="/stores/:id/orders">
        {({ id }) => <StoreOrdersPage storeId={id || ""} />}
      </Route>
      <Route path="/tasks" component={TasksPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/store/:url">
        {({ url }) => <PublicStorePage storeUrl={url || ""} />}
      </Route>
      <Route path="/public-calendar/:token">
        {({ token }) => <PublicCalendarPage />}
      </Route>
      <Route path="/checkout/:storeId">
        {({ storeId }) => <StoreCheckoutPage storeId={storeId || ""} />}
      </Route>
      <Route path="/team-login" component={TeamLoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MainLayout({ user, onLogout }: { user: User; onLogout: () => void }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} onLogout={onLogout} />
        <div className="flex flex-col flex-1 min-h-0 w-full">
          <TopHeader user={user} onLogout={onLogout} />
          <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar w-full">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AuthRouter({ onLogin, onRegister, authView, setAuthView }: any) {
  return authView === "login" ? (
    <LoginPage
      onLogin={onLogin}
      onSwitchToRegister={() => setAuthView("register")}
    />
  ) : (
    <RegisterPage
      onRegister={onRegister}
      onSwitchToLogin={() => setAuthView("login")}
    />
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [location] = useLocation();
  const isPublicPage = location?.startsWith("/store/") || location?.startsWith("/checkout/") || location?.startsWith("/public-calendar/") || location?.startsWith("/team-login");

  useEffect(() => {
    // Load user from localStorage on mount
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed?.id && parsed?.email) {
          setUser(parsed);
        } else {
          localStorage.removeItem("user");
        }
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleRegister = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setAuthView("login");
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return null;
  }

  // Public pages (no auth required)
  if (isPublicPage) {
    return <PublicRouter />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <AuthRouter
        onLogin={handleLogin}
        onRegister={handleRegister}
        authView={authView}
        setAuthView={setAuthView}
      />
    );
  }

  // Render protected app layout only if authenticated
  return (
    <>
      <MainLayout user={user} onLogout={handleLogout} />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
