import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Button } from "@/components/ui/button";
import { TrendingUp, LayoutDashboard, BookOpen, Trophy, LogOut, Users } from "lucide-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import Discovery from "@/pages/discovery";

function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">Nomad Tradings</span>
              <span className="text-xs text-muted-foreground hidden sm:inline-block ml-1">AI Nomads</span>
            </div>
          </Link>
          
          {user && (
            <nav className="hidden md:flex items-center gap-1 ml-4">
              <Link href="/">
                <Button 
                  variant={location === "/" ? "secondary" : "ghost"} 
                  size="sm"
                  data-testid="nav-dashboard"
                >
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/discover">
                <Button 
                  variant={location === "/discover" ? "secondary" : "ghost"} 
                  size="sm"
                  data-testid="nav-discover"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Discover
                </Button>
              </Link>
              <Link href="/social">
                <Button 
                  variant={location === "/social" ? "secondary" : "ghost"} 
                  size="sm"
                  data-testid="nav-social"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Social
                </Button>
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium hidden sm:inline" data-testid="text-username">
                {user.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  if (!user) return null;
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
      <div className="flex items-center justify-around py-2">
        <Link href="/">
          <Button 
            variant={location === "/" ? "secondary" : "ghost"} 
            size="sm"
            className="flex-col h-auto py-2 px-4"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs mt-1">Trade</span>
          </Button>
        </Link>
        <Link href="/discover">
          <Button 
            variant={location === "/discover" ? "secondary" : "ghost"} 
            size="sm"
            className="flex-col h-auto py-2 px-4"
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs mt-1">Learn</span>
          </Button>
        </Link>
        <Link href="/social">
          <Button 
            variant={location === "/social" ? "secondary" : "ghost"} 
            size="sm"
            className="flex-col h-auto py-2 px-4"
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Social</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/discover" component={Discovery} />
      <ProtectedRoute path="/social" component={SocialPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function SocialPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Social Trading
        </h1>
        <p className="text-muted-foreground mt-1">
          See how other traders are doing and compete on the leaderboard.
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Leaderboard />
        </div>
        <div>
          <SocialFeed />
        </div>
      </div>
    </div>
  );
}

import { Leaderboard } from "@/components/leaderboard";
import { SocialFeed } from "@/components/social-feed";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen flex flex-col pb-16 md:pb-0">
              <Header />
              <main className="flex-1">
                <Router />
              </main>
              <MobileNav />
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
