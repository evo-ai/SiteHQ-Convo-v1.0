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
import WidgetEmbedPage from "@/pages/widget-embed";
import StandaloneWidgetDocs from "@/pages/standalone-widget-docs";
import { useEffect } from "react";

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
      <Route path="/widget-embed" component={WidgetEmbedPage} />
      <Route path="/widget-docs" component={StandaloneWidgetDocs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Dynamically load the sitehq-widget.js script
    const script = document.createElement('script');
    script.src = '/sitehq-widget.js'; // Maps to client/public/sitehq-widget.js
    script.async = true;
    document.body.appendChild(script);

    // Add the sitehq-chat custom element to the DOM
    const widget = document.createElement('sitehq-chat');
    widget.setAttribute('api-key', 'sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500');
    widget.setAttribute('agent-id', 'KRGVz0f5HAU0E7u6BbA5');
    widget.setAttribute('initially-open', 'true');
    widget.setAttribute('title', 'My Chatbot');
    widget.setAttribute('theme', '{"primary": "#ff5733"}');
    document.body.appendChild(widget);

    return () => {
      // Cleanup: Remove the script and widget when the component unmounts
      document.body.removeChild(script);
      document.body.removeChild(widget);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;