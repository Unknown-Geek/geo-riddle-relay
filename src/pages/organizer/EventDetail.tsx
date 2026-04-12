import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/contexts/EventContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, MapPin, Trophy, Activity, Settings, Play, Pause,
  Square, Download, RotateCcw, Copy, Plus, Trash2, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getEventStats,
  getEventCheckpoints,
  getCheckpointRiddles,
  getEventTeams,
  getEventActivityLogs,
  updateEvent,
  updateTeamStatus,
  resetEventScores,
  exportEventResults,
  createCheckpoint,
  createRiddle,
  deleteCheckpoint,
  deleteRiddle,
} from "@/services/organizer-service";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Breadcrumbs } from "@/components/layout/PageHeader";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  completed: "secondary",
};

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { currentEvent, events, setCurrentEvent } = useEvent();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load event from context or fetch
  const event = currentEvent?.slug === slug
    ? currentEvent
    : events.find(e => e.slug === slug);

  const eventId = event?.id;

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["event-stats", eventId],
    queryFn: () => getEventStats(eventId!),
    enabled: !!eventId,
  });

  const { data: checkpoints = [], isLoading: cpLoading } = useQuery({
    queryKey: ["event-checkpoints", eventId],
    queryFn: () => getEventCheckpoints(eventId!),
    enabled: !!eventId,
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["event-teams", eventId],
    queryFn: () => getEventTeams(eventId!),
    enabled: !!eventId,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["event-logs", eventId],
    queryFn: () => getEventActivityLogs(eventId!),
    enabled: !!eventId,
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: (status: string) => updateEvent(eventId!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-stats", eventId] });
      toast({ title: "Event status updated" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetEventScores(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-stats", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-teams", eventId] });
      toast({ title: "Scores reset" });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => exportEventResults(eventId!),
    onSuccess: (data) => {
      // Trigger CSV download
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event?.name ?? "event"}-results.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Results exported" });
    },
  });

  const copyInviteCode = () => {
    navigator.clipboard.writeText(event?.invite_code ?? "");
    toast({ title: "Invite code copied!" });
  };

  if (!event) {
    return (
      <AppShell role="organizer">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Event not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/organize")}>
            Back to events
          </Button>
        </div>
      </AppShell>
    );
  }

  const isDraft = event.status === "draft";
  const isActive = event.status === "active";

  return (
    <AppShell role="organizer">
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <Breadcrumbs items={[
            { label: "Events", href: "/organize" },
            { label: event.name },
          ]} />
          <PageHeader
            title={event.name}
            description={event.description ?? undefined}
            actions={
              <div className="flex items-center gap-2">
                <Badge variant={statusColors[event.status] ?? "secondary"}>
                  {event.status}
                </Badge>
                {isDraft && (
                  <Button size="sm" onClick={() => statusMutation.mutate("active")}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Start
                  </Button>
                )}
                {isActive && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => statusMutation.mutate("paused")}>
                      <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      if (confirm("End this event? This cannot be undone.")) {
                        statusMutation.mutate("completed");
                      }
                    }}>
                      <Square className="h-3.5 w-3.5 mr-1" /> End
                    </Button>
                  </>
                )}
                {event.status === "paused" && (
                  <Button size="sm" onClick={() => statusMutation.mutate("active")}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Resume
                  </Button>
                )}
              </div>
            }
          />
        </div>

        {/* Invite code */}
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Invite code:</span>
              <code className="text-sm font-mono font-bold">{event.invite_code}</code>
            </div>
            <Button variant="ghost" size="sm" onClick={copyInviteCode}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total teams</p>
                  <p className="text-2xl font-bold">{stats?.totalTeams ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats?.activeTeams ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats?.completedTeams ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Checkpoints</p>
                  <p className="text-2xl font-bold">{stats?.totalCheckpoints ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportMutation.mutate()}
                  disabled={exportMutation.isPending}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Export results
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Reset all scores? This cannot be undone.")) {
                      resetMutation.mutate();
                    }
                  }}
                  disabled={resetMutation.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset scores
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checkpoints */}
          <TabsContent value="checkpoints" className="space-y-3 mt-4">
            {cpLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
            ) : (
              checkpoints.map((cp: any, index: number) => (
                <Card key={cp.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">#{index + 1} {cp.name}</span>
                          <Badge variant="outline" className="text-[10px]">{cp.radius_meters}m radius</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {cp.latitude}, {cp.longitude}
                        </p>
                        {cp.clue_text && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Clue: {cp.clue_text}
                          </p>
                        )}
                      </div>
                      {(isDraft) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={async () => {
                            await deleteCheckpoint(cp.id);
                            queryClient.invalidateQueries({ queryKey: ["event-checkpoints", eventId] });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            {isDraft && (
              <Button variant="outline" className="w-full" onClick={() => navigate(`/organize/${slug}/edit`)}>
                <Plus className="h-4 w-4 mr-1.5" /> Add checkpoint
              </Button>
            )}
          </TabsContent>

          {/* Teams */}
          <TabsContent value="teams" className="mt-4">
            {teamsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : teams.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No teams registered yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="divide-y divide-border">
                  {teams.map((team: any) => (
                    <div key={team.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: team.team_color ?? "#5E6AD2" }}
                        />
                        <div>
                          <p className="text-sm font-medium">{team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {team.team_members?.[0]?.count ?? 0} members
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{team.current_score} pts</span>
                        <Badge variant={team.status === "active" ? "default" : "secondary"} className="text-xs">
                          {team.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="mt-4">
            {logsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : logs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="divide-y divide-border">
                  {logs.map((log: any) => (
                    <div key={log.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{log.description}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.action_type}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default EventDetail;
