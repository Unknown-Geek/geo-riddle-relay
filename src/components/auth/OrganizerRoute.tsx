import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface OrganizerRouteProps {
  children: React.ReactNode;
}

export function OrganizerRoute({ children }: OrganizerRouteProps) {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (profile?.role !== "organizer") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
