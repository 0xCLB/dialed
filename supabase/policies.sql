-- Dialed Self row-level security policies.
-- Apply after supabase/schema.sql. Service-role Edge Functions bypass RLS and own
-- official scoring, digest generation, notification fanout, and RevenueCat sync.

alter table public.profiles enable row level security;
alter table public.activity_catalog enable row level security;
alter table public.user_quick_picks enable row level security;
alter table public.entries enable row level security;
alter table public.entry_media enable row level security;
alter table public.entry_scores enable row level security;
alter table public.daily_scores enable row level security;
alter table public.streaks enable row level security;
alter table public.friendships enable row level security;
alter table public.user_blocks enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.challenge_entries enable row level security;
alter table public.health_samples enable row level security;
alter table public.daily_digests enable row level security;
alter table public.share_assets enable row level security;
alter table public.notification_devices enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;

create or replace function public.are_blocked(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select user_a is not null
    and user_b is not null
    and user_a <> user_b
    and (
      exists (
        select 1
        from public.user_blocks b
        where (b.blocker_id = user_a and b.blocked_id = user_b)
           or (b.blocker_id = user_b and b.blocked_id = user_a)
      )
      or exists (
        select 1
        from public.friendships f
        where f.status = 'blocked'
          and (
            (f.requester_id = user_a and f.addressee_id = user_b)
            or (f.requester_id = user_b and f.addressee_id = user_a)
          )
      )
    );
$$;

create or replace function public.are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select user_a is not null
    and user_b is not null
    and user_a <> user_b
    and not public.are_blocked(user_a, user_b)
    and exists (
      select 1
      from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = user_a and f.addressee_id = user_b)
          or (f.requester_id = user_b and f.addressee_id = user_a)
        )
    );
$$;

create or replace function public.is_challenge_member(viewer uuid, target_challenge_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select viewer is not null
    and exists (
      select 1
      from public.challenge_members cm
      where cm.challenge_id = target_challenge_id
        and cm.user_id = viewer
        and cm.status = 'active'
    );
$$;

create or replace function public.can_view_challenge(viewer uuid, target_challenge_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.challenges c
    where c.id = target_challenge_id
      and (
        c.visibility = 'public'
        or c.creator_id = viewer
        or public.is_challenge_member(viewer, c.id)
      )
  );
$$;

create or replace function public.can_view_entry(viewer uuid, target_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.entries e
    where e.id = target_entry_id
      and e.status <> 'deleted'
      and not public.are_blocked(viewer, e.user_id)
      and (
        e.user_id = viewer
        or e.visibility = 'public'
        or (
          e.visibility = 'friends'
          and public.are_friends(viewer, e.user_id)
        )
        or (
          e.visibility = 'challenge'
          and exists (
            select 1
            from public.challenge_entries ce
            where ce.entry_id = e.id
              and public.is_challenge_member(viewer, ce.challenge_id)
          )
        )
      )
  );
$$;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_select_social" on public.profiles;
create policy "profiles_select_social"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or (
    username is not null
    and not public.are_blocked(auth.uid(), id)
  )
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "activity_catalog_select_active" on public.activity_catalog;
create policy "activity_catalog_select_active"
on public.activity_catalog for select
to authenticated
using (is_active);

drop policy if exists "user_quick_picks_select_own" on public.user_quick_picks;
create policy "user_quick_picks_select_own"
on public.user_quick_picks for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "user_quick_picks_insert_own" on public.user_quick_picks;
create policy "user_quick_picks_insert_own"
on public.user_quick_picks for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "user_quick_picks_update_own" on public.user_quick_picks;
create policy "user_quick_picks_update_own"
on public.user_quick_picks for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "user_quick_picks_delete_own" on public.user_quick_picks;
create policy "user_quick_picks_delete_own"
on public.user_quick_picks for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own"
on public.entries for insert
to authenticated
with check (
  user_id = auth.uid()
  and status in ('draft', 'pending_score')
);

drop policy if exists "entries_select_visible" on public.entries;
create policy "entries_select_visible"
on public.entries for select
to authenticated
using (public.can_view_entry(auth.uid(), id));

drop policy if exists "entries_update_own_user_fields" on public.entries;
create policy "entries_update_own_user_fields"
on public.entries for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and status in ('draft', 'pending_score', 'scored', 'deleted')
);

drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own"
on public.entries for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "entry_media_select_visible_entry" on public.entry_media;
create policy "entry_media_select_visible_entry"
on public.entry_media for select
to authenticated
using (public.can_view_entry(auth.uid(), entry_id));

