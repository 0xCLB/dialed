import { supabase } from '@/lib/supabase';
import type { ReactionType } from '@/types/domain';

export async function searchProfiles(query: string) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .or(`username.ilike.%${normalized}%,display_name.ilike.%${normalized}%`)
    .limit(12);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listFriendships(userId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select(
      'id, requester_id, addressee_id, status, created_at, updated_at, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)',
    )
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function requestFriend(addresseeId: string, requesterId: string) {
  const { error } = await supabase.from('friendships').insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: 'pending',
  });

  if (error) {
    throw error;
  }
}

export async function respondToFriendship(id: string, status: 'accepted' | 'blocked') {
  const { error } = await supabase.from('friendships').update({ status }).eq('id', id);

  if (error) {
    throw error;
  }
}

export async function reactToEntry(entryId: string, userId: string, reaction: ReactionType) {
  const { error } = await supabase.from('entry_reactions').upsert(
    {
      entry_id: entryId,
      user_id: userId,
      reaction,
    },
    { onConflict: 'entry_id,user_id' },
  );

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
  const { error } = await supabase.rpc('mark_notification_read', { notification_id: id });
  if (error) {
    throw error;
  }
}
