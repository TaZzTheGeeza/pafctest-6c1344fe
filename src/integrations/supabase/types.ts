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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          type?: string
        }
        Relationships: []
      }
      carpool_offers: {
        Row: {
          created_at: string
          direction: string
          fixture_date: string
          id: string
          notes: string | null
          opponent: string
          pickup_location: string | null
          seats_available: number
          team_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction?: string
          fixture_date: string
          id?: string
          notes?: string | null
          opponent: string
          pickup_location?: string | null
          seats_available?: number
          team_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          fixture_date?: string
          id?: string
          notes?: string | null
          opponent?: string
          pickup_location?: string | null
          seats_available?: number
          team_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      carpool_requests: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          direction: string
          fixture_date: string
          id: string
          notes: string | null
          opponent: string
          passengers_count: number
          pickup_location: string | null
          status: string
          team_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          direction?: string
          fixture_date: string
          id?: string
          notes?: string | null
          opponent: string
          passengers_count?: number
          pickup_location?: string | null
          status?: string
          team_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          direction?: string
          fixture_date?: string
          id?: string
          notes?: string | null
          opponent?: string
          passengers_count?: number
          pickup_location?: string | null
          status?: string
          team_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      club_documents: {
        Row: {
          created_at: string
          description: string | null
          document_category: string
          file_url: string | null
          id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_category?: string
          file_url?: string | null
          id?: string
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_category?: string
          file_url?: string | null
          id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      club_events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          event_type: string
          id: string
          is_all_day: boolean
          location: string | null
          start_time: string
          team: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          start_time: string
          team?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          start_time?: string
          team?: string | null
          title?: string
        }
        Relationships: []
      }
      club_meetings: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number
          id: string
          invite_type: string
          room_code: string
          scheduled_at: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number
          id?: string
          invite_type?: string
          room_code?: string
          scheduled_at: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          invite_type?: string
          room_code?: string
          scheduled_at?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      custom_formations: {
        Row: {
          created_at: string
          format: string
          id: string
          name: string
          slots: Json
          team_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          format: string
          id?: string
          name: string
          slots: Json
          team_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          name?: string
          slots?: Json
          team_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_system: boolean | null
          label: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          label: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          label?: string
          name?: string
        }
        Relationships: []
      }
      document_upload_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      enquiry_replies: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          message: string
          submission_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          message: string
          submission_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          message?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiry_replies_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          note: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          note?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          note?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "club_events"
            referencedColumns: ["id"]
          },
        ]
      }
      fixture_availability: {
        Row: {
          created_at: string
          fixture_date: string
          id: string
          note: string | null
          opponent: string
          responding_for: string | null
          status: string
          team_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fixture_date: string
          id?: string
          note?: string | null
          opponent: string
          responding_for?: string | null
          status?: string
          team_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fixture_date?: string
          id?: string
          note?: string | null
          opponent?: string
          responding_for?: string | null
          status?: string
          team_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gallery_albums: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          title: string
          visibility: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          title: string
          visibility?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          title?: string
          visibility?: string
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          url: string
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "gallery_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          id: string
          invite_token: string | null
          parent_user_id: string
          player_name: string
          status: string
          team_slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_token?: string | null
          parent_user_id: string
          player_name: string
          status?: string
          team_slug: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_token?: string | null
          parent_user_id?: string
          player_name?: string
          status?: string
          team_slug?: string
        }
        Relationships: []
      }
      hub_availability_events: {
        Row: {
          created_at: string
          created_by: string
          event_date: string
          event_time: string | null
          id: string
          team_slug: string
          title: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          event_date: string
          event_time?: string | null
          id?: string
          team_slug: string
          title: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          event_date?: string
          event_time?: string | null
          id?: string
          team_slug?: string
          title?: string
          venue?: string | null
        }
        Relationships: []
      }
      hub_channels: {
        Row: {
          channel_type: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          team_slug: string | null
        }
        Insert: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          team_slug?: string | null
        }
        Update: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          team_slug?: string | null
        }
        Relationships: []
      }
      hub_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "hub_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "hub_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          reply_to: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          reply_to?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          reply_to?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "hub_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "hub_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          team_slug: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          team_slug?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          team_slug?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      hub_payment_requests: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          due_date: string | null
          id: string
          status: string
          team_slug: string | null
          title: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          team_slug?: string | null
          title: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          team_slug?: string | null
          title?: string
        }
        Relationships: []
      }
      hub_payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          paid_at: string | null
          request_id: string
          status: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          paid_at?: string | null
          request_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          request_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_payments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "hub_payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      live_matches: {
        Row: {
          age_group: string
          away_score: number
          away_team: string
          created_at: string
          home_score: number
          home_team: string
          id: string
          kickoff_time: string | null
          match_events: Json | null
          status: string
          venue: string | null
        }
        Insert: {
          age_group: string
          away_score?: number
          away_team: string
          created_at?: string
          home_score?: number
          home_team: string
          id?: string
          kickoff_time?: string | null
          match_events?: Json | null
          status?: string
          venue?: string | null
        }
        Update: {
          age_group?: string
          away_score?: number
          away_team?: string
          created_at?: string
          home_score?: number
          home_team?: string
          id?: string
          kickoff_time?: string | null
          match_events?: Json | null
          status?: string
          venue?: string | null
        }
        Relationships: []
      }
      match_player_stats: {
        Row: {
          appeared: boolean
          assists: number
          created_at: string
          goals: number
          id: string
          match_date: string
          opponent: string
          player_stat_id: string
          potm: boolean
          team_slug: string
        }
        Insert: {
          appeared?: boolean
          assists?: number
          created_at?: string
          goals?: number
          id?: string
          match_date: string
          opponent: string
          player_stat_id: string
          potm?: boolean
          team_slug: string
        }
        Update: {
          appeared?: boolean
          assists?: number
          created_at?: string
          goals?: number
          id?: string
          match_date?: string
          opponent?: string
          player_stat_id?: string
          potm?: boolean
          team_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_player_stats_player_stat_id_fkey"
            columns: ["player_stat_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      match_player_stats_history: {
        Row: {
          appeared: boolean
          archived_at: string
          assists: number
          goals: number
          history_player_stat_id: string | null
          id: string
          match_date: string
          opponent: string
          original_player_stat_id: string | null
          potm: boolean
          season: string
          team_slug: string
        }
        Insert: {
          appeared?: boolean
          archived_at?: string
          assists?: number
          goals?: number
          history_player_stat_id?: string | null
          id?: string
          match_date: string
          opponent: string
          original_player_stat_id?: string | null
          potm?: boolean
          season: string
          team_slug: string
        }
        Update: {
          appeared?: boolean
          archived_at?: string
          assists?: number
          goals?: number
          history_player_stat_id?: string | null
          id?: string
          match_date?: string
          opponent?: string
          original_player_stat_id?: string | null
          potm?: boolean
          season?: string
          team_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_player_stats_history_history_player_stat_id_fkey"
            columns: ["history_player_stat_id"]
            isOneToOne: false
            referencedRelation: "player_stats_history"
            referencedColumns: ["id"]
          },
        ]
      }
      match_reports: {
        Row: {
          age_group: string
          assists: string | null
          away_score: number
          created_at: string
          goal_scorers: string | null
          home_score: number
          id: string
          match_date: string
          notes: string | null
          opponent: string
          team_name: string
        }
        Insert: {
          age_group: string
          assists?: string | null
          away_score?: number
          created_at?: string
          goal_scorers?: string | null
          home_score?: number
          id?: string
          match_date?: string
          notes?: string | null
          opponent: string
          team_name: string
        }
        Update: {
          age_group?: string
          assists?: string | null
          away_score?: number
          created_at?: string
          goal_scorers?: string | null
          home_score?: number
          id?: string
          match_date?: string
          notes?: string | null
          opponent?: string
          team_name?: string
        }
        Relationships: []
      }
      match_reports_history: {
        Row: {
          age_group: string
          archived_at: string
          assists: string | null
          away_score: number
          created_at: string
          goal_scorers: string | null
          home_score: number
          id: string
          match_date: string
          notes: string | null
          opponent: string
          original_match_report_id: string | null
          season: string
          team_name: string
        }
        Insert: {
          age_group: string
          archived_at?: string
          assists?: string | null
          away_score?: number
          created_at?: string
          goal_scorers?: string | null
          home_score?: number
          id?: string
          match_date: string
          notes?: string | null
          opponent: string
          original_match_report_id?: string | null
          season: string
          team_name: string
        }
        Update: {
          age_group?: string
          archived_at?: string
          assists?: string | null
          away_score?: number
          created_at?: string
          goal_scorers?: string | null
          home_score?: number
          id?: string
          match_date?: string
          notes?: string | null
          opponent?: string
          original_match_report_id?: string | null
          season?: string
          team_name?: string
        }
        Relationships: []
      }
      meeting_invitees: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_invitees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "club_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_rsvps: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_rsvps_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "club_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          author_id: string
          author_name: string
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          category?: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      photo_claim_tokens: {
        Row: {
          buyer_name: string | null
          created_at: string
          download_count: number
          email: string
          expires_at: string
          id: string
          paid_at: string | null
          photo_ids: string[]
          provider: string
          shopify_order_id: string | null
          token: string
          total_cents: number
        }
        Insert: {
          buyer_name?: string | null
          created_at?: string
          download_count?: number
          email: string
          expires_at?: string
          id?: string
          paid_at?: string | null
          photo_ids?: string[]
          provider?: string
          shopify_order_id?: string | null
          token: string
          total_cents?: number
        }
        Update: {
          buyer_name?: string | null
          created_at?: string
          download_count?: number
          email?: string
          expires_at?: string
          id?: string
          paid_at?: string | null
          photo_ids?: string[]
          provider?: string
          shopify_order_id?: string | null
          token?: string
          total_cents?: number
        }
        Relationships: []
      }
      pitch_bookings: {
        Row: {
          admin_override: boolean
          age_group: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decline_reason: string | null
          end_time: string
          fa_fixture_id: string | null
          id: string
          notes: string | null
          opponent: string | null
          pitch_id: string
          purpose: string
          requested_by: string | null
          start_time: string
          status: string
          team_slug: string | null
          updated_at: string
        }
        Insert: {
          admin_override?: boolean
          age_group?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          end_time: string
          fa_fixture_id?: string | null
          id?: string
          notes?: string | null
          opponent?: string | null
          pitch_id: string
          purpose?: string
          requested_by?: string | null
          start_time: string
          status?: string
          team_slug?: string | null
          updated_at?: string
        }
        Update: {
          admin_override?: boolean
          age_group?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decline_reason?: string | null
          end_time?: string
          fa_fixture_id?: string | null
          id?: string
          notes?: string | null
          opponent?: string | null
          pitch_id?: string
          purpose?: string
          requested_by?: string | null
          start_time?: string
          status?: string
          team_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_bookings_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_map_layout: {
        Row: {
          color: string | null
          cx: number
          cy: number
          fill_opacity: number
          font_size: number
          h: number
          label_color: string | null
          label_dx: number
          label_dy: number
          label_scale: number
          label_text: string | null
          pitch_number: number
          rot: number
          show_label: boolean
          show_sub_text: boolean
          sub_text: string | null
          updated_at: string
          use_status_color: boolean
          w: number
          z: number
        }
        Insert: {
          color?: string | null
          cx: number
          cy: number
          fill_opacity?: number
          font_size?: number
          h: number
          label_color?: string | null
          label_dx?: number
          label_dy?: number
          label_scale?: number
          label_text?: string | null
          pitch_number: number
          rot?: number
          show_label?: boolean
          show_sub_text?: boolean
          sub_text?: string | null
          updated_at?: string
          use_status_color?: boolean
          w: number
          z?: number
        }
        Update: {
          color?: string | null
          cx?: number
          cy?: number
          fill_opacity?: number
          font_size?: number
          h?: number
          label_color?: string | null
          label_dx?: number
          label_dy?: number
          label_scale?: number
          label_text?: string | null
          pitch_number?: number
          rot?: number
          show_label?: boolean
          show_sub_text?: boolean
          sub_text?: string | null
          updated_at?: string
          use_status_color?: boolean
          w?: number
          z?: number
        }
        Relationships: []
      }
      pitches: {
        Row: {
          active: boolean
          created_at: string
          format: string
          id: string
          name: string
          number: number
          suggested_age_groups: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          format: string
          id?: string
          name: string
          number: number
          suggested_age_groups?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          format?: string
          id?: string
          name?: string
          number?: number
          suggested_age_groups?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      player_documents: {
        Row: {
          created_at: string
          document_type: string
          expiry_date: string | null
          file_url: string | null
          id: string
          notes: string | null
          title: string
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          title: string
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          title?: string
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      player_of_the_match: {
        Row: {
          age_group: string
          award_date: string
          created_at: string
          id: string
          match_description: string | null
          photo_url: string | null
          player_name: string
          reason: string | null
          shirt_number: number | null
          team_name: string
        }
        Insert: {
          age_group: string
          award_date?: string
          created_at?: string
          id?: string
          match_description?: string | null
          photo_url?: string | null
          player_name: string
          reason?: string | null
          shirt_number?: number | null
          team_name: string
        }
        Update: {
          age_group?: string
          award_date?: string
          created_at?: string
          id?: string
          match_description?: string | null
          photo_url?: string | null
          player_name?: string
          reason?: string | null
          shirt_number?: number | null
          team_name?: string
        }
        Relationships: []
      }
      player_registrations: {
        Row: {
          additional_info: string | null
          address: string | null
          child_dob: string
          child_name: string
          confirmation_email_sent_at: string | null
          consent_medical: boolean | null
          consent_photography: boolean | null
          created_at: string
          declaration_confirmed: boolean | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          fa_fan_number: string | null
          foster_care_details: string | null
          gocardless_billing_request_id: string | null
          guardian_id: string | null
          id: string
          known_to_social_services: boolean | null
          medical_conditions: string | null
          paid_at: string | null
          parent_name: string
          payment_status: string
          phone: string
          photo_url: string | null
          preferred_age_group: string
          previous_club: string | null
          relationship_to_child: string | null
          social_services_details: string | null
          user_id: string | null
        }
        Insert: {
          additional_info?: string | null
          address?: string | null
          child_dob: string
          child_name: string
          confirmation_email_sent_at?: string | null
          consent_medical?: boolean | null
          consent_photography?: boolean | null
          created_at?: string
          declaration_confirmed?: boolean | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          fa_fan_number?: string | null
          foster_care_details?: string | null
          gocardless_billing_request_id?: string | null
          guardian_id?: string | null
          id?: string
          known_to_social_services?: boolean | null
          medical_conditions?: string | null
          paid_at?: string | null
          parent_name: string
          payment_status?: string
          phone: string
          photo_url?: string | null
          preferred_age_group: string
          previous_club?: string | null
          relationship_to_child?: string | null
          social_services_details?: string | null
          user_id?: string | null
        }
        Update: {
          additional_info?: string | null
          address?: string | null
          child_dob?: string
          child_name?: string
          confirmation_email_sent_at?: string | null
          consent_medical?: boolean | null
          consent_photography?: boolean | null
          created_at?: string
          declaration_confirmed?: boolean | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          fa_fan_number?: string | null
          foster_care_details?: string | null
          gocardless_billing_request_id?: string | null
          guardian_id?: string | null
          id?: string
          known_to_social_services?: boolean | null
          medical_conditions?: string | null
          paid_at?: string | null
          parent_name?: string
          payment_status?: string
          phone?: string
          photo_url?: string | null
          preferred_age_group?: string
          previous_club?: string | null
          relationship_to_child?: string | null
          social_services_details?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_registrations_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          age_group: string
          appearances: number
          assists: number
          created_at: string
          first_name: string
          goals: number
          id: string
          photo_url: string | null
          position: string | null
          potm_awards: number
          shirt_number: number | null
          team_name: string
          updated_at: string
        }
        Insert: {
          age_group: string
          appearances?: number
          assists?: number
          created_at?: string
          first_name: string
          goals?: number
          id?: string
          photo_url?: string | null
          position?: string | null
          potm_awards?: number
          shirt_number?: number | null
          team_name: string
          updated_at?: string
        }
        Update: {
          age_group?: string
          appearances?: number
          assists?: number
          created_at?: string
          first_name?: string
          goals?: number
          id?: string
          photo_url?: string | null
          position?: string | null
          potm_awards?: number
          shirt_number?: number | null
          team_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_stats_history: {
        Row: {
          age_group: string
          appearances: number
          archived_at: string
          assists: number
          first_name: string
          goals: number
          id: string
          original_player_stat_id: string | null
          photo_url: string | null
          position: string | null
          potm_awards: number
          season: string
          shirt_number: number | null
          team_name: string
        }
        Insert: {
          age_group: string
          appearances?: number
          archived_at?: string
          assists?: number
          first_name: string
          goals?: number
          id?: string
          original_player_stat_id?: string | null
          photo_url?: string | null
          position?: string | null
          potm_awards?: number
          season: string
          shirt_number?: number | null
          team_name: string
        }
        Update: {
          age_group?: string
          appearances?: number
          archived_at?: string
          assists?: number
          first_name?: string
          goals?: number
          id?: string
          original_player_stat_id?: string | null
          photo_url?: string | null
          position?: string | null
          potm_awards?: number
          season?: string
          shirt_number?: number | null
          team_name?: string
        }
        Relationships: []
      }
      presentation_allocations: {
        Row: {
          created_at: string
          event_id: string
          granted_by_admin: boolean
          id: string
          max_adults: number
          max_children: number
          notes: string | null
          player_name: string
          team_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          granted_by_admin?: boolean
          id?: string
          max_adults?: number
          max_children?: number
          notes?: string | null
          player_name: string
          team_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          granted_by_admin?: boolean
          id?: string
          max_adults?: number
          max_children?: number
          notes?: string | null
          player_name?: string
          team_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_allocations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "presentation_events"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_award_settings: {
        Row: {
          award_type: string
          created_at: string
          id: string
          team_slug: string
          updated_at: string
          voting_open: boolean
        }
        Insert: {
          award_type: string
          created_at?: string
          id?: string
          team_slug: string
          updated_at?: string
          voting_open?: boolean
        }
        Update: {
          award_type?: string
          created_at?: string
          id?: string
          team_slug?: string
          updated_at?: string
          voting_open?: boolean
        }
        Relationships: []
      }
      presentation_award_votes: {
        Row: {
          award_type: string
          created_at: string
          id: string
          responding_for: string
          team_slug: string
          updated_at: string
          voted_for_player_id: string | null
          voted_for_player_name: string
          voter_user_id: string
        }
        Insert: {
          award_type: string
          created_at?: string
          id?: string
          responding_for: string
          team_slug: string
          updated_at?: string
          voted_for_player_id?: string | null
          voted_for_player_name: string
          voter_user_id: string
        }
        Update: {
          award_type?: string
          created_at?: string
          id?: string
          responding_for?: string
          team_slug?: string
          updated_at?: string
          voted_for_player_id?: string | null
          voted_for_player_name?: string
          voter_user_id?: string
        }
        Relationships: []
      }
      presentation_events: {
        Row: {
          created_at: string
          description: string | null
          doors_open_time: string
          dress_code: string | null
          event_date: string
          id: string
          is_active: boolean
          seats_per_table: number
          start_time: string
          title: string
          updated_at: string
          venue: string
          venue_address: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          doors_open_time: string
          dress_code?: string | null
          event_date: string
          id?: string
          is_active?: boolean
          seats_per_table?: number
          start_time: string
          title: string
          updated_at?: string
          venue: string
          venue_address?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          doors_open_time?: string
          dress_code?: string | null
          event_date?: string
          id?: string
          is_active?: boolean
          seats_per_table?: number
          start_time?: string
          title?: string
          updated_at?: string
          venue?: string
          venue_address?: string | null
        }
        Relationships: []
      }
      presentation_tables: {
        Row: {
          age_group: string | null
          col_index: number | null
          created_at: string
          event_id: string
          id: string
          is_locked: boolean
          is_staff_only: boolean
          label: string | null
          row_index: number | null
          table_number: number
        }
        Insert: {
          age_group?: string | null
          col_index?: number | null
          created_at?: string
          event_id: string
          id?: string
          is_locked?: boolean
          is_staff_only?: boolean
          label?: string | null
          row_index?: number | null
          table_number: number
        }
        Update: {
          age_group?: string | null
          col_index?: number | null
          created_at?: string
          event_id?: string
          id?: string
          is_locked?: boolean
          is_staff_only?: boolean
          label?: string | null
          row_index?: number | null
          table_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentation_tables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "presentation_events"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_theatre_seats: {
        Row: {
          col_index: number
          created_at: string
          event_id: string
          id: string
          player_stat_id: string
          row_index: number
          side: string
          updated_at: string
        }
        Insert: {
          col_index: number
          created_at?: string
          event_id: string
          id?: string
          player_stat_id: string
          row_index: number
          side: string
          updated_at?: string
        }
        Update: {
          col_index?: number
          created_at?: string
          event_id?: string
          id?: string
          player_stat_id?: string
          row_index?: number
          side?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_theatre_seats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "presentation_events"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_tickets: {
        Row: {
          allocation_id: string
          attendee_name: string
          created_at: string
          event_id: string
          id: string
          seat_number: number | null
          table_id: string | null
          ticket_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allocation_id: string
          attendee_name: string
          created_at?: string
          event_id: string
          id?: string
          seat_number?: number | null
          table_id?: string | null
          ticket_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allocation_id?: string
          attendee_name?: string
          created_at?: string
          event_id?: string
          id?: string
          seat_number?: number | null
          table_id?: string | null
          ticket_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_tickets_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "presentation_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "presentation_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_tickets_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "presentation_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_seen_at: string | null
          must_change_password: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_seen_at?: string | null
          must_change_password?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          must_change_password?: boolean
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          platform: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          platform?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      raffle_tickets: {
        Row: {
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          created_at: string
          id: string
          payment_status: string
          raffle_id: string
          stripe_payment_intent_id: string | null
          ticket_number: number
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          created_at?: string
          id?: string
          payment_status?: string
          raffle_id: string
          stripe_payment_intent_id?: string | null
          ticket_number: number
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          created_at?: string
          id?: string
          payment_status?: string
          raffle_id?: string
          stripe_payment_intent_id?: string | null
          ticket_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "raffle_tickets_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffles: {
        Row: {
          auto_draw_when_sold_out: boolean
          created_at: string
          currency: string
          description: string | null
          draw_date: string | null
          draw_started_at: string | null
          draw_video_url: string | null
          drawn_ticket_number: number | null
          id: string
          image_url: string | null
          max_tickets: number | null
          number_range: number | null
          prize_description: string
          status: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          ticket_price_cents: number
          title: string
          updated_at: string
          winner_name: string | null
          winner_ticket_id: string | null
        }
        Insert: {
          auto_draw_when_sold_out?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          draw_date?: string | null
          draw_started_at?: string | null
          draw_video_url?: string | null
          drawn_ticket_number?: number | null
          id?: string
          image_url?: string | null
          max_tickets?: number | null
          number_range?: number | null
          prize_description: string
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          ticket_price_cents: number
          title: string
          updated_at?: string
          winner_name?: string | null
          winner_ticket_id?: string | null
        }
        Update: {
          auto_draw_when_sold_out?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          draw_date?: string | null
          draw_started_at?: string | null
          draw_video_url?: string | null
          drawn_ticket_number?: number | null
          id?: string
          image_url?: string | null
          max_tickets?: number | null
          number_range?: number | null
          prize_description?: string
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          ticket_price_cents?: number
          title?: string
          updated_at?: string
          winner_name?: string | null
          winner_ticket_id?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          permission: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          permission: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          permission?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      safeguarding_reports: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          id: string
          incident_date: string | null
          is_anonymous: boolean
          people_involved: string | null
          reference_number: string
          reporter_email: string | null
          reporter_name: string | null
          reporter_phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          incident_date?: string | null
          is_anonymous?: boolean
          people_involved?: string | null
          reference_number?: string
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          incident_date?: string | null
          is_anonymous?: boolean
          people_involved?: string | null
          reference_number?: string
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shopify_orders: {
        Row: {
          cancelled_at: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_first_name: string | null
          customer_last_name: string | null
          email: string | null
          financial_status: string
          fulfillment_status: string | null
          id: string
          line_items: Json
          order_name: string
          order_number: number | null
          shopify_created_at: string
          shopify_order_id: number
          total_price: number
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_first_name?: string | null
          customer_last_name?: string | null
          email?: string | null
          financial_status?: string
          fulfillment_status?: string | null
          id?: string
          line_items?: Json
          order_name: string
          order_number?: number | null
          shopify_created_at?: string
          shopify_order_id: number
          total_price?: number
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_first_name?: string | null
          customer_last_name?: string | null
          email?: string | null
          financial_status?: string
          fulfillment_status?: string | null
          id?: string
          line_items?: Json
          order_name?: string
          order_number?: number | null
          shopify_created_at?: string
          shopify_order_id?: number
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tactics_boards: {
        Row: {
          board_data: Json
          created_at: string
          created_by: string | null
          fixture_date: string | null
          id: string
          is_template: boolean
          name: string
          opponent: string | null
          team_slug: string
          updated_at: string
        }
        Insert: {
          board_data?: Json
          created_at?: string
          created_by?: string | null
          fixture_date?: string | null
          id?: string
          is_template?: boolean
          name: string
          opponent?: string | null
          team_slug: string
          updated_at?: string
        }
        Update: {
          board_data?: Json
          created_at?: string
          created_by?: string | null
          fixture_date?: string | null
          id?: string
          is_template?: boolean
          name?: string
          opponent?: string | null
          team_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invite_token: string
          invited_by: string
          role: string
          status: string
          team_slug: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invite_token?: string
          invited_by: string
          role?: string
          status?: string
          team_slug: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invite_token?: string
          invited_by?: string
          role?: string
          status?: string
          team_slug?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: string
          team_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          team_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          team_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      team_requests: {
        Row: {
          created_at: string
          id: string
          invite_code: string | null
          player_name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_requested: string
          status: string
          team_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string | null
          player_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_requested?: string
          status?: string
          team_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string | null
          player_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_requested?: string
          status?: string
          team_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      team_selections: {
        Row: {
          captain_id: string | null
          created_at: string
          created_by: string | null
          fixture_date: string
          formation: string | null
          formation_format: string | null
          id: string
          notes: string | null
          opponent: string
          opposition_formation: string | null
          players: Json
          positions: Json
          published_at: string | null
          status: string
          team_slug: string
          updated_at: string
          vice_captain_id: string | null
        }
        Insert: {
          captain_id?: string | null
          created_at?: string
          created_by?: string | null
          fixture_date: string
          formation?: string | null
          formation_format?: string | null
          id?: string
          notes?: string | null
          opponent: string
          opposition_formation?: string | null
          players?: Json
          positions?: Json
          published_at?: string | null
          status?: string
          team_slug: string
          updated_at?: string
          vice_captain_id?: string | null
        }
        Update: {
          captain_id?: string | null
          created_at?: string
          created_by?: string | null
          fixture_date?: string
          formation?: string | null
          formation_format?: string | null
          id?: string
          notes?: string | null
          opponent?: string
          opposition_formation?: string | null
          players?: Json
          positions?: Json
          published_at?: string | null
          status?: string
          team_slug?: string
          updated_at?: string
          vice_captain_id?: string | null
        }
        Relationships: []
      }
      tournament_age_groups: {
        Row: {
          age_group: string
          created_at: string
          group_count: number | null
          id: string
          max_teams: number | null
          tournament_id: string
        }
        Insert: {
          age_group: string
          created_at?: string
          group_count?: number | null
          id?: string
          max_teams?: number | null
          tournament_id: string
        }
        Update: {
          age_group?: string
          created_at?: string
          group_count?: number | null
          id?: string
          max_teams?: number | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_age_groups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_announcements: {
        Row: {
          created_at: string
          id: string
          message: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_announcements_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_audit_log: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          new_row: Json | null
          old_row: Json | null
          operation: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          new_row?: Json | null
          old_row?: Json | null
          operation: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          new_row?: Json | null
          old_row?: Json | null
          operation?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      tournament_groups: {
        Row: {
          age_group_id: string
          created_at: string
          group_name: string
          id: string
        }
        Insert: {
          age_group_id: string
          created_at?: string
          group_name: string
          id?: string
        }
        Update: {
          age_group_id?: string
          created_at?: string
          group_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_groups_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "tournament_age_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          age_group_id: string
          away_placeholder: string | null
          away_score: number | null
          away_team_id: string | null
          created_at: string
          group_id: string | null
          home_placeholder: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          match_time: string | null
          pitch: string | null
          referee: string | null
          stage: string
          status: string
        }
        Insert: {
          age_group_id: string
          away_placeholder?: string | null
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string
          group_id?: string | null
          home_placeholder?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          match_time?: string | null
          pitch?: string | null
          referee?: string | null
          stage?: string
          status?: string
        }
        Update: {
          age_group_id?: string
          away_placeholder?: string | null
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string
          group_id?: string | null
          home_placeholder?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          match_time?: string | null
          pitch?: string | null
          referee?: string | null
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "tournament_age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "tournament_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "tournament_teams_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tournament_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "tournament_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "tournament_teams_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_photo_purchases: {
        Row: {
          created_at: string
          download_count: number
          id: string
          photo_id: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          download_count?: number
          id?: string
          photo_id: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          download_count?: number
          id?: string
          photo_id?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_photo_purchases_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "tournament_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_photo_purchases_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "tournament_photos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_photos: {
        Row: {
          age_group: string | null
          caption: string | null
          created_at: string
          featured: boolean
          featured_at: string | null
          id: string
          photo_date: string | null
          photo_ref: string
          preview_url: string
          price_cents: number
          storage_path: string
          tournament_id: string
        }
        Insert: {
          age_group?: string | null
          caption?: string | null
          created_at?: string
          featured?: boolean
          featured_at?: string | null
          id?: string
          photo_date?: string | null
          photo_ref?: string
          preview_url: string
          price_cents?: number
          storage_path: string
          tournament_id: string
        }
        Update: {
          age_group?: string | null
          caption?: string | null
          created_at?: string
          featured?: boolean
          featured_at?: string | null
          id?: string
          photo_date?: string | null
          photo_ref?: string
          preview_url?: string
          price_cents?: number
          storage_path?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_photos_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_team_players: {
        Row: {
          created_at: string
          date_of_birth: string
          id: string
          player_name: string
          shirt_number: number | null
          team_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          id?: string
          player_name: string
          shirt_number?: number | null
          team_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          id?: string
          player_name?: string
          shirt_number?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_teams_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_teams: {
        Row: {
          age_group_id: string
          club_name: string | null
          club_org_id: string | null
          consent_photography: boolean | null
          consent_rules: boolean | null
          county: string | null
          created_at: string
          group_id: string | null
          id: string
          league_division: string | null
          manager_email: string
          manager_name: string
          manager_phone: string | null
          manual_drawn: number | null
          manual_ga: number | null
          manual_gf: number | null
          manual_lost: number | null
          manual_played: number | null
          manual_points: number | null
          manual_won: number | null
          player_count: number | null
          secretary_email: string | null
          secretary_name: string | null
          secretary_phone: string | null
          status: string
          team_category: string | null
          team_name: string
          whatsapp_contacts: Json | null
        }
        Insert: {
          age_group_id: string
          club_name?: string | null
          club_org_id?: string | null
          consent_photography?: boolean | null
          consent_rules?: boolean | null
          county?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          league_division?: string | null
          manager_email: string
          manager_name: string
          manager_phone?: string | null
          manual_drawn?: number | null
          manual_ga?: number | null
          manual_gf?: number | null
          manual_lost?: number | null
          manual_played?: number | null
          manual_points?: number | null
          manual_won?: number | null
          player_count?: number | null
          secretary_email?: string | null
          secretary_name?: string | null
          secretary_phone?: string | null
          status?: string
          team_category?: string | null
          team_name: string
          whatsapp_contacts?: Json | null
        }
        Update: {
          age_group_id?: string
          club_name?: string | null
          club_org_id?: string | null
          consent_photography?: boolean | null
          consent_rules?: boolean | null
          county?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          league_division?: string | null
          manager_email?: string
          manager_name?: string
          manager_phone?: string | null
          manual_drawn?: number | null
          manual_ga?: number | null
          manual_gf?: number | null
          manual_lost?: number | null
          manual_played?: number | null
          manual_points?: number | null
          manual_won?: number | null
          player_count?: number | null
          secretary_email?: string | null
          secretary_name?: string | null
          secretary_phone?: string | null
          status?: string
          team_category?: string | null
          team_name?: string
          whatsapp_contacts?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_teams_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "tournament_age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tournament_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          description: string | null
          entries_open: boolean
          entry_fee_cents: number | null
          id: string
          name: string
          rules: string | null
          status: string
          tournament_date: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          entries_open?: boolean
          entry_fee_cents?: number | null
          id?: string
          name: string
          rules?: string | null
          status?: string
          tournament_date?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          entries_open?: boolean
          entry_fee_cents?: number | null
          id?: string
          name?: string
          rules?: string | null
          status?: string
          tournament_date?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      training_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          fixture_date: string | null
          id: string
          note_type: string
          opponent: string | null
          team_slug: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          fixture_date?: string | null
          id?: string
          note_type?: string
          opponent?: string | null
          team_slug: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          fixture_date?: string | null
          id?: string
          note_type?: string
          opponent?: string | null
          team_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_age_groups: {
        Row: {
          age_group: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          age_group: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          age_group?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      venue_address_overrides: {
        Row: {
          created_at: string
          full_address: string
          id: string
          updated_at: string
          venue_name: string
        }
        Insert: {
          created_at?: string
          full_address: string
          id?: string
          updated_at?: string
          venue_name: string
        }
        Update: {
          created_at?: string
          full_address?: string
          id?: string
          updated_at?: string
          venue_name?: string
        }
        Relationships: []
      }
      whats_new_campaigns: {
        Row: {
          bullets: Json
          created_at: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          bullets?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Update: {
          bullets?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      tournament_photos_public: {
        Row: {
          age_group: string | null
          caption: string | null
          created_at: string | null
          featured: boolean | null
          featured_at: string | null
          id: string | null
          photo_date: string | null
          photo_ref: string | null
          preview_url: string | null
          price_cents: number | null
          tournament_id: string | null
        }
        Insert: {
          age_group?: string | null
          caption?: string | null
          created_at?: string | null
          featured?: boolean | null
          featured_at?: string | null
          id?: string | null
          photo_date?: string | null
          photo_ref?: string | null
          preview_url?: string | null
          price_cents?: number | null
          tournament_id?: string | null
        }
        Update: {
          age_group?: string | null
          caption?: string | null
          created_at?: string | null
          featured?: boolean | null
          featured_at?: string | null
          id?: string | null
          photo_date?: string | null
          photo_ref?: string | null
          preview_url?: string | null
          price_cents?: number | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_photos_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_teams_public: {
        Row: {
          age_group_id: string | null
          club_name: string | null
          county: string | null
          created_at: string | null
          group_id: string | null
          id: string | null
          league_division: string | null
          player_count: number | null
          status: string | null
          team_category: string | null
          team_name: string | null
        }
        Insert: {
          age_group_id?: string | null
          club_name?: string | null
          county?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string | null
          league_division?: string | null
          player_count?: number | null
          status?: string | null
          team_category?: string | null
          team_name?: string | null
        }
        Update: {
          age_group_id?: string | null
          club_name?: string | null
          county?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string | null
          league_division?: string | null
          player_count?: number | null
          status?: string | null
          team_category?: string | null
          team_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_teams_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "tournament_age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tournament_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_claim_presentation_tickets: {
        Args: { _user_id: string }
        Returns: boolean
      }
      canonical_age_group: { Args: { _value: string }; Returns: string }
      canonical_team_slug: { Args: { _slug: string }; Returns: string }
      check_pitch_conflict: {
        Args: {
          _end: string
          _exclude_id?: string
          _pitch_id: string
          _start: string
        }
        Returns: {
          age_group: string
          end_time: string
          id: string
          opponent: string
          pitch_id: string
          pitch_name: string
          start_time: string
          status: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      expire_pending_raffle_tickets: { Args: never; Returns: number }
      get_safe_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          last_seen_at: string
        }[]
      }
      get_taken_ticket_numbers: {
        Args: { _raffle_id: string }
        Returns: {
          payment_status: string
          ticket_number: number
        }[]
      }
      get_tournament_team_contacts: {
        Args: { _team_id: string }
        Returns: {
          id: string
          manager_email: string
          manager_name: string
          manager_phone: string
          secretary_email: string
          secretary_name: string
          secretary_phone: string
          whatsapp_contacts: Json
        }[]
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_team_member: {
        Args: { _team_slug: string; _user_id: string }
        Returns: boolean
      }
      lookup_invite_team_slug: { Args: { _token: string }; Returns: string }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      pitch_numbers_overlap: {
        Args: { _a: number; _b: number }
        Returns: boolean
      }
      prune_tournament_audit_log: { Args: never; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      restore_tournament_record: { Args: { _log_id: string }; Returns: Json }
      shares_team_with: {
        Args: { _target: string; _viewer: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "coach"
        | "user"
        | "player"
        | "treasurer"
        | "news_editor"
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
        "coach",
        "user",
        "player",
        "treasurer",
        "news_editor",
      ],
    },
  },
} as const
