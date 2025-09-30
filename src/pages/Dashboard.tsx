import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Compass, Trophy, LogOut, AlertTriangle, ShieldAlert, Satellite } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import {
  getTeamByLeaderEmail,
  getCheckpointWithRiddles,
  getFirstActiveCheckpoint,
  getTeamSubmissions,
  submitRiddleAnswer,
  redeemHelpToken,
  subscribeToTeamUpdates,
  type TeamRow,
} from "@/services/player-service";
import { TeamSummary } from "@/components/dashboard/TeamSummary";
import { CheckpointMap } from "@/components/dashboard/CheckpointMap";
import { RiddleList } from "@/components/dashboard/RiddleList";
import { SubmissionTimeline } from "@/components/dashboard/SubmissionTimeline";
import { Skeleton } from "@/components/ui/skeleton";

const HELP_TOKENS_ALLOWED = 3;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
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

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, navigate, user]);

  // In the new system, user IS the team object, so no need to fetch separately
  const team = user;

  useEffect(() => {
    if (!team?.id) return;
    const unsubscribe = subscribeToTeamUpdates(team.id, () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", team.id] });
    });
    return unsubscribe;
  }, [queryClient, team?.id]);

  const checkpointQuery = useQuery({
    queryKey: ["checkpoint", team?.current_checkpoint_id, team?.status],
    queryFn: async () => {
      if (!team) return null;
      if (team.current_checkpoint_id) {
        return getCheckpointWithRiddles(team.current_checkpoint_id);
      }
      const fallback = await getFirstActiveCheckpoint();
      if (!fallback) return null;
      return getCheckpointWithRiddles(fallback.id);
    },
    enabled: !!team && team.status !== "completed",
  });

  const submissionsQuery = useQuery({
    queryKey: ["submissions", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      return getTeamSubmissions(team.id);
    },
    enabled: !!team?.id,
    staleTime: 5_000,
  });

  const checkpoint = checkpointQuery.data;
  const submissions = submissionsQuery.data ?? [];
  const helpTokensRemaining = Math.max(0, HELP_TOKENS_ALLOWED - (team?.help_tokens_used ?? 0));

  const distanceToCheckpoint = checkpoint
    ? distanceTo({ latitude: checkpoint.latitude, longitude: checkpoint.longitude })
    : null;
  const checkpointRadius = checkpoint?.radius_meters ?? 50;
  const checkpointUnlocked = distanceToCheckpoint !== null && distanceToCheckpoint <= checkpointRadius + 5;

  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: (payload: Parameters<typeof submitRiddleAnswer>[0]) => submitRiddleAnswer(payload),
    onMutate: (variables) => {
      setActiveSubmissionId(variables.riddleId);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Answer submitted",
        description: data?.message ?? "We recorded your attempt.",
      });
      queryClient.invalidateQueries({ queryKey: ["submissions", team?.id] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: err?.message ?? "Please try again in a moment.",
      });
    },
    onSettled: () => {
      setActiveSubmissionId(null);
    },
  });

  const helpMutation = useMutation({
    mutationFn: (payload: Parameters<typeof redeemHelpToken>[0]) => redeemHelpToken(payload),
    onMutate: (variables) => {
      setActiveHelpId(variables.riddleId);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Help token redeemed",
        description: data?.hint ?? "Hint granted. Check your notifications!",
      });
      // Team data is already in user object, no need to invalidate
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Unable to redeem token",
        description: err?.message ?? "Try again or contact an admin.",
      });
    },
    onSettled: () => {
      setActiveHelpId(null);
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const renderLoading = () => (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="text-center space-y-4">
        <Compass className="h-12 w-12 text-primary mx-auto animate-spin" />
        <p className="text-foreground">Preparing your treasure hunt dashboard...</p>
      </div>
    </div>
  );

  if (loading) {
    return renderLoading();
  }

  if (!user) {
    return renderLoading();
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="flex justify-between items-center p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Campus Treasure Hunt</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate("/leaderboard")} className="glass-card">
            <Trophy className="h-4 w-4 mr-2" /> Leaderboard
          </Button>
          <Button variant="outline" onClick={handleSignOut} className="glass-card">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {permission !== "granted" && (
          <Alert variant="destructive" className="glass-card border-destructive/40">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Enable location services</AlertTitle>
            <AlertDescription>
              We need precise GPS access to unlock riddles. {" "}
              <button className="underline text-destructive-foreground" onClick={requestPermission}>
                Tap to request permission again.
              </button>
            </AlertDescription>
          </Alert>
        )}

        {geolocationError && (
          <Alert variant="destructive" className="glass-card border-destructive/40">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Location issue</AlertTitle>
            <AlertDescription>{geolocationError}</AlertDescription>
          </Alert>
        )}

        {suspicious && (
          <Alert className="glass-card border-warning/40 bg-warning/10">
            <Satellite className="h-4 w-4 text-warning" />
            <AlertTitle>Location anomaly detected</AlertTitle>
            <AlertDescription>
              Slow down—your signal looks unstable. We may lock submissions if spoofing continues.
            </AlertDescription>
          </Alert>
        )}

        {!team && (
          <Card className="glass-card border-glass-border max-w-xl mx-auto p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">No team found</h2>
            <p className="text-muted-foreground">
              You need to register a team before joining the treasure hunt.
            </p>
            <Button className="bg-gradient-primary hover:glow-primary" onClick={() => navigate("/register")}>Register your team</Button>
          </Card>
        )}

        {team && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <TeamSummary team={team as TeamRow} helpTokensRemaining={helpTokensRemaining} />
                <CheckpointMap
                  checkpoint={checkpoint}
                  reading={reading}
                  suspicious={suspicious}
                  distanceToCheckpoint={distanceToCheckpoint}
                />
              </div>

              <div>
                {checkpointQuery.isLoading ? (
                  <Card className="glass-card border-glass-border p-8">
                    <Skeleton className="h-8 w-1/3 mb-4" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full mt-4" />
                  </Card>
                ) : (
                  <RiddleList
                    riddles={checkpoint?.riddles ?? []}
                    submissions={submissions}
                    unlocked={checkpointUnlocked}
                    helpTokensRemaining={helpTokensRemaining}
                    loadingRiddleId={activeSubmissionId}
                    helpLoadingId={activeHelpId}
                    onSubmit={async (riddleId, answer) => {
                      if (!team || !checkpoint) return;
                      if (!checkpointUnlocked) {
                        toast({
                          variant: "destructive",
                          title: "Checkpoint still locked",
                          description: "Move closer to the landmark to submit your answer.",
                        });
                        return;
                      }
                      if (!answer.trim()) {
                        toast({
                          variant: "destructive",
                          title: "Enter an answer",
                          description: "Your team must provide an answer before submitting.",
                        });
                        return;
                      }
                      await submitMutation.mutateAsync({
                        teamId: team.id,
                        riddleId,
                        checkpointId: checkpoint.id,
                        answer,
                        latitude: reading?.latitude,
                        longitude: reading?.longitude,
                      });
                    }}
                    onRedeemHelpToken={async (riddleId) => {
                      if (!team || !checkpoint) return;
                      if (helpTokensRemaining <= 0) {
                        toast({
                          variant: "destructive",
                          title: "No help tokens left",
                          description: "You've used all available hints at this checkpoint.",
                        });
                        return;
                      }
                      await helpMutation.mutateAsync({
                        teamId: team.id,
                        checkpointId: checkpoint.id,
                        riddleId,
                      });
                    }}
                  />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <SubmissionTimeline submissions={submissions} />
              <Card className="glass-card border-glass-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Checkpoint intel</h3>
                {checkpoint ? (
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li><strong className="text-foreground">Location:</strong> {checkpoint.name}</li>
                    {checkpoint.clue_text && (
                      <li><strong className="text-foreground">Clue:</strong> {checkpoint.clue_text}</li>
                    )}
                    {checkpoint.help_token_hint && (
                      <li><strong className="text-foreground">Help token hint:</strong> {checkpoint.help_token_hint}</li>
                    )}
                    <li><strong className="text-foreground">Radius:</strong> {checkpointRadius} m</li>
                    {distanceToCheckpoint !== null && (
                      <li>
                        <strong className="text-foreground">Distance:</strong> {Math.round(distanceToCheckpoint)} m
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Awaiting your first checkpoint...</p>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;