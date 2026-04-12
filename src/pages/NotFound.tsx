import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <h1 className="text-xl font-semibold mt-4">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/">
              <Compass className="h-4 w-4 mr-2" /> Home
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
