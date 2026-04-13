import { z } from "zod";

// ============================================
// Auth
// ============================================

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = signInSchema.extend({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .regex(/^[\p{L}\s'-]+$/u, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  role: z.enum(["player", "organizer"]),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

// ============================================
// Player
// ============================================

export const inviteCodeSchema = z
  .string()
  .min(6, "Invite code is required")
  .max(12, "Invite code is too long")
  .regex(/^[A-Z0-9]+$/, "Invite code must be alphanumeric");

export const createTeamSchema = z.object({
  teamName: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(50, "Team name must be under 50 characters"),
  teamColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
});

export const joinTeamSchema = z.object({
  teamCode: z
    .string()
    .min(4, "Team code is required")
    .max(10, "Team code is too long"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be under 50 characters"),
});

export const submitAnswerSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(1, "Answer cannot be empty")
    .max(500, "Answer must be under 500 characters"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type JoinTeamInput = z.infer<typeof joinTeamSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

// ============================================
// Organizer - Event
// ============================================

export const eventDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Event name must be at least 3 characters")
    .max(100, "Event name must be under 100 characters"),
  description: z.string().max(2000, "Description must be under 2000 characters").optional(),
  coverImageUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export const eventSettingsSchema = z.object({
  help_tokens_per_team: z.coerce.number().int().min(0).max(20).default(3),
  max_teams: z.coerce.number().int().min(1).max(500).default(50),
  max_time_minutes: z.coerce.number().int().min(5).max(1440).default(180),
  time_penalty_per_minute: z.coerce.number().int().min(0).max(100).default(5),
});

export type EventDetailsInput = z.infer<typeof eventDetailsSchema>;
export type EventSettingsInput = z.infer<typeof eventSettingsSchema>;

// ============================================
// Organizer - Checkpoint
// ============================================

export const checkpointSchema = z.object({
  name: z.string().trim().min(2, "Checkpoint name is required").max(100),
  description: z.string().max(500).optional(),
  latitude: z.coerce
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  radiusMeters: z.coerce.number().int().min(5, "Radius must be at least 5m").max(10000).default(50),
  clueText: z.string().trim().min(5, "Clue text is required").max(1000),
  helpTokenHint: z.string().max(500).optional(),
});

export type CheckpointInput = z.infer<typeof checkpointSchema>;

// ============================================
// Organizer - Riddle
// ============================================

export const riddleSchema = z.object({
  question: z.string().trim().min(5, "Question is required").max(1000),
  correctAnswer: z.string().trim().min(1, "Answer is required").max(200),
  maxPoints: z.coerce.number().int().min(1, "Points must be at least 1").max(10000).default(100),
});

export type RiddleInput = z.infer<typeof riddleSchema>;

// ============================================
// Helpers
// ============================================

/** Format Zod errors into a flat record for form fields */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}
