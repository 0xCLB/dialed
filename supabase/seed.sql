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
  avatar_path,
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
  avatar_path = excluded.avatar_path,
  bio = excluded.bio,
  city = excluded.city,
  timezone = excluded.timezone,
  onboarding_completed = excluded.onboarding_completed,
  privacy_default = excluded.privacy_default,
  is_pro = excluded.is_pro,
  updated_at = now();

insert into public.activity_catalog (slug, label, wellness_pillar, default_points, keywords, sort_order)
values
  ('strength_training', 'Strength training', 'movement', 70, array['gym', 'lift', 'weights', 'workout'], 10),
  ('outdoor_walk', 'Outdoor walk', 'movement', 45, array['walk', 'steps', 'outside'], 20),
  ('protein_target', 'Hit protein target', 'fuel', 55, array['protein', 'meal', 'macros'], 30),
  ('hydration_target', 'Hydration target', 'fuel', 40, array['water', 'hydration'], 40),
  ('reading_journaling', 'Reading and journaling', 'mind', 50, array['read', 'journal', 'reflection'], 50),
  ('meditation', 'Meditation', 'mind', 45, array['meditate', 'breath', 'mindful'], 60),
  ('mobility_recovery', 'Mobility recovery', 'recovery', 45, array['stretch', 'mobility', 'recovery'], 70),
  ('sleep_routine', 'Sleep routine', 'recovery', 60, array['sleep', 'wind down', 'bedtime'], 80)
on conflict (slug) do update set
  label = excluded.label,
  wellness_pillar = excluded.wellness_pillar,
  default_points = excluded.default_points,
  keywords = excluded.keywords,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.user_quick_picks (user_id, activity_slug, usage_count, last_used_at)
values
  ('00000000-0000-4000-8000-000000000001', 'strength_training', 12, now() - interval '2 hours'),
  ('00000000-0000-4000-8000-000000000001', 'protein_target', 8, now() - interval '90 minutes'),
  ('00000000-0000-4000-8000-000000000002', 'reading_journaling', 6, now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000003', 'mobility_recovery', 5, now() - interval '1 day')
on conflict (user_id, activity_slug) do update set
  usage_count = excluded.usage_count,
  last_used_at = excluded.last_used_at,
  updated_at = now();

insert into public.friendships (id, requester_id, addressee_id, status)
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
  entry_type,
  activity_tag,
  caption,
  location_name,
  wellness_pillar,
  visibility,
  status,
  occurred_at,
  metadata
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'photo',
    'strength_training',
    'Lower body lift and sled pushes.',
    'Dev Gym',
    'movement',
    'friends',
    'scored',
    now() - interval '2 hours',
    '{"dev_seed":true,"duration_minutes":62}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'manual',
    'protein_target',
    'Hit water target and 150g protein.',
    null,
    'fuel',
    'friends',
    'scored',
    now() - interval '90 minutes',
    '{"dev_seed":true,"water_oz":96,"protein_g":150}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000002',
    'manual',
    'reading_journaling',
    'Twenty pages and a five minute reflection.',
    null,
    'mind',
    'friends',
    'scored',
    now() - interval '1 day' + interval '8 hours',
    '{"dev_seed":true,"pages":20,"journal_minutes":5}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000003',
    'manual',
    'mobility_recovery',
    'Sauna, stretch, and early lights out.',
    null,
    'recovery',
    'friends',
    'scored',
    now() - interval '1 day' + interval '10 hours',
    '{"dev_seed":true,"sauna_minutes":20,"stretch_minutes":15,"sleep_hours":8}'::jsonb
  )
on conflict (id) do update set
  user_id = excluded.user_id,
  entry_type = excluded.entry_type,
  activity_tag = excluded.activity_tag,
  caption = excluded.caption,
  location_name = excluded.location_name,
  wellness_pillar = excluded.wellness_pillar,
  visibility = excluded.visibility,
  status = excluded.status,
  occurred_at = excluded.occurred_at,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.entry_media (
  id,
  entry_id,
  user_id,
  bucket_id,
  storage_path,
  media_kind,
  mime_type,
  width,
  height
)
values
  (
    '21000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'entry-photos',
    'entry-photos/00000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000001.jpg',
    'proof',
    'image/jpeg',
    1080,
    1440
  )
