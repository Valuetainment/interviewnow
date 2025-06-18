export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      candidate_assessments: {
        Row: {
          created_at: string
          details: Json
          id: string
          session_id: string
          tenant_id: string
          updated_at: string
          weighted_score: number
        }
        Insert: {
          created_at?: string
          details: Json
          id?: string
          session_id: string
          tenant_id: string
          updated_at?: string
          weighted_score: number
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          session_id?: string
          tenant_id?: string
          updated_at?: string
          weighted_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "candidate_assessments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_assessments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_profiles: {
        Row: {
          birth_year: number | null
          candidate_id: string
          countries: string[] | null
          created_at: string
          education: Json | null
          experience: Json | null
          facebook_url: string | null
          facebook_username: string | null
          first_name: string | null
          gender: string | null
          github_url: string | null
          github_username: string | null
          id: string
          industry: string | null
          interests: string[] | null
          job_company_industry: string | null
          job_company_name: string | null
          job_company_size: string | null
          job_last_updated: string | null
          job_start_date: string | null
          job_title: string | null
          job_title_levels: string[] | null
          last_enriched_at: string | null
          last_name: string | null
          linkedin_id: string | null
          linkedin_url: string | null
          linkedin_username: string | null
          location_continent: string | null
          location_country: string | null
          location_geo: string | null
          location_locality: string | null
          location_name: string | null
          location_postal_code: string | null
          location_region: string | null
          location_street_address: string | null
          middle_name: string | null
          pdl_id: string | null
          pdl_likelihood: number | null
          skills: string[] | null
          tenant_id: string
          twitter_url: string | null
          twitter_username: string | null
          updated_at: string
        }
        Insert: {
          birth_year?: number | null
          candidate_id: string
          countries?: string[] | null
          created_at?: string
          education?: Json | null
          experience?: Json | null
          facebook_url?: string | null
          facebook_username?: string | null
          first_name?: string | null
          gender?: string | null
          github_url?: string | null
          github_username?: string | null
          id?: string
          industry?: string | null
          interests?: string[] | null
          job_company_industry?: string | null
          job_company_name?: string | null
          job_company_size?: string | null
          job_last_updated?: string | null
          job_start_date?: string | null
          job_title?: string | null
          job_title_levels?: string[] | null
          last_enriched_at?: string | null
          last_name?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          linkedin_username?: string | null
          location_continent?: string | null
          location_country?: string | null
          location_geo?: string | null
          location_locality?: string | null
          location_name?: string | null
          location_postal_code?: string | null
          location_region?: string | null
          location_street_address?: string | null
          middle_name?: string | null
          pdl_id?: string | null
          pdl_likelihood?: number | null
          skills?: string[] | null
          tenant_id: string
          twitter_url?: string | null
          twitter_username?: string | null
          updated_at?: string
        }
        Update: {
          birth_year?: number | null
          candidate_id?: string
          countries?: string[] | null
          created_at?: string
          education?: Json | null
          experience?: Json | null
          facebook_url?: string | null
          facebook_username?: string | null
          first_name?: string | null
          gender?: string | null
          github_url?: string | null
          github_username?: string | null
          id?: string
          industry?: string | null
          interests?: string[] | null
          job_company_industry?: string | null
          job_company_name?: string | null
          job_company_size?: string | null
          job_last_updated?: string | null
          job_start_date?: string | null
          job_title?: string | null
          job_title_levels?: string[] | null
          last_enriched_at?: string | null
          last_name?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          linkedin_username?: string | null
          location_continent?: string | null
          location_country?: string | null
          location_geo?: string | null
          location_locality?: string | null
          location_name?: string | null
          location_postal_code?: string | null
          location_region?: string | null
          location_street_address?: string | null
          middle_name?: string | null
          pdl_id?: string | null
          pdl_likelihood?: number | null
          skills?: string[] | null
          tenant_id?: string
          twitter_url?: string | null
          twitter_username?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_tenants: {
        Row: {
          candidate_id: string
          created_at: string
          invitation_date: string
          last_interaction: string | null
          relationship_type: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          invitation_date?: string
          last_interaction?: string | null
          relationship_type?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          invitation_date?: string
          last_interaction?: string | null
          relationship_type?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_tenants_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          auth_email: string | null
          auth_id: string | null
          created_at: string
          education: string | null
          email: string
          experience: Json | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          resume_analysis: Json | null
          resume_text: string | null
          resume_url: string | null
          skills: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auth_email?: string | null
          auth_id?: string | null
          created_at?: string
          education?: string | null
          email: string
          experience?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          resume_analysis?: Json | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auth_email?: string | null
          auth_id?: string | null
          created_at?: string
          education?: string | null
          email?: string
          experience?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          resume_analysis?: Json | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          benefits_data: Json | null
          created_at: string
          culture: string | null
          id: string
          name: string
          story: string | null
          tenant_id: string | null
          updated_at: string
          values_data: Json | null
        }
        Insert: {
          benefits_data?: Json | null
          created_at?: string
          culture?: string | null
          id?: string
          name: string
          story?: string | null
          tenant_id?: string | null
          updated_at?: string
          values_data?: Json | null
        }
        Update: {
          benefits_data?: Json | null
          created_at?: string
          culture?: string | null
          id?: string
          name?: string
          story?: string | null
          tenant_id?: string | null
          updated_at?: string
          values_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_invitations: {
        Row: {
          candidate_id: string
          created_at: string
          expires_at: string
          session_id: string
          status: string
          tenant_id: string
          token: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          expires_at: string
          session_id: string
          status?: string
          tenant_id: string
          token?: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          expires_at?: string
          session_id?: string
          status?: string
          tenant_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_invitations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_invitations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          avatar_enabled: boolean | null
          avatar_provider: string | null
          avatar_session_id: string | null
          candidate_id: string
          company_id: string | null
          created_at: string
          end_time: string | null
          ice_candidates: Json | null
          id: string
          position_id: string
          sdp_answers: Json | null
          sdp_offers: Json | null
          start_time: string | null
          status: string
          tenant_id: string
          updated_at: string
          video_url: string | null
          webrtc_architecture: string | null
          webrtc_connection_time: string | null
          webrtc_operation_id: string | null
          webrtc_server_url: string | null
          webrtc_session_id: string | null
          webrtc_status: string | null
        }
        Insert: {
          avatar_enabled?: boolean | null
          avatar_provider?: string | null
          avatar_session_id?: string | null
          candidate_id: string
          company_id?: string | null
          created_at?: string
          end_time?: string | null
          ice_candidates?: Json | null
          id?: string
          position_id: string
          sdp_answers?: Json | null
          sdp_offers?: Json | null
          start_time?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          video_url?: string | null
          webrtc_architecture?: string | null
          webrtc_connection_time?: string | null
          webrtc_operation_id?: string | null
          webrtc_server_url?: string | null
          webrtc_session_id?: string | null
          webrtc_status?: string | null
        }
        Update: {
          avatar_enabled?: boolean | null
          avatar_provider?: string | null
          avatar_session_id?: string | null
          candidate_id?: string
          company_id?: string | null
          created_at?: string
          end_time?: string | null
          ice_candidates?: Json | null
          id?: string
          position_id?: string
          sdp_answers?: Json | null
          sdp_offers?: Json | null
          start_time?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          video_url?: string | null
          webrtc_architecture?: string | null
          webrtc_connection_time?: string | null
          webrtc_operation_id?: string | null
          webrtc_server_url?: string | null
          webrtc_session_id?: string | null
          webrtc_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          interview_session_id: string | null
          is_read: boolean | null
          message: string | null
          tenant_id: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interview_session_id?: string | null
          is_read?: boolean | null
          message?: string | null
          tenant_id: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_session_id?: string | null
          is_read?: boolean | null
          message?: string | null
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      position_competencies: {
        Row: {
          competency_id: string
          created_at: string
          position_id: string
          tenant_id: string
          updated_at: string
          weight: number
        }
        Insert: {
          competency_id: string
          created_at?: string
          position_id: string
          tenant_id: string
          updated_at?: string
          weight: number
        }
        Update: {
          competency_id?: string
          created_at?: string
          position_id?: string
          tenant_id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "position_competencies_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_competencies_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_competencies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          application_deadline: string | null
          benefits: string | null
          company_id: string | null
          created_at: string
          department: string | null
          description: string | null
          employment_type: string | null
          experience_level: string | null
          id: string
          key_competencies_section: string | null
          key_responsibilities: string | null
          location: string | null
          preferred_qualifications: string | null
          reference_number: string | null
          required_qualifications: string | null
          role_overview: string | null
          salary_range: string | null
          tenant_id: string
          title: string
          travel_requirements: string | null
          updated_at: string
          work_authorization: string | null
        }
        Insert: {
          application_deadline?: string | null
          benefits?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          employment_type?: string | null
          experience_level?: string | null
          id?: string
          key_competencies_section?: string | null
          key_responsibilities?: string | null
          location?: string | null
          preferred_qualifications?: string | null
          reference_number?: string | null
          required_qualifications?: string | null
          role_overview?: string | null
          salary_range?: string | null
          tenant_id: string
          title: string
          travel_requirements?: string | null
          updated_at?: string
          work_authorization?: string | null
        }
        Update: {
          application_deadline?: string | null
          benefits?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          employment_type?: string | null
          experience_level?: string | null
          id?: string
          key_competencies_section?: string | null
          key_responsibilities?: string | null
          location?: string | null
          preferred_qualifications?: string | null
          reference_number?: string | null
          required_qualifications?: string | null
          role_overview?: string | null
          salary_range?: string | null
          tenant_id?: string
          title?: string
          travel_requirements?: string | null
          updated_at?: string
          work_authorization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_preferences: {
        Row: {
          avatar_enabled_default: boolean | null
          avatar_monthly_limit: number | null
          avatar_provider: string | null
          avatar_usage_count: number | null
          created_at: string | null
          default_avatar_id: string | null
          id: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_enabled_default?: boolean | null
          avatar_monthly_limit?: number | null
          avatar_provider?: string | null
          avatar_usage_count?: number | null
          created_at?: string | null
          default_avatar_id?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_enabled_default?: boolean | null
          avatar_monthly_limit?: number | null
          avatar_provider?: string | null
          avatar_usage_count?: number | null
          created_at?: string | null
          default_avatar_id?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      transcript_entries: {
        Row: {
          actual_start_ms: number | null
          confidence: number | null
          created_at: string
          duration_ms: number | null
          id: string
          session_id: string
          source_architecture: string | null
          speaker: string
          start_ms: number
          tenant_id: string
          text: string
          timestamp: string | null
        }
        Insert: {
          actual_start_ms?: number | null
          confidence?: number | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          session_id: string
          source_architecture?: string | null
          speaker: string
          start_ms: number
          tenant_id: string
          text: string
          timestamp?: string | null
        }
        Update: {
          actual_start_ms?: number | null
          confidence?: number | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          session_id?: string
          source_architecture?: string | null
          speaker?: string
          start_ms?: number
          tenant_id?: string
          text?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcript_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          quantity: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          quantity?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          quantity?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          role?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      video_segments: {
        Row: {
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          id: string
          metadata: Json | null
          segment_url: string
          session_id: string
          start_time: string
          status: string | null
          updated_at: string
          video_provider: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          metadata?: Json | null
          segment_url: string
          session_id: string
          start_time: string
          status?: string | null
          updated_at?: string
          video_provider?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          metadata?: Json | null
          segment_url?: string
          session_id?: string
          start_time?: string
          status?: string | null
          updated_at?: string
          video_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_segments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_candidate_invitation: {
        Args: {
          p_tenant_id: string
          p_candidate_email: string
          p_position_id?: string
        }
        Returns: string
      }
      debug_jwt_claims: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json }
        Returns: undefined
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {},
  },
} as const

