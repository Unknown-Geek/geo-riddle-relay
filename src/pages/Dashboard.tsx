import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/contexts/EventContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Compass, MapPin, Trophy, HelpCircle, Lock, Unlock,
  Send, Clock, Users, ArrowRight, LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import {
  getTeamForEvent,
  getCheckpointWithRiddles,
  getFirstActiveCheckpoint,
  getTeamSubmissions,
  submitRiddleAnswer,
  redeemHelpToken,
  subscribeToTeamUpdates,
  type TeamRow,
} from "@/services/player-service";
import { CheckpointMap } from "@/components/dashboard/CheckpointMap";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Breadcrumbs } from "@/components/layout/PageHeader";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { currentEvent, events } = useEvent();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    reading,
    suspicious,
    permission,
    error: geolocationError,
    distanceTo,
    requestPermission,
  } = useGeolocation();

  const eventId = currentEvent?.id;
  const helpTokensAllowed = currentEvent?.settings?.help_tokens_per_team ?? 3;

  // Get team for this event
  const teamQuery = useQuery({
    queryKey: ["team", eventId, user?.id],
    queryFn: () => getTeamForEvent(eventId!, user!.id),
    enabled: !!eventId && !!user,
  });

  const team = teamQuery.data;

  // Subscribe to team updates
  useEffect(() => {
    if (!team?.id) return;
    const unsubscribe = subscribeToTeamUpdates(team.id, () => {
      queryClient.invalidateQueries({ queryKey: ["team", eventId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["submissions", team.id] });
    });
    return unsubscribe;
  }, [queryClient, team?.id, eventId, user?.id]);

  // Get current checkpoint
  const checkpointQuery = useQuery({
    queryKey: ["checkpoint", team?.current_checkpoint_id, team?.status, eventId],
    queryFn: async () => {
      if (!team || !eventId) return null;
      if (team.current_checkpoint_id) {
        return getCheckpointWithRiddles(team.current_checkpoint_id);
      }
      const fallback = await getFirstActiveCheckpoint(eventId);
      if (!fallback) return null;
      return getCheckpointWithRiddles(fallback.id);
    },
    enabled: !!team && team.status !== "completed",
  });

  // Get submissions
  const submissionsQuery = useQuery({
    queryKey: ["submissions", team?.id],
    queryFn: () => getTeamSubmissions(team!.id),
    enabled: !!team?.id,
    staleTime: 5_000,
  });

  const checkpoint = checkpointQuery.data;
  const submissions = submissionsQuery.data ?? [];
  const helpTokensRemaining = Math.max(0, helpTokensAllowed - (team?.help_tokens_used ?? 0));

  const distanceToCheckpoint = checkpoint
    ? distanceTo({ latitude: checkpoint.latitude, longitude: checkpoint.longitude })
    : null;
  const checkpointRadius = checkpoint?.radius_meters ?? 50;
  const checkpointUnlocked = distanceToCheckpoint !== null && distanceToCheckpoint <= checkpointRadius + 5;

  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});

  const submitMutation = useMutation({
    mutationFn: submitRiddleAnswer,
    onMutate: (variables) => setActiveSubmissionId(variables.riddleId),
    onSuccess: (data: any) => {
      toast({ title: "Answer submitted", description: data?.message ?? "Your answer was recorded." });
      queryClient.invalidateQueries({ queryKey: ["submissions", team?.id] });
      queryClient.invalidateQueries({ queryKey: ["team", eventId, user?.id] });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Submission failed", description: err?.message ?? "Please try again." });
    },
    onSettled: () => setActiveSubmissionId(null),
  });

  const helpMutation = useMutation({
    mutationFn: redeemHelpToken,
    onMutate: (variables) => setActiveHelpId(variables.riddleId),
    onSuccess: (data: any) => {
      toast({ title: "Hint revealed", description: data?.hint ?? "Check your riddle for the hint." });
      queryClient.invalidateQueries({ queryKey: ["team", eventId, user?.id] });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Unable to redeem token", description: err?.message ?? "Try again." });
    },
    onSettled: () => setActiveHelpId(null),
  });

  if (!user || teamQuery.isLoading) {
    return (
      <AppShell role="player" eventName={currentEvent?.name}>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!eventId && events.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>No events yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Join an event using an invite code from your organizer.
            </p>
            <Button className="w-full" onClick={() => navigate("/join")}>
              Join an event
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const riddles = checkpoint?.riddles ?? [];
  const solvedRiddleIds = new Set(submissions.filter(s => s.status === "correct").map(s => s.riddle_id));
  const unsolvedRiddles = riddles.filter(r => !solvedRiddleIds.has(r.id));

  return (
    <AppShell role="player" eventName={currentEvent?.name}>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Page header */}
        <div>
          <Breadcrumbs items={[
            { label: "Events", href: "/dashboard" },
            { label: currentEvent?.name ?? "Game" },
          ]} />
          <PageHeader
            title={team?.name ?? "Dashboard"}
            description={currentEvent?.name ?? ""}
            actions={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/leaderboard")}>
                  <Trophy className="h-4 w-4 mr-1.5" /> Leaderboard
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            }
          />
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="text-2xl font-bold">{team?.current_score ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={team?.status === "active" ? "default" : "secondary"} className="mt-1">
                {team?.status ?? "pending"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Hints left</p>
              <p className="text-2xl font-bold">{helpTokensRemaining}</p>
            </CardContent>
          </Card>
        </div>

        {/* GPS Permission Alert */}
        {permission !== "granted" && (
          <Card className="border-destructive/50">
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Location access required</p>
                <p className="text-xs text-muted-foreground">GPS is needed to unlock checkpoints</p>
              </div>
              <Button size="sm" variant="outline" onClick={requestPermission}>Enable</Button>
            </CardContent>
          </Card>
        )}

        {/* Map */}
        <CheckpointMap
          checkpoint={checkpoint}
          reading={reading}
          suspicious={suspicious}
          distanceToCheckpoint={distanceToCheckpoint}
        />

        {/* Checkpoint info */}
        {checkpoint && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{checkpoint.name}</CardTitle>
                {checkpointUnlocked ? (
                  <Badge className="bg-success text-success-foreground">
                    <Unlock className="h-3 w-3 mr-1" /> Unlocked
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" /> {Math.round(distanceToCheckpoint ?? 0)}m away
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {checkpoint.clue_text && (
                <p className="text-sm text-muted-foreground">{checkpoint.clue_text}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Riddles */}
        {unsolvedRiddles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Riddles {checkpointUnlocked ? "" : "(unlock checkpoint first)"}
            </h3>
            {unsolvedRiddles.map((riddle) => {
              const isSubmitting = activeSubmissionId === riddle.id;
              const isHelpLoading = activeHelpId === riddle.id;
              const submittedAnswer = answerInputs[riddle.id] ?? "";

              return (
                <Card key={riddle.id} className={!checkpointUnlocked ? "opacity-60" : ""}>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm">{riddle.question}</p>

                    {checkpointUnlocked && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Your answer"
                          value={submittedAnswer}
                          onChange={(e) =>
                            setAnswerInputs(prev => ({ ...prev, [riddle.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && submittedAnswer.trim() && team && checkpoint) {
                              submitMutation.mutate({
                                teamId: team.id,
                                riddleId: riddle.id,
                                checkpointId: checkpoint.id,
                                answer: submittedAnswer.trim(),
                                latitude: reading?.latitude,
                                longitude: reading?.longitude,
                              });
                            }
                          }}
                          disabled={isSubmitting}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!submittedAnswer.trim() || !team || !checkpoint) return;
                            submitMutation.mutate({
                              teamId: team.id,
                              riddleId: riddle.id,
                              checkpointId: checkpoint.id,
                              answer: submittedAnswer.trim(),
                              latitude: reading?.latitude,
                              longitude: reading?.longitude,
                            });
                          }}
                          disabled={isSubmitting || !submittedAnswer.trim()}
                        >
                          {isSubmitting ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {riddle.max_points ?? 100} points
                      </span>
                      {helpTokensRemaining > 0 && checkpointUnlocked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            if (!team || !checkpoint) return;
                            helpMutation.mutate({
                              teamId: team.id,
                              checkpointId: checkpoint.id,
                              riddleId: riddle.id,
                            });
                          }}
                          disabled={isHelpLoading}
                        >
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Use hint ({helpTokensRemaining} left)
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Completed */}
        {team?.status === "completed" && (
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <Trophy className="h-8 w-8 text-warning mx-auto" />
              <h3 className="text-lg font-semibold">Hunt complete!</h3>
              <p className="text-muted-foreground">Final score: {team.current_score} points</p>
              <Button variant="outline" onClick={() => navigate("/leaderboard")}>
                View leaderboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent submissions */}
        {submissions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Recent submissions</h3>
            {submissions.slice(0, 5).map((sub) => (
              <Card key={sub.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="text-sm truncate">{sub.submitted_answer}</div>
                  <Badge variant={sub.status === "correct" ? "default" : "secondary"} className="text-xs">
                    {sub.status === "correct" ? `+${sub.points_awarded}` : sub.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Dashboard;
