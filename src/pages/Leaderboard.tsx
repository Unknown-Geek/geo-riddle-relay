import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/contexts/EventContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getLeaderboard, subscribeToLeaderboard } from "@/services/player-service";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import type { TeamRow } from "@/services/player-service";

type LeaderboardTeam = Pick<TeamRow, "id" | "name" | "current_score" | "status" | "team_color" | "team_code">;

const Leaderboard = () => {
  const { user } = useAuth();
  const { currentEvent } = useEvent();
  const { toast } = useToast();
  const eventId = currentEvent?.id;

  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!eventId) return;

    const load = async () => {
      try {
        const data = await getLeaderboard(eventId);
        setTeams(data ?? []);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error loading leaderboard", description: error?.message });
      } finally {
        setLoading(false);
      }
    };

    load();

    const unsubscribe = subscribeToLeaderboard(eventId, load);
    return unsubscribe;
  }, [eventId, toast]);

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AppShell role="player" eventName={currentEvent?.name}>
        <div className="p-6 space-y-3">
          <Skeleton className="h-8 w-40" />
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="player" eventName={currentEvent?.name}>
      <div className="p-4 sm:p-6 space-y-6">
        <PageHeader
          title="Leaderboard"
          description={currentEvent?.name ?? ""}
          actions={
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          }
        />

        {filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No teams yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Podium for top 3 */}
            {filteredTeams.length >= 3 && !search && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* 2nd place */}
                <Card className="text-center">
                  <CardContent className="p-3 pt-6">
                    <Medal className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs font-medium truncate">{filteredTeams[1].name}</p>
                    <p className="text-lg font-bold">{filteredTeams[1].current_score}</p>
                  </CardContent>
                </Card>
                {/* 1st place */}
                <Card className="border-primary/30 text-center">
                  <CardContent className="p-3 pt-4">
                    <Trophy className="h-8 w-8 text-warning mx-auto mb-1" />
                    <p className="text-xs font-medium truncate">{filteredTeams[0].name}</p>
                    <p className="text-xl font-bold">{filteredTeams[0].current_score}</p>
                  </CardContent>
                </Card>
                {/* 3rd place */}
                <Card className="text-center">
                  <CardContent className="p-3 pt-6">
                    <Award className="h-6 w-6 text-amber-700 mx-auto mb-1" />
                    <p className="text-xs font-medium truncate">{filteredTeams[2].name}</p>
                    <p className="text-lg font-bold">{filteredTeams[2].current_score}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Full table */}
            <Card>
              <div className="divide-y divide-border">
                {filteredTeams.map((team, index) => {
                  const position = index + 1;
                  const isTopThree = position <= 3;

                  return (
                    <div key={team.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm w-6 text-center ${isTopThree ? "font-bold" : "text-muted-foreground"}`}>
                          {position}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: team.team_color ?? "#5E6AD2" }}
                        />
                        <div>
                          <p className="text-sm font-medium">{team.name}</p>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] h-4">
                              {team.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{team.current_score}</p>
                        <p className="text-xs text-muted-foreground">pts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Leaderboard;
