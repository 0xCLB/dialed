-- Dialed Self row-level security policies.
-- Apply after supabase/schema.sql. Service-role Edge Functions bypass RLS and should own
-- official scoring, subscription sync, notification fanout, and other trusted writes.

alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.daily_scores enable row level security;
alter table public.streaks enable row level security;
alter table public.friendships enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.health_samples enable row level security;
alter table public.daily_digests enable row level security;
alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;

-- Helper: accepted friendship in either direction.
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

-- Helper: entry visibility gate shared by entries, reactions, and comments.
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
      and (
        e.user_id = viewer
        or e.visibility = 'public'
        or (
          e.visibility = 'friends'
          and public.are_friends(viewer, e.user_id)
        )
      )
  );
$$;

-- Helper: challenge membership gate without recursive challenge_members policies.
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
    );
$$;

-- Profiles: authenticated users may create only their own profile.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

-- Profiles: users can read their own full profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

-- Profiles: accepted friends can read profile rows for social profile cards.
-- RLS controls row visibility, not columns; clients should project limited public fields only.
drop policy if exists "profiles_select_accepted_friends" on public.profiles;
create policy "profiles_select_accepted_friends"
on public.profiles for select
to authenticated
using (public.are_friends(auth.uid(), id));

-- Profiles: authenticated users can search public profile fields such as username,
-- display_name, and avatar_url. API queries should select only public fields.
drop policy if exists "profiles_select_public_search" on public.profiles;
create policy "profiles_select_public_search"
on public.profiles for select
to authenticated
using (username is not null);

-- Profiles: users can update only their own profile. No policy allows updating another profile.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Entries: owners can insert their own entries.
-- Official score fields are not trustworthy from the client; points, base_points,
-- and bonus_points should be validated or overwritten by a server Edge Function in production.
drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own"
on public.entries for insert
to authenticated
with check (user_id = auth.uid());

-- Entries: owners can select their own entries, including private entries.
drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own"
on public.entries for select
to authenticated
using (user_id = auth.uid());

-- Entries: authenticated users can select public entries.
drop policy if exists "entries_select_public" on public.entries;
create policy "entries_select_public"
on public.entries for select
to authenticated
using (visibility = 'public');

-- Entries: accepted friends can select friends-visible entries.
drop policy if exists "entries_select_friends" on public.entries;
create policy "entries_select_friends"
on public.entries for select
to authenticated
using (
  visibility = 'friends'
  and public.are_friends(auth.uid(), user_id)
);

-- Entries: owners can update their own entries. Production scoring fields should be
-- controlled by trusted server code, not accepted blindly from mobile clients.
drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own"
on public.entries for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Entries: owners can delete their own entries. Private entries have no non-owner select policy.
drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own"
on public.entries for delete
to authenticated
using (user_id = auth.uid());

-- Daily scores: owners can read their own daily score history.
drop policy if exists "daily_scores_select_own" on public.daily_scores;
create policy "daily_scores_select_own"
on public.daily_scores for select
to authenticated
using (user_id = auth.uid());

-- Daily scores: accepted friends can read friend scores for social competition.
drop policy if exists "daily_scores_select_friends" on public.daily_scores;
create policy "daily_scores_select_friends"
on public.daily_scores for select
to authenticated
using (public.are_friends(auth.uid(), user_id));

-- Daily scores: ranked rows are leaderboard-safe. Clients should project limited fields.
drop policy if exists "daily_scores_select_public_leaderboard" on public.daily_scores;
create policy "daily_scores_select_public_leaderboard"
on public.daily_scores for select
to authenticated
using (rank_snapshot is not null);

-- Daily scores: no direct client write policy. Recalculate totals through a controlled
-- server function or service-role Edge Function.

-- Streaks: owners can read their own streak state.
drop policy if exists "streaks_select_own" on public.streaks;
create policy "streaks_select_own"
on public.streaks for select
to authenticated
using (user_id = auth.uid());

-- Streaks: accepted friends can read streak rows for social surfaces.
-- Clients should project limited streak fields in friend views.
drop policy if exists "streaks_select_friends" on public.streaks;
create policy "streaks_select_friends"
on public.streaks for select
to authenticated
using (public.are_friends(auth.uid(), user_id));

-- Streaks: no direct client write policy. Streak updates should be server-calculated.

-- Friendships: users can create pending requests where they are the requester.
drop policy if exists "friendships_insert_requester_pending" on public.friendships;
create policy "friendships_insert_requester_pending"
on public.friendships for insert
to authenticated
with check (
  requester_id = auth.uid()
  and requester_id <> addressee_id
  and status = 'pending'
);

-- Friendships: participants can read their own friendship/request rows.
drop policy if exists "friendships_select_participant" on public.friendships;
create policy "friendships_select_participant"
on public.friendships for select
to authenticated
using (auth.uid() in (requester_id, addressee_id));

-- Friendships: addressees can accept or block pending requests addressed to them.
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

-- Friendships: either party can block an existing friendship/request.
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

-- Friendships: either party can remove or decline a friendship/request by deleting it.
drop policy if exists "friendships_delete_participant" on public.friendships;
create policy "friendships_delete_participant"
on public.friendships for delete
to authenticated
using (auth.uid() in (requester_id, addressee_id));

