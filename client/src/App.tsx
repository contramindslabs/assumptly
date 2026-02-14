import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Shield, LayoutDashboard } from "lucide-react";
import NotFound from "@/pages/not-found";
import UploadPage from "@/pages/upload";
import AnalysisPage from "@/pages/analysis";
import DashboardPage from "@/pages/dashboard";

function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-sm tracking-tight">Assumptly</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/dashboard">
            <Button
              variant={location === "/dashboard" ? "secondary" : "ghost"}
              size="sm"
              data-testid="link-dashboard"
            >
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              My Decks
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={UploadPage} />
      <Route path="/analysis/:id" component={AnalysisPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
