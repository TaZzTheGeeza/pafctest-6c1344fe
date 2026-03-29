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
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          title: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          title?: string
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
      hub_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
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
          id: string
          known_to_social_services: boolean | null
          medical_conditions: string | null
          parent_name: string
          phone: string
          photo_url: string | null
          preferred_age_group: string
          previous_club: string | null
          relationship_to_child: string | null
          social_services_details: string | null
        }
        Insert: {
          additional_info?: string | null
          address?: string | null
          child_dob: string
          child_name: string
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
          id?: string
          known_to_social_services?: boolean | null
          medical_conditions?: string | null
          parent_name: string
          phone: string
          photo_url?: string | null
          preferred_age_group: string
          previous_club?: string | null
          relationship_to_child?: string | null
          social_services_details?: string | null
        }
        Update: {
          additional_info?: string | null
          address?: string | null
          child_dob?: string
          child_name?: string
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
          id?: string
          known_to_social_services?: boolean | null
          medical_conditions?: string | null
          parent_name?: string
          phone?: string
          photo_url?: string | null
          preferred_age_group?: string
          previous_club?: string | null
          relationship_to_child?: string | null
          social_services_details?: string | null
        }
        Relationships: []
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
          potm_awards?: number
          shirt_number?: number | null
          team_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
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
          created_at: string
          created_by: string | null
          fixture_date: string
          formation: string | null
          id: string
          notes: string | null
          opponent: string
          players: Json
          team_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fixture_date: string
          formation?: string | null
          id?: string
          notes?: string | null
          opponent: string
          players?: Json
          team_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fixture_date?: string
          formation?: string | null
          id?: string
          notes?: string | null
          opponent?: string
          players?: Json
          team_slug?: string
          updated_at?: string
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
          away_score: number | null
          away_team_id: string
          created_at: string
          group_id: string | null
          home_score: number | null
          home_team_id: string
          id: string
          match_time: string | null
          pitch: string | null
          stage: string
          status: string
        }
        Insert: {
          age_group_id: string
          away_score?: number | null
          away_team_id: string
          created_at?: string
          group_id?: string | null
          home_score?: number | null
          home_team_id: string
          id?: string
          match_time?: string | null
          pitch?: string | null
          stage?: string
          status?: string
        }
        Update: {
          age_group_id?: string
          away_score?: number | null
          away_team_id?: string
          created_at?: string
          group_id?: string | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          match_time?: string | null
          pitch?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_slug: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "coach" | "user" | "player"
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
      app_role: ["admin", "coach", "user", "player"],
    },
  },
} as const
