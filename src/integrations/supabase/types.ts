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
      cron_health_snapshots: {
        Row: {
          active_jobs: number
          alert_sent: boolean
          failed_runs: number
          health_status: string
          id: string
          message: string | null
          recorded_at: string
          success_rate: number
          timeout_errors: number
          total_jobs: number
          total_runs: number
        }
        Insert: {
          active_jobs?: number
          alert_sent?: boolean
          failed_runs?: number
          health_status: string
          id?: string
          message?: string | null
          recorded_at?: string
          success_rate?: number
          timeout_errors?: number
          total_jobs?: number
          total_runs?: number
        }
        Update: {
          active_jobs?: number
          alert_sent?: boolean
          failed_runs?: number
          health_status?: string
          id?: string
          message?: string | null
          recorded_at?: string
          success_rate?: number
          timeout_errors?: number
          total_jobs?: number
          total_runs?: number
        }
        Relationships: []
      }
      email_events: {
        Row: {
          country_code: string | null
          created_at: string
          device_type: string | null
          email_client: string | null
          email_type: string
          event_type: string
          id: string
          ip_hash: string | null
          link_url: string | null
          region: string | null
          subscription_id: string | null
          timestamp_utc: string | null
          tracking_id: string
          user_agent: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          email_client?: string | null
          email_type: string
          event_type: string
          id?: string
          ip_hash?: string | null
          link_url?: string | null
          region?: string | null
          subscription_id?: string | null
          timestamp_utc?: string | null
          tracking_id: string
          user_agent?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          email_client?: string | null
          email_type?: string
          event_type?: string
          id?: string
          ip_hash?: string | null
          link_url?: string | null
          region?: string | null
          subscription_id?: string | null
          timestamp_utc?: string | null
          tracking_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          affected_technologies: string[] | null
          author: string | null
          category: string
          content: string | null
          created_at: string
          cve_id: string | null
          id: string
          is_processed: boolean | null
          link: string
          metadata: Json | null
          published_at: string
          raw_content: string | null
          search_vector: unknown
          severity: string
          source_name: string | null
          source_url: string | null
          summary: string | null
          tags: string[] | null
          title: string
          uid: string
          updated_at: string
        }
        Insert: {
          affected_technologies?: string[] | null
          author?: string | null
          category?: string
          content?: string | null
          created_at?: string
          cve_id?: string | null
          id?: string
          is_processed?: boolean | null
          link: string
          metadata?: Json | null
          published_at: string
          raw_content?: string | null
          search_vector?: unknown
          severity?: string
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          uid: string
          updated_at?: string
        }
        Update: {
          affected_technologies?: string[] | null
          author?: string | null
          category?: string
          content?: string | null
          created_at?: string
          cve_id?: string | null
          id?: string
          is_processed?: boolean | null
          link?: string
          metadata?: Json | null
          published_at?: string
          raw_content?: string | null
          search_vector?: unknown
          severity?: string
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          uid?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          article_id: string | null
          error_message: string | null
          id: string
          sent_at: string
          status: string
          subscription_id: string | null
        }
        Insert: {
          article_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          subscription_id?: string | null
        }
        Update: {
          article_id?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_scores: {
        Row: {
          badge_count: number
          character_rank: string
          created_at: string
          id: string
          score: number
          username: string
        }
        Insert: {
          badge_count?: number
          character_rank: string
          created_at?: string
          id?: string
          score: number
          username: string
        }
        Update: {
          badge_count?: number
          character_rank?: string
          created_at?: string
          id?: string
          score?: number
          username?: string
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          completed_at: string | null
          expires_at: string
          id: string
          ip_hash: string
          question_ids: number[]
          session_token: string
          started_at: string
        }
        Insert: {
          completed_at?: string | null
          expires_at?: string
          id?: string
          ip_hash: string
          question_ids: number[]
          session_token: string
          started_at?: string
        }
        Update: {
          completed_at?: string | null
          expires_at?: string
          id?: string
          ip_hash?: string
          question_ids?: number[]
          session_token?: string
          started_at?: string
        }
        Relationships: []
      }
      quiz_submission_log: {
        Row: {
          id: string
          ip_hash: string
          submitted_at: string
          username_hash: string
        }
        Insert: {
          id?: string
          ip_hash: string
          submitted_at?: string
          username_hash: string
        }
        Update: {
          id?: string
          ip_hash?: string
          submitted_at?: string
          username_hash?: string
        }
        Relationships: []
      }
      rss_feeds: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          last_fetched_at: string | null
          name: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          name: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          name?: string
          url?: string
        }
        Relationships: []
      }
      security_keywords: {
        Row: {
          category: string
          created_at: string
          id: string
          keyword: string
          weight: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          keyword: string
          weight?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          keyword?: string
          weight?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          categories: string[]
          created_at: string
          email: string
          frequency: string
          id: string
          is_active: boolean
          is_verified: boolean
          last_notified_at: string | null
          name: string | null
          preferred_day: number | null
          preferred_hour: number | null
          severity_threshold: string
          technologies: string[] | null
          timezone_offset: number | null
          updated_at: string
          verification_token: string | null
          verification_token_expires_at: string | null
        }
        Insert: {
          categories?: string[]
          created_at?: string
          email: string
          frequency?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_notified_at?: string | null
          name?: string | null
          preferred_day?: number | null
          preferred_hour?: number | null
          severity_threshold?: string
          technologies?: string[] | null
          timezone_offset?: number | null
          updated_at?: string
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Update: {
          categories?: string[]
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_notified_at?: string | null
          name?: string | null
          preferred_day?: number | null
          preferred_hour?: number | null
          severity_threshold?: string
          technologies?: string[] | null
          timezone_offset?: number | null
          updated_at?: string
          verification_token?: string | null
          verification_token_expires_at?: string | null
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
    }
    Views: {
      email_analytics_daily: {
        Row: {
          day: string | null
          email_type: string | null
          event_count: number | null
          event_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_quiz_sessions: { Args: never; Returns: undefined }
      cleanup_old_health_snapshots: { Args: never; Returns: undefined }
      cleanup_old_submission_logs: { Args: never; Returns: undefined }
      count_news_articles: {
        Args: {
          category_filter?: string[]
          date_from?: string
          search_query?: string
          severity_filter?: string[]
        }
        Returns: number
      }
      get_subscriber_count: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      news_articles_search_vector: {
        Args: {
          affected_technologies: string[]
          content: string
          cve_id: string
          summary: string
          tags: string[]
          title: string
        }
        Returns: unknown
      }
      search_news_articles: {
        Args: {
          category_filter?: string[]
          date_from?: string
          result_limit?: number
          result_offset?: number
          search_query: string
          severity_filter?: string[]
        }
        Returns: {
          affected_technologies: string[]
          author: string
          category: string
          content: string
          cve_id: string
          id: string
          is_processed: boolean
          link: string
          published_at: string
          rank: number
          severity: string
          source_name: string
          source_url: string
          summary: string
          tags: string[]
          title: string
        }[]
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
