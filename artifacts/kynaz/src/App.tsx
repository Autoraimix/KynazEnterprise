import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { IdleWarningBanner } from "@/components/IdleWarningBanner";
import NotFound from "@/pages/not-found";

import Home from "@/pages/public/Home";
import Services from "@/pages/public/Services";
import ServiceDetail from "@/pages/public/ServiceDetail";
import About from "@/pages/public/About";
import Contact from "@/pages/public/Contact";
import GuestQuote from "@/pages/public/GuestQuote";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

import Dashboard from "@/pages/dashboard/Dashboard";
import Quotations from "@/pages/dashboard/Quotations";
import QuotationDetail from "@/pages/dashboard/QuotationDetail";
import NewQuotation from "@/pages/dashboard/NewQuotation";
import Payment from "@/pages/dashboard/Payment";
import Cashback from "@/pages/dashboard/Cashback";
import Referrals from "@/pages/dashboard/Referrals";
import Notifications from "@/pages/dashboard/Notifications";
import Profile from "@/pages/dashboard/Profile";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminQuotations from "@/pages/admin/AdminQuotations";
import AdminQuotationDetail from "@/pages/admin/AdminQuotationDetail";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCashback from "@/pages/admin/AdminCashback";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminAgents from "@/pages/admin/AdminAgents";
import AdminInfographics from "@/pages/admin/AdminInfographics";
import AdminLeaderboard from "@/pages/admin/AdminLeaderboard";

import AgentDashboard from "@/pages/agent/AgentDashboard";
import AgentCustomers from "@/pages/agent/AgentCustomers";
import AgentQuotations from "@/pages/agent/AgentQuotations";
import AgentRanking from "@/pages/agent/AgentRanking";
import AgentCommissions from "@/pages/agent/AgentCommissions";

import SuperAdminDashboard from "@/pages/superadmin/SuperAdminDashboard";
import SuperAdminUsers from "@/pages/superadmin/SuperAdminUsers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/services/:slug" component={ServiceDetail} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/quote" component={GuestQuote} />

      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* Customer dashboard routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/quotations" component={Quotations} />
      <Route path="/dashboard/quotations/new" component={NewQuotation} />
      <Route path="/dashboard/quotations/:id/payment" component={Payment} />
      <Route path="/dashboard/quotations/:id" component={QuotationDetail} />
      <Route path="/dashboard/cashback" component={Cashback} />
      <Route path="/dashboard/referrals" component={Referrals} />
      <Route path="/dashboard/notifications" component={Notifications} />
      <Route path="/dashboard/profile" component={Profile} />

      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/quotations" component={AdminQuotations} />
      <Route path="/admin/quotations/:id" component={AdminQuotationDetail} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/cashback" component={AdminCashback} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/agents" component={AdminAgents} />
      <Route path="/admin/leaderboard" component={AdminLeaderboard} />
      <Route path="/admin/infographics" component={AdminInfographics} />

      {/* Super Admin routes */}
      <Route path="/superadmin" component={SuperAdminDashboard} />
      <Route path="/superadmin/users" component={SuperAdminUsers} />

      {/* Agent routes */}
      <Route path="/agent" component={AgentDashboard} />
      <Route path="/agent/customers" component={AgentCustomers} />
      <Route path="/agent/quotations" component={AgentQuotations} />
      <Route path="/agent/commissions" component={AgentCommissions} />
      <Route path="/agent/ranking" component={AgentRanking} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
              <IdleWarningBanner />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
