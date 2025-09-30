import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TeamRow = Tables<"teams">;
export type CheckpointRow = Tables<"checkpoints">;
export type RiddleRow = Tables<"riddles">;
export type SubmissionRow = Tables<"submissions">;

export interface CheckpointWithRiddles extends CheckpointRow {
  riddles: RiddleRow[];
}

export async function getTeamByLeaderEmail(email: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("leader_email", email)
    .maybeSingle();

  if (error) throw error;
  return data as TeamRow | null;
}

export async function getCheckpointWithRiddles(checkpointId: string) {
  const { data, error } = await supabase
    .from("checkpoints")
    .select(`*, riddles(* )`)
    .eq("id", checkpointId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  const casted = {
    ...(data as CheckpointRow),
    riddles: (data as any).riddles as RiddleRow[],
  } satisfies CheckpointWithRiddles;

  return casted;
}

export async function getFirstActiveCheckpoint() {
  const { data, error } = await supabase
    .from("checkpoints")
    .select("*")
    .eq("is_active", true)
    .order("order_number", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as CheckpointRow | null;
}

export async function getTeamSubmissions(teamId: string) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("team_id", teamId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SubmissionRow[];
}

export async function submitRiddleAnswer(payload: {
  teamId: string;
  riddleId: string;
  checkpointId: string;
  answer: string;
  latitude?: number;
  longitude?: number;
}) {
  const { data, error } = await supabase.functions.invoke("submit-riddle", {
    body: payload,
  });

  if (error) throw error;
  return data;
}

export async function redeemHelpToken(payload: {
  teamId: string;
  checkpointId: string;
  riddleId: string;
}) {
  const { data, error } = await supabase.functions.invoke("redeem-help-token", {
    body: payload,
  });

  if (error) throw error;
  return data;
}

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, current_score, status, member_names, avatar_url, team_color")
    .order("current_score", { ascending: false });

  if (error) throw error;
  return data as Array<Pick<TeamRow, "id" | "name" | "current_score" | "status" | "member_names" | "avatar_url" | "team_color" >>;
}

export function subscribeToTeamUpdates(teamId: string, callback: () => void) {
  const channel = supabase
    .channel(`teams-${teamId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "teams",
        filter: `id=eq.${teamId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToLeaderboard(callback: () => void) {
  const channel = supabase
    .channel("leaderboard-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "teams",
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
