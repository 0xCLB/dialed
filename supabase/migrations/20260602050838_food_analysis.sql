-- Dialed Self Food Proof Analysis v1.
-- Additive table for server-owned food photo macro and fuel-quality estimates.

create table if not exists public.food_analyses (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  detected_foods jsonb not null default '[]'::jsonb,
  estimated_calories integer check (estimated_calories is null or estimated_calories >= 0),
  estimated_protein_g numeric check (estimated_protein_g is null or estimated_protein_g >= 0),
  estimated_carbs_g numeric check (estimated_carbs_g is null or estimated_carbs_g >= 0),
  estimated_fat_g numeric check (estimated_fat_g is null or estimated_fat_g >= 0),
  healthiness_score integer check (healthiness_score is null or healthiness_score between 0 and 100),
  fuel_quality_label text check (
    fuel_quality_label is null
    or fuel_quality_label in ('poor', 'okay', 'solid', 'dialed')
  ),
  confidence numeric check (confidence is null or confidence between 0 and 1),
  notes text,
  suggested_points integer check (suggested_points is null or suggested_points >= 0),
  warning text,
  model_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_id),
  unique (storage_path)
);

create index if not exists food_analyses_user_created_idx
  on public.food_analyses (user_id, created_at desc);

create index if not exists food_analyses_entry_idx
  on public.food_analyses (entry_id);

drop trigger if exists set_food_analyses_updated_at on public.food_analyses;
create trigger set_food_analyses_updated_at
before update on public.food_analyses
for each row execute function public.set_updated_at();

alter table public.food_analyses enable row level security;

drop policy if exists "food_analyses_select_own" on public.food_analyses;
create policy "food_analyses_select_own"
on public.food_analyses for select
to authenticated
using (user_id = auth.uid());

revoke all on public.food_analyses from anon, authenticated;
grant select on public.food_analyses to authenticated;

comment on table public.food_analyses is
  'Server-owned estimated food proof analysis. Client can read own rows only.';

comment on column public.food_analyses.estimated_calories is
  'Estimate only; not medical or nutrition advice.';

comment on column public.food_analyses.storage_path is
  'Cache key for avoiding repeated analysis of the same proof image.';
