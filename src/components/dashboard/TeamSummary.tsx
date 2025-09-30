import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import type { TeamRow } from "@/services/player-service";

interface TeamSummaryProps {
  team: TeamRow;
  helpTokensRemaining: number;
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  completed: "secondary",
  pending: "outline",
  disqualified: "destructive",
};

export const TeamSummary = ({ team, helpTokensRemaining }: TeamSummaryProps) => {
  const normalizedStatus = ((team.status ?? "pending") as string).toLowerCase();
  const badgeVariant = statusVariant[normalizedStatus] ?? "outline";
  const statusLabel = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  const initials = team.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="glass-card border-glass-border h-full">
      <CardHeader className="flex flex-row items-center gap-3">
        <Avatar
          className="h-12 w-12 border border-primary/40 shadow-[0_0_18px_rgba(0,217,255,0.35)]"
          style={{ backgroundColor: team.team_color ?? undefined }}
        >
          {team.avatar_url ? <AvatarImage src={team.avatar_url} alt={team.name} /> : <AvatarFallback>{initials}</AvatarFallback>}
        </Avatar>
        <div>
          <CardTitle className="text-foreground text-xl flex items-center gap-2">
            {team.name}
            <Badge variant={badgeVariant}>{statusLabel}</Badge>
          </CardTitle>
          <CardDescription className="text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> {team.member_names.length} players
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Current score</p>
          <p className="text-2xl font-bold text-foreground">{team.current_score ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Help tokens left</p>
          <p className="text-2xl font-bold text-foreground">{helpTokensRemaining}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">Members</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {team.member_names.map((member) => (
              <Badge key={member} variant="outline" className="text-xs">
                {member}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
