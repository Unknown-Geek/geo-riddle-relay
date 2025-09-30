import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Lock, Unlock, Trophy } from "lucide-react";
import type { RiddleRow, SubmissionRow } from "@/services/player-service";

interface RiddleListProps {
  riddles: RiddleRow[];
  submissions: SubmissionRow[];
  unlocked: boolean;
  helpTokensRemaining: number;
  onSubmit: (riddleId: string, answer: string) => Promise<void>;
  onRedeemHelpToken: (riddleId: string) => Promise<void>;
  loadingRiddleId: string | null;
  helpLoadingId: string | null;
}

const getSubmissionStatus = (submissions: SubmissionRow[]) => {
  const map = new Map<string, SubmissionRow>();
  submissions.forEach((submission) => {
    if (!map.has(submission.riddle_id) || submission.submitted_at! > (map.get(submission.riddle_id)?.submitted_at ?? "")) {
      map.set(submission.riddle_id, submission);
    }
  });
  return map;
};

export const RiddleList = ({
  riddles,
  submissions,
  unlocked,
  helpTokensRemaining,
  onSubmit,
  onRedeemHelpToken,
  loadingRiddleId,
  helpLoadingId,
}: RiddleListProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const statusMap = useMemo(() => getSubmissionStatus(submissions), [submissions]);

  if (!riddles?.length) {
    return (
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="text-foreground">Riddles</CardTitle>
          <CardDescription className="text-muted-foreground">Waiting for checkpoint assignment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {riddles.map((riddle, index) => {
        const submission = statusMap.get(riddle.id);
        const solved = submission?.status === "correct";
        const locked = !unlocked && !solved;

        return (
          <Card key={riddle.id} className="glass-card border-glass-border overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  Riddle {index + 1}
                  {solved && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      <Trophy className="h-3 w-3 text-warning" /> Solved
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Answers unlock the clue to your next location.
                </CardDescription>
              </div>
              <Badge variant={locked ? "outline" : "default"} className="flex items-center gap-1">
                {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />} {locked ? "Locked" : "Unlocked"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className={`transition-glow ${locked ? "blur-sm select-none pointer-events-none" : ""}`}>
                <p className="text-foreground/90 leading-relaxed mb-4">{riddle.question}</p>
                <form
                  className="flex flex-col sm:flex-row gap-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (locked || solved) return;
                    await onSubmit(riddle.id, answers[riddle.id] ?? "");
                    setAnswers((prev) => ({ ...prev, [riddle.id]: "" }));
                  }}
                >
                  <Input
                    value={answers[riddle.id] ?? ""}
                    onChange={(event) => setAnswers((prev) => ({ ...prev, [riddle.id]: event.target.value }))}
                    placeholder="Enter your answer"
                    className="bg-input border-border"
                    required
                    disabled={solved || locked || loadingRiddleId === riddle.id}
                  />
                  <Button
                    type="submit"
                    className="bg-gradient-primary hover:glow-primary"
                    disabled={solved || locked || loadingRiddleId === riddle.id}
                  >
                    {loadingRiddleId === riddle.id ? "Submitting..." : solved ? "Solved" : "Submit"}
                  </Button>
                </form>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {submission
                    ? submission.status === "correct"
                      ? `Answered at ${new Date(submission.submitted_at ?? "").toLocaleTimeString()}`
                      : `Last attempt: "${submission.submitted_answer}"` 
                    : "No attempts yet"}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Attempts: {submissions.filter((s) => s.riddle_id === riddle.id).length}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-accent flex items-center gap-1"
                    disabled={helpTokensRemaining <= 0 || helpLoadingId === riddle.id}
                    onClick={async () => {
                      await onRedeemHelpToken(riddle.id);
                    }}
                  >
                    <HelpCircle className="h-4 w-4" />
                    {helpLoadingId === riddle.id ? "Requesting..." : `Help Token (${helpTokensRemaining})`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
