import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AppLayout from "@/pages/layout";
import DashboardPage from "@/pages/dashboard";
import FlagsPage from "@/pages/flags";
import AuditPage from "@/pages/audit";
import SettingsPage from "@/pages/settings";
import EvalPage from "@/pages/eval";
import LoginPage from "@/pages/login";
import { useState } from "react";

function AppRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/flags" component={FlagsPage} />
        <Route path="/audit" component={AuditPage} />
        <Route path="/eval" component={EvalPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  const [authed, setAuthed] = useState(false);

  if (!authed) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage onLogin={() => setAuthed(true)} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
