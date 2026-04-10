import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TourProvider } from "@/components/tour/TourProvider";
import NotFound from "@/pages/not-found";
import AppLayout from "@/pages/layout";
import DashboardPage from "@/pages/dashboard";
import FlagsPage from "@/pages/flags";
import AuditPage from "@/pages/audit";
import SettingsPage from "@/pages/settings";
import EvalPage from "@/pages/eval";
import DemoPage from "@/pages/demo";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import { useState } from "react";
import { LangProvider } from "@/lib/i18n";

function AppRouter() {
  return (
    <AppLayout>
      <TourProvider>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/flags" component={FlagsPage} />
          <Route path="/audit" component={AuditPage} />
          <Route path="/eval" component={EvalPage} />
          <Route path="/demo" component={DemoPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </TourProvider>
    </AppLayout>
  );
}

function App() {
  const [authed, setAuthed] = useState(false);

  if (!authed) {
    return (
      <QueryClientProvider client={queryClient}>
        <LangProvider>
          <LoginPage onLogin={() => setAuthed(true)} />
        </LangProvider>
      </QueryClientProvider>
    );
  }

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <LangProvider>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </TooltipProvider>
        </LangProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
}

export default App;