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
      ai_generation_logs: {
        Row: {
          created_at: string
          error_message: string | null
          generation_type: string
          id: string
          metadata: Json | null
          model_used: string
          prompt: string
          response: string | null
          success: boolean
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          generation_type: string
          id?: string
          metadata?: Json | null
          model_used: string
          prompt: string
          response?: string | null
          success?: boolean
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          generation_type?: string
          id?: string
          metadata?: Json | null
          model_used?: string
          prompt?: string
          response?: string | null
          success?: boolean
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          api_endpoint: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_tokens: number | null
          metadata: Json | null
          model_name: string
          model_type: string
          provider: string
          sort_order: number | null
          supports_streaming: boolean | null
          supports_vision: boolean | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          metadata?: Json | null
          model_name: string
          model_type?: string
          provider: string
          sort_order?: number | null
          supports_streaming?: boolean | null
          supports_vision?: boolean | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          metadata?: Json | null
          model_name?: string
          model_type?: string
          provider?: string
          sort_order?: number | null
          supports_streaming?: boolean | null
          supports_vision?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          api_endpoint: string
          created_at: string
          id: string
          is_active: boolean
          max_tokens: number
          model_id: string | null
          model_name: string
          model_provider: string
          system_prompt: string | null
          temperature: number
          updated_at: string
        }
        Insert: {
          api_endpoint?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_tokens?: number
          model_id?: string | null
          model_name?: string
          model_provider?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_tokens?: number
          model_id?: string | null
          model_name?: string
          model_provider?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_trends: {
        Row: {
          city_id: string | null
          created_at: string
          date: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          metric_type: string
          value: number
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          date?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          metric_type: string
          value: number
        }
        Update: {
          city_id?: string | null
          created_at?: string
          date?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_trends_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      api_endpoint_metrics: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          ip_address: unknown
          method: string
          response_time: number
          status_code: number
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method: string
          response_time: number
          status_code: number
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method?: string
          response_time?: number
          status_code?: number
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_analytics: {
        Row: {
          article_id: string
          avg_time_on_page: number
          bounce_rate: number
          conversion_rate: number
          created_at: string
          date: string
          id: string
          referral_sources: Json | null
          signups_attributed: number
          unique_visitors: number
          views: number
        }
        Insert: {
          article_id: string
          avg_time_on_page?: number
          bounce_rate?: number
          conversion_rate?: number
          created_at?: string
          date?: string
          id?: string
          referral_sources?: Json | null
          signups_attributed?: number
          unique_visitors?: number
          views?: number
        }
        Update: {
          article_id?: string
          avg_time_on_page?: number
          bounce_rate?: number
          conversion_rate?: number
          created_at?: string
          date?: string
          id?: string
          referral_sources?: Json | null
          signups_attributed?: number
          unique_visitors?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_analytics_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_article_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          prompt_template: string
          required_sections: string[]
          seo_focus: string[]
          target_word_count: number
          template_type: string
          tone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          prompt_template: string
          required_sections?: string[]
          seo_focus?: string[]
          target_word_count?: number
          template_type: string
          tone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          prompt_template?: string
          required_sections?: string[]
          seo_focus?: string[]
          target_word_count?: number
          template_type?: string
          tone?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_articles: {
        Row: {
          ai_generated: boolean
          ai_prompt: string | null
          author_id: string | null
          category: string
          city_id: string | null
          content: string
          created_at: string
          estimated_reading_time: number
          excerpt: string
          featured_image: string | null
          id: string
          keywords: string[]
          meta_description: string
          meta_title: string
          publish_date: string | null
          readability_score: number
          seo_score: number
          slug: string
          status: string
          tags: string[]
          title: string
          updated_at: string
          view_count: number
          webhook_response: Json | null
          webhook_sent_at: string | null
          webhook_settings_id: string | null
          word_count: number
        }
        Insert: {
          ai_generated?: boolean
          ai_prompt?: string | null
          author_id?: string | null
          category: string
          city_id?: string | null
          content: string
          created_at?: string
          estimated_reading_time?: number
          excerpt: string
          featured_image?: string | null
          id?: string
          keywords?: string[]
          meta_description: string
          meta_title: string
          publish_date?: string | null
          readability_score?: number
          seo_score?: number
          slug: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
          webhook_response?: Json | null
          webhook_sent_at?: string | null
          webhook_settings_id?: string | null
          word_count?: number
        }
        Update: {
          ai_generated?: boolean
          ai_prompt?: string | null
          author_id?: string | null
          category?: string
          city_id?: string | null
          content?: string
          created_at?: string
          estimated_reading_time?: number
          excerpt?: string
          featured_image?: string | null
          id?: string
          keywords?: string[]
          meta_description?: string
          meta_title?: string
          publish_date?: string | null
          readability_score?: number
          seo_score?: number
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
          webhook_response?: Json | null
          webhook_sent_at?: string | null
          webhook_settings_id?: string | null
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_articles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_articles_webhook_settings_id_fkey"
            columns: ["webhook_settings_id"]
            isOneToOne: false
            referencedRelation: "webhook_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_content_calendar: {
        Row: {
          created_at: string
          focus_theme: string
          id: string
          month_name: string
          priority_keywords: string[]
          seasonal_events: string[] | null
          target_posts_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          focus_theme: string
          id?: string
          month_name: string
          priority_keywords?: string[]
          seasonal_events?: string[] | null
          target_posts_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          focus_theme?: string
          id?: string
          month_name?: string
          priority_keywords?: string[]
          seasonal_events?: string[] | null
          target_posts_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_keyword_clusters: {
        Row: {
          cluster_id: number
          content_type: string
          created_at: string
          description: string
          id: string
          name: string
          search_intent: string
          target_audience: string[]
          updated_at: string
        }
        Insert: {
          cluster_id: number
          content_type: string
          created_at?: string
          description: string
          id?: string
          name: string
          search_intent: string
          target_audience?: string[]
          updated_at?: string
        }
        Update: {
          cluster_id?: number
          content_type?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          search_intent?: string
          target_audience?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      blog_keywords: {
        Row: {
          blog_angle: string
          buyer_intent: string
          cluster_id: number
          competition: string
          content_type: string
          created_at: string
          id: string
          last_used_at: string | null
          local_modifier: boolean
          primary_keyword: string
          priority_score: number | null
          product_category: string | null
          related_keywords: string[]
          search_volume: string
          seasonal: boolean
          seasonal_months: string[] | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          blog_angle: string
          buyer_intent: string
          cluster_id: number
          competition: string
          content_type: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          local_modifier?: boolean
          primary_keyword: string
          priority_score?: number | null
          product_category?: string | null
          related_keywords?: string[]
          search_volume: string
          seasonal?: boolean
          seasonal_months?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          blog_angle?: string
          buyer_intent?: string
          cluster_id?: number
          competition?: string
          content_type?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          local_modifier?: boolean
          primary_keyword?: string
          priority_score?: number | null
          product_category?: string | null
          related_keywords?: string[]
          search_volume?: string
          seasonal?: boolean
          seasonal_months?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_keywords_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "blog_keyword_clusters"
            referencedColumns: ["cluster_id"]
          },
        ]
      }
      blog_post_templates: {
        Row: {
          applicable_clusters: number[]
          created_at: string
          id: string
          seo_requirements: Json
          structure: string[]
          target_length: string
          template_name: string
          updated_at: string
        }
        Insert: {
          applicable_clusters?: number[]
          created_at?: string
          id?: string
          seo_requirements?: Json
          structure?: string[]
          target_length: string
          template_name: string
          updated_at?: string
        }
        Update: {
          applicable_clusters?: number[]
          created_at?: string
          id?: string
          seo_requirements?: Json
          structure?: string[]
          target_length?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_seo_keywords: {
        Row: {
          category: string | null
          city_specific: boolean
          created_at: string
          difficulty_score: number | null
          id: string
          keyword: string
          last_updated: string
          related_keywords: string[] | null
          search_volume: number | null
        }
        Insert: {
          category?: string | null
          city_specific?: boolean
          created_at?: string
          difficulty_score?: number | null
          id?: string
          keyword: string
          last_updated?: string
          related_keywords?: string[] | null
          search_volume?: number | null
        }
        Update: {
          category?: string | null
          city_specific?: boolean
          created_at?: string
          difficulty_score?: number | null
          id?: string
          keyword?: string
          last_updated?: string
          related_keywords?: string[] | null
          search_volume?: number | null
        }
        Relationships: []
      }
      campaign_automation: {
        Row: {
          automation_status: string
          campaign_id: string
          created_at: string
          created_by: string
          generation_progress: Json | null
          id: string
          posts_generated: number
          total_days: number
          updated_at: string
          webhook_settings_id: string | null
        }
        Insert: {
          automation_status?: string
          campaign_id: string
          created_at?: string
          created_by: string
          generation_progress?: Json | null
          id?: string
          posts_generated?: number
          total_days?: number
          updated_at?: string
          webhook_settings_id?: string | null
        }
        Update: {
          automation_status?: string
          campaign_id?: string
          created_at?: string
          created_by?: string
          generation_progress?: Json | null
          id?: string
          posts_generated?: number
          total_days?: number
          updated_at?: string
          webhook_settings_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_automation_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_media_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_automation_webhook_settings_id_fkey"
            columns: ["webhook_settings_id"]
            isOneToOne: false
            referencedRelation: "webhook_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          items: Json
          reminder_sent_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          reminder_sent_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          reminder_sent_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          city_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          city_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          city_logo_url: string | null
          created_at: string
          description: string | null
          hero_image_url: string | null
          id: string
          is_active: boolean
          launch_date: string | null
          name: string
          slug: string
          state: string
          updated_at: string
        }
        Insert: {
          city_logo_url?: string | null
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          launch_date?: string | null
          name: string
          slug: string
          state: string
          updated_at?: string
        }
        Update: {
          city_logo_url?: string | null
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          launch_date?: string | null
          name?: string
          slug?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      compliance_audit_log: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_type: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          seller_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          seller_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          seller_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          last_accessed: string | null
          progress: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          last_accessed?: string | null
          progress?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          last_accessed?: string | null
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "craft_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      craft_courses: {
        Row: {
          category: string
          city_id: string | null
          created_at: string
          description: string
          duration_minutes: number
          enrollment_count: number
          id: string
          instructor_id: string
          is_free: boolean
          is_published: boolean
          learning_outcomes: string[] | null
          materials_needed: string[] | null
          price: number | null
          rating: number | null
          review_count: number
          skill_level: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          city_id?: string | null
          created_at?: string
          description: string
          duration_minutes: number
          enrollment_count?: number
          id?: string
          instructor_id: string
          is_free?: boolean
          is_published?: boolean
          learning_outcomes?: string[] | null
          materials_needed?: string[] | null
          price?: number | null
          rating?: number | null
          review_count?: number
          skill_level: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          city_id?: string | null
          created_at?: string
          description?: string
          duration_minutes?: number
          enrollment_count?: number
          id?: string
          instructor_id?: string
          is_free?: boolean
          is_published?: boolean
          learning_outcomes?: string[] | null
          materials_needed?: string[] | null
          price?: number | null
          rating?: number | null
          review_count?: number
          skill_level?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "craft_courses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          created_at: string
          dispute_id: string
          id: string
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          id?: string
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          id?: string
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          dispute_type: string
          disputed_user_id: string
          disputing_user_id: string
          evidence_urls: string[] | null
          id: string
          order_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          dispute_type: string
          disputed_user_id: string
          disputing_user_id: string
          evidence_urls?: string[] | null
          id?: string
          order_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          dispute_type?: string
          disputed_user_id?: string
          disputing_user_id?: string
          evidence_urls?: string[] | null
          id?: string
          order_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dmca_notices: {
        Row: {
          claimant_address: string | null
          claimant_email: string
          claimant_name: string
          claimant_signature: string | null
          counter_notice_id: string | null
          created_at: string
          id: string
          infringing_url: string
          listing_id: string | null
          notice_type: string
          original_work_description: string
          responded_at: string | null
          response_action: string | null
          response_deadline: string
          response_notes: string | null
          restoration_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          claimant_address?: string | null
          claimant_email: string
          claimant_name: string
          claimant_signature?: string | null
          counter_notice_id?: string | null
          created_at?: string
          id?: string
          infringing_url: string
          listing_id?: string | null
          notice_type: string
          original_work_description: string
          responded_at?: string | null
          response_action?: string | null
          response_deadline: string
          response_notes?: string | null
          restoration_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          claimant_address?: string | null
          claimant_email?: string
          claimant_name?: string
          claimant_signature?: string | null
          counter_notice_id?: string | null
          created_at?: string
          id?: string
          infringing_url?: string
          listing_id?: string | null
          notice_type?: string
          original_work_description?: string
          responded_at?: string | null
          response_action?: string | null
          response_deadline?: string
          response_notes?: string | null
          restoration_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dmca_notices_counter_notice_id_fkey"
            columns: ["counter_notice_id"]
            isOneToOne: false
            referencedRelation: "dmca_notices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dmca_notices_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          created_at: string
          error_type: string
          id: string
          message: string
          metadata: Json | null
          resolved: boolean
          resolved_at: string | null
          session_id: string | null
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_type: string
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          session_id?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          session_id?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      featured_makers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city_id: string | null
          cover_image_url: string | null
          created_at: string
          featured_description: string | null
          featured_until: string | null
          id: string
          is_featured: boolean | null
          location: string | null
          neighborhood: string | null
          rating: number | null
          review_count: number | null
          shop_name: string
          social_links: Json | null
          sort_order: number | null
          specialty: string
          tags: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          featured_description?: string | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean | null
          location?: string | null
          neighborhood?: string | null
          rating?: number | null
          review_count?: number | null
          shop_name: string
          social_links?: Json | null
          sort_order?: number | null
          specialty: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          featured_description?: string | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean | null
          location?: string | null
          neighborhood?: string | null
          rating?: number | null
          review_count?: number | null
          shop_name?: string
          social_links?: Json | null
          sort_order?: number | null
          specialty?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_makers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_slots: {
        Row: {
          action_text: string | null
          action_url: string | null
          category_id: string | null
          city_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          listing_id: string | null
          slot_type: string
          sort_order: number
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_text?: string | null
          action_url?: string | null
          category_id?: string | null
          city_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          listing_id?: string | null
          slot_type: string
          sort_order?: number
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_text?: string | null
          action_url?: string | null
          category_id?: string | null
          city_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          listing_id?: string | null
          slot_type?: string
          sort_order?: number
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_slots_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_slots_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_slots_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_detection_rules: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          rule_name: string
          rule_type: string
          severity: string
          threshold_config: Json
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          rule_name: string
          rule_type: string
          severity: string
          threshold_config: Json
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          rule_name?: string
          rule_type?: string
          severity?: string
          threshold_config?: Json
          updated_at?: string
        }
        Relationships: []
      }
      fraud_detection_sessions: {
        Row: {
          behavioral_data: Json | null
          created_at: string
          device_fingerprint: Json | null
          id: string
          ip_address: unknown
          risk_score: number | null
          session_end: string | null
          session_id: string
          session_start: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          behavioral_data?: Json | null
          created_at?: string
          device_fingerprint?: Json | null
          id?: string
          ip_address?: unknown
          risk_score?: number | null
          session_end?: string | null
          session_id: string
          session_start?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          behavioral_data?: Json | null
          created_at?: string
          device_fingerprint?: Json | null
          id?: string
          ip_address?: unknown
          risk_score?: number | null
          session_end?: string | null
          session_id?: string
          session_start?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fraud_reviews: {
        Row: {
          automated: boolean
          created_at: string
          decision: string
          id: string
          notes: string | null
          order_id: string | null
          reason: string | null
          reviewer_id: string
          signal_id: string
          user_id: string
        }
        Insert: {
          automated?: boolean
          created_at?: string
          decision: string
          id?: string
          notes?: string | null
          order_id?: string | null
          reason?: string | null
          reviewer_id: string
          signal_id: string
          user_id: string
        }
        Update: {
          automated?: boolean
          created_at?: string
          decision?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          reason?: string | null
          reviewer_id?: string
          signal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_reviews_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "fraud_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_signals: {
        Row: {
          action_required: boolean
          action_taken: string | null
          confidence: number
          created_at: string
          description: string
          false_positive: boolean | null
          id: string
          metadata: Json | null
          order_id: string | null
          session_id: string | null
          severity: string
          signal_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_required?: boolean
          action_taken?: string | null
          confidence: number
          created_at?: string
          description: string
          false_positive?: boolean | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          session_id?: string | null
          severity: string
          signal_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_required?: boolean
          action_taken?: string | null
          confidence?: number
          created_at?: string
          description?: string
          false_positive?: boolean | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          session_id?: string | null
          severity?: string
          signal_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_signals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_signals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "fraud_detection_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      image_optimizations: {
        Row: {
          created_at: string
          id: string
          optimized_versions: Json
          original_size: number
          original_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          optimized_versions?: Json
          original_size: number
          original_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          optimized_versions?: Json
          original_size?: number
          original_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          created_at: string
          current_stock: number
          id: string
          listing_id: string
          metadata: Json | null
          resolved_at: string | null
          seller_id: string
          status: string
          threshold: number | null
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string
          current_stock: number
          id?: string
          listing_id: string
          metadata?: Json | null
          resolved_at?: string | null
          seller_id: string
          status?: string
          threshold?: number | null
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          current_stock?: number
          id?: string
          listing_id?: string
          metadata?: Json | null
          resolved_at?: string | null
          seller_id?: string
          status?: string
          threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          listing_id: string
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          listing_id: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          listing_id?: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_analytics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category_id: string | null
          city_id: string | null
          created_at: string
          description: string | null
          estimated_shipping_days: number | null
          featured: boolean
          free_shipping_threshold: number | null
          id: string
          images: string[] | null
          inventory_count: number | null
          local_pickup_available: boolean
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          national_shipping_available: boolean | null
          pickup_location: string | null
          pickup_today: boolean | null
          price: number
          ready_today: boolean | null
          seller_id: string
          shipping_available: boolean
          shipping_cost: number | null
          shipping_notes: string | null
          ships_today: boolean | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          description?: string | null
          estimated_shipping_days?: number | null
          featured?: boolean
          free_shipping_threshold?: number | null
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          local_pickup_available?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          national_shipping_available?: boolean | null
          pickup_location?: string | null
          pickup_today?: boolean | null
          price: number
          ready_today?: boolean | null
          seller_id: string
          shipping_available?: boolean
          shipping_cost?: number | null
          shipping_notes?: string | null
          ships_today?: boolean | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          description?: string | null
          estimated_shipping_days?: number | null
          featured?: boolean
          free_shipping_threshold?: number | null
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          local_pickup_available?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          national_shipping_available?: boolean | null
          pickup_location?: string | null
          pickup_today?: boolean | null
          price?: number
          ready_today?: boolean | null
          seller_id?: string
          shipping_available?: boolean
          shipping_cost?: number | null
          shipping_notes?: string | null
          ships_today?: boolean | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      maker_livestreams: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          category: string
          city_id: string | null
          created_at: string
          description: string
          id: string
          maker_id: string
          scheduled_end: string | null
          scheduled_start: string
          status: string
          stream_url: string | null
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          viewer_count: number
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          category: string
          city_id?: string | null
          created_at?: string
          description: string
          id?: string
          maker_id: string
          scheduled_end?: string | null
          scheduled_start: string
          status?: string
          stream_url?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          viewer_count?: number
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          category?: string
          city_id?: string | null
          created_at?: string
          description?: string
          id?: string
          maker_id?: string
          scheduled_end?: string | null
          scheduled_start?: string
          status?: string
          stream_url?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "maker_livestreams_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      meetup_attendees: {
        Row: {
          created_at: string
          id: string
          meetup_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meetup_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meetup_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetup_attendees_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "pickup_meetups"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_applications: {
        Row: {
          applicant_id: string
          application_message: string
          created_at: string
          id: string
          program_id: string
          response_message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          application_message: string
          created_at?: string
          id?: string
          program_id: string
          response_message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          application_message?: string
          created_at?: string
          id?: string
          program_id?: string
          response_message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "mentorship_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_programs: {
        Row: {
          city_id: string | null
          craft_specialty: string
          created_at: string
          current_mentees: number
          description: string
          duration_weeks: number
          experience_required: string
          id: string
          is_accepting: boolean
          max_mentees: number
          mentor_id: string
          tags: string[]
          time_commitment_hours: number
          title: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          craft_specialty: string
          created_at?: string
          current_mentees?: number
          description: string
          duration_weeks: number
          experience_required: string
          id?: string
          is_accepting?: boolean
          max_mentees?: number
          mentor_id: string
          tags?: string[]
          time_commitment_hours: number
          title: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          craft_specialty?: string
          created_at?: string
          current_mentees?: number
          description?: string
          duration_weeks?: number
          experience_required?: string
          id?: string
          is_accepting?: boolean
          max_mentees?: number
          mentor_id?: string
          tags?: string[]
          time_commitment_hours?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_programs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          listing_id: string | null
          order_id: string | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          listing_id?: string | null
          order_id?: string | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          order_id?: string | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          listing_id: string | null
          moderator_id: string
          new_status: string | null
          notes: string | null
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          listing_id?: string | null
          moderator_id: string
          new_status?: string | null
          notes?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          moderator_id?: string
          new_status?: string | null
          notes?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          assigned_to: string | null
          auto_flagged: boolean
          confidence_score: number | null
          content_id: string
          content_type: string
          created_at: string
          flag_reasons: Json | null
          id: string
          priority: string
          reviewed_at: string | null
          reviewer_notes: string | null
          seller_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          auto_flagged?: boolean
          confidence_score?: number | null
          content_id: string
          content_type: string
          created_at?: string
          flag_reasons?: Json | null
          id?: string
          priority?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          seller_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          auto_flagged?: boolean
          confidence_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          flag_reasons?: Json | null
          id?: string
          priority?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          seller_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_queue_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          read: boolean
          read_at: string | null
          related_id: string | null
          sender_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          related_id?: string | null
          sender_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          related_id?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          allowed_scopes: string[]
          client_id: string
          client_name: string
          client_secret: string
          created_at: string | null
          id: string
          is_active: boolean | null
          redirect_uris: string[]
          updated_at: string | null
        }
        Insert: {
          allowed_scopes: string[]
          client_id: string
          client_name: string
          client_secret: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          redirect_uris: string[]
          updated_at?: string | null
        }
        Update: {
          allowed_scopes?: string[]
          client_id?: string
          client_name?: string
          client_secret?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          redirect_uris?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      oauth_events: {
        Row: {
          client_id: string | null
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          scope: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          scope?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          scope?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          customization_options: Json | null
          id: string
          listing_id: string | null
          order_id: string
          product_description: string | null
          product_images: string[] | null
          product_name: string
          quantity: number
          seller_id: string | null
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customization_options?: Json | null
          id?: string
          listing_id?: string | null
          order_id: string
          product_description?: string | null
          product_images?: string[] | null
          product_name: string
          quantity?: number
          seller_id?: string | null
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customization_options?: Json | null
          id?: string
          listing_id?: string | null
          order_id?: string
          product_description?: string | null
          product_images?: string[] | null
          product_name?: string
          quantity?: number
          seller_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reminders: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          order_id: string
          recipient_id: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          order_id: string
          recipient_id: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          order_id?: string
          recipient_id?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_reminders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_geo_confirmed: boolean | null
          buyer_id: string
          carrier: string | null
          commission_amount: number
          created_at: string
          dispute_id: string | null
          escrow_release_date: string | null
          fulfillment_method: string
          geo_checkin_data: Json | null
          gift_message: string | null
          gift_mode: boolean | null
          gift_recipient_email: string | null
          hide_prices_on_receipt: boolean | null
          id: string
          listing_id: string
          notes: string | null
          payment_authorized_at: string | null
          payment_hold_status: string | null
          payment_status: string
          pickup_confirmed_at: string | null
          pickup_location: string | null
          quantity: number
          scheduled_ship_date: string | null
          seller_handoff_confirmed: boolean | null
          seller_id: string
          shipping_address: Json | null
          shipping_label_url: string | null
          status: string
          stripe_payment_intent_id: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          buyer_geo_confirmed?: boolean | null
          buyer_id: string
          carrier?: string | null
          commission_amount: number
          created_at?: string
          dispute_id?: string | null
          escrow_release_date?: string | null
          fulfillment_method: string
          geo_checkin_data?: Json | null
          gift_message?: string | null
          gift_mode?: boolean | null
          gift_recipient_email?: string | null
          hide_prices_on_receipt?: boolean | null
          id?: string
          listing_id: string
          notes?: string | null
          payment_authorized_at?: string | null
          payment_hold_status?: string | null
          payment_status?: string
          pickup_confirmed_at?: string | null
          pickup_location?: string | null
          quantity?: number
          scheduled_ship_date?: string | null
          seller_handoff_confirmed?: boolean | null
          seller_id: string
          shipping_address?: Json | null
          shipping_label_url?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          buyer_geo_confirmed?: boolean | null
          buyer_id?: string
          carrier?: string | null
          commission_amount?: number
          created_at?: string
          dispute_id?: string | null
          escrow_release_date?: string | null
          fulfillment_method?: string
          geo_checkin_data?: Json | null
          gift_message?: string | null
          gift_mode?: boolean | null
          gift_recipient_email?: string | null
          hide_prices_on_receipt?: boolean | null
          id?: string
          listing_id?: string
          notes?: string | null
          payment_authorized_at?: string | null
          payment_hold_status?: string | null
          payment_status?: string
          pickup_confirmed_at?: string | null
          pickup_location?: string | null
          quantity?: number
          scheduled_ship_date?: string | null
          seller_handoff_confirmed?: boolean | null
          seller_id?: string
          shipping_address?: Json | null
          shipping_label_url?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_alerts: {
        Row: {
          action_taken: string | null
          alert_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          resolved: boolean
          resolved_at: string | null
          threshold_value: number
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          resolved?: boolean
          resolved_at?: string | null
          threshold_value: number
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          resolved?: boolean
          resolved_at?: string | null
          threshold_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string
          id: string
          metrics: Json
          page_url: string
          session_id: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metrics?: Json
          page_url: string
          session_id: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json
          page_url?: string
          session_id?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      performance_recommendations: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          impact_estimate: string | null
          implementation_effort: string | null
          implementation_notes: string | null
          metric_improvement: Json | null
          priority: string
          recommendation_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          impact_estimate?: string | null
          implementation_effort?: string | null
          implementation_notes?: string | null
          metric_improvement?: Json | null
          priority: string
          recommendation_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          impact_estimate?: string | null
          implementation_effort?: string | null
          implementation_notes?: string | null
          metric_improvement?: Json | null
          priority?: string
          recommendation_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      photo_quality_scores: {
        Row: {
          analyzed_at: string
          created_at: string
          id: string
          image_url: string
          issues: Json | null
          listing_id: string
          quality_score: number
          suggestions: Json | null
        }
        Insert: {
          analyzed_at?: string
          created_at?: string
          id?: string
          image_url: string
          issues?: Json | null
          listing_id: string
          quality_score: number
          suggestions?: Json | null
        }
        Update: {
          analyzed_at?: string
          created_at?: string
          id?: string
          image_url?: string
          issues?: Json | null
          listing_id?: string
          quality_score?: number
          suggestions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_quality_scores_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_appointments: {
        Row: {
          buyer_id: string
          buyer_notes: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          order_id: string
          pickup_location: string
          seller_id: string
          seller_notes: string | null
          slot_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_notes?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          pickup_location: string
          seller_id: string
          seller_notes?: string | null
          slot_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_notes?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          pickup_location?: string
          seller_id?: string
          seller_notes?: string | null
          slot_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pickup_meetups: {
        Row: {
          city_id: string | null
          created_at: string
          current_attendees: number
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          location_address: string
          location_name: string
          max_attendees: number | null
          meetup_date: string
          seller_id: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          current_attendees?: number
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location_address: string
          location_name: string
          max_attendees?: number | null
          meetup_date: string
          seller_id: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          current_attendees?: number
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location_address?: string
          location_name?: string
          max_attendees?: number | null
          meetup_date?: string
          seller_id?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_meetups_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_slots: {
        Row: {
          created_at: string
          date: string
          id: string
          is_available: boolean
          notes: string | null
          seller_id: string
          time_end: string
          time_start: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_available?: boolean
          notes?: string | null
          seller_id: string
          time_end: string
          time_start: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          seller_id?: string
          time_end?: string
          time_start?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          analytics_enabled: boolean
          created_at: string
          custom_branding: boolean
          featured_listings: number
          features: string[]
          id: string
          interval: string
          max_listings: number | null
          name: string
          popular: boolean
          price: number
          priority_support: boolean
          stripe_price_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          analytics_enabled?: boolean
          created_at?: string
          custom_branding?: boolean
          featured_listings?: number
          features?: string[]
          id?: string
          interval: string
          max_listings?: number | null
          name: string
          popular?: boolean
          price: number
          priority_support?: boolean
          stripe_price_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          analytics_enabled?: boolean
          created_at?: string
          custom_branding?: boolean
          featured_listings?: number
          features?: string[]
          id?: string
          interval?: string
          max_listings?: number | null
          name?: string
          popular?: boolean
          price?: number
          priority_support?: boolean
          stripe_price_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_recommendations: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          metadata: Json | null
          recommendation_type: string
          recommended_listing_id: string
          score: number
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          metadata?: Json | null
          recommendation_type: string
          recommended_listing_id: string
          score?: number
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          metadata?: Json | null
          recommendation_type?: string
          recommended_listing_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_recommended_listing_id_fkey"
            columns: ["recommended_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_address: string | null
          business_name: string | null
          city_id: string | null
          created_at: string
          default_shipping_cost: number | null
          display_name: string | null
          email: string | null
          free_shipping_threshold: number | null
          id: string
          is_seller: boolean
          last_seen_at: string | null
          location: string | null
          notification_preferences: Json | null
          phone: string | null
          seller_categories: string[] | null
          seller_description: string | null
          seller_verified: boolean
          shipping_policy: string | null
          ships_nationally: boolean | null
          social_links: Json | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_address?: string | null
          business_name?: string | null
          city_id?: string | null
          created_at?: string
          default_shipping_cost?: number | null
          display_name?: string | null
          email?: string | null
          free_shipping_threshold?: number | null
          id?: string
          is_seller?: boolean
          last_seen_at?: string | null
          location?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          seller_categories?: string[] | null
          seller_description?: string | null
          seller_verified?: boolean
          shipping_policy?: string | null
          ships_nationally?: boolean | null
          social_links?: Json | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_address?: string | null
          business_name?: string | null
          city_id?: string | null
          created_at?: string
          default_shipping_cost?: number | null
          display_name?: string | null
          email?: string | null
          free_shipping_threshold?: number | null
          id?: string
          is_seller?: boolean
          last_seen_at?: string | null
          location?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          seller_categories?: string[] | null
          seller_description?: string | null
          seller_verified?: boolean
          shipping_policy?: string | null
          ships_nationally?: boolean | null
          social_links?: Json | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      protection_claim_messages: {
        Row: {
          claim_id: string
          created_at: string
          id: string
          is_admin: boolean
          message: string
          sender_id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          sender_id: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protection_claim_messages_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "protection_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      protection_claims: {
        Row: {
          buyer_id: string
          claim_type: string
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          order_id: string
          resolution_amount: number | null
          resolution_notes: string | null
          resolution_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          claim_type: string
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          order_id: string
          resolution_amount?: number | null
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          claim_type?: string
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          order_id?: string
          resolution_amount?: number | null
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protection_claims_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_logs: {
        Row: {
          allowed: boolean
          created_at: string
          endpoint: string
          id: string
          identifier: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      reorder_history: {
        Row: {
          created_at: string
          id: string
          last_reordered_at: string
          original_order_id: string
          reorder_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reordered_at?: string
          original_order_id: string
          reorder_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reordered_at?: string
          original_order_id?: string
          reorder_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reorder_history_original_order_id_fkey"
            columns: ["original_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          created_at: string
          id: string
          response_text: string
          review_id: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          response_text: string
          review_id: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          response_text?: string
          review_id?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          order_id: string
          photos: string[] | null
          rating: number
          review_type: string
          reviewed_user_id: string
          reviewer_id: string
          status: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          order_id: string
          photos?: string[] | null
          rating: number
          review_type: string
          reviewed_user_id: string
          reviewer_id: string
          status?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          order_id?: string
          photos?: string[] | null
          rating?: number
          review_type?: string
          reviewed_user_id?: string
          reviewer_id?: string
          status?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_tax_nexus: {
        Row: {
          created_at: string
          current_revenue: number
          current_transactions: number
          filing_frequency: string | null
          has_nexus: boolean
          id: string
          last_filing_date: string | null
          next_filing_date: string | null
          nexus_established_date: string | null
          registered_for_tax: boolean
          registration_date: string | null
          revenue_threshold: number
          state: string
          tax_registration_number: string | null
          transaction_threshold: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_revenue?: number
          current_transactions?: number
          filing_frequency?: string | null
          has_nexus?: boolean
          id?: string
          last_filing_date?: string | null
          next_filing_date?: string | null
          nexus_established_date?: string | null
          registered_for_tax?: boolean
          registration_date?: string | null
          revenue_threshold?: number
          state: string
          tax_registration_number?: string | null
          transaction_threshold?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_revenue?: number
          current_transactions?: number
          filing_frequency?: string | null
          has_nexus?: boolean
          id?: string
          last_filing_date?: string | null
          next_filing_date?: string | null
          nexus_established_date?: string | null
          registered_for_tax?: boolean
          registration_date?: string | null
          revenue_threshold?: number
          state?: string
          tax_registration_number?: string | null
          transaction_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          city_id: string | null
          created_at: string
          filters_used: Json | null
          id: string
          query: string
          results_count: number
          user_id: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          filters_used?: Json | null
          id?: string
          query: string
          results_count?: number
          user_id?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string
          filters_used?: Json | null
          id?: string
          query?: string
          results_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_analytics_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_performance_metrics: {
        Row: {
          average_rating: number | null
          canceled_orders: number
          chargebacks: number
          communication_score: number | null
          created_at: string
          disputes_filed: number
          disputes_lost: number
          id: string
          late_shipments: number
          meets_standards: boolean
          messages_responded_24h: number
          on_time_shipments: number
          overall_score: number | null
          period_end: string
          period_start: string
          quality_score: number | null
          response_time_avg_hours: number | null
          restriction_applied: boolean
          seller_id: string
          shipping_score: number | null
          total_messages: number
          total_orders: number
          total_reviews: number
          updated_at: string
          warning_sent: boolean
        }
        Insert: {
          average_rating?: number | null
          canceled_orders?: number
          chargebacks?: number
          communication_score?: number | null
          created_at?: string
          disputes_filed?: number
          disputes_lost?: number
          id?: string
          late_shipments?: number
          meets_standards?: boolean
          messages_responded_24h?: number
          on_time_shipments?: number
          overall_score?: number | null
          period_end: string
          period_start: string
          quality_score?: number | null
          response_time_avg_hours?: number | null
          restriction_applied?: boolean
          seller_id: string
          shipping_score?: number | null
          total_messages?: number
          total_orders?: number
          total_reviews?: number
          updated_at?: string
          warning_sent?: boolean
        }
        Update: {
          average_rating?: number | null
          canceled_orders?: number
          chargebacks?: number
          communication_score?: number | null
          created_at?: string
          disputes_filed?: number
          disputes_lost?: number
          id?: string
          late_shipments?: number
          meets_standards?: boolean
          messages_responded_24h?: number
          on_time_shipments?: number
          overall_score?: number | null
          period_end?: string
          period_start?: string
          quality_score?: number | null
          response_time_avg_hours?: number | null
          restriction_applied?: boolean
          seller_id?: string
          shipping_score?: number | null
          total_messages?: number
          total_orders?: number
          total_reviews?: number
          updated_at?: string
          warning_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "seller_performance_metrics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seller_price_analytics: {
        Row: {
          analyzed_at: string
          avg_market_price: number
          category_id: string | null
          competitor_count: number
          created_at: string
          id: string
          price_percentile: number
          recommendation: string | null
          seller_avg_price: number
          seller_id: string
        }
        Insert: {
          analyzed_at?: string
          avg_market_price: number
          category_id?: string | null
          competitor_count?: number
          created_at?: string
          id?: string
          price_percentile: number
          recommendation?: string | null
          seller_avg_price: number
          seller_id: string
        }
        Update: {
          analyzed_at?: string
          avg_market_price?: number
          category_id?: string | null
          competitor_count?: number
          created_at?: string
          id?: string
          price_percentile?: number
          recommendation?: string | null
          seller_avg_price?: number
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_price_analytics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_public_disclosures: {
        Row: {
          business_address: string
          business_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          disclosure_required_since: string
          id: string
          is_active: boolean
          seller_id: string
          updated_at: string
        }
        Insert: {
          business_address: string
          business_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          disclosure_required_since: string
          id?: string
          is_active?: boolean
          seller_id: string
          updated_at?: string
        }
        Update: {
          business_address?: string
          business_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          disclosure_required_since?: string
          id?: string
          is_active?: boolean
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_public_disclosures_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seller_tax_info: {
        Row: {
          backup_withholding_exempt: boolean
          backup_withholding_rate: number | null
          business_entity_type: string | null
          created_at: string
          id: string
          legal_name: string | null
          seller_id: string
          tax_address: Json | null
          tax_id_last_4: string | null
          tax_id_type: string | null
          tin_verification_date: string | null
          tin_verified: boolean
          updated_at: string
          w9_approved_at: string | null
          w9_form_url: string | null
          w9_submitted_at: string | null
        }
        Insert: {
          backup_withholding_exempt?: boolean
          backup_withholding_rate?: number | null
          business_entity_type?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          seller_id: string
          tax_address?: Json | null
          tax_id_last_4?: string | null
          tax_id_type?: string | null
          tin_verification_date?: string | null
          tin_verified?: boolean
          updated_at?: string
          w9_approved_at?: string | null
          w9_form_url?: string | null
          w9_submitted_at?: string | null
        }
        Update: {
          backup_withholding_exempt?: boolean
          backup_withholding_rate?: number | null
          business_entity_type?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          seller_id?: string
          tax_address?: Json | null
          tax_id_last_4?: string | null
          tax_id_type?: string | null
          tin_verification_date?: string | null
          tin_verified?: boolean
          updated_at?: string
          w9_approved_at?: string | null
          w9_form_url?: string | null
          w9_submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_tax_info_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          created_at: string
          estimated_days: number | null
          free_shipping_threshold: number | null
          id: string
          is_active: boolean | null
          seller_id: string
          shipping_cost: number
          states: string[]
          updated_at: string
          zone_name: string
        }
        Insert: {
          created_at?: string
          estimated_days?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          seller_id: string
          shipping_cost: number
          states: string[]
          updated_at?: string
          zone_name: string
        }
        Update: {
          created_at?: string
          estimated_days?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          seller_id?: string
          shipping_cost?: number
          states?: string[]
          updated_at?: string
          zone_name?: string
        }
        Relationships: []
      }
      sla_metrics: {
        Row: {
          created_at: string
          downtime_minutes: number
          failed_checks: number
          id: string
          incident_count: number
          mttr_minutes: number | null
          period_end: string
          period_start: string
          sla_met: boolean
          sla_target: number
          successful_checks: number
          total_checks: number
          uptime_percentage: number
        }
        Insert: {
          created_at?: string
          downtime_minutes?: number
          failed_checks?: number
          id?: string
          incident_count?: number
          mttr_minutes?: number | null
          period_end: string
          period_start: string
          sla_met?: boolean
          sla_target?: number
          successful_checks?: number
          total_checks?: number
          uptime_percentage: number
        }
        Update: {
          created_at?: string
          downtime_minutes?: number
          failed_checks?: number
          id?: string
          incident_count?: number
          mttr_minutes?: number | null
          period_end?: string
          period_start?: string
          sla_met?: boolean
          sla_target?: number
          successful_checks?: number
          total_checks?: number
          uptime_percentage?: number
        }
        Relationships: []
      }
      social_media_campaigns: {
        Row: {
          campaign_type: string
          city_id: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          goals: string | null
          hashtags: string[] | null
          id: string
          name: string
          start_date: string
          status: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          campaign_type: string
          city_id: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          goals?: string | null
          hashtags?: string[] | null
          id?: string
          name: string
          start_date: string
          status?: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          campaign_type?: string
          city_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          goals?: string | null
          hashtags?: string[] | null
          id?: string
          name?: string
          start_date?: string
          status?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_campaigns_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_posts: {
        Row: {
          ai_generated: boolean
          ai_prompt: string | null
          auto_generated: boolean
          campaign_day: number | null
          campaign_id: string | null
          city_id: string
          content: string
          created_at: string
          created_by: string
          engagement_stats: Json | null
          hashtags: string[] | null
          id: string
          long_description: string | null
          media_urls: string[] | null
          platform: string
          post_theme: string | null
          post_type: string
          posted_at: string | null
          scheduled_for: string | null
          short_description: string | null
          status: string
          title: string | null
          updated_at: string
          webhook_response: Json | null
          webhook_sent_at: string | null
        }
        Insert: {
          ai_generated?: boolean
          ai_prompt?: string | null
          auto_generated?: boolean
          campaign_day?: number | null
          campaign_id?: string | null
          city_id: string
          content: string
          created_at?: string
          created_by: string
          engagement_stats?: Json | null
          hashtags?: string[] | null
          id?: string
          long_description?: string | null
          media_urls?: string[] | null
          platform: string
          post_theme?: string | null
          post_type: string
          posted_at?: string | null
          scheduled_for?: string | null
          short_description?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          webhook_response?: Json | null
          webhook_sent_at?: string | null
        }
        Update: {
          ai_generated?: boolean
          ai_prompt?: string | null
          auto_generated?: boolean
          campaign_day?: number | null
          campaign_id?: string | null
          city_id?: string
          content?: string
          created_at?: string
          created_by?: string
          engagement_stats?: Json | null
          hashtags?: string[] | null
          id?: string
          long_description?: string | null
          media_urls?: string[] | null
          platform?: string
          post_theme?: string | null
          post_type?: string
          posted_at?: string | null
          scheduled_for?: string | null
          short_description?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          webhook_response?: Json | null
          webhook_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_media_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_posts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_templates: {
        Row: {
          content_template: string
          created_at: string
          created_by: string
          description: string | null
          hashtag_template: string[] | null
          id: string
          is_active: boolean
          name: string
          platform: string
          template_type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          content_template: string
          created_at?: string
          created_by: string
          description?: string | null
          hashtag_template?: string[] | null
          id?: string
          is_active?: boolean
          name: string
          platform: string
          template_type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          content_template?: string
          created_at?: string
          created_by?: string
          description?: string | null
          hashtag_template?: string[] | null
          id?: string
          is_active?: boolean
          name?: string
          platform?: string
          template_type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_checks: {
        Row: {
          components: Json
          created_at: string
          error_message: string | null
          id: string
          response_time: number | null
          score: number
          status: string
        }
        Insert: {
          components?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          response_time?: number | null
          score: number
          status: string
        }
        Update: {
          components?: Json
          created_at?: string
          error_message?: string | null
          id?: string
          response_time?: number | null
          score?: number
          status?: string
        }
        Relationships: []
      }
      tax_form_1099k: {
        Row: {
          created_at: string
          form_data: Json | null
          form_filed_with_irs_at: string | null
          form_generated_at: string | null
          form_pdf_url: string | null
          form_required: boolean
          form_sent_to_seller_at: string | null
          gross_revenue: number
          id: string
          irs_filing_status: string | null
          seller_id: string
          tax_year: number
          total_transactions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_data?: Json | null
          form_filed_with_irs_at?: string | null
          form_generated_at?: string | null
          form_pdf_url?: string | null
          form_required?: boolean
          form_sent_to_seller_at?: string | null
          gross_revenue?: number
          id?: string
          irs_filing_status?: string | null
          seller_id: string
          tax_year: number
          total_transactions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_data?: Json | null
          form_filed_with_irs_at?: string | null
          form_generated_at?: string | null
          form_pdf_url?: string | null
          form_required?: boolean
          form_sent_to_seller_at?: string | null
          gross_revenue?: number
          id?: string
          irs_filing_status?: string | null
          seller_id?: string
          tax_year?: number
          total_transactions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_form_1099k_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      uptime_incidents: {
        Row: {
          affected_components: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          resolution_summary: string | null
          resolved_at: string | null
          root_cause: string | null
          severity: string
          started_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_components?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          resolution_summary?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity: string
          started_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_components?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          resolution_summary?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_device_fingerprints: {
        Row: {
          created_at: string
          fingerprint: Json
          first_seen: string
          id: string
          is_trusted: boolean
          last_seen: string
          trust_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fingerprint: Json
          first_seen?: string
          id?: string
          is_trusted?: boolean
          last_seen?: string
          trust_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fingerprint?: Json
          first_seen?: string
          id?: string
          is_trusted?: boolean
          last_seen?: string
          trust_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          city_id: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          city_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          city_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trust_scores: {
        Row: {
          account_age_days: number
          created_at: string
          failed_transactions: number
          fraud_signals_count: number
          id: string
          last_calculated: string
          last_fraud_signal: string | null
          manual_adjustments: Json | null
          stripe_verification_status: string | null
          successful_transactions: number
          trust_score: number
          updated_at: string
          user_id: string
          verification_level: string
        }
        Insert: {
          account_age_days?: number
          created_at?: string
          failed_transactions?: number
          fraud_signals_count?: number
          id?: string
          last_calculated?: string
          last_fraud_signal?: string | null
          manual_adjustments?: Json | null
          stripe_verification_status?: string | null
          successful_transactions?: number
          trust_score?: number
          updated_at?: string
          user_id: string
          verification_level?: string
        }
        Update: {
          account_age_days?: number
          created_at?: string
          failed_transactions?: number
          fraud_signals_count?: number
          id?: string
          last_calculated?: string
          last_fraud_signal?: string | null
          manual_adjustments?: Json | null
          stripe_verification_status?: string | null
          successful_transactions?: number
          trust_score?: number
          updated_at?: string
          user_id?: string
          verification_level?: string
        }
        Relationships: []
      }
      visual_search_history: {
        Row: {
          created_at: string
          filters_applied: Json | null
          id: string
          image_url: string
          search_results: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          filters_applied?: Json | null
          id?: string
          image_url: string
          search_results?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          filters_applied?: Json | null
          id?: string
          image_url?: string
          search_results?: Json
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          content_id: string
          content_type: string | null
          error_message: string | null
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          sent_at: string
          success: boolean
          webhook_settings_id: string | null
          webhook_url: string
        }
        Insert: {
          content_id: string
          content_type?: string | null
          error_message?: string | null
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
          success?: boolean
          webhook_settings_id?: string | null
          webhook_url: string
        }
        Update: {
          content_id?: string
          content_type?: string | null
          error_message?: string | null
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
          success?: boolean
          webhook_settings_id?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_settings_id_fkey"
            columns: ["webhook_settings_id"]
            isOneToOne: false
            referencedRelation: "webhook_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_settings: {
        Row: {
          auto_publish: boolean | null
          content_types: string[] | null
          created_at: string
          created_by: string
          headers: Json | null
          id: string
          is_active: boolean
          name: string
          platforms: string[]
          retry_config: Json | null
          secret_key: string | null
          updated_at: string
          webhook_type: string
          webhook_url: string
        }
        Insert: {
          auto_publish?: boolean | null
          content_types?: string[] | null
          created_at?: string
          created_by: string
          headers?: Json | null
          id?: string
          is_active?: boolean
          name: string
          platforms?: string[]
          retry_config?: Json | null
          secret_key?: string | null
          updated_at?: string
          webhook_type?: string
          webhook_url: string
        }
        Update: {
          auto_publish?: boolean | null
          content_types?: string[] | null
          created_at?: string
          created_by?: string
          headers?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          platforms?: string[]
          retry_config?: Json | null
          secret_key?: string | null
          updated_at?: string
          webhook_type?: string
          webhook_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_newsletter_subscriptions: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          source: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      high_priority_keywords: {
        Row: {
          blog_angle: string | null
          buyer_intent: string | null
          cluster_id: number | null
          cluster_name: string | null
          competition: string | null
          content_type: string | null
          created_at: string | null
          id: string | null
          last_used_at: string | null
          local_modifier: boolean | null
          primary_keyword: string | null
          priority_score: number | null
          product_category: string | null
          related_keywords: string[] | null
          search_intent: string | null
          search_volume: string | null
          seasonal: boolean | null
          seasonal_months: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_keywords_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "blog_keyword_clusters"
            referencedColumns: ["cluster_id"]
          },
        ]
      }
      seasonal_keywords: {
        Row: {
          blog_angle: string | null
          buyer_intent: string | null
          cluster_content_type: string | null
          cluster_id: number | null
          cluster_name: string | null
          competition: string | null
          content_type: string | null
          created_at: string | null
          id: string | null
          last_used_at: string | null
          local_modifier: boolean | null
          primary_keyword: string | null
          priority_score: number | null
          product_category: string | null
          related_keywords: string[] | null
          search_intent: string | null
          search_volume: string | null
          seasonal: boolean | null
          seasonal_months: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_keywords_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "blog_keyword_clusters"
            referencedColumns: ["cluster_id"]
          },
        ]
      }
      unused_keywords: {
        Row: {
          blog_angle: string | null
          buyer_intent: string | null
          cluster_id: number | null
          cluster_name: string | null
          competition: string | null
          content_type: string | null
          created_at: string | null
          id: string | null
          last_used_at: string | null
          local_modifier: boolean | null
          primary_keyword: string | null
          priority_score: number | null
          product_category: string | null
          related_keywords: string[] | null
          search_volume: string | null
          seasonal: boolean | null
          seasonal_months: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_keywords_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "blog_keyword_clusters"
            referencedColumns: ["cluster_id"]
          },
        ]
      }
    }
    Functions: {
      auto_resolve_stale_alerts: { Args: never; Returns: number }
      calculate_blog_seo_score: {
        Args: {
          p_content: string
          p_featured_image: string
          p_keywords: string[]
          p_meta_description: string
          p_meta_title: string
          p_title: string
        }
        Returns: number
      }
      calculate_category_growth_rate: {
        Args: { category_uuid: string; days_back?: number }
        Returns: number
      }
      calculate_sla_metrics: {
        Args: { end_date: string; start_date: string }
        Returns: {
          downtime_minutes: number
          failed_checks: number
          incident_count: number
          mttr_minutes: number
          successful_checks: number
          total_checks: number
          uptime_percentage: number
        }[]
      }
      check_inventory_levels: { Args: never; Returns: undefined }
      check_shipping_availability: {
        Args: { seller_uuid: string; target_state: string }
        Returns: boolean
      }
      create_compliance_audit_log: {
        Args: {
          _action_type: string
          _actor_id: string
          _actor_type: string
          _details?: Json
          _entity_id: string
          _entity_type: string
          _metadata?: Json
          _seller_id: string
        }
        Returns: string
      }
      create_demo_listings_for_user: { Args: never; Returns: Json }
      create_notification: {
        Args: {
          _action_url?: string
          _content: string
          _metadata?: Json
          _related_id?: string
          _sender_id?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      decrement_inventory: {
        Args: { listing_uuid: string; quantity: number }
        Returns: undefined
      }
      generate_performance_recommendations: { Args: never; Returns: number }
      get_user_scopes: { Args: { user_uuid: string }; Returns: string[] }
      has_role: {
        Args: {
          _city_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_blog_view_count: {
        Args: { article_slug: string }
        Returns: undefined
      }
      increment_listing_views: {
        Args: { listing_uuid: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_city_moderator: {
        Args: { _city_id: string; _user_id: string }
        Returns: boolean
      }
      log_oauth_event: {
        Args: {
          _client_id?: string
          _error_message?: string
          _event_type: string
          _metadata?: Json
          _scope?: string
          _success?: boolean
          _user_id?: string
        }
        Returns: string
      }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      seed_mock_seller_data: { Args: never; Returns: Json }
      should_flag_transaction: {
        Args: {
          seller_id: string
          target_user_id: string
          transaction_amount: number
        }
        Returns: boolean
      }
      trigger_compliance_check: { Args: never; Returns: Json }
      update_last_seen: { Args: { _user_id: string }; Returns: undefined }
      update_user_trust_score: {
        Args: { target_user_id: string }
        Returns: number
      }
      verify_review_purchase: {
        Args: { review_buyer_id: string; review_order_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "city_moderator" | "seller" | "buyer"
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
      app_role: ["admin", "city_moderator", "seller", "buyer"],
    },
  },
} as const
