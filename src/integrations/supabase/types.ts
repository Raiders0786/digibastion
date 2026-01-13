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
          severity_threshold: string
          technologies: string[] | null
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
          severity_threshold?: string
          technologies?: string[] | null
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
          severity_threshold?: string
          technologies?: string[] | null
          updated_at?: string
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
