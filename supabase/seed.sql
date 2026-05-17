-- Dialed Self local/dev seed data.
-- DEV-ONLY placeholder UUIDs. Do not reuse these IDs in production.
-- No real phone numbers, credentials, provider tokens, or secrets are included.

insert into auth.users (
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'david@example.test',
    now(),
    '{"provider":"dev_seed","providers":["dev_seed"]}'::jsonb,
    '{"username":"david","display_name":"David","dev_only":true}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'kyle@example.test',
    now(),
    '{"provider":"dev_seed","providers":["dev_seed"]}'::jsonb,
    '{"username":"kyle","display_name":"Kyle","dev_only":true}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'emma@example.test',
    now(),
    '{"provider":"dev_seed","providers":["dev_seed"]}'::jsonb,
    '{"username":"emma","display_name":"Emma","dev_only":true}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update set
  email = excluded.email,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into public.profiles (
  id,
  username,
  display_name,
  avatar_url,
  bio,
  city,
  timezone,
  onboarding_completed,
  privacy_default,
  is_pro
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'david',
    'David',
    'avatars/00000000-0000-4000-8000-000000000001/avatar.jpg',
    'Building a dialed daily baseline.',
    'Los Angeles',
    'America/Los_Angeles',
    true,
    'friends',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'kyle',
    'Kyle',
    'avatars/00000000-0000-4000-8000-000000000002/avatar.jpg',
    'Chasing consistency across movement and recovery.',
    'Austin',
    'America/Chicago',
    true,
    'friends',
    false
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'emma',
    'Emma',
    'avatars/00000000-0000-4000-8000-000000000003/avatar.jpg',
    'Fuel, focus, and better sleep.',
    'New York',
    'America/New_York',
    true,
    'friends',
    false
  )
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  city = excluded.city,
  timezone = excluded.timezone,
  onboarding_completed = excluded.onboarding_completed,
  privacy_default = excluded.privacy_default,
  is_pro = excluded.is_pro,
  updated_at = now();

insert into public.friendships (
  id,
  requester_id,
  addressee_id,
  status
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'accepted'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    'pending'
  )
on conflict (requester_id, addressee_id) do update set
  status = excluded.status,
  updated_at = now();

insert into public.entries (
  id,
  user_id,
  type,
  activity_tag,
  normalized_activity,
  caption,
  ai_subtext,
  photo_url,
  thumbnail_url,
  location_name,
  wellness_pillar,
  points,
  base_points,
  bonus_points,
  confidence,
  scoring_source,
  visibility,
  metadata,
  created_at,
  updated_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'photo',
    'gym_workout',
    'strength_training',
    'Lower body lift and sled pushes.',
    'Heavy movement proof with high effort and repeatable structure.',
    'entry-photos/00000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001.jpg',
    'entry-photos/00000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001-thumb.jpg',
    'Dev Gym',
    'movement',
    95,
    80,
    15,
    0.94,
    'ai',
    'friends',
    '{"dev_seed":true,"duration_minutes":62}'::jsonb,
    now() - interval '2 hours',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'manual',
    'water_protein',
    'hydration_and_protein',
    'Hit water target and 150g protein.',
    'Fuel pillar covered with hydration and protein consistency.',
    null,
    null,
    null,
    'fuel',
    72,
    60,
    12,
    0.88,
    'manual',
    'friends',
    '{"dev_seed":true,"water_oz":96,"protein_g":150}'::jsonb,
    now() - interval '90 minutes',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000002',
    'manual',
    'reading_journaling',
    'reading_and_journaling',
    'Twenty pages and a five minute reflection.',
    'Mind pillar proof with focused input and written output.',
    null,
    null,
    null,
    'mind',
    64,
    55,
    9,
    0.86,
    'rule',
    'friends',
    '{"dev_seed":true,"pages":20,"journal_minutes":5}'::jsonb,
    now() - interval '1 day' + interval '8 hours',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000003',
    'manual',
    'sauna_stretch_sleep',
    'sauna_mobility_sleep',
    'Sauna, stretch, and early lights out.',
    'Recovery pillar proof with heat, mobility, and sleep intent.',
    null,
    null,
    null,
    'recovery',
    80,
    68,
    12,
    0.9,
    'manual',
    'friends',
    '{"dev_seed":true,"sauna_minutes":20,"stretch_minutes":15,"sleep_hours":8}'::jsonb,
    now() - interval '1 day' + interval '10 hours',
    now()
  )
on conflict (id) do update set
  user_id = excluded.user_id,
  type = excluded.type,
  activity_tag = excluded.activity_tag,
  normalized_activity = excluded.normalized_activity,
  caption = excluded.caption,
  ai_subtext = excluded.ai_subtext,
  photo_url = excluded.photo_url,
  thumbnail_url = excluded.thumbnail_url,
  location_name = excluded.location_name,
  wellness_pillar = excluded.wellness_pillar,
  points = excluded.points,
  base_points = excluded.base_points,
  bonus_points = excluded.bonus_points,
  confidence = excluded.confidence,
  scoring_source = excluded.scoring_source,
  visibility = excluded.visibility,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.daily_scores (
  user_id,
  score_date,
  total_points,
  movement_points,
  fuel_points,
  mind_points,
  recovery_points,
  completed_pillars,
  all_pillars_completed,
  streak_count,
  rank_snapshot
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    current_date,
    167,
    95,
    72,
    0,
    0,
    2,
    false,
    5,
    1
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    current_date,
    124,
    60,
    0,
    64,
    0,
    2,
    false,
    3,
    2
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    current_date,
    110,
    0,
    30,
    0,
    80,
    2,
    false,
    2,
    3
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    current_date - 1,
    210,
    70,
    50,
    45,
    45,
    4,
    true,
    4,
    1
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    current_date - 1,
    156,
    58,
    34,
    64,
    0,
    3,
    false,
    2,
    2
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    current_date - 1,
    142,
    30,
    32,
    0,
    80,
    3,
    false,
    1,
    3
  )
on conflict (user_id, score_date) do update set
  total_points = excluded.total_points,
  movement_points = excluded.movement_points,
  fuel_points = excluded.fuel_points,
  mind_points = excluded.mind_points,
  recovery_points = excluded.recovery_points,
  completed_pillars = excluded.completed_pillars,
  all_pillars_completed = excluded.all_pillars_completed,
  streak_count = excluded.streak_count,
  rank_snapshot = excluded.rank_snapshot,
  updated_at = now();

insert into public.streaks (
  user_id,
  current_streak,
  longest_streak,
  last_completed_date,
  movement_streak,
  fuel_streak,
  mind_streak,
  recovery_streak
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    5,
    12,
    current_date,
    5,
    5,
    4,
    4
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    3,
    9,
    current_date,
    3,
    2,
    3,
    1
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    2,
    7,
    current_date,
    1,
    2,
    1,
    2
  )
on conflict (user_id) do update set
  current_streak = excluded.current_streak,
  longest_streak = excluded.longest_streak,
  last_completed_date = excluded.last_completed_date,
  movement_streak = excluded.movement_streak,
  fuel_streak = excluded.fuel_streak,
  mind_streak = excluded.mind_streak,
  recovery_streak = excluded.recovery_streak,
  updated_at = now();

insert into public.reactions (
  id,
  entry_id,
  user_id,
  type
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'dialed'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    'fire'
  )
on conflict (entry_id, user_id, type) do nothing;
