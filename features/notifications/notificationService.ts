import { buildNotificationCopy, calculateNotificationInterest } from '@/features/notifications/notificationCopy';
import type {
  InAppNotification,
  NotificationDeepLink,
  NotificationDevice,
  NotificationPreference,
  NotificationType,
  SmartNotificationCandidate,
} from '@/features/notifications/types';
import { env } from '@/lib/env';
import { scheduleLocalReminder } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  notification_type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

type PreferenceRow = {
  user_id: string;
  streak_reminders: boolean;
  social_updates: boolean;
  leaderboard_updates: boolean;
  digest_updates: boolean;
  marketing_updates: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  updated_at: string | null;
};

type DeviceRow = {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform: 'ios' | 'android';
  device_name: string | null;
  enabled: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

function normalizeNotificationType(value: string): NotificationType {
  if (
    value === 'friend_request' ||
    value === 'reaction' ||
    value === 'comment' ||
    value === 'leaderboard' ||
    value === 'challenge' ||
    value === 'digest' ||
    value === 'streak' ||
    value === 'friend_entry' ||
    value === 'system'
  ) {
    return value;
  }

  return 'system';
}

function serverNotificationType(type: NotificationType) {
  return type === 'friend_entry' ? 'system' : type;
}

function dateKey() {
  return new Date().toISOString().slice(0, 10);
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function buildDeepLinkForNotification(notification: Pick<InAppNotification, 'type' | 'data'>): NotificationDeepLink {
  const explicitRoute = stringValue(notification.data.route);
  if (explicitRoute) {
    return { route: explicitRoute as NotificationDeepLink['route'] };
  }

  const entryId = stringValue(notification.data.entry_id ?? notification.data.entryId);
  const profileId = stringValue(notification.data.profile_id ?? notification.data.profileId);
  const friendId = stringValue(notification.data.friend_id ?? notification.data.friendId);
  const digestDate = stringValue(notification.data.digest_date ?? notification.data.digestDate);
  const timelineDate = stringValue(notification.data.score_date ?? notification.data.date);

  if ((notification.type === 'reaction' || notification.type === 'comment' || notification.type === 'friend_entry') && entryId) {
    return { route: `/entry/${entryId}` };
  }

  if (notification.type === 'friend_request') {
    return { route: '/friends' };
  }

  if (notification.type === 'leaderboard') {
    return { route: '/(tabs)/leaderboard' };
  }

  if (notification.type === 'digest') {
    return { route: `/digest/${digestDate ?? dateKey()}` };
  }

  if (notification.type === 'streak') {
    return { route: `/timeline/${timelineDate ?? dateKey()}` };
  }

  if (profileId || friendId) {
    return { route: `/friends/${profileId ?? friendId}` };
  }

  return { route: '/notifications' };
}

function mapNotification(row: NotificationRow): InAppNotification {
  const type = normalizeNotificationType(row.notification_type);
  const data = row.data ?? {};
  return {
    id: row.id,
    userId: row.user_id,
    actorId: row.actor_id,
    type,
    title: row.title,
    body: row.body,
    data,
    readAt: row.read_at,
    createdAt: row.created_at,
    deepLink: buildDeepLinkForNotification({ type, data }),
  };
}

function mapPreference(row: PreferenceRow): NotificationPreference {
  return {
    userId: row.user_id,
    friendActivity: row.social_updates,
    leaderboardMovement: row.leaderboard_updates,
    streakRisk: row.streak_reminders,
    digestReady: row.digest_updates,
    challengeUpdates: row.social_updates,
    marketingUpdates: row.marketing_updates,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    updatedAt: row.updated_at,
  };
}

function defaultPreferences(userId: string): NotificationPreference {
  return {
    userId,
    friendActivity: true,
    leaderboardMovement: true,
    streakRisk: true,
    digestReady: true,
    challengeUpdates: true,
    marketingUpdates: false,
    quietHoursStart: null,
    quietHoursEnd: null,
  };
}

function mapDevice(row: DeviceRow): NotificationDevice {
  return {
    id: row.id,
    userId: row.user_id,
    expoPushToken: row.expo_push_token,
    platform: row.platform,
    deviceName: row.device_name,
    enabled: row.enabled,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getNotificationPreferences(userId: string) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPreference(data as PreferenceRow) : defaultPreferences(userId);
}

export async function upsertNotificationPreferences(input: NotificationPreference) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: input.userId,
        streak_reminders: input.streakRisk,
        social_updates: input.friendActivity || input.challengeUpdates,
        leaderboard_updates: input.leaderboardMovement,
        digest_updates: input.digestReady,
        marketing_updates: input.marketingUpdates,
        quiet_hours_start: input.quietHoursStart,
        quiet_hours_end: input.quietHoursEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();

  if (error) throw error;
  return mapPreference(data as PreferenceRow);
}

export async function getNotificationDevices(userId: string) {
  const { data, error } = await supabase
    .from('notification_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true)
    .order('last_seen_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as DeviceRow[]).map(mapDevice);
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) throw error;
  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
}

export async function createLocalNotificationRecord(input: {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const payload = {
    user_id: input.userId,
    actor_id: input.actorId ?? undefined,
    notification_type: serverNotificationType(input.type),
    title: input.title,
    body: input.body,
    data: {
      ...(input.data ?? {}),
      client_requested_type: input.type,
    },
  };

  const { data: functionData, error: functionError } = await supabase.functions.invoke('send-smart-notification', {
    body: payload,
  });

  if (!functionError && functionData) {
    return {
      notificationId: (functionData as { notification_id?: string }).notification_id ?? null,
      persisted: true,
      localOnly: false,
    };
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert(payload)
    .select('id')
    .single();

  if (!error) {
    return {
      notificationId: (data as { id: string }).id,
      persisted: true,
      localOnly: false,
    };
  }

  if (env.appEnv !== 'production') {
    await scheduleLocalReminder(input.title, input.body, 2, input.data);
    return {
      notificationId: null,
      persisted: false,
      localOnly: true,
      error: functionError?.message ?? error.message,
    };
  }

  throw functionError ?? error;
}

export async function createSmartNotificationCandidate(candidate: SmartNotificationCandidate) {
  const copy = buildNotificationCopy(candidate);
  const interestScore = calculateNotificationInterest(candidate);

  return createLocalNotificationRecord({
    userId: candidate.userId,
    actorId: candidate.actorId,
    type: candidate.type,
    title: copy.title,
    body: copy.body,
    data: {
      ...(candidate.metadata ?? {}),
      entry_id: candidate.entryId,
      friend_id: candidate.friendId,
      digest_date: candidate.date,
      score_date: candidate.date,
      activity_tag: candidate.activityTag,
      pillar: candidate.pillar,
      points: candidate.points,
      interest_score: interestScore,
    },
  });
}
