import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Demo from "@/pages/demo";
import AdminLogin from "@/pages/admin/login";
import AnalyticsDashboard from "@/pages/analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Demo} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/analytics" component={AnalyticsDashboard} />
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