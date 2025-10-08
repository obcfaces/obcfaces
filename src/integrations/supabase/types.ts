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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      _archived_contest_applications: {
        Row: {
          application_data: Json | null
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          last_participation_date: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_data?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          last_participation_date?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_data?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          last_participation_date?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contest_application_history: {
        Row: {
          application_data: Json | null
          application_id: string
          change_reason: string | null
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          rejection_reason_types: string[] | null
          status: string
        }
        Insert: {
          application_data?: Json | null
          application_id: string
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rejection_reason_types?: string[] | null
          status: string
        }
        Update: {
          application_data?: Json | null
          application_id?: string
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rejection_reason_types?: string[] | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_application_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "_archived_contest_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_application_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contest_applications_backup"
            referencedColumns: ["id"]
          },
        ]
      }
      contestant_rating_history: {
        Row: {
          action_type: string
          changed_at: string
          contestant_name: string
          created_at: string
          id: string
          new_rating: number
          old_rating: number | null
          participant_id: string | null
          rating_id: string
          user_id: string
        }
        Insert: {
          action_type?: string
          changed_at?: string
          contestant_name: string
          created_at?: string
          id?: string
          new_rating: number
          old_rating?: number | null
          participant_id?: string | null
          rating_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          changed_at?: string
          contestant_name?: string
          created_at?: string
          id?: string
          new_rating?: number
          old_rating?: number | null
          participant_id?: string | null
          rating_id?: string
          user_id?: string
        }
        Relationships: []
      }
      contestant_ratings: {
        Row: {
          contestant_name: string
          created_at: string
          id: string
          participant_id: string | null
          rating: number
          updated_at: string
          user_id: string
          week_interval: string | null
        }
        Insert: {
          contestant_name: string
          created_at?: string
          id?: string
          participant_id?: string | null
          rating: number
          updated_at?: string
          user_id: string
          week_interval?: string | null
        }
        Update: {
          contestant_name?: string
          created_at?: string
          id?: string
          participant_id?: string | null
          rating?: number
          updated_at?: string
          user_id?: string
          week_interval?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contestant_ratings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "weekly_contest_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "contest_participants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "contest_participants_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "contest_participants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "contest_participants_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      like_counts: {
        Row: {
          content_id: string
          content_type: string
          like_count: number
          updated_at: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          like_count?: number
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          like_count?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          participant_id: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          participant_id?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          participant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "weekly_contest_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean
          message_type: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          message_type?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          message_type?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      next_week_votes: {
        Row: {
          candidate_name: string
          created_at: string
          id: string
          updated_at: string | null
          user_id: string
          vote_count: number | null
          vote_type: string
        }
        Insert: {
          candidate_name: string
          created_at?: string
          id?: string
          updated_at?: string | null
          user_id: string
          vote_count?: number | null
          vote_type: string
        }
        Update: {
          candidate_name?: string
          created_at?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          vote_count?: number | null
          vote_type?: string
        }
        Relationships: []
      }
      participant_data_access_log: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_by: string | null
          id: string
          ip_address: unknown | null
          participant_id: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_by?: string | null
          id?: string
          ip_address?: unknown | null
          participant_id: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_by?: string | null
          id?: string
          ip_address?: unknown | null
          participant_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      photo_comments: {
        Row: {
          comment_text: string
          content_id: string
          content_type: string
          created_at: string
          id: string
          participant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          content_id: string
          content_type?: string
          created_at?: string
          id?: string
          participant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          participant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_comments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "weekly_contest_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string
          id: string
          likes_count: number | null
          media_types: string[]
          media_urls: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_types: string[]
          media_urls: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_types?: string[]
          media_urls?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      posts_media: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          mime_type: string | null
          order_index: number
          post_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          mime_type?: string | null
          order_index?: number
          post_id: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          order_index?: number
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email_verified: boolean | null
          first_name: string | null
          gender: string | null
          has_children: boolean | null
          height_cm: number | null
          id: string
          is_approved: boolean | null
          is_contest_participant: boolean | null
          last_name: string | null
          locale: string | null
          marital_status: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          participant_type: string | null
          photo_1_url: string | null
          photo_2_url: string | null
          privacy_level: string | null
          provider_data: Json | null
          state: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          gender?: string | null
          has_children?: boolean | null
          height_cm?: number | null
          id: string
          is_approved?: boolean | null
          is_contest_participant?: boolean | null
          last_name?: string | null
          locale?: string | null
          marital_status?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          participant_type?: string | null
          photo_1_url?: string | null
          photo_2_url?: string | null
          privacy_level?: string | null
          provider_data?: Json | null
          state?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          gender?: string | null
          has_children?: boolean | null
          height_cm?: number | null
          id?: string
          is_approved?: boolean | null
          is_contest_participant?: boolean | null
          last_name?: string | null
          locale?: string | null
          marital_status?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          participant_type?: string | null
          photo_1_url?: string | null
          photo_2_url?: string | null
          privacy_level?: string | null
          provider_data?: Json | null
          state?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          accessed_at: string
          action: string
          id: string
          ip_address: unknown | null
          row_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          accessed_at?: string
          action: string
          id?: string
          ip_address?: unknown | null
          row_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          accessed_at?: string
          action?: string
          id?: string
          ip_address?: unknown | null
          row_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shares: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_device_fingerprints: {
        Row: {
          audio_fingerprint: string | null
          canvas_fingerprint: string | null
          cookies_enabled: boolean | null
          created_at: string
          device_memory: number | null
          do_not_track: boolean | null
          fingerprint_id: string
          first_seen_at: string
          hardware_concurrency: number | null
          id: string
          installed_fonts: string[] | null
          ip_address: unknown | null
          language: string | null
          languages: string[] | null
          last_seen_at: string
          platform: string | null
          screen_color_depth: number | null
          screen_resolution: string | null
          timezone: string | null
          timezone_offset: number | null
          touch_support: boolean | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
          visit_count: number
          webgl_renderer: string | null
          webgl_vendor: string | null
        }
        Insert: {
          audio_fingerprint?: string | null
          canvas_fingerprint?: string | null
          cookies_enabled?: boolean | null
          created_at?: string
          device_memory?: number | null
          do_not_track?: boolean | null
          fingerprint_id: string
          first_seen_at?: string
          hardware_concurrency?: number | null
          id?: string
          installed_fonts?: string[] | null
          ip_address?: unknown | null
          language?: string | null
          languages?: string[] | null
          last_seen_at?: string
          platform?: string | null
          screen_color_depth?: number | null
          screen_resolution?: string | null
          timezone?: string | null
          timezone_offset?: number | null
          touch_support?: boolean | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          visit_count?: number
          webgl_renderer?: string | null
          webgl_vendor?: string | null
        }
        Update: {
          audio_fingerprint?: string | null
          canvas_fingerprint?: string | null
          cookies_enabled?: boolean | null
          created_at?: string
          device_memory?: number | null
          do_not_track?: boolean | null
          fingerprint_id?: string
          first_seen_at?: string
          hardware_concurrency?: number | null
          id?: string
          installed_fonts?: string[] | null
          ip_address?: unknown | null
          language?: string | null
          languages?: string[] | null
          last_seen_at?: string
          platform?: string | null
          screen_color_depth?: number | null
          screen_resolution?: string | null
          timezone?: string | null
          timezone_offset?: number | null
          touch_support?: boolean | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          visit_count?: number
          webgl_renderer?: string | null
          webgl_vendor?: string | null
        }
        Relationships: []
      }
      user_login_logs: {
        Row: {
          created_at: string
          device_fingerprint_id: string | null
          fingerprint_id: string | null
          id: string
          ip_address: unknown | null
          login_method: string
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint_id?: string | null
          fingerprint_id?: string | null
          id?: string
          ip_address?: unknown | null
          login_method?: string
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint_id?: string | null
          fingerprint_id?: string | null
          id?: string
          ip_address?: unknown | null
          login_method?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_login_logs_device_fingerprint_id_fkey"
            columns: ["device_fingerprint_id"]
            isOneToOne: false
            referencedRelation: "user_device_fingerprints"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_voting_stats: {
        Row: {
          created_at: string
          first_vote_at: string | null
          id: string
          is_regular_voter: boolean
          last_vote_at: string | null
          total_votes_count: number
          unique_weeks_count: number
          updated_at: string
          user_id: string
          voting_week_intervals: string[]
        }
        Insert: {
          created_at?: string
          first_vote_at?: string | null
          id?: string
          is_regular_voter?: boolean
          last_vote_at?: string | null
          total_votes_count?: number
          unique_weeks_count?: number
          updated_at?: string
          user_id: string
          voting_week_intervals?: string[]
        }
        Update: {
          created_at?: string
          first_vote_at?: string | null
          id?: string
          is_regular_voter?: boolean
          last_vote_at?: string | null
          total_votes_count?: number
          unique_weeks_count?: number
          updated_at?: string
          user_id?: string
          voting_week_intervals?: string[]
        }
        Relationships: []
      }
      weekly_contest_participants: {
        Row: {
          admin_status: Database["public"]["Enums"]["participant_admin_status"]
          application_data: Json | null
          average_rating: number | null
          contest_id: string
          created_at: string
          deleted_at: string | null
          final_rank: number | null
          id: string
          is_active: boolean
          notes: string | null
          rejection_reason: string | null
          rejection_reason_types: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status_history: Json | null
          submitted_at: string | null
          total_votes: number | null
          user_id: string
          week_interval: string | null
        }
        Insert: {
          admin_status?: Database["public"]["Enums"]["participant_admin_status"]
          application_data?: Json | null
          average_rating?: number | null
          contest_id: string
          created_at?: string
          deleted_at?: string | null
          final_rank?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          rejection_reason?: string | null
          rejection_reason_types?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status_history?: Json | null
          submitted_at?: string | null
          total_votes?: number | null
          user_id: string
          week_interval?: string | null
        }
        Update: {
          admin_status?: Database["public"]["Enums"]["participant_admin_status"]
          application_data?: Json | null
          average_rating?: number | null
          contest_id?: string
          created_at?: string
          deleted_at?: string | null
          final_rank?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          rejection_reason?: string | null
          rejection_reason_types?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status_history?: Json | null
          submitted_at?: string | null
          total_votes?: number | null
          user_id?: string
          week_interval?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_contest_participants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "weekly_contests"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_contests: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          week_end_date: string
          week_start_date: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          week_end_date: string
          week_start_date: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          week_end_date?: string
          week_start_date?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      winner_content: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          payment_proof_url: string | null
          testimonial_text: string | null
          testimonial_video_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          payment_proof_url?: string | null
          testimonial_text?: string | null
          testimonial_video_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          payment_proof_url?: string | null
          testimonial_text?: string | null
          testimonial_video_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      contest_applications_backup: {
        Row: {
          application_data: Json | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          is_active: boolean | null
          last_participation_date: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          application_data?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          is_active?: boolean | null
          last_participation_date?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          application_data?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          is_active?: boolean | null
          last_participation_date?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contest_participants_public: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
          is_contest_participant: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
          is_contest_participant?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
          is_contest_participant?: boolean | null
        }
        Relationships: []
      }
      contest_participants_safe: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
          is_contest_participant: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
          is_contest_participant?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
          is_contest_participant?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_old_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_assign_weekly_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_transition_weekly_contests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_transition_weekly_contests_with_timezone: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_conversation_membership: {
        Args: { conversation_id_param: string; user_id_param: string }
        Returns: boolean
      }
      check_user_has_voted_for_participant: {
        Args: { target_participant_id: string }
        Returns: boolean
      }
      check_user_in_conversation_safe: {
        Args: { conversation_id_param: string; user_id_param: string }
        Returns: boolean
      }
      check_user_liked_participant: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_user_liked_participant_id: {
        Args: { participant_id_param: string }
        Returns: boolean
      }
      check_user_voted: {
        Args: { contestant_name_param: string; user_id_param: string }
        Returns: boolean
      }
      cleanup_duplicate_conversations_safe: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_weekly_contest: {
        Args: { contest_date?: string }
        Returns: string
      }
      get_all_profiles_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          age: number
          avatar_url: string
          bio: string
          birthdate: string
          city: string
          country: string
          created_at: string
          display_name: string
          email_verified: boolean
          first_name: string
          gender: string
          has_children: boolean
          height_cm: number
          id: string
          is_approved: boolean
          is_contest_participant: boolean
          last_name: string
          locale: string
          marital_status: string
          moderated_at: string
          moderated_by: string
          moderation_notes: string
          participant_type: string
          photo_1_url: string
          photo_2_url: string
          privacy_level: string
          provider_data: Json
          state: string
          updated_at: string
          weight_kg: number
        }[]
      }
      get_card_section_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          moved_to_next_week_count: number
          new_applications_count: number
        }[]
      }
      get_clean_participant_rating_stats: {
        Args: { target_participant_id: string }
        Returns: {
          average_rating: number
          total_votes: number
        }[]
      }
      get_content_like_stats: {
        Args: {
          content_id_param: string
          content_type_param: string
          requesting_user_id?: string
        }
        Returns: {
          total_likes: number
          user_has_liked: boolean
        }[]
      }
      get_contest_leaderboard: {
        Args: { contest_week_offset?: number }
        Returns: {
          avatar_url: string
          avg_rating: number
          full_name: string
          rank_position: number
          total_votes: number
          user_id: string
        }[]
      }
      get_contest_participant_info: {
        Args: Record<PropertyKey, never> | { participant_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
        }[]
      }
      get_contest_participants: {
        Args: Record<PropertyKey, never>
        Returns: {
          age: number
          city: string
          country: string
          first_name: string
          height_cm: number
          id: string
          last_name: string
          photo1_url: string
          photo2_url: string
          user_id: string
          weight_kg: number
        }[]
      }
      get_contestant_average_rating: {
        Args: {
          contestant_name_param: string
          contestant_user_id_param?: string
        }
        Returns: number
      }
      get_conversation_unread_count: {
        Args: { conversation_id_param: string; user_id_param: string }
        Returns: number
      }
      get_daily_application_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          approved_applications: number
          day_date: string
          day_name: string
          total_applications: number
        }[]
      }
      get_daily_registration_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          day_name: string
          day_of_week: number
          registration_count: number
          sort_order: number
          suspicious_count: number
        }[]
      }
      get_daily_voting_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          day_name: string
          day_of_week: number
          like_count: number
          sort_order: number
          vote_count: number
        }[]
      }
      get_detailed_profile: {
        Args: { profile_user_id: string }
        Returns: {
          age: number
          avatar_url: string
          bio: string
          city: string
          country: string
          display_name: string
          id: string
          is_contest_participant: boolean
        }[]
      }
      get_email_domain_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          domain: string
          user_count: number
        }[]
      }
      get_email_domain_voting_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_rating: number
          domain: string
          total_likes: number
          total_votes: number
          user_count: number
        }[]
      }
      get_follow_stats: {
        Args: { target_user_id: string }
        Returns: {
          followers_count: number
          following_count: number
        }[]
      }
      get_friend_profile_summary: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          city: string
          country: string
          display_name: string
          id: string
        }[]
      }
      get_my_rating_for_participant: {
        Args: { participant_id_param: string }
        Returns: number
      }
      get_my_rating_for_user: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_next_week_applications_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_week_daily_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          day_name: string
          day_of_week: number
          dislike_count: number
          like_count: number
          total_votes: number
        }[]
      }
      get_next_week_participants_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_status: string
          age: number
          average_rating: number
          city: string
          country: string
          created_at: string
          first_name: string
          height_cm: number
          id: string
          last_name: string
          photo_1_url: string
          photo_2_url: string
          status_assigned_date: string
          total_votes: number
          user_id: string
          week_interval: string
          weight_kg: number
        }[]
      }
      get_next_week_participants_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          age: number
          city: string
          country: string
          first_name: string
          height_cm: number
          last_name: string
          participant_id: string
          photo_1_url: string
          photo_2_url: string
          user_id: string
          weight_kg: number
        }[]
      }
      get_next_week_participants_with_votes: {
        Args: Record<PropertyKey, never>
        Returns: {
          age: number
          avatar_url: string
          average_rating: number
          city: string
          country: string
          dislike_count: number
          display_name: string
          first_name: string
          gender: string
          has_children: boolean
          height_cm: number
          last_name: string
          like_count: number
          marital_status: string
          participant_id: string
          participant_status: string
          photo_1_url: string
          photo_2_url: string
          state: string
          total_votes: number
          user_id: string
          vote_total: number
          weight_kg: number
        }[]
      }
      get_next_week_vote_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          candidate_name: string
          dislike_count: number
          like_count: number
          total_votes: number
        }[]
      }
      get_next_week_voters: {
        Args: { participant_name_param: string; vote_type_param?: string }
        Returns: {
          age: number
          avatar_url: string
          city: string
          country: string
          created_at: string
          display_name: string
          first_name: string
          last_name: string
          photo_1_url: string
          photo_2_url: string
          user_id: string
          vote_count: number
          vote_type: string
        }[]
      }
      get_or_create_conversation: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_participant_comments_count: {
        Args: { participant_id_param: string }
        Returns: number
      }
      get_participant_content_stats: {
        Args: { profile_id_param: string; requesting_user_id?: string }
        Returns: {
          total_comments: number
          total_likes: number
          user_has_commented: boolean
          user_has_liked: boolean
        }[]
      }
      get_participant_likes_count: {
        Args: { participant_id_param: string }
        Returns: number
      }
      get_participant_rating_stats: {
        Args: { participant_id_param: string }
        Returns: {
          average_rating: number
          total_votes: number
          user_has_voted: boolean
        }[]
      }
      get_participant_statistics: {
        Args: { contest_week_offset?: number }
        Returns: {
          avg_rating: number
          contest_id: string
          contest_status: string
          first_name: string
          last_name: string
          total_ratings: number
          user_id: string
          week_end_date: string
          week_start_date: string
        }[]
      }
      get_primary_participant_timezone: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_public_contest_participant_photos: {
        Args: { participant_user_ids: string[] }
        Returns: {
          age: number
          avatar_url: string
          city: string
          country: string
          height_cm: number
          id: string
          photo_1_url: string
          photo_2_url: string
          weight_kg: number
        }[]
      }
      get_public_participant_rating_stats: {
        Args: { target_participant_id: string }
        Returns: {
          average_rating: number
          total_votes: number
        }[]
      }
      get_public_profile_summary: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
        }[]
      }
      get_public_rating_stats: {
        Args: { target_contestant_name: string }
        Returns: {
          average_rating: number
          total_votes: number
        }[]
      }
      get_rating_stats: {
        Args: {
          contestant_name_param: string
          contestant_user_id_param?: string
        }
        Returns: {
          average_rating: number
          rating_distribution: Json
          total_votes: number
        }[]
      }
      get_registration_stats_by_type: {
        Args: Record<PropertyKey, never>
        Returns: {
          fri: number
          mon: number
          sat: number
          stat_type: string
          sun: number
          thu: number
          tue: number
          wed: number
        }[]
      }
      get_safe_contest_participant_profile: {
        Args: { participant_id_param: string }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          first_name: string
          id: string
          photo_1_url: string
          photo_2_url: string
        }[]
      }
      get_safe_contestant_info: {
        Args: { contestant_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          is_contest_participant: boolean
        }[]
      }
      get_safe_participant_data: {
        Args: { weeks_offset?: number }
        Returns: {
          age_range: string
          average_rating: number
          city: string
          country: string
          created_at: string
          display_name: string
          final_rank: number
          first_name: string
          participant_id: string
          photo_1_url: string
          photo_2_url: string
          total_votes: number
          user_id: string
        }[]
      }
      get_unread_messages_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_auth_data_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          auth_provider: string
          created_at: string
          email: string
          email_confirmed_at: string
          facebook_data: Json
          last_sign_in_at: string
          user_id: string
          user_metadata: Json
        }[]
      }
      get_user_auth_data_admin_paginated: {
        Args: { page_number?: number; page_size?: number }
        Returns: {
          auth_provider: string
          created_at: string
          email: string
          email_confirmed_at: string
          facebook_data: Json
          last_sign_in_at: string
          user_id: string
          user_metadata: Json
        }[]
      }
      get_user_comments_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_user_likes_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_user_rating_for_participant: {
        Args: { participant_id_param: string }
        Returns: number
      }
      get_user_rating_stats: {
        Args: { target_user_id: string }
        Returns: {
          average_rating: number
          total_votes: number
          user_has_voted: boolean
        }[]
      }
      get_users_i_liked: {
        Args: { target_user_id: string }
        Returns: {
          age: number
          avatar_url: string
          city: string
          content_id: string
          content_type: string
          country: string
          created_at: string
          display_name: string
          like_id: string
          liked_user_id: string
          participant_type: string
          photo_1_url: string
          photo_2_url: string
        }[]
      }
      get_users_i_liked_debug: {
        Args: { target_user_id: string }
        Returns: {
          content_id: string
          display_name: string
          extracted_name: string
          like_id: string
          participant_name: string
          user_id: string
        }[]
      }
      get_users_who_liked_me: {
        Args: { target_user_id: string }
        Returns: {
          age: number
          avatar_url: string
          city: string
          content_id: string
          content_type: string
          country: string
          created_at: string
          display_name: string
          height_cm: number
          like_id: string
          liker_user_id: string
          participant_type: string
          photo_1_url: string
          photo_2_url: string
          state: string
          weight_kg: number
        }[]
      }
      get_week_monday: {
        Args: { input_date?: string }
        Returns: string
      }
      get_weekly_contest_participants: {
        Args: { weeks_offset?: number }
        Returns: {
          age: number
          city: string
          contest_status: string
          country: string
          final_rank: number
          first_name: string
          height_cm: number
          id: string
          last_name: string
          photo1_url: string
          photo2_url: string
          user_id: string
          week_end_date: string
          week_start_date: string
          weight_kg: number
        }[]
      }
      get_weekly_contest_participants_admin: {
        Args: { weeks_offset?: number }
        Returns: {
          admin_status: Database["public"]["Enums"]["participant_admin_status"]
          age: number
          avatar_url: string
          average_rating: number
          city: string
          contest_id: string
          contest_start_date: string
          country: string
          created_at: string
          deleted_at: string
          final_rank: number
          first_name: string
          gender: string
          has_children: boolean
          height_cm: number
          is_active: boolean
          last_name: string
          marital_status: string
          participant_id: string
          photo_1_url: string
          photo_2_url: string
          rejection_reason: string
          rejection_reason_types: string[]
          reviewed_at: string
          reviewed_by: string
          state: string
          status_assigned_date: string
          status_history: Json
          submitted_at: string
          total_votes: number
          user_id: string
          week_interval: string
          weight_kg: number
        }[]
      }
      get_weekly_contest_participants_next: {
        Args: { week_offset?: number }
        Returns: {
          age: number
          average_rating: number
          city: string
          country: string
          created_at: string
          display_name: string
          final_rank: number
          first_name: string
          height_cm: number
          last_name: string
          participant_id: string
          photo_1_url: string
          photo_2_url: string
          state: string
          total_votes: number
          user_id: string
          weight_kg: number
        }[]
      }
      get_weekly_contest_participants_public: {
        Args: { weeks_offset?: number }
        Returns: {
          age: number
          average_rating: number
          city: string
          country: string
          created_at: string
          display_name: string
          final_rank: number
          first_name: string
          height_cm: number
          last_name: string
          participant_id: string
          photo_1_url: string
          photo_2_url: string
          state: string
          total_votes: number
          user_id: string
          weight_kg: number
        }[]
      }
      get_weekly_contest_participants_safe: {
        Args: { weeks_offset?: number }
        Returns: {
          age: number
          average_rating: number
          city: string
          contest_status: string
          country: string
          final_rank: number
          first_name: string
          height_cm: number
          id: string
          last_name: string
          photo1_url: string
          photo2_url: string
          total_votes: number
          user_id: string
          week_end_date: string
          week_start_date: string
          weight_kg: number
        }[]
      }
      get_weekly_participants_by_admin_status: {
        Args: { weeks_offset?: number }
        Returns: {
          admin_status: string
          age: number
          avatar_url: string
          average_rating: number
          city: string
          contest_end_date: string
          contest_id: string
          contest_start_date: string
          contest_status: string
          contest_title: string
          country: string
          display_name: string
          final_rank: number
          first_name: string
          gender: string
          has_children: boolean
          height_cm: number
          is_active: boolean
          last_name: string
          marital_status: string
          participant_id: string
          participant_type: string
          photo_1_url: string
          photo_2_url: string
          state: string
          total_votes: number
          user_id: string
          weight_kg: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_contest_participant: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_email_confirmed: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_following: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_suspicious_email_domain: {
        Args: { email: string }
        Returns: boolean
      }
      mark_conversation_as_read: {
        Args: { conversation_id_param: string; user_id_param: string }
        Returns: undefined
      }
      refresh_participant_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rotate_weekly_contests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      transition_weekly_participant_statuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_application_status: {
        Args: {
          application_id_param: string
          new_status_param: string
          notes_param?: string
          reviewer_id_param?: string
        }
        Returns: boolean
      }
      update_participant_rating_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_in_conversation: {
        Args: { conversation_id: string; user_id: string }
        Returns: boolean
      }
      user_is_in_conversation: {
        Args: { conversation_id_param: string; user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "suspicious"
        | "usual"
        | "regular"
      participant_admin_status:
        | "pending"
        | "rejected"
        | "this week"
        | "next week"
        | "next week on site"
        | "past"
        | "pre next week"
        | "approved"
        | "under_review"
      rejection_reason_type:
        | "first_photo_makeup"
        | "first_photo_id_style"
        | "first_photo_blurry"
        | "first_photo_filters"
        | "second_photo_makeup"
        | "second_photo_pose"
        | "second_photo_clothing"
        | "second_photo_accessories"
        | "both_photos_quality"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "suspicious",
        "usual",
        "regular",
      ],
      participant_admin_status: [
        "pending",
        "rejected",
        "this week",
        "next week",
        "next week on site",
        "past",
        "pre next week",
        "approved",
        "under_review",
      ],
      rejection_reason_type: [
        "first_photo_makeup",
        "first_photo_id_style",
        "first_photo_blurry",
        "first_photo_filters",
        "second_photo_makeup",
        "second_photo_pose",
        "second_photo_clothing",
        "second_photo_accessories",
        "both_photos_quality",
      ],
    },
  },
} as const
