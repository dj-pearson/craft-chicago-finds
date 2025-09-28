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
      ai_settings: {
        Row: {
          api_endpoint: string
          created_at: string
          id: string
          is_active: boolean
          max_tokens: number
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
          model_name?: string
          model_provider?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
        }
        Relationships: []
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
          featured: boolean
          id: string
          images: string[] | null
          inventory_count: number | null
          local_pickup_available: boolean
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          pickup_location: string | null
          price: number
          seller_id: string
          shipping_available: boolean
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
          featured?: boolean
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          local_pickup_available?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          pickup_location?: string | null
          price: number
          seller_id: string
          shipping_available?: boolean
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
          featured?: boolean
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          local_pickup_available?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          pickup_location?: string | null
          price?: number
          seller_id?: string
          shipping_available?: boolean
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
      orders: {
        Row: {
          buyer_id: string
          commission_amount: number
          created_at: string
          dispute_id: string | null
          fulfillment_method: string
          id: string
          listing_id: string
          notes: string | null
          payment_status: string
          pickup_location: string | null
          quantity: number
          seller_id: string
          shipping_address: Json | null
          status: string
          stripe_payment_intent_id: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          commission_amount: number
          created_at?: string
          dispute_id?: string | null
          fulfillment_method: string
          id?: string
          listing_id: string
          notes?: string | null
          payment_status?: string
          pickup_location?: string | null
          quantity?: number
          seller_id: string
          shipping_address?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          commission_amount?: number
          created_at?: string
          dispute_id?: string | null
          fulfillment_method?: string
          id?: string
          listing_id?: string
          notes?: string | null
          payment_status?: string
          pickup_location?: string | null
          quantity?: number
          seller_id?: string
          shipping_address?: Json | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_address: string | null
          business_name: string | null
          city_id: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_seller: boolean
          last_seen_at: string | null
          location: string | null
          notification_preferences: Json | null
          phone: string | null
          seller_categories: string[] | null
          seller_description: string | null
          seller_verified: boolean
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
          display_name?: string | null
          email?: string | null
          id?: string
          is_seller?: boolean
          last_seen_at?: string | null
          location?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          seller_categories?: string[] | null
          seller_description?: string | null
          seller_verified?: boolean
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
          display_name?: string | null
          email?: string | null
          id?: string
          is_seller?: boolean
          last_seen_at?: string | null
          location?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          seller_categories?: string[] | null
          seller_description?: string | null
          seller_verified?: boolean
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
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          rating: number
          review_type: string
          reviewed_user_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          rating: number
          review_type: string
          reviewed_user_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          rating?: number
          review_type?: string
          reviewed_user_id?: string
          reviewer_id?: string
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
      webhook_logs: {
        Row: {
          error_message: string | null
          id: string
          post_id: string
          request_payload: Json
          response_body: string | null
          response_status: number | null
          sent_at: string
          success: boolean
          webhook_url: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          post_id: string
          request_payload: Json
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
          success?: boolean
          webhook_url: string
        }
        Update: {
          error_message?: string | null
          id?: string
          post_id?: string
          request_payload?: Json
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
          success?: boolean
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_media_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_settings: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          platforms: string[]
          secret_key: string | null
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          platforms?: string[]
          secret_key?: string | null
          updated_at?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          platforms?: string[]
          secret_key?: string | null
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_category_growth_rate: {
        Args: { category_uuid: string; days_back?: number }
        Returns: number
      }
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
      decrement_inventory: {
        Args: { listing_uuid: string; quantity: number }
        Returns: undefined
      }
      has_role: {
        Args: {
          _city_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listing_views: {
        Args: { listing_uuid: string }
        Returns: undefined
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_city_moderator: {
        Args: { _city_id: string; _user_id: string }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      update_last_seen: {
        Args: { _user_id: string }
        Returns: undefined
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
