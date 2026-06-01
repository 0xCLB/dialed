import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { track } from '@/lib/analytics';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

let handlersConfigured = false;

function permissionGranted(response: unknown) {
  const value = response as {
    granted?: boolean;
    status?: string;
    ios?: { status?: Notifications.IosAuthorizationStatus };
  };
  return value.granted === true || value.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

function routeFromData(data: Record<string, unknown>) {
  const route = typeof data.route === 'string' ? data.route : null;
  if (route) return route;

  const entryId = typeof data.entry_id === 'string' ? data.entry_id : null;
  const friendId = typeof data.friend_id === 'string' ? data.friend_id : null;
  const profileId = typeof data.profile_id === 'string' ? data.profile_id : null;
  const digestDate = typeof data.digest_date === 'string' ? data.digest_date : null;
  const scoreDate = typeof data.score_date === 'string' ? data.score_date : null;

  if (entryId) return `/entry/${entryId}`;
  if (friendId || profileId) return `/friends/${friendId ?? profileId}`;
  if (digestDate) return `/digest/${digestDate}`;
  if (scoreDate) return `/timeline/${scoreDate}`;
  if (data.notification_type === 'leaderboard') return '/(tabs)/leaderboard';
  if (data.notification_type === 'friend_request') return '/friends';

  return '/notifications';
}

export function configureNotificationHandlers() {
  if (handlersConfigured) return () => undefined;
  handlersConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse) {
    handleNotificationResponse(lastResponse);
    Notifications.clearLastNotificationResponse();
  }

  return () => subscription.remove();
}

export async function requestNotificationPermissions() {
  track('notification_permission_requested');

  const current = await Notifications.getPermissionsAsync();
  if (permissionGranted(current)) {
    track('notification_permission_granted', { existing: true });
    return { granted: true, status: (current as { status?: string }).status ?? 'granted' };
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  const granted = permissionGranted(requested);
  if (granted) {
    track('notification_permission_granted', { existing: false });
  }

  return { granted, status: (requested as { status?: string }).status ?? (granted ? 'granted' : 'denied') };
}

export async function getExpoPushToken() {
  if (!Device.isDevice || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
    return null;
  }

  const permission = await requestNotificationPermissions();
  if (!permission.granted) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync(
    env.easProjectId ? { projectId: env.easProjectId } : undefined,
  );
  return token.data;
}

export async function registerDeviceToken(userId: string) {
  const token = await getExpoPushToken();
  if (!token || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
    return null;
  }

  const { error } = await supabase.from('notification_devices').upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS,
      device_name: Device.deviceName ?? null,
      enabled: true,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' },
  );

  if (error) throw error;
  track('push_token_registered', { platform: Platform.OS });
  return token;
}

export async function unregisterDeviceToken(token: string) {
  const { error } = await supabase
    .from('notification_devices')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('expo_push_token', token);

  if (error) throw error;
}

export function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, unknown>;
  const route = routeFromData(data);
  track('notification_opened', {
    route,
    type: typeof data.notification_type === 'string' ? data.notification_type : 'unknown',
  });
  router.push(route as never);
}

export async function scheduleLocalReminder(
  title: string,
  body: string,
  seconds = 60 * 60,
  data: Record<string, unknown> = {},
) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
}

export async function registerForPushNotifications(userId: string) {
  return registerDeviceToken(userId);
}
