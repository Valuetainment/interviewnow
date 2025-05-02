// Placeholder for database types
// Later, you can generate these automatically using Supabase CLI:
// supabase gen types typescript --linked > src/integrations/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          plan_tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plan_tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan_tier?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      candidates: {
        Row: {
          id: string
          tenant_id: string
          full_name: string
          email: string
          resume_url: string | null
          resume_text?: string | null
          phone?: string | null
          skills?: string[] | null
          experience?: Json | null
          education?: string | null
          resume_analysis: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          full_name: string
          email: string
          resume_url?: string | null
          resume_text?: string | null
          phone?: string | null
          skills?: string[] | null
          experience?: Json | null
          education?: string | null
          resume_analysis?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          full_name?: string
          email?: string
          resume_url?: string | null
          resume_text?: string | null
          phone?: string | null
          skills?: string[] | null
          experience?: Json | null
          education?: string | null
          resume_analysis?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      candidate_profiles: {
        Row: {
          id: string
          candidate_id: string
          tenant_id: string
          created_at: string
          updated_at: string
          pdl_id?: string | null
          pdl_likelihood?: number | null
          last_enriched_at?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          gender?: string | null
          birth_year?: number | null
          location_name?: string | null
          location_locality?: string | null
          location_region?: string | null
          location_country?: string | null
          location_continent?: string | null
          location_postal_code?: string | null
          location_street_address?: string | null
          location_geo?: string | null
          job_title?: string | null
          job_company_name?: string | null
          job_company_size?: string | null
          job_company_industry?: string | null
          job_start_date?: string | null
          job_last_updated?: string | null
          linkedin_url?: string | null
          linkedin_username?: string | null
          linkedin_id?: string | null
          twitter_url?: string | null
          twitter_username?: string | null
          facebook_url?: string | null
          facebook_username?: string | null
          github_url?: string | null
          github_username?: string | null
          skills?: string[] | null
          interests?: string[] | null
          countries?: string[] | null
          experience?: Json | null
          education?: Json | null
          industry?: string | null
          job_title_levels?: string[] | null
          phone?: string | null
        }
        Insert: {
          id?: string
          candidate_id: string
          tenant_id: string
          created_at?: string
          updated_at?: string
          pdl_id?: string | null
          pdl_likelihood?: number | null
          last_enriched_at?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          gender?: string | null
          birth_year?: number | null
          location_name?: string | null
          location_locality?: string | null
          location_region?: string | null
          location_country?: string | null
          location_continent?: string | null
          location_postal_code?: string | null
          location_street_address?: string | null
          location_geo?: string | null
          job_title?: string | null
          job_company_name?: string | null
          job_company_size?: string | null
          job_company_industry?: string | null
          job_start_date?: string | null
          job_last_updated?: string | null
          linkedin_url?: string | null
          linkedin_username?: string | null
          linkedin_id?: string | null
          twitter_url?: string | null
          twitter_username?: string | null
          facebook_url?: string | null
          facebook_username?: string | null
          github_url?: string | null
          github_username?: string | null
          skills?: string[] | null
          interests?: string[] | null
          countries?: string[] | null
          experience?: Json | null
          education?: Json | null
          industry?: string | null
          job_title_levels?: string[] | null
          phone?: string | null
        }
        Update: {
          id?: string
          candidate_id?: string
          tenant_id?: string
          created_at?: string
          updated_at?: string
          pdl_id?: string | null
          pdl_likelihood?: number | null
          last_enriched_at?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          gender?: string | null
          birth_year?: number | null
          location_name?: string | null
          location_locality?: string | null
          location_region?: string | null
          location_country?: string | null
          location_continent?: string | null
          location_postal_code?: string | null
          location_street_address?: string | null
          location_geo?: string | null
          job_title?: string | null
          job_company_name?: string | null
          job_company_size?: string | null
          job_company_industry?: string | null
          job_start_date?: string | null
          job_last_updated?: string | null
          linkedin_url?: string | null
          linkedin_username?: string | null
          linkedin_id?: string | null
          twitter_url?: string | null
          twitter_username?: string | null
          facebook_url?: string | null
          facebook_username?: string | null
          github_url?: string | null
          github_username?: string | null
          skills?: string[] | null
          interests?: string[] | null
          countries?: string[] | null
          experience?: Json | null
          education?: Json | null
          industry?: string | null
          job_title_levels?: string[] | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      positions: {
        Row: {
          id: string
          tenant_id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      interview_sessions: {
        Row: {
          id: string
          tenant_id: string
          position_id: string
          candidate_id: string
          start_time: string | null
          end_time: string | null
          status: string
          video_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          position_id: string
          candidate_id: string
          start_time?: string | null
          end_time?: string | null
          status?: string
          video_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          position_id?: string
          candidate_id?: string
          start_time?: string | null
          end_time?: string | null
          status?: string
          video_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_position_id_fkey"
            columns: ["position_id"]
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          }
        ]
      }
      interview_invitations: {
        Row: {
          token: string
          tenant_id: string
          session_id: string
          candidate_id: string
          expires_at: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          token?: string
          tenant_id: string
          session_id: string
          candidate_id: string
          expires_at: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          token?: string
          tenant_id?: string
          session_id?: string
          candidate_id?: string
          expires_at?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_invitations_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_invitations_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          }
        ]
      }
      usage_events: {
        Row: {
          id: string
          tenant_id: string
          event_type: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          event_type: string
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          event_type?: string
          quantity?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      transcript_entries: {
        Row: {
          id: string;
          tenant_id: string;
          session_id: string;
          speaker: string;
          text: string;
          start_ms: number;
          confidence: number | null;
          sequence_number: number | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          tenant_id: string;
          session_id: string;
          speaker: string;
          text: string;
          start_ms: number;
          confidence?: number | null;
          sequence_number?: number | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          tenant_id?: string;
          session_id?: string;
          speaker?: string;
          text?: string;
          start_ms?: number;
          confidence?: number | null;
          sequence_number?: number | null;
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "transcript_entries_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      // Other tables to be added as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