-- Reactions: reactions are visible only when the parent entry is visible.
drop policy if exists "reactions_select_visible_entry" on public.reactions;
create policy "reactions_select_visible_entry"
on public.reactions for select
to authenticated
using (public.can_view_entry(auth.uid(), entry_id));

-- Reactions: authenticated users can react only to entries they can view.
drop policy if exists "reactions_insert_visible_entry" on public.reactions;
create policy "reactions_insert_visible_entry"
on public.reactions for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.can_view_entry(auth.uid(), entry_id)
);

-- Reactions: users can delete their own reactions.
drop policy if exists "reactions_delete_own" on public.reactions;
create policy "reactions_delete_own"
on public.reactions for delete
to authenticated
using (user_id = auth.uid());

-- Comments: comments are visible when the parent entry is visible and the comment is active.
drop policy if exists "comments_select_visible_entry_active" on public.comments;
create policy "comments_select_visible_entry_active"
on public.comments for select
to authenticated
using (
  deleted_at is null
  and public.can_view_entry(auth.uid(), entry_id)
);

-- Comments: authenticated users can comment on entries they can view.
drop policy if exists "comments_insert_visible_entry" on public.comments;
create policy "comments_insert_visible_entry"
on public.comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and deleted_at is null
  and public.can_view_entry(auth.uid(), entry_id)
);

-- Comments: users can soft-delete their own comments by setting deleted_at.
drop policy if exists "comments_update_own_soft_delete" on public.comments;
create policy "comments_update_own_soft_delete"
on public.comments for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Challenges: creators can create their own challenges.
drop policy if exists "challenges_insert_creator" on public.challenges;
create policy "challenges_insert_creator"
on public.challenges for insert
to authenticated
with check (creator_id = auth.uid());

-- Challenges: public challenges are readable by authenticated users.
drop policy if exists "challenges_select_public" on public.challenges;
create policy "challenges_select_public"
on public.challenges for select
to authenticated
using (visibility = 'public');

-- Challenges: creators can read their own challenges.
drop policy if exists "challenges_select_creator" on public.challenges;
create policy "challenges_select_creator"
on public.challenges for select
to authenticated
using (creator_id = auth.uid());

-- Challenges: private and friends challenges are readable by members.
drop policy if exists "challenges_select_members" on public.challenges;
create policy "challenges_select_members"
on public.challenges for select
to authenticated
using (
  visibility in ('private', 'friends')
  and public.is_challenge_member(auth.uid(), id)
);

-- Challenges: creators can update challenge metadata and rules.
drop policy if exists "challenges_update_creator" on public.challenges;
create policy "challenges_update_creator"
on public.challenges for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

-- Challenges: creators can delete their own challenges.
drop policy if exists "challenges_delete_creator" on public.challenges;
create policy "challenges_delete_creator"
on public.challenges for delete
to authenticated
using (creator_id = auth.uid());

-- Challenge members: members can read membership for challenges they belong to.
drop policy if exists "challenge_members_select_shared_challenge" on public.challenge_members;
create policy "challenge_members_select_shared_challenge"
on public.challenge_members for select
to authenticated
using (public.is_challenge_member(auth.uid(), challenge_id));

-- Challenge members: users can join public challenges as themselves.
drop policy if exists "challenge_members_insert_self_public" on public.challenge_members;
create policy "challenge_members_insert_self_public"
on public.challenge_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.challenges c
    where c.id = challenge_id
      and c.visibility = 'public'
  )
);

-- Challenge members: users can leave their own challenge membership.
drop policy if exists "challenge_members_delete_self" on public.challenge_members;
create policy "challenge_members_delete_self"
on public.challenge_members for delete
to authenticated
using (user_id = auth.uid());

-- Health samples: private health data is owner-only. No friend or global read policies exist.
drop policy if exists "health_samples_select_own" on public.health_samples;
create policy "health_samples_select_own"
on public.health_samples for select
to authenticated
using (user_id = auth.uid());

-- Health samples: users can insert only their own imported/manual health samples.
drop policy if exists "health_samples_insert_own" on public.health_samples;
create policy "health_samples_insert_own"
on public.health_samples for insert
to authenticated
with check (user_id = auth.uid());

-- Health samples: users can update only their own samples.
drop policy if exists "health_samples_update_own" on public.health_samples;
create policy "health_samples_update_own"
on public.health_samples for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Health samples: users can delete only their own samples.
drop policy if exists "health_samples_delete_own" on public.health_samples;
create policy "health_samples_delete_own"
on public.health_samples for delete
to authenticated
using (user_id = auth.uid());

-- Daily digests: private by default; owners can read their own digest only.
drop policy if exists "daily_digests_select_own" on public.daily_digests;
create policy "daily_digests_select_own"
on public.daily_digests for select
to authenticated
using (user_id = auth.uid());

-- Daily digests: no direct client write policy. Generate through server jobs.

-- Notifications: users can read their own notifications.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

-- Notifications: users can update their own notifications, for example read_at.
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Notifications: inserts should be server-side where possible; no client insert policy exists.

-- Subscriptions: users can read their own RevenueCat entitlement mirror.
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions for select
to authenticated
using (user_id = auth.uid());

-- Subscriptions: writes should come from the RevenueCat webhook or another trusted server path.
