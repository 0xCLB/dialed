create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null,
  avatar_path text,
  bio text,
  city text,
  timezone text not null default 'UTC',
  onboarding_completed boolean not null default false,
  privacy_default text not null default 'friends'
    check (privacy_default in ('private', 'friends', 'public')),
  is_pro boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (username is null or username ~ '^[a-z0-9_]{3,24}$'),
  check (char_length(display_name) between 1 and 80)
);

create table if not exists public.activity_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  wellness_pillar text not null check (wellness_pillar in ('movement', 'fuel', 'mind', 'recovery')),
  default_points integer not null default 40 check (default_points between 0 and 100),
  keywords text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.user_quick_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_slug text not null references public.activity_catalog(slug) on delete cascade,
  label_override text,
  usage_count integer not null default 0 check (usage_count >= 0),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, activity_slug)
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_type text not null check (entry_type in ('photo', 'manual', 'health', 'location')),
  activity_tag text,
  caption text,
  location_name text,
  latitude numeric check (latitude is null or (latitude >= -90 and latitude <= 90)),
  longitude numeric check (longitude is null or (longitude >= -180 and longitude <= 180)),
  wellness_pillar text check (wellness_pillar in ('movement', 'fuel', 'mind', 'recovery')),
  visibility text not null default 'friends' check (visibility in ('private', 'friends', 'public', 'challenge')),
  status text not null default 'pending_score' check (status in ('draft', 'pending_score', 'scored', 'rejected', 'deleted')),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.entry_media (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null,
  user_id uuid not null,
  bucket_id text not null check (bucket_id in ('entry-photos')),
  storage_path text not null unique,
  media_kind text not null default 'proof' check (media_kind in ('proof', 'thumbnail')),
  mime_type text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now(),
  foreign key (entry_id, user_id) references public.entries(id, user_id) on delete cascade,
  check (storage_path = bucket_id || '/' || user_id::text || '/' || entry_id::text || '/' || id::text || '.jpg'
    or storage_path = bucket_id || '/' || user_id::text || '/' || entry_id::text || '/' || id::text || '.jpeg'
    or storage_path = bucket_id || '/' || user_id::text || '/' || entry_id::text || '/' || id::text || '.png'
    or storage_path = bucket_id || '/' || user_id::text || '/' || entry_id::text || '/' || id::text || '.heic'
    or storage_path = bucket_id || '/' || user_id::text || '/' || entry_id::text || '/' || id::text || '.webp')
);

create table if not exists public.entry_scores (
  entry_id uuid primary key references public.entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  normalized_activity text not null,
  wellness_pillar text not null check (wellness_pillar in ('movement', 'fuel', 'mind', 'recovery')),
  points integer not null default 0 check (points between 0 and 1000),
  base_points integer not null default 0 check (base_points between 0 and 1000),
  bonus_points integer not null default 0 check (bonus_points between 0 and 1000),
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  scoring_source text not null default 'ai' check (scoring_source in ('ai', 'manual_review', 'health', 'rule')),
  ai_subtext text,
  scoring_explanation text,
  model_name text,
  flagged boolean not null default false,
  flag_reason text,
  metadata jsonb not null default '{}'::jsonb,
  scored_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (entry_id, user_id) references public.entries(id, user_id) on delete cascade
);

create table if not exists public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score_date date not null,
  total_points integer not null default 0 check (total_points >= 0),
  movement_points integer not null default 0 check (movement_points >= 0),
  fuel_points integer not null default 0 check (fuel_points >= 0),
  mind_points integer not null default 0 check (mind_points >= 0),
  recovery_points integer not null default 0 check (recovery_points >= 0),
  completed_pillars integer not null default 0 check (completed_pillars between 0 and 4),
  all_pillars_completed boolean not null default false,
  streak_count integer not null default 0 check (streak_count >= 0),
  rank_snapshot integer check (rank_snapshot is null or rank_snapshot > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, score_date)
);

create table if not exists public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_completed_date date,
  movement_streak integer not null default 0 check (movement_streak >= 0),
  fuel_streak integer not null default 0 check (fuel_streak >= 0),
  mind_streak integer not null default 0 check (mind_streak >= 0),
  recovery_streak integer not null default 0 check (recovery_streak >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('fire', 'dialed', 'respect', 'slippin', 'water', 'check')),
  created_at timestamptz not null default now(),
  unique (entry_id, user_id, reaction_type)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  description text,
  challenge_type text not null default 'points'
    check (challenge_type in ('points', 'pillar_completion', 'streak', 'custom')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  visibility text not null default 'friends' check (visibility in ('private', 'friends', 'public')),
  entry_rules jsonb not null default '{}'::jsonb,
  scoring_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.challenge_members (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('invited', 'active', 'declined', 'removed')),
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table if not exists public.challenge_entries (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (challenge_id, entry_id),
  foreign key (entry_id, user_id) references public.entries(id, user_id) on delete cascade
);

create table if not exists public.health_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'apple_health'
    check (provider in ('apple_health', 'manual', 'whoop', 'oura', 'garmin', 'strava')),
  metric_type text not null
    check (metric_type in ('steps', 'workout', 'sleep', 'heart_rate', 'hrv', 'calories', 'mindfulness', 'recovery')),
  value numeric,
  unit text,
  started_at timestamptz not null,
  ended_at timestamptz,
  source_identifier text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table if not exists public.daily_digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  digest_date date not null,
  title text not null,
  body text not null,
  tone text not null default 'twain' check (tone in ('twain', 'coach', 'plain')),
  insights jsonb not null default '{}'::jsonb,
  score_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, digest_date)
);

