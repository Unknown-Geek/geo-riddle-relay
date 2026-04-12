import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EventProvider } from "@/contexts/EventContext";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OrganizerRoute } from "@/components/auth/OrganizerRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const JoinEvent = lazy(() => import("./pages/JoinEvent"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const OrganizerDashboard = lazy(() => import("./pages/organizer/Dashboard"));
const CreateEvent = lazy(() => import("./pages/organizer/CreateEvent"));
const EventDetail = lazy(() => import("./pages/organizer/EventDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5_000,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <EventProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/join" element={<JoinEvent />} />
                    <Route path="/join/:code" element={<JoinEvent />} />

                    {/* Protected player routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

                    {/* Organizer routes */}
                    <Route path="/organize" element={<OrganizerRoute><OrganizerDashboard /></OrganizerRoute>} />
                    <Route path="/organize/new" element={<OrganizerRoute><CreateEvent /></OrganizerRoute>} />
                    <Route path="/organize/:slug" element={<OrganizerRoute><EventDetail /></OrganizerRoute>} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ErrorBoundary>
          </TooltipProvider>
        </EventProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
