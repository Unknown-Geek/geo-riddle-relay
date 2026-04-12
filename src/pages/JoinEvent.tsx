import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/contexts/EventContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, ArrowRight, Check, Users } from "lucide-react";
import { getEventByInviteCode, createTeam } from "@/services/player-service";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "react-router-dom";

const JoinEvent = () => {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentEvent } = useEvent();
  const { toast } = useToast();

  const [step, setStep] = useState<"invite" | "details" | "team" | "done">(code ? "details" : "invite");
  const [inviteCode, setInviteCode] = useState(code ?? "");
  const [eventName, setEventName] = useState("");
  const [eventId, setEventId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamColor, setTeamColor] = useState("#5E6AD2");
  const [teamCode, setTeamCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const event = await getEventByInviteCode(inviteCode);
      setEventName(event.name);
      setEventId(event.id);
      setStep("team");
    } catch (err: any) {
      setError("Event not found. Check the invite code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth?signup=true");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const team = await createTeam(eventId, user.id, teamName, teamColor);
      setTeamCode(team.team_code ?? "");

      // Set the event context
      const event = await getEventByInviteCode(inviteCode);
      setCurrentEvent(event as any);

      toast({
        title: "Team created!",
        description: "Share your team code with teammates to join.",
      });

      setStep("done");
    } catch (err: any) {
      setError(err.message ?? "Failed to create team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Riddle Relay</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Step 1: Enter invite code */}
          {step === "invite" && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Join a hunt</CardTitle>
                <CardDescription>Enter the invite code from your event organizer</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLookupCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite code</Label>
                    <Input
                      id="inviteCode"
                      placeholder="ABC12345"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      required
                      className="text-center text-lg tracking-widest font-mono"
                      maxLength={8}
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    Find event <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>

                {!user && (
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    You'll need an account to join.{" "}
                    <Link to="/auth?signup=true" className="text-primary hover:underline">
                      Sign up first
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Create team */}
          {step === "team" && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-2">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{eventName}</CardTitle>
                <CardDescription>Create your team to join this event</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team name</Label>
                    <Input
                      id="teamName"
                      placeholder="Enter your team name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamColor">Team color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="teamColor"
                        type="color"
                        value={teamColor}
                        onChange={(e) => setTeamColor(e.target.value)}
                        className="h-10 w-16 cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">Pick a color for your team badge</span>
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating team..." : "Create team"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep("invite")}
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                  >
                    Use a different invite code
                  </button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Success */}
          {step === "done" && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-2">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-xl">You're in!</CardTitle>
                <CardDescription>Share this code with your teammates so they can join</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">Team code</p>
                  <p className="text-2xl font-mono font-bold tracking-widest">{teamCode}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Share this code with up to 3 teammates</span>
                </div>

                <Button className="w-full" onClick={() => navigate("/dashboard")}>
                  Go to dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinEvent;
