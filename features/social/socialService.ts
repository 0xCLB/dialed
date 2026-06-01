import { getEntriesForDate, getEntryWithScore, listRecentEntries } from '@/features/entries/entryService';
import {
  getDailyScore,
  getUserStreak,
  recomputeLocalDaySummary,
} from '@/features/progress/progressService';
import { supabase } from '@/lib/supabase';
import type {
  FriendFeedItem,
  FriendProfile,
  FriendRequest,
  Friendship,
  FriendshipStatus,
  ProfileSummary,
  ReactionType,
} from '@/features/social/types';

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  bio: string | null;
  city: string | null;
  privacy_default: 'private' | 'friends' | 'public';
  is_pro: boolean;
};

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requester?: ProfileRow | ProfileRow[] | null;
  addressee?: ProfileRow | ProfileRow[] | null;
};

type ReactionRow = {
  entry_id: string;
  user_id: string;
  reaction_type: ReactionType;
};

const PROFILE_COLUMNS =
  'id, username, display_name, avatar_path, bio, city, privacy_default, is_pro';

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function mapProfile(row: ProfileRow | null | undefined): ProfileSummary | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name ?? row.username ?? 'Dialed athlete',
    avatarPath: row.avatar_path,
    bio: row.bio,
    city: row.city,
    privacyDefault: row.privacy_default,
    isPro: row.is_pro,
  };
}

function mapFriendship(row: FriendshipRow, currentUserId: string): Friendship {
  const requester = mapProfile(firstRelation(row.requester));
  const addressee = mapProfile(firstRelation(row.addressee));
  const direction = row.requester_id === currentUserId ? 'outgoing' : 'incoming';

  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    requester,
    addressee,
    otherProfile: direction === 'outgoing' ? addressee : requester,
    direction,
  };
}

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('You must be signed in.');
  }
  return data.user.id;
}

function normalizeSearchQuery(query: string) {
  return query
    .trim()
    .toLowerCase()
    .replace(/[%_,]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 60);
}

export async function searchProfiles(query: string) {
  const normalized = normalizeSearchQuery(query);
  if (normalized.length < 2) {
    return [];
  }

  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .or(`username.ilike.%${normalized}%,display_name.ilike.%${normalized}%`)
    .neq('id', userId)
    .limit(15);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProfileRow[])
    .map(mapProfile)
    .filter((profile): profile is ProfileSummary => Boolean(profile));
}

export async function getFriendships(userId: string) {
  const authUserId = await getAuthenticatedUserId();
  if (authUserId !== userId) {
    throw new Error('Friendship user must match the signed-in user.');
  }

  const { data, error } = await supabase
    .from('friendships')
    .select(
      `id, requester_id, addressee_id, status, created_at, updated_at,
      requester:profiles!friendships_requester_id_fkey(${PROFILE_COLUMNS}),
      addressee:profiles!friendships_addressee_id_fkey(${PROFILE_COLUMNS})`,
    )
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as FriendshipRow[]).map((row) => mapFriendship(row, userId));
}

export async function getIncomingRequests(userId: string) {
  return (await getFriendships(userId)).filter(
    (friendship): friendship is FriendRequest =>
      friendship.status === 'pending' && friendship.direction === 'incoming',
  );
}

export async function getOutgoingRequests(userId: string) {
  return (await getFriendships(userId)).filter(
    (friendship): friendship is FriendRequest =>
      friendship.status === 'pending' && friendship.direction === 'outgoing',
  );
}

export async function sendFriendRequest(addresseeId: string) {
  const requesterId = await getAuthenticatedUserId();
  if (requesterId === addresseeId) {
    throw new Error('You cannot friend yourself.');
  }

  const { error } = await supabase.from('friendships').insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: 'pending',
  });

  if (error) {
    throw error;
  }
}

export async function acceptFriendRequest(friendshipId: string) {
  await getAuthenticatedUserId();
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }
}

export async function declineFriendRequest(friendshipId: string) {
  await removeFriend(friendshipId);
}

export async function removeFriend(friendshipId: string) {
  await getAuthenticatedUserId();
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);

  if (error) {
    throw error;
  }
}

async function getProfile(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapProfile(data as ProfileRow | null);
}

