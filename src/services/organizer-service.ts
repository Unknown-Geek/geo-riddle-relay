import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// ============================================
// Event management
// ============================================

export async function getOrganizerEvents(organizerId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createEvent(payload: {
  name: string;
  description?: string;
  coverImageUrl?: string;
  organizerId: string;
  settings?: Record<string, any>;
}) {
  // Generate slug from name
  const slug = payload.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("events")
    .insert({
      name: payload.name,
      slug,
      description: payload.description ?? null,
      cover_image_url: payload.coverImageUrl ?? null,
      organizer_id: payload.organizerId,
      status: "draft",
      settings: payload.settings ?? {
        help_tokens_per_team: 3,
        max_teams: 50,
        max_time_minutes: 180,
        time_penalty_per_minute: 5,
      },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEvent(eventId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) throw error;
}

export async function getEventStats(eventId: string) {
  const { count: totalTeams } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { count: activeTeams } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "active");

  const { count: completedTeams } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "completed");

  const { count: totalCheckpoints } = await supabase
    .from("checkpoints")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  return {
    totalTeams: totalTeams ?? 0,
    activeTeams: activeTeams ?? 0,
    completedTeams: completedTeams ?? 0,
    totalCheckpoints: totalCheckpoints ?? 0,
  };
}

// ============================================
// Checkpoint management
// ============================================

export async function getEventCheckpoints(eventId: string) {
  const { data, error } = await supabase
    .from("checkpoints")
    .select("*")
    .eq("event_id", eventId)
    .order("order_number", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCheckpoint(payload: {
  eventId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  orderNumber: number;
  clueText: string;
  helpTokenHint?: string;
}) {
  const { data, error } = await supabase
    .from("checkpoints")
    .insert({
      event_id: payload.eventId,
      name: payload.name,
      description: payload.description ?? null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      radius_meters: payload.radiusMeters ?? 50,
      order_number: payload.orderNumber,
      clue_text: payload.clueText,
      help_token_hint: payload.helpTokenHint ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCheckpoint(checkpointId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("checkpoints")
    .update(updates)
    .eq("id", checkpointId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCheckpoint(checkpointId: string) {
  const { error } = await supabase
    .from("checkpoints")
    .delete()
    .eq("id", checkpointId);

  if (error) throw error;
}

// ============================================
// Riddle management
// ============================================

export async function getCheckpointRiddles(checkpointId: string) {
  const { data, error } = await supabase
    .from("riddles")
    .select("*")
    .eq("checkpoint_id", checkpointId)
    .order("order_number", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createRiddle(payload: {
  checkpointId: string;
  question: string;
  correctAnswer: string;
  maxPoints?: number;
  timePenaltyPerMinute?: number;
  orderNumber?: number;
}) {
  const { data, error } = await supabase
    .from("riddles")
    .insert({
      checkpoint_id: payload.checkpointId,
      question: payload.question,
      correct_answer: payload.correctAnswer,
      max_points: payload.maxPoints ?? 100,
      time_penalty_per_minute: payload.timePenaltyPerMinute ?? 5,
      order_number: payload.orderNumber ?? 1,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRiddle(riddleId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("riddles")
    .update(updates)
    .eq("id", riddleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRiddle(riddleId: string) {
  const { error } = await supabase
    .from("riddles")
    .delete()
    .eq("id", riddleId);

  if (error) throw error;
}

// ============================================
// Team management
// ============================================

export async function getEventTeams(eventId: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("*, team_members(count)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateTeamStatus(teamId: string, status: string) {
  const { error } = await supabase
    .from("teams")
    .update({ status })
    .eq("id", teamId);

  if (error) throw error;
}

export async function resetEventScores(eventId: string) {
  const { error: teamsError } = await supabase
    .from("teams")
    .update({
      current_score: 0,
      status: "pending",
      completed_at: null,
      help_tokens_used: 0,
    })
    .eq("event_id", eventId);

  if (teamsError) throw teamsError;

  // Clear submissions
  const { error: subError } = await supabase
    .from("submissions")
    .delete()
    .in("team_id", (
      await supabase.from("teams").select("id").eq("event_id", eventId)
    ).data?.map(t => t.id) ?? []);

  if (subError) throw subError;
}

// ============================================
// Activity logs
// ============================================

export async function getEventActivityLogs(eventId: string) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
}

// ============================================
// Export
// ============================================

export async function exportEventResults(eventId: string) {
  const { data, error } = await supabase.functions.invoke("export-results", {
    body: { eventId },
  });

  if (error) throw error;
  return data;
}
