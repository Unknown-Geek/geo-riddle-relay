import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleSlash, Clock } from "lucide-react";
import type { SubmissionRow } from "@/services/player-service";
import type { ReactNode } from "react";

interface SubmissionTimelineProps {
  submissions: SubmissionRow[];
}

const statusIcon: Record<string, ReactNode> = {
  correct: <CheckCircle2 className="h-4 w-4 text-success" />,
  incorrect: <CircleSlash className="h-4 w-4 text-destructive" />,
  invalid: <CircleSlash className="h-4 w-4 text-warning" />,
};

const statusVariant: Record<string, "default" | "destructive" | "secondary"> = {
  correct: "default",
  incorrect: "destructive",
  invalid: "secondary",
};

export const SubmissionTimeline = ({ submissions }: SubmissionTimelineProps) => {
  return (
    <Card className="glass-card border-glass-border h-full">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-foreground text-lg">Recent Attempts</CardTitle>
        <Badge variant="outline" className="flex items-center gap-1 text-[11px]">
          <Clock className="h-3 w-3" /> Live feed
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[240px] pr-4">
          <ul className="space-y-3">
            {submissions.map((submission) => {
              const createdAt = submission.submitted_at ? new Date(submission.submitted_at) : null;
              return (
                <li
                  key={submission.id}
                  className="flex items-start gap-3 border border-border/40 p-3 rounded-lg backdrop-blur-sm"
                >
                  {statusIcon[submission.status] ?? (
                    <CircleSlash className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={statusVariant[submission.status] ?? "secondary"}>
                        {submission.status}
                      </Badge>
                      {createdAt && (
                        <span className="text-[11px] text-muted-foreground">
                          {createdAt.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground mt-1 break-words">
                      Answer: <span className="font-medium">{submission.submitted_answer}</span>
                    </p>
                    {submission.points_awarded !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Points awarded: {submission.points_awarded}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
            {!submissions.length && (
              <li className="text-sm text-muted-foreground text-center py-8">
                No submissions yet. Your attempts will appear here in real-time.
              </li>
            )}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