create table if not exists public.share_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_id uuid references public.entries(id) on delete set null,
  score_date date,
  asset_type text not null check (asset_type in ('story_card', 'reel', 'leaderboard_card', 'digest_card')),
  template_id text not null,
  bucket_id text not null default 'share-assets' check (bucket_id = 'share-assets'),
  storage_path text not null unique,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  status text not null default 'pending_upload' check (status in ('pending_upload', 'ready', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (entry_id is not null or score_date is not null),
  check (storage_path = bucket_id || '/' || user_id::text || '/' || id::text || '.png'
    or storage_path = bucket_id || '/' || user_id::text || '/' || id::text || '.jpg'
    or storage_path = bucket_id || '/' || user_id::text || '/' || id::text || '.jpeg'
    or storage_path = bucket_id || '/' || user_id::text || '/' || id::text || '.mp4')
);

create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null default 'ios' check (platform in ('ios', 'android')),
  device_name text,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  streak_reminders boolean not null default true,
  social_updates boolean not null default true,
  leaderboard_updates boolean not null default true,
  digest_updates boolean not null default true,
  marketing_updates boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  notification_type text not null
    check (notification_type in ('friend_request', 'reaction', 'comment', 'leaderboard', 'challenge', 'digest', 'streak', 'subscription', 'system')),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  revenuecat_customer_id text not null,
  entitlement text not null default 'dialed_pro',
  status text not null default 'inactive'
    check (status in ('active', 'trialing', 'inactive', 'billing_issue', 'cancelled', 'expired')),
  product_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  revenuecat_customer_id text,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists friendships_unique_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists profiles_username_idx
  on public.profiles (username);

create index if not exists activity_catalog_search_idx
  on public.activity_catalog using gin (keywords);

create index if not exists user_quick_picks_user_last_used_idx
  on public.user_quick_picks (user_id, last_used_at desc nulls last);

create index if not exists entries_user_occurred_at_idx
  on public.entries (user_id, occurred_at desc);

create index if not exists entries_visibility_status_idx
  on public.entries (visibility, status);

create index if not exists entries_wellness_pillar_idx
  on public.entries (wellness_pillar);

create index if not exists entry_media_entry_id_idx
  on public.entry_media (entry_id);

create index if not exists entry_scores_user_scored_at_idx
  on public.entry_scores (user_id, scored_at desc);

create index if not exists entry_scores_pillar_idx
  on public.entry_scores (wellness_pillar);

create index if not exists daily_scores_user_score_date_idx
  on public.daily_scores (user_id, score_date desc);

create index if not exists daily_scores_score_date_total_points_idx
  on public.daily_scores (score_date, total_points desc);

create index if not exists friendships_requester_status_idx
  on public.friendships (requester_id, status);

create index if not exists friendships_addressee_status_idx
  on public.friendships (addressee_id, status);

create index if not exists user_blocks_blocked_idx
  on public.user_blocks (blocked_id);

create index if not exists reactions_entry_id_idx
  on public.reactions (entry_id);

create index if not exists comments_entry_id_created_at_idx
  on public.comments (entry_id, created_at);

create index if not exists challenges_window_idx
  on public.challenges (starts_at, ends_at);

create index if not exists challenge_members_user_idx
  on public.challenge_members (user_id, status);

create index if not exists health_samples_user_started_at_idx
  on public.health_samples (user_id, started_at desc);

create index if not exists daily_digests_user_date_idx
  on public.daily_digests (user_id, digest_date desc);

create index if not exists share_assets_user_created_at_idx
  on public.share_assets (user_id, created_at desc);

create index if not exists notifications_user_read_at_idx
  on public.notifications (user_id, read_at, created_at desc);

create index if not exists subscription_events_user_created_at_idx
  on public.subscription_events (user_id, created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_user_quick_picks_updated_at on public.user_quick_picks;
create trigger set_user_quick_picks_updated_at
before update on public.user_quick_picks
for each row execute function public.set_updated_at();

drop trigger if exists set_entries_updated_at on public.entries;
create trigger set_entries_updated_at
before update on public.entries
for each row execute function public.set_updated_at();

drop trigger if exists set_entry_scores_updated_at on public.entry_scores;
create trigger set_entry_scores_updated_at
before update on public.entry_scores
for each row execute function public.set_updated_at();

drop trigger if exists set_daily_scores_updated_at on public.daily_scores;
create trigger set_daily_scores_updated_at
before update on public.daily_scores
for each row execute function public.set_updated_at();

drop trigger if exists set_streaks_updated_at on public.streaks;
create trigger set_streaks_updated_at
before update on public.streaks
for each row execute function public.set_updated_at();

drop trigger if exists set_friendships_updated_at on public.friendships;
create trigger set_friendships_updated_at
before update on public.friendships
for each row execute function public.set_updated_at();

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

drop trigger if exists set_challenges_updated_at on public.challenges;
create trigger set_challenges_updated_at
before update on public.challenges
for each row execute function public.set_updated_at();

drop trigger if exists set_health_samples_updated_at on public.health_samples;
create trigger set_health_samples_updated_at
before update on public.health_samples
for each row execute function public.set_updated_at();

drop trigger if exists set_daily_digests_updated_at on public.daily_digests;
create trigger set_daily_digests_updated_at
before update on public.daily_digests
for each row execute function public.set_updated_at();

drop trigger if exists set_share_assets_updated_at on public.share_assets;
create trigger set_share_assets_updated_at
before update on public.share_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_notification_devices_updated_at on public.notification_devices;
create trigger set_notification_devices_updated_at
before update on public.notification_devices
for each row execute function public.set_updated_at();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();