on conflict (storage_path) do update set
  media_kind = excluded.media_kind,
  mime_type = excluded.mime_type,
  width = excluded.width,
  height = excluded.height;

insert into public.entry_scores (
  entry_id,
  user_id,
  normalized_activity,
  wellness_pillar,
  points,
  base_points,
  bonus_points,
  confidence,
  scoring_source,
  ai_subtext,
  scoring_explanation,
  model_name,
  metadata
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'strength_training',
    'movement',
    95,
    80,
    15,
    0.94,
    'ai',
    'Heavy movement proof with high effort and repeatable structure.',
    'Dev seed AI-style score.',
    'dev-seed',
    '{"dev_seed":true}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'hydration_and_protein',
    'fuel',
    72,
    60,
    12,
    0.88,
    'manual_review',
    'Fuel pillar covered with hydration and protein consistency.',
    'Dev seed manual score.',
    'dev-seed',
    '{"dev_seed":true}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000002',
    'reading_and_journaling',
    'mind',
    64,
    55,
    9,
    0.86,
    'rule',
    'Mind pillar proof with focused input and written output.',
    'Dev seed rule score.',
    'dev-seed',
    '{"dev_seed":true}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000003',
    'sauna_mobility_sleep',
    'recovery',
    80,
    68,
    12,
    0.9,
    'manual_review',
    'Recovery pillar proof with heat, mobility, and sleep intent.',
    'Dev seed manual score.',
    'dev-seed',
    '{"dev_seed":true}'::jsonb
  )
on conflict (entry_id) do update set
  user_id = excluded.user_id,
  normalized_activity = excluded.normalized_activity,
  wellness_pillar = excluded.wellness_pillar,
  points = excluded.points,
  base_points = excluded.base_points,
  bonus_points = excluded.bonus_points,
  confidence = excluded.confidence,
  scoring_source = excluded.scoring_source,
  ai_subtext = excluded.ai_subtext,
  scoring_explanation = excluded.scoring_explanation,
  model_name = excluded.model_name,
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
  ('00000000-0000-4000-8000-000000000001', current_date, 167, 95, 72, 0, 0, 2, false, 5, 1),
  ('00000000-0000-4000-8000-000000000002', current_date, 124, 60, 0, 64, 0, 2, false, 3, 2),
  ('00000000-0000-4000-8000-000000000003', current_date, 110, 0, 30, 0, 80, 2, false, 2, 3),
  ('00000000-0000-4000-8000-000000000001', current_date - 1, 210, 70, 50, 45, 45, 4, true, 4, 1),
  ('00000000-0000-4000-8000-000000000002', current_date - 1, 156, 58, 34, 64, 0, 3, false, 2, 2),
  ('00000000-0000-4000-8000-000000000003', current_date - 1, 142, 30, 32, 0, 80, 3, false, 1, 3)
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
  ('00000000-0000-4000-8000-000000000001', 5, 12, current_date, 5, 5, 4, 4),
  ('00000000-0000-4000-8000-000000000002', 3, 9, current_date, 3, 2, 3, 1),
  ('00000000-0000-4000-8000-000000000003', 2, 7, current_date, 1, 2, 1, 2)
on conflict (user_id) do update set
  current_streak = excluded.current_streak,
  longest_streak = excluded.longest_streak,
  last_completed_date = excluded.last_completed_date,
  movement_streak = excluded.movement_streak,
  fuel_streak = excluded.fuel_streak,
  mind_streak = excluded.mind_streak,
  recovery_streak = excluded.recovery_streak,
  updated_at = now();

insert into public.reactions (id, entry_id, user_id, reaction_type)
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
on conflict (entry_id, user_id, reaction_type) do nothing;

insert into public.comments (id, entry_id, user_id, body)
values
  (
    '31000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'That leg day looks rude in the best way.'
  )
