import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TeamRow = Tables<"teams">;
export type CheckpointRow = Tables<"checkpoints">;
export type RiddleRow = Omit<Tables<"riddles">, "correct_answer"> & { correct_answer?: never };
export type SubmissionRow = Tables<"submissions">;
export type EventRow = Tables<"events">;

export interface CheckpointWithRiddles extends CheckpointRow {
  riddles: RiddleRow[];
}

// ============================================
// Event queries
// ============================================

export async function getEventByInviteCode(code: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("invite_code", code)
    .single();

  if (error) throw error;
  return data as EventRow;
}

export async function getEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data as EventRow;
}

// ============================================
// Team queries
// ============================================

export async function getTeamForEvent(eventId: string, userId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("team_id, teams(*)")
    .eq("user_id", userId)
    .eq("teams.event_id", eventId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data?.teams as TeamRow | null;
}

export async function createTeam(eventId: string, userId: string, name: string, teamColor: string) {
  const { data, error } = await supabase
    .from("teams")
    .insert({
      name,
      event_id: eventId,
      leader_id: userId,
      leader_email: "", // No longer required for auth, but schema needs it
      password_hash: "", // Supabase Auth handles auth now
      member_names: [],
      team_color: teamColor,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  // Add leader as team member
  await supabase.from("team_members").insert({
    team_id: data.id,
    user_id: userId,
    display_name: "",
  });

  return data as TeamRow;
}

export async function joinTeamByCode(teamCode: string, userId: string, displayName: string) {
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, member_names")
    .eq("team_code", teamCode)
    .single();

  if (teamError) throw teamError;

  // Check if already a member
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) throw new Error("Already a member of this team");

  // Check team size (max 4)
  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team.id);

  if ((count ?? 0) >= 4) throw new Error("Team is full (max 4 members)");

  const { error } = await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: userId,
    display_name: displayName,
  });

  if (error) throw error;
  return team;
}

export async function getTeamMembers(teamId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, display_name, user_id, profiles(full_name, avatar_url)")
    .eq("team_id", teamId);

  if (error) throw error;
  return data;
}

// ============================================
// Checkpoint & Riddle queries
// ============================================

export async function getCheckpointWithRiddles(checkpointId: string) {
  // Use the player_riddles view which excludes correct_answer
  const { data: checkpoint, error: cpError } = await supabase
    .from("checkpoints")
    .select("*")
    .eq("id", checkpointId)
    .maybeSingle();

  if (cpError) throw cpError;
  if (!checkpoint) return null;

  // Fetch riddles without correct_answer for players
  const { data: riddles, error: riddleError } = await supabase
    .from("player_riddles")
    .select("*")
    .eq("checkpoint_id", checkpointId);

  if (riddleError) throw riddleError;

  return {
    ...checkpoint,
    riddles: riddles ?? [],
  } satisfies CheckpointWithRiddles;
}

export async function getFirstActiveCheckpoint(eventId: string) {
  const { data, error } = await supabase
    .from("checkpoints")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("order_number", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as CheckpointRow | null;
}

// ============================================
// Submissions
// ============================================

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

// ============================================
// Leaderboard
// ============================================

export async function getLeaderboard(eventId: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, current_score, status, team_color, team_code")
    .eq("event_id", eventId)
    .order("current_score", { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================
// Real-time subscriptions
// ============================================

export function subscribeToTeamUpdates(teamId: string, callback: () => void) {
  const channel = supabase
    .channel(`teams-${teamId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "teams", filter: `id=eq.${teamId}` },
      callback
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToLeaderboard(eventId: string, callback: () => void) {
  const channel = supabase
    .channel(`leaderboard-${eventId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "teams", filter: `event_id=eq.${eventId}` },
      callback
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
