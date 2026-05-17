alter table public.profiles enable row level security;
alter table public.user_goals enable row level security;
alter table public.entries enable row level security;
alter table public.entry_reactions enable row level security;
alter table public.friendships enable row level security;
alter table public.leaderboard_scores enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.notifications enable row level security;
alter table public.device_push_tokens enable row level security;
alter table public.health_sync_samples enable row level security;
alter table public.share_assets enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "profiles_select_visible" on public.profiles;
create policy "profiles_select_visible"
on public.profiles for select
to authenticated
using (public.can_view_user(auth.uid(), id));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "user_goals_all_own" on public.user_goals;
create policy "user_goals_all_own"
on public.user_goals for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "entries_select_visible" on public.entries;
create policy "entries_select_visible"
on public.entries for select
to authenticated
using (public.can_view_user(auth.uid(), user_id));

drop policy if exists "entries_insert_pending_own_only" on public.entries;
create policy "entries_insert_pending_own_only"
on public.entries for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and score = 0
  and confidence = 0
  and ai_summary is null
  and score_breakdown is null
);

drop policy if exists "entries_update_caption_own_pending" on public.entries;
create policy "entries_update_caption_own_pending"
on public.entries for update
to authenticated
using (auth.uid() = user_id and status = 'pending')
with check (auth.uid() = user_id and status = 'pending' and score = 0);

drop policy if exists "entry_reactions_select_visible_entries" on public.entry_reactions;
create policy "entry_reactions_select_visible_entries"
on public.entry_reactions for select
to authenticated
using (
  exists (
    select 1 from public.entries e
    where e.id = entry_id and public.can_view_user(auth.uid(), e.user_id)
  )
);

drop policy if exists "entry_reactions_upsert_own_visible" on public.entry_reactions;
create policy "entry_reactions_upsert_own_visible"
on public.entry_reactions for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.entries e
    where e.id = entry_id and public.can_view_user(auth.uid(), e.user_id)
  )
);

drop policy if exists "entry_reactions_update_own" on public.entry_reactions;
create policy "entry_reactions_update_own"
on public.entry_reactions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "friendships_select_participant" on public.friendships;
create policy "friendships_select_participant"
on public.friendships for select
to authenticated
using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "friendships_insert_requester" on public.friendships;
create policy "friendships_insert_requester"
on public.friendships for insert
to authenticated
with check (auth.uid() = requester_id and status = 'pending');

drop policy if exists "friendships_update_addressee" on public.friendships;
create policy "friendships_update_addressee"
on public.friendships for update
to authenticated
using (auth.uid() = addressee_id or auth.uid() = requester_id)
with check (auth.uid() = addressee_id or auth.uid() = requester_id);

drop policy if exists "leaderboard_select_visible" on public.leaderboard_scores;
create policy "leaderboard_select_visible"
on public.leaderboard_scores for select
to authenticated
using (public.can_view_user(auth.uid(), user_id));

drop policy if exists "challenges_select_visible" on public.challenges;
create policy "challenges_select_visible"
on public.challenges for select
to authenticated
using (
  is_private = false
  or owner_id = auth.uid()
  or exists (
    select 1 from public.challenge_members cm
    where cm.challenge_id = id and cm.user_id = auth.uid()
  )
);

drop policy if exists "challenges_insert_owner" on public.challenges;
create policy "challenges_insert_owner"
on public.challenges for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "challenges_update_owner" on public.challenges;
create policy "challenges_update_owner"
on public.challenges for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "challenge_members_select_visible" on public.challenge_members;
create policy "challenge_members_select_visible"
on public.challenge_members for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.challenges c
    where c.id = challenge_id and (c.is_private = false or c.owner_id = auth.uid())
  )
);

drop policy if exists "challenge_members_insert_self" on public.challenge_members;
create policy "challenge_members_insert_self"
on public.challenge_members for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "notifications_all_own" on public.notifications;
create policy "notifications_all_own"
on public.notifications for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "push_tokens_all_own" on public.device_push_tokens;
create policy "push_tokens_all_own"
on public.device_push_tokens for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "health_sync_all_own" on public.health_sync_samples;
create policy "health_sync_all_own"
on public.health_sync_samples for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "share_assets_all_own" on public.share_assets;
create policy "share_assets_all_own"
on public.share_assets for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "entry_proofs_select_visible" on storage.objects;
create policy "entry_proofs_select_visible"
on storage.objects for select
to authenticated
using (
  bucket_id = 'entry-proofs'
  and (
    owner = auth.uid()
    or exists (
      select 1 from public.entries e
      where e.proof_url = name and public.can_view_user(auth.uid(), e.user_id)
    )
  )
);

drop policy if exists "entry_proofs_insert_own_path" on storage.objects;
create policy "entry_proofs_insert_own_path"
on storage.objects for insert
to authenticated
with check (bucket_id = 'entry-proofs' and owner = auth.uid() and name like auth.uid()::text || '/%');

drop policy if exists "share_assets_select_own" on storage.objects;
create policy "share_assets_select_own"
on storage.objects for select
to authenticated
using (bucket_id = 'share-assets' and owner = auth.uid());

drop policy if exists "share_assets_insert_own_path" on storage.objects;
create policy "share_assets_insert_own_path"
on storage.objects for insert
to authenticated
with check (bucket_id = 'share-assets' and owner = auth.uid() and name like auth.uid()::text || '/%');
