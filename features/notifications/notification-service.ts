import { supabase } from '@/lib/supabase';
import type { AppNotification } from '@/types/domain';

function mapNotification(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    actorId: row.actor_id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapNotification);
}

export async function readNotification(id: string) {
  const { error } = await supabase.rpc('mark_notification_read', { notification_id: id });
  if (error) {
    throw error;
  }
}
