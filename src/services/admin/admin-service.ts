import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TeamRow = Tables<"teams">;
export type CheckpointRow = Tables<"checkpoints">;
export type RiddleRow = Tables<"riddles">;
export type SubmissionRow = Tables<"submissions">;
export type ActivityLogRow = Tables<"activity_logs">;

// Teams CRUD
export async function getAllTeams() {
  const { data, error } = await supabase.from("teams").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as TeamRow[];
}

export async function updateTeam(id: string, updates: Partial<TeamRow>) {
  const { data, error } = await supabase.from("teams").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as TeamRow;
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// Checkpoints CRUD
export async function getAllCheckpoints() {
  const { data, error } = await supabase.from("checkpoints").select("*").order("order_number", { ascending: true });
  if (error) throw error;
  return data as CheckpointRow[];
}

export async function createCheckpoint(payload: Omit<CheckpointRow, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("checkpoints").insert(payload).select().single();
  if (error) throw error;
  return data as CheckpointRow;
}

export async function updateCheckpoint(id: string, updates: Partial<CheckpointRow>) {
  const { data, error } = await supabase.from("checkpoints").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as CheckpointRow;
}

export async function deleteCheckpoint(id: string) {
  const { error } = await supabase.from("checkpoints").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// Riddles CRUD
export async function getRiddlesByCheckpoint(checkpointId: string) {
  const { data, error } = await supabase.from("riddles").select("*").eq("checkpoint_id", checkpointId).order("order_number");
  if (error) throw error;
  return data as RiddleRow[];
}

export async function createRiddle(payload: Omit<RiddleRow, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("riddles").insert(payload).select().single();
  if (error) throw error;
  return data as RiddleRow;
}

export async function updateRiddle(id: string, updates: Partial<RiddleRow>) {
  const { data, error } = await supabase.from("riddles").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as RiddleRow;
}

export async function deleteRiddle(id: string) {
  const { error } = await supabase.from("riddles").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// Activity Logs
export async function getActivityLogs(limit = 50) {
  const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data as ActivityLogRow[];
}

// Game Settings
export async function getGameSettings() {
  const { data, error } = await supabase.from("game_settings").select("*");
  if (error) throw error;
  return data;
}

export async function updateGameSetting(key: string, value: string) {
  const { data, error } = await supabase.from("game_settings").update({ setting_value: value }).eq("setting_key", key).select().single();
  if (error) throw error;
  return data;
}

// Export Results
export async function exportResults(format: "csv" | "json" = "csv") {
  const { data, error } = await supabase.functions.invoke("export-results", { body: { format } });
  if (error) throw error;
  return data;
}
