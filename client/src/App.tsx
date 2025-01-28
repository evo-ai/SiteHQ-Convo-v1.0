import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Demo from "@/pages/demo";
import AdminLogin from "@/pages/admin/login";
import AdminRegister from "@/pages/admin/register";
import ForgotPassword from "@/pages/admin/forgot-password";
import ResetPassword from "@/pages/admin/reset-password";
import AnalyticsDashboard from "@/pages/analytics";
import EmbedPage from "@/pages/embed";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Demo} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/register" component={AdminRegister} />
      <Route path="/admin/forgot-password" component={ForgotPassword} />
      <Route path="/admin/reset-password" component={ResetPassword} />
      <Route path="/admin/analytics" component={AnalyticsDashboard} />
      <Route path="/embed" component={EmbedPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;