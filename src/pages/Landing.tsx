import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Compass, MapPin, Users, Trophy, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Riddle Relay</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth?signup=true">Get started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            GPS treasure hunts,<br />
            <span className="text-primary">made simple</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Create and play location-based riddle events. Teams navigate to real-world
            checkpoints, unlock riddles with GPS, and compete on live leaderboards.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/join">
                Join a hunt <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link to="/auth?signup=true&role=organizer">
                Organize an event
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">GPS Checkpoints</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Riddles unlock only when your team reaches the physical location.
                Real-world exploration, not just screen time.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Team Play</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Register as a team leader, share your team code, and play together.
                Up to 4 members per team.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Live Leaderboard</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Real-time scoring with time-based penalties. See how your team
                stacks up as the hunt unfolds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Compass className="h-4 w-4" />
            <span>Riddle Relay</span>
          </div>
          <p className="text-xs text-muted-foreground">GPS treasure hunts, made simple</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
