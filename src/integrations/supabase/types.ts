export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string | null
          description: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          team_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          team_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          team_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          role: Database["public"]["Enums"]["admin_role"] | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          role?: Database["public"]["Enums"]["admin_role"] | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          role?: Database["public"]["Enums"]["admin_role"] | null
        }
        Relationships: []
      }
      checkpoints: {
        Row: {
          clue_text: string
          created_at: string | null
          description: string | null
          help_token_hint: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          order_number: number
          radius_meters: number | null
          updated_at: string | null
        }
        Insert: {
          clue_text: string
          created_at?: string | null
          description?: string | null
          help_token_hint?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          order_number: number
          radius_meters?: number | null
          updated_at?: string | null
        }
        Update: {
          clue_text?: string
          created_at?: string | null
          description?: string | null
          help_token_hint?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          order_number?: number
          radius_meters?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      game_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      riddles: {
        Row: {
          checkpoint_id: string
          correct_answer: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_points: number | null
          order_number: number | null
          question: string
          time_penalty_per_minute: number | null
          updated_at: string | null
        }
        Insert: {
          checkpoint_id: string
          correct_answer: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_points?: number | null
          order_number?: number | null
          question: string
          time_penalty_per_minute?: number | null
          updated_at?: string | null
        }
        Update: {
          checkpoint_id?: string
          correct_answer?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_points?: number | null
          order_number?: number | null
          question?: string
          time_penalty_per_minute?: number | null
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
          checkpoint_id: string
          distance_from_checkpoint: number | null
          help_token_used: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          points_awarded: number | null
          riddle_id: string
          status: Database["public"]["Enums"]["submission_status"]
          submitted_answer: string
          submitted_at: string | null
          team_id: string
        }
        Insert: {
          checkpoint_id: string
          distance_from_checkpoint?: number | null
          help_token_used?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          points_awarded?: number | null
          riddle_id: string
          status: Database["public"]["Enums"]["submission_status"]
          submitted_answer: string
          submitted_at?: string | null
          team_id: string
        }
        Update: {
          checkpoint_id?: string
          distance_from_checkpoint?: number | null
          help_token_used?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          points_awarded?: number | null
          riddle_id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_answer?: string
          submitted_at?: string | null
          team_id?: string
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
      teams: {
        Row: {
          avatar_url: string | null
          completed_at: string | null
          created_at: string | null
          current_checkpoint_id: string | null
          current_score: number | null
          help_tokens_used: number | null
          id: string
          leader_email: string
          member_names: string[]
          name: string
          password_hash: string
          status: Database["public"]["Enums"]["team_status"] | null
          team_color: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_checkpoint_id?: string | null
          current_score?: number | null
          help_tokens_used?: number | null
          id?: string
          leader_email: string
          member_names: string[]
          name: string
          password_hash: string
          status?: Database["public"]["Enums"]["team_status"] | null
          team_color?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_checkpoint_id?: string | null
          current_score?: number | null
          help_tokens_used?: number | null
          id?: string
          leader_email?: string
          member_names?: string[]
          name?: string
          password_hash?: string
          status?: Database["public"]["Enums"]["team_status"] | null
          team_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      admin_role: "super_admin" | "game_admin" | "moderator"
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
      admin_role: ["super_admin", "game_admin", "moderator"],
      submission_status: ["correct", "incorrect", "invalid"],
      team_status: ["pending", "active", "completed", "disqualified"],
    },
  },
} as const