drop policy if exists "entry_media_insert_own_entry" on public.entry_media;
create policy "entry_media_insert_own_entry"
on public.entry_media for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.entries e
    where e.id = entry_id
      and e.user_id = auth.uid()
  )
  and storage_path like bucket_id || '/' || auth.uid()::text || '/%'
);

drop policy if exists "entry_media_delete_own" on public.entry_media;
create policy "entry_media_delete_own"
on public.entry_media for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "entry_scores_select_visible_entry" on public.entry_scores;
create policy "entry_scores_select_visible_entry"
on public.entry_scores for select
to authenticated
using (public.can_view_entry(auth.uid(), entry_id));

-- No entry_scores insert/update/delete policies: official scoring is server-owned.

drop policy if exists "daily_scores_select_own" on public.daily_scores;
create policy "daily_scores_select_own"
on public.daily_scores for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "daily_scores_select_friends" on public.daily_scores;
create policy "daily_scores_select_friends"
on public.daily_scores for select
to authenticated
using (public.are_friends(auth.uid(), user_id));

drop policy if exists "daily_scores_select_public_leaderboard" on public.daily_scores;
create policy "daily_scores_select_public_leaderboard"
on public.daily_scores for select
to authenticated
using (
  rank_snapshot is not null
  and not public.are_blocked(auth.uid(), user_id)
);

drop policy if exists "streaks_select_own" on public.streaks;
create policy "streaks_select_own"
on public.streaks for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "streaks_select_friends" on public.streaks;
create policy "streaks_select_friends"
on public.streaks for select
to authenticated
using (public.are_friends(auth.uid(), user_id));

drop policy if exists "friendships_insert_requester_pending" on public.friendships;
create policy "friendships_insert_requester_pending"
on public.friendships for insert
to authenticated
with check (
  requester_id = auth.uid()
  and requester_id <> addressee_id
  and status = 'pending'
  and not public.are_blocked(requester_id, addressee_id)
);

drop policy if exists "friendships_select_participant" on public.friendships;
create policy "friendships_select_participant"
on public.friendships for select
to authenticated
using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "friendships_update_addressee_pending" on public.friendships;
create policy "friendships_update_addressee_pending"
on public.friendships for update
to authenticated
using (
  addressee_id = auth.uid()
  and status = 'pending'
)
with check (
  addressee_id = auth.uid()
  and requester_id <> addressee_id
  and status in ('accepted', 'blocked')
);

drop policy if exists "friendships_update_participant_block" on public.friendships;
create policy "friendships_update_participant_block"
on public.friendships for update
to authenticated
using (auth.uid() in (requester_id, addressee_id))
with check (
  auth.uid() in (requester_id, addressee_id)
  and requester_id <> addressee_id
  and status = 'blocked'
);

drop policy if exists "friendships_delete_participant" on public.friendships;
create policy "friendships_delete_participant"
on public.friendships for delete
to authenticated
using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "user_blocks_select_own" on public.user_blocks;
create policy "user_blocks_select_own"
on public.user_blocks for select
to authenticated
using (blocker_id = auth.uid());

drop policy if exists "user_blocks_insert_own" on public.user_blocks;
create policy "user_blocks_insert_own"
on public.user_blocks for insert
to authenticated
with check (blocker_id = auth.uid() and blocker_id <> blocked_id);

drop policy if exists "user_blocks_delete_own" on public.user_blocks;
create policy "user_blocks_delete_own"
on public.user_blocks for delete
to authenticated
using (blocker_id = auth.uid());

drop policy if exists "reactions_select_visible_entry" on public.reactions;
create policy "reactions_select_visible_entry"
on public.reactions for select
to authenticated
using (public.can_view_entry(auth.uid(), entry_id));

drop policy if exists "reactions_insert_visible_entry" on public.reactions;
create policy "reactions_insert_visible_entry"
on public.reactions for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.can_view_entry(auth.uid(), entry_id)
);

drop policy if exists "reactions_delete_own" on public.reactions;
create policy "reactions_delete_own"
on public.reactions for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "comments_select_visible_entry_active" on public.comments;
create policy "comments_select_visible_entry_active"
on public.comments for select
to authenticated
using (
  deleted_at is null
  and public.can_view_entry(auth.uid(), entry_id)
);

drop policy if exists "comments_insert_visible_entry" on public.comments;
create policy "comments_insert_visible_entry"
on public.comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and deleted_at is null
  and public.can_view_entry(auth.uid(), entry_id)
);

drop policy if exists "comments_update_own_soft_delete" on public.comments;
create policy "comments_update_own_soft_delete"
on public.comments for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "challenges_insert_creator" on public.challenges;
create policy "challenges_insert_creator"
on public.challenges for insert
to authenticated
with check (creator_id = auth.uid());

