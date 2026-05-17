import type {
  EntrySource,
  EntryStatus,
  ReactionType,
  WellnessPillar,
} from './domain';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          timezone: string;
          onboarding_complete: boolean;
          is_private: boolean;
          pro_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          timezone?: string;
          onboarding_complete?: boolean;
          is_private?: boolean;
          pro_until?: string | null;
        };
        Update: {
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          timezone?: string;
          onboarding_complete?: boolean;
          is_private?: boolean;
          pro_until?: string | null;
        };
        Relationships: [];
      };
      user_goals: {
        Row: {
          user_id: string;
          goal_key: string;
          priority: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          goal_key: string;
          priority?: number;
        };
        Update: {
          priority?: number;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          id: string;
          user_id: string;
          pillar: WellnessPillar;
          source: EntrySource;
          action_type: string;
          title: string;
          caption: string | null;
          proof_url: string | null;
          location: Json | null;
          health_snapshot: Json | null;
          client_metadata: Json;
          ai_summary: string | null;
          share_headline: string | null;
          score: number;
          max_score: number;
          confidence: number;
          score_breakdown: Json | null;
          status: EntryStatus;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pillar: WellnessPillar;
          source: EntrySource;
          action_type: string;
          title: string;
          caption?: string | null;
          proof_url?: string | null;
          location?: Json | null;
          health_snapshot?: Json | null;
          client_metadata?: Json;
          occurred_at?: string;
        };
        Update: {
          caption?: string | null;
          client_metadata?: Json;
        };
        Relationships: [];
      };
      entry_reactions: {
        Row: {
          id: string;
          entry_id: string;
          user_id: string;
          reaction: ReactionType;
          created_at: string;
        };
        Insert: {
          entry_id: string;
          user_id: string;
          reaction: ReactionType;
        };
        Update: never;
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          requester_id: string;
          addressee_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
        };
        Update: {
          status?: 'pending' | 'accepted' | 'blocked';
        };
        Relationships: [];
      };
      leaderboard_scores: {
        Row: {
          id: string;
          user_id: string;
          scope: 'daily' | 'weekly';
          period_start: string;
          period_end: string;
          score: number;
          entries_count: number;
          movement_score: number;
          fuel_score: number;
          mind_score: number;
          recovery_score: number;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          pillar: WellnessPillar | 'all';
          starts_at: string;
          ends_at: string;
          is_private: boolean;
          entry_goal: number;
          created_at: string;
        };
        Insert: {
          owner_id: string;
          title: string;
          description?: string | null;
          pillar?: WellnessPillar | 'all';
          starts_at: string;
          ends_at: string;
          is_private?: boolean;
          entry_goal?: number;
        };
        Update: {
          title?: string;
          description?: string | null;
          pillar?: WellnessPillar | 'all';
          starts_at?: string;
          ends_at?: string;
          is_private?: boolean;
          entry_goal?: number;
        };
        Relationships: [];
      };
      challenge_members: {
        Row: {
          challenge_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          challenge_id: string;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string | null;
          type: string;
          title: string;
          body: string;
          data: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          actor_id?: string | null;
          type: string;
          title: string;
          body: string;
          data?: Json;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
      device_push_tokens: {
        Row: {
          id: string;
          user_id: string;
          expo_push_token: string;
          platform: string;
          device_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          expo_push_token: string;
          platform: string;
          device_name?: string | null;
        };
        Update: {
          expo_push_token?: string;
          device_name?: string | null;
        };
        Relationships: [];
      };
      health_sync_samples: {
        Row: {
          id: string;
          user_id: string;
          day: string;
          metrics: Json;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          day: string;
          metrics: Json;
          source?: string;
        };
        Update: {
          metrics?: Json;
        };
        Relationships: [];
      };
      share_assets: {
        Row: {
          id: string;
          user_id: string;
          entry_id: string | null;
          template: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          entry_id?: string | null;
          template: string;
          storage_path: string;
        };
        Update: never;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          revenuecat_app_user_id: string;
          entitlement: string;
          status: string;
          expires_at: string | null;
          raw_event: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          revenuecat_app_user_id: string;
          entitlement: string;
          status: string;
          expires_at?: string | null;
          raw_event?: Json;
        };
        Update: {
          revenuecat_app_user_id?: string;
          entitlement?: string;
          status?: string;
          expires_at?: string | null;
          raw_event?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_friend: {
        Args: { viewer_id: string; target_id: string };
        Returns: boolean;
      };
      mark_notification_read: {
        Args: { notification_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
