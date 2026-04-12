export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          cover_image_url: string | null
          organizer_id: string
          start_time: string | null
          end_time: string | null
          status: Database["public"]["Enums"]["event_status"]
          settings: Json | null
          invite_code: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          cover_image_url?: string | null
          organizer_id: string
          start_time?: string | null
          end_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          settings?: Json | null
          invite_code?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          cover_image_url?: string | null
          organizer_id?: string
          start_time?: string | null
          end_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          settings?: Json | null
          invite_code?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          member_names: string[] | null
          leader_email: string | null
          password_hash: string | null
          team_color: string | null
          status: Database["public"]["Enums"]["team_status"] | null
          current_checkpoint_id: string | null
          current_score: number | null
          help_tokens_used: number | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
          event_id: string | null
          team_code: string | null
          leader_id: string | null
        }
        Insert: {
          id?: string
          name: string
          avatar_url?: string | null
          member_names?: string[] | null
          leader_email?: string | null
          password_hash?: string | null
          team_color?: string | null
          status?: Database["public"]["Enums"]["team_status"] | null
          current_checkpoint_id?: string | null
          current_score?: number | null
          help_tokens_used?: number | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          event_id?: string | null
          team_code?: string | null
          leader_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          member_names?: string[] | null
          leader_email?: string | null
          password_hash?: string | null
          team_color?: string | null
          status?: Database["public"]["Enums"]["team_status"] | null
          current_checkpoint_id?: string | null
          current_score?: number | null
          help_tokens_used?: number | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          event_id?: string | null
          team_code?: string | null
          leader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          display_name: string | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          display_name?: string | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          display_name?: string | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoints: {
        Row: {
          id: string
          name: string
          description: string | null
          clue_text: string
          help_token_hint: string | null
          latitude: number
          longitude: number
          radius_meters: number | null
          order_number: number
          is_active: boolean | null
          event_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          clue_text: string
          help_token_hint?: string | null
          latitude: number
          longitude: number
          radius_meters?: number | null
          order_number: number
          is_active?: boolean | null
          event_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          clue_text?: string
          help_token_hint?: string | null
          latitude?: number
          longitude?: number
          radius_meters?: number | null
          order_number?: number
          is_active?: boolean | null
          event_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkpoints_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      riddles: {
        Row: {
          id: string
          checkpoint_id: string
          question: string
          correct_answer: string
          max_points: number | null
          time_penalty_per_minute: number | null
          order_number: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          checkpoint_id: string
          question: string
          correct_answer: string
          max_points?: number | null
          time_penalty_per_minute?: number | null
          order_number?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          checkpoint_id?: string
          question?: string
          correct_answer?: string
          max_points?: number | null
          time_penalty_per_minute?: number | null
          order_number?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "riddles_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "checkpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          id: string
          team_id: string
          riddle_id: string
          checkpoint_id: string
          submitted_answer: string
          status: Database["public"]["Enums"]["submission_status"]
          points_awarded: number | null
          help_token_used: boolean | null
          latitude: number | null
          longitude: number | null
          distance_from_checkpoint: number | null
          submitted_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          riddle_id: string
          checkpoint_id: string
          submitted_answer: string
          status: Database["public"]["Enums"]["submission_status"]
          points_awarded?: number | null
          help_token_used?: boolean | null
          latitude?: number | null
          longitude?: number | null
          distance_from_checkpoint?: number | null
          submitted_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          riddle_id?: string
          checkpoint_id?: string
          submitted_answer?: string
          status?: Database["public"]["Enums"]["submission_status"]
          points_awarded?: number | null
          help_token_used?: boolean | null
          latitude?: number | null
          longitude?: number | null
          distance_from_checkpoint?: number | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_riddle_id_fkey"
            columns: ["riddle_id"]
            isOneToOne: false
            referencedRelation: "riddles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          id: string
          action_type: string
          description: string
          metadata: Json | null
          team_id: string | null
          admin_id: string | null
          ip_address: unknown | null
          user_agent: string | null
          event_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          action_type: string
          description: string
          metadata?: Json | null
          team_id?: string | null
          admin_id?: string | null
          ip_address?: unknown | null
          user_agent?: string | null
          event_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          action_type?: string
          description?: string
          metadata?: Json | null
          team_id?: string | null
          admin_id?: string | null
          ip_address?: unknown | null
          user_agent?: string | null
          event_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      player_riddles: {
        Row: {
          id: string | null
          checkpoint_id: string | null
          question: string | null
          max_points: number | null
          time_penalty_per_minute: number | null
          order_number: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          checkpoint_id?: string | null
          question?: string | null
          max_points?: number | null
          time_penalty_per_minute?: number | null
          order_number?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          checkpoint_id?: string | null
          question?: string | null
          max_points?: number | null
          time_penalty_per_minute?: number | null
          order_number?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_status: "draft" | "active" | "paused" | "completed"
      user_role: "organizer" | "player"
      submission_status: "correct" | "incorrect" | "invalid"
      team_status: "pending" | "active" | "completed" | "disqualified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_status: ["draft", "active", "paused", "completed"],
      user_role: ["organizer", "player"],
      submission_status: ["correct", "incorrect", "invalid"],
      team_status: ["pending", "active", "completed", "disqualified"],
    },
  },
} as const
