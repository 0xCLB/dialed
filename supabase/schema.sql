create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  city text,
  timezone text,
  onboarding_completed boolean default false,
  privacy_default text default 'friends',
  is_pro boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('photo', 'manual', 'health', 'location', 'reel', 'imported')),
  activity_tag text,
  normalized_activity text,
  caption text,
  ai_subtext text,
  photo_url text,
  thumbnail_url text,
  location_name text,
  latitude numeric,
  longitude numeric,
  wellness_pillar text check (wellness_pillar in ('movement', 'fuel', 'mind', 'recovery')),
  points integer default 0,
  base_points integer default 0,
  bonus_points integer default 0,
  confidence numeric,
  scoring_source text check (scoring_source in ('ai', 'manual', 'health', 'rule')),
  visibility text default 'friends' check (visibility in ('private', 'friends', 'public')),
  flagged boolean default false,
  flag_reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  score_date date not null,
  total_points integer default 0,
  movement_points integer default 0,
  fuel_points integer default 0,
  mind_points integer default 0,
  recovery_points integer default 0,
  completed_pillars integer default 0,
  all_pillars_completed boolean default false,
  streak_count integer default 0,
  rank_snapshot integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, score_date)
);

create table if not exists public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_completed_date date,
  movement_streak integer default 0,
  fuel_streak integer default 0,
  mind_streak integer default 0,
  recovery_streak integer default 0,
  updated_at timestamptz default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade,
  addressee_id uuid references public.profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (requester_id, addressee_id)
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.entries(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  type text check (type in ('fire', 'dialed', 'respect', 'slippin', 'water', 'check')),
  created_at timestamptz default now(),
  unique (entry_id, user_id, type)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.entries(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  challenge_type text,
  starts_at timestamptz,
  ends_at timestamptz,
  visibility text default 'friends',
  entry_rules jsonb default '{}'::jsonb,
  scoring_rules jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.challenge_members (
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status text default 'active',
  joined_at timestamptz default now(),
  primary key (challenge_id, user_id)
);

create table if not exists public.health_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  source text check (source in ('apple_health', 'whoop', 'oura', 'garmin', 'strava', 'manual')),
  metric_type text check (metric_type in ('steps', 'workout', 'sleep', 'hr', 'hrv', 'calories', 'mindfulness')),
  value numeric,
  unit text,
  started_at timestamptz,
  ended_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.daily_digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  digest_date date,
  title text,
  body text,
  insights jsonb default '{}'::jsonb,
  score_summary jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (user_id, digest_date)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text,
  title text,
  body text,
  data jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  revenuecat_customer_id text,
  entitlement text,
  status text,
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

create index if not exists profiles_username_idx
  on public.profiles (username);

create index if not exists entries_user_created_at_idx
  on public.entries (user_id, created_at);

create index if not exists entries_visibility_idx
  on public.entries (visibility);

create index if not exists entries_wellness_pillar_idx
  on public.entries (wellness_pillar);

create index if not exists daily_scores_user_score_date_idx
  on public.daily_scores (user_id, score_date);

create index if not exists daily_scores_score_date_total_points_idx
  on public.daily_scores (score_date, total_points);

create index if not exists friendships_requester_status_idx
  on public.friendships (requester_id, status);

create index if not exists friendships_addressee_status_idx
  on public.friendships (addressee_id, status);

create index if not exists reactions_entry_id_idx
  on public.reactions (entry_id);

create index if not exists comments_entry_id_idx
  on public.comments (entry_id);

create index if not exists health_samples_user_started_at_idx
  on public.health_samples (user_id, started_at);

create index if not exists notifications_user_read_at_idx
  on public.notifications (user_id, read_at);
