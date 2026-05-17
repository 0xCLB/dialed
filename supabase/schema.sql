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