drop policy if exists "challenges_select_visible" on public.challenges;
create policy "challenges_select_visible"
on public.challenges for select
to authenticated
using (public.can_view_challenge(auth.uid(), id));

drop policy if exists "challenges_update_creator" on public.challenges;
create policy "challenges_update_creator"
on public.challenges for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

drop policy if exists "challenges_delete_creator" on public.challenges;
create policy "challenges_delete_creator"
on public.challenges for delete
to authenticated
using (creator_id = auth.uid());

drop policy if exists "challenge_members_select_visible_challenge" on public.challenge_members;
create policy "challenge_members_select_visible_challenge"
on public.challenge_members for select
to authenticated
using (public.can_view_challenge(auth.uid(), challenge_id));

drop policy if exists "challenge_members_insert_self_public" on public.challenge_members;
create policy "challenge_members_insert_self_public"
on public.challenge_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'active'
  and exists (
    select 1
    from public.challenges c
    where c.id = challenge_id
      and c.visibility = 'public'
  )
);

drop policy if exists "challenge_members_update_self" on public.challenge_members;
create policy "challenge_members_update_self"
on public.challenge_members for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and status in ('active', 'declined'));

drop policy if exists "challenge_members_delete_self" on public.challenge_members;
create policy "challenge_members_delete_self"
on public.challenge_members for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "challenge_entries_select_visible" on public.challenge_entries;
create policy "challenge_entries_select_visible"
on public.challenge_entries for select
to authenticated
using (
  public.can_view_challenge(auth.uid(), challenge_id)
  and public.can_view_entry(auth.uid(), entry_id)
);

drop policy if exists "challenge_entries_insert_member_own_entry" on public.challenge_entries;
create policy "challenge_entries_insert_member_own_entry"
on public.challenge_entries for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_challenge_member(auth.uid(), challenge_id)
  and exists (
    select 1
    from public.entries e
    where e.id = entry_id
      and e.user_id = auth.uid()
  )
);

drop policy if exists "challenge_entries_delete_own" on public.challenge_entries;
create policy "challenge_entries_delete_own"
on public.challenge_entries for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "health_samples_select_own" on public.health_samples;
create policy "health_samples_select_own"
on public.health_samples for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "health_samples_insert_own" on public.health_samples;
create policy "health_samples_insert_own"
on public.health_samples for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "health_samples_update_own" on public.health_samples;
create policy "health_samples_update_own"
on public.health_samples for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "health_samples_delete_own" on public.health_samples;
create policy "health_samples_delete_own"
on public.health_samples for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "daily_digests_select_own" on public.daily_digests;
create policy "daily_digests_select_own"
on public.daily_digests for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "share_assets_select_own" on public.share_assets;
create policy "share_assets_select_own"
on public.share_assets for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "share_assets_select_public" on public.share_assets;
create policy "share_assets_select_public"
on public.share_assets for select
to public
using (visibility = 'public' and status = 'ready');

drop policy if exists "share_assets_insert_own" on public.share_assets;
create policy "share_assets_insert_own"
on public.share_assets for insert
to authenticated
with check (
  user_id = auth.uid()
  and storage_path like bucket_id || '/' || auth.uid()::text || '/%'
);

drop policy if exists "share_assets_update_own" on public.share_assets;
create policy "share_assets_update_own"
on public.share_assets for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and storage_path like bucket_id || '/' || auth.uid()::text || '/%'
);

drop policy if exists "share_assets_delete_own" on public.share_assets;
create policy "share_assets_delete_own"
on public.share_assets for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "notification_devices_select_own" on public.notification_devices;
create policy "notification_devices_select_own"
on public.notification_devices for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notification_devices_insert_own" on public.notification_devices;
create policy "notification_devices_insert_own"
on public.notification_devices for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "notification_devices_update_own" on public.notification_devices;
create policy "notification_devices_update_own"
on public.notification_devices for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notification_devices_delete_own" on public.notification_devices;
create policy "notification_devices_delete_own"
on public.notification_devices for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
on public.notification_preferences for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own"
on public.notification_preferences for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
on public.notification_preferences for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_update_own_read_state" on public.notifications;
create policy "notifications_update_own_read_state"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "subscription_events_select_own" on public.subscription_events;
create policy "subscription_events_select_own"
on public.subscription_events for select
to authenticated
using (user_id = auth.uid());

-- No client write policies for daily_scores, streaks, daily_digests, subscriptions,
-- or subscription_events. Notifications are server-created; clients can only update
-- their own read state.
