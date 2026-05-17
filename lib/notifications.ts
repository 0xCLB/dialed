import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function permissionGranted(response: unknown) {
  const value = response as { granted?: boolean; status?: string };
  return value.granted === true || value.status === 'granted';
}

export async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice) {
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  const finalGranted = permissionGranted(existing)
    ? true
    : permissionGranted(await Notifications.requestPermissionsAsync());

  if (!finalGranted) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync(
    env.easProjectId ? { projectId: env.easProjectId } : undefined,
  );

  await supabase.from('device_push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token.data,
      platform: Platform.OS,
      device_name: Device.deviceName ?? null,
    },
    { onConflict: 'user_id,expo_push_token' },
  );

  return token.data;
}

export async function scheduleLocalReminder(title: string, body: string, seconds = 60 * 60) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
}
