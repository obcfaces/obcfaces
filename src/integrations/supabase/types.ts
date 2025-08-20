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
      contest_applications: {
        Row: {
          application_data: Json | null
          created_at: string
          id: string
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
          id?: string
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
          id?: string
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
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
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
            referencedRelation: "profiles"
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
      likes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
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
          user_id: string
          vote_type: string
        }
        Insert: {
          candidate_name: string
          created_at?: string
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          candidate_name?: string
          created_at?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: []
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
          first_name: string | null
          gender: string | null
          has_children: boolean | null
          height_cm: number | null
          id: string
          is_approved: boolean | null
          is_contest_participant: boolean | null
          last_name: string | null
          marital_status: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          participant_type: string | null
          photo_1_url: string | null
          photo_2_url: string | null
          privacy_level: string | null
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
          first_name?: string | null
          gender?: string | null
          has_children?: boolean | null
          height_cm?: number | null
          id: string
          is_approved?: boolean | null
          is_contest_participant?: boolean | null
          last_name?: string | null
          marital_status?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          participant_type?: string | null
          photo_1_url?: string | null
          photo_2_url?: string | null
          privacy_level?: string | null
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
          first_name?: string | null
          gender?: string | null
          has_children?: boolean | null
          height_cm?: number | null
          id?: string
          is_approved?: boolean | null
          is_contest_participant?: boolean | null
          last_name?: string | null
          marital_status?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          participant_type?: string | null
          photo_1_url?: string | null
          photo_2_url?: string | null
          privacy_level?: string | null
          state?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
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
      weekly_contest_participants: {
        Row: {
          application_data: Json | null
          average_rating: number | null
          contest_id: string
          created_at: string
          final_rank: number | null
          id: string
          total_votes: number | null
          user_id: string
        }
        Insert: {
          application_data?: Json | null
          average_rating?: number | null
          contest_id: string
          created_at?: string
          final_rank?: number | null
          id?: string
          total_votes?: number | null
          user_id: string
        }
        Update: {
          application_data?: Json | null
          average_rating?: number | null
          contest_id?: string
          created_at?: string
          final_rank?: number | null
          id?: string
          total_votes?: number | null
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_weekly_contest: {
        Args: { contest_date?: string }
        Returns: string
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
      get_or_create_conversation: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_public_profile_summary: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
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
          age: number
          application_data: Json
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
      get_weekly_contest_participants_public: {
        Args: { weeks_offset?: number }
        Returns: {
          age: number
          city: string
          country: string
          final_rank: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_following: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      rotate_weekly_contests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_in_conversation: {
        Args: { conversation_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