export async function getFriendProfile(profileId: string): Promise<FriendProfile> {
  const userId = await getAuthenticatedUserId();
  const [profile, friendships, recentEntries, todayScore, streak] = await Promise.all([
    getProfile(profileId),
    getFriendships(userId),
    listRecentEntries(profileId, 12).catch(() => []),
    getDailyScore(profileId, new Date()).catch(() => null),
    getUserStreak(profileId).catch(() => null),
  ]);

  if (!profile) {
    throw new Error('Profile not found.');
  }

  const friendship =
    friendships.find(
      (item) => item.requesterId === profileId || item.addresseeId === profileId,
    ) ?? null;
  const todayEntries = await getEntriesForDate(profileId, new Date()).catch(() => []);
  const todaySummary = recomputeLocalDaySummary(todayEntries, undefined, undefined, todayScore);

  return {
    profile,
    friendship,
    todaySummary,
    streak,
    recentEntries,
    pillarProgress: todaySummary.pillarProgress,
  };
}

async function getReactionMap(entryIds: string[], userId: string) {
  if (entryIds.length === 0) {
    return new Map<string, { counts: Partial<Record<ReactionType, number>>; mine: ReactionType[] }>();
  }

  const { data, error } = await supabase
    .from('reactions')
    .select('entry_id, user_id, reaction_type')
    .in('entry_id', entryIds);

  if (error) {
    return new Map<string, { counts: Partial<Record<ReactionType, number>>; mine: ReactionType[] }>();
  }

  const map = new Map<string, { counts: Partial<Record<ReactionType, number>>; mine: ReactionType[] }>();
  for (const reaction of (data ?? []) as ReactionRow[]) {
    const current = map.get(reaction.entry_id) ?? { counts: {}, mine: [] };
    current.counts[reaction.reaction_type] = (current.counts[reaction.reaction_type] ?? 0) + 1;
    if (reaction.user_id === userId) {
      current.mine.push(reaction.reaction_type);
    }
    map.set(reaction.entry_id, current);
  }

  return map;
}

export async function getFriendFeed(): Promise<FriendFeedItem[]> {
  const userId = await getAuthenticatedUserId();
  const acceptedFriends = (await getFriendships(userId)).filter(
    (friendship) => friendship.status === 'accepted' && friendship.otherProfile,
  );
  const friendProfiles = new Map(
    acceptedFriends
      .map((friendship) => friendship.otherProfile)
      .filter((profile): profile is ProfileSummary => Boolean(profile))
      .map((profile) => [profile.id, profile]),
  );

  if (friendProfiles.size === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .in('user_id', [...friendProfiles.keys()])
    .neq('status', 'deleted')
    .order('occurred_at', { ascending: false })
    .limit(12);

  if (error) {
    return [];
  }

  const entries = await Promise.all(
    ((data ?? []) as Array<{ id: string }>).map((row) => getEntryWithScore(row.id).catch(() => null)),
  );
  const visibleEntries = entries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const reactions = await getReactionMap(visibleEntries.map((entry) => entry.id), userId);

  return visibleEntries
    .map((entry) => {
      const profile = friendProfiles.get(entry.userId);
      if (!profile) return null;
      const reactionState = reactions.get(entry.id) ?? { counts: {}, mine: [] };
      return {
        id: entry.id,
        profile,
        entry,
        reactionCounts: reactionState.counts,
        myReactions: reactionState.mine,
      };
    })
    .filter((item): item is FriendFeedItem => Boolean(item));
}

export async function reactToEntry(entryId: string, reactionType: ReactionType) {
  const userId = await getAuthenticatedUserId();
  const { error } = await supabase.from('reactions').insert({
    entry_id: entryId,
    user_id: userId,
    reaction_type: reactionType,
  });

  if (error && error.code !== '23505') {
    throw error;
  }
}

export async function removeReaction(entryId: string, reactionType: ReactionType) {
  const userId = await getAuthenticatedUserId();
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('entry_id', entryId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType);

  if (error) {
    throw error;
  }
}

export async function listFriendships(userId: string) {
  return getFriendships(userId);
}

export async function requestFriend(addresseeId: string) {
  return sendFriendRequest(addresseeId);
}

export async function respondToFriendship(id: string, status: 'accepted' | 'blocked') {
  if (status === 'accepted') {
    return acceptFriendRequest(id);
  }
  const { error } = await supabase.from('friendships').update({ status }).eq('id', id);
  if (error) {
    throw error;
  }
}

export async function listNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw error;
  }
}