on conflict (id) do update set
  body = excluded.body,
  updated_at = now();

insert into public.challenges (
  id,
  creator_id,
  title,
  description,
  challenge_type,
  starts_at,
  ends_at,
  visibility,
  entry_rules,
  scoring_rules
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Four Pillar Week',
    'Complete all four pillars as many days as possible.',
    'pillar_completion',
    date_trunc('week', now()),
    date_trunc('week', now()) + interval '7 days',
    'friends',
    '{"pillars":["movement","fuel","mind","recovery"]}'::jsonb,
    '{"rank_by":"completed_pillars_then_points"}'::jsonb
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  challenge_type = excluded.challenge_type,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  visibility = excluded.visibility,
  entry_rules = excluded.entry_rules,
  scoring_rules = excluded.scoring_rules,
  updated_at = now();

insert into public.challenge_members (challenge_id, user_id, status)
values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'active'),
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'active')
on conflict (challenge_id, user_id) do update set
  status = excluded.status,
  joined_at = now();

insert into public.challenge_entries (challenge_id, entry_id, user_id)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001'
  )
on conflict (challenge_id, entry_id) do nothing;

insert into public.health_samples (
  id,
  user_id,
  provider,
  metric_type,
  value,
  unit,
  started_at,
  ended_at,
  source_identifier,
  metadata
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'apple_health',
    'steps',
    8420,
    'count',
    current_date + time '08:00',
    current_date + time '20:00',
    'dev.steps.today',
    '{"dev_seed":true}'::jsonb
  )
on conflict (id) do update set
  value = excluded.value,
  unit = excluded.unit,
  started_at = excluded.started_at,
  ended_at = excluded.ended_at,
  source_identifier = excluded.source_identifier,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.daily_digests (
  user_id,
  digest_date,
  title,
  body,
  tone,
  insights,
  score_summary
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    current_date,
    'Today''s Dialed Digest',
    'You stacked movement and fuel. Recovery is still sitting there with a raised eyebrow.',
    'twain',
    '{"dev_seed":true,"next_best_action":"Add a recovery check-in"}'::jsonb,
    '{"total_points":167,"completed_pillars":2}'::jsonb
  )
on conflict (user_id, digest_date) do update set
  title = excluded.title,
  body = excluded.body,
  tone = excluded.tone,
  insights = excluded.insights,
  score_summary = excluded.score_summary,
  updated_at = now();

insert into public.share_assets (
  id,
  user_id,
  entry_id,
  score_date,
  asset_type,
  template_id,
  bucket_id,
  storage_path,
  visibility,
  status,
  metadata
)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    null,
    'story_card',
    'classic-proof',
    'share-assets',
    'share-assets/00000000-0000-4000-8000-000000000001/60000000-0000-4000-8000-000000000001.png',
    'private',
    'ready',
    '{"dev_seed":true}'::jsonb
  )
on conflict (storage_path) do update set
  visibility = excluded.visibility,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.notification_preferences (user_id)
values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003')
on conflict (user_id) do update set
  updated_at = now();

insert into public.notifications (
  id,
  user_id,
  actor_id,
  notification_type,
  title,
  body,
  data
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'leaderboard',
    'Still in first',
    'Kyle is within 43 Dialed Points. Keep the crown warm.',
    '{"dev_seed":true,"interest_score":82}'::jsonb
  )
on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  data = excluded.data;

insert into public.subscriptions (
  user_id,
  revenuecat_customer_id,
  entitlement,
  status,
  product_id,
  current_period_end
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'dev_rc_00000000-0000-4000-8000-000000000001',
    'dialed_pro',
    'active',
    'dialed_pro_monthly',
    now() + interval '30 days'
  )
on conflict (user_id) do update set
  revenuecat_customer_id = excluded.revenuecat_customer_id,
  entitlement = excluded.entitlement,
  status = excluded.status,
  product_id = excluded.product_id,
  current_period_end = excluded.current_period_end,
  updated_at = now();
