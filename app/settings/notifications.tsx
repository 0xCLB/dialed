import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, FlaskConical } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { useRequireSession } from '@/features/auth/useRequireSession';
import {
  createLocalNotificationRecord,
  getNotificationDevices,
  getNotificationPreferences,
  upsertNotificationPreferences,
} from '@/features/notifications/notificationService';
import type { NotificationPreference } from '@/features/notifications/types';
import { track } from '@/lib/analytics';
import { env } from '@/lib/env';
import { registerDeviceToken } from '@/lib/notifications';

function emptyPreference(userId: string): NotificationPreference {
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

export default function NotificationSettingsScreen() {
  const { session } = useRequireSession();
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [deviceCount, setDeviceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDev = env.appEnv !== 'production';

  const load = useCallback(async () => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextPreferences, devices] = await Promise.all([
        getNotificationPreferences(session.user.id),
        getNotificationDevices(session.user.id).catch(() => []),
      ]);
      setPreferences(nextPreferences);
      setDeviceCount(devices.length);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Notification settings did not load.');
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    load();
  }, [load]);

  function patchPreferences(patch: Partial<NotificationPreference>) {
    setPreferences((current) => ({ ...(current ?? emptyPreference(session?.user.id ?? '')), ...patch }));
  }

  async function handleEnableDevice() {
    if (!session?.user.id) return;
    setRegistering(true);
    setError(null);
    try {
      const token = await registerDeviceToken(session.user.id);
      if (token) {
        setDeviceCount((count) => Math.max(1, count));
      }
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Could not register device.');
    } finally {
      setRegistering(false);
    }
  }

  async function handleSave() {
    if (!preferences) return;
    setSaving(true);
    setError(null);
    try {
      setPreferences(await upsertNotificationPreferences(preferences));
      track('notification_preferences_updated');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Preferences did not save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestNotification() {
    if (!session?.user.id) return;
    setTesting(true);
    setError(null);
    try {
      await createLocalNotificationRecord({
        userId: session.user.id,
        type: 'digest',
        title: 'Daily Recap',
        body: 'Your day has been judged. Fairly. Mostly.',
        data: {
          notification_type: 'digest',
          digest_date: new Date().toISOString().slice(0, 10),
        },
      });
      track('test_notification_sent');
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Test notification failed.');
    } finally {
      setTesting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <View style={styles.headerCopy}>
          <Text variant="title">Smart Alerts</Text>
          <Text variant="caption" muted>
            Friend heat, streak saves, and recap drops.
          </Text>
        </View>
      </View>

      {loading ? <LoadingState label="Loading notification settings" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error && preferences ? (
        <>
          <Card style={styles.card}>
            <View style={styles.deviceRow}>
              <View style={styles.deviceIcon}>
                <Bell size={20} color={theme.colors.white} />
              </View>
              <View style={styles.deviceCopy}>
                <Text variant="subtitle">Push device</Text>
                <Text muted>
                  {deviceCount > 0 ? `${deviceCount} device registered` : 'No push device registered yet'}
                </Text>
              </View>
            </View>
            <Button loading={registering} onPress={handleEnableDevice}>
              Enable smart friend alerts
            </Button>
          </Card>

          <Card style={styles.card}>
            <Text variant="subtitle">Preferences</Text>
            <ToggleRow
              label="Friend activity"
              detail="Friend proof, reactions, and requests."
              value={preferences.friendActivity}
              onValueChange={(value) => patchPreferences({ friendActivity: value })}
            />
            <ToggleRow
              label="Leaderboard movement"
              detail="Rank changes and close-score nudges."
              value={preferences.leaderboardMovement}
              onValueChange={(value) => patchPreferences({ leaderboardMovement: value })}
            />
            <ToggleRow
              label="Streak risk"
              detail="Late-day streak and pillar saves."
              value={preferences.streakRisk}
              onValueChange={(value) => patchPreferences({ streakRisk: value })}
            />
            <ToggleRow
              label="Recap ready"
              detail="Daily Recap moments."
              value={preferences.digestReady}
              onValueChange={(value) => patchPreferences({ digestReady: value })}
            />
            <ToggleRow
              label="Challenge updates"
              detail="Challenge notifications share the social update switch in v1."
              value={preferences.challengeUpdates}
              onValueChange={(value) => patchPreferences({ challengeUpdates: value })}
            />
            <ToggleRow
              label="Marketing/off"
              detail="Product announcements. Off by default."
              value={preferences.marketingUpdates}
              onValueChange={(value) => patchPreferences({ marketingUpdates: value })}
            />
          </Card>

          <Card style={styles.card}>
            <Text variant="subtitle">Quiet hours</Text>
            <Text muted>Placeholder for the server scheduler. Use 24-hour times.</Text>
            <View style={styles.quietRow}>
              <View style={styles.quietField}>
                <TextInputField
                  label="Start"
                  value={preferences.quietHoursStart ?? ''}
                  onChangeText={(value) => patchPreferences({ quietHoursStart: value || null })}
                  placeholder="22:00"
                />
              </View>
              <View style={styles.quietField}>
                <TextInputField
                  label="End"
                  value={preferences.quietHoursEnd ?? ''}
                  onChangeText={(value) => patchPreferences({ quietHoursEnd: value || null })}
                  placeholder="07:00"
                />
              </View>
            </View>
            <Button loading={saving} onPress={handleSave}>
              Save preferences
            </Button>
          </Card>

          {isDev ? (
            <Card style={styles.card}>
              <View style={styles.deviceRow}>
                <FlaskConical size={20} color={theme.colors.primary} />
                <View style={styles.deviceCopy}>
                  <Text variant="subtitle">Dev test</Text>
                  <Text muted>Creates a server notification if possible, otherwise schedules local.</Text>
                </View>
              </View>
              <Button variant="secondary" loading={testing} onPress={handleTestNotification}>
                Send test notification
              </Button>
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

function ToggleRow({
  label,
  detail,
  value,
  onValueChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onValueChange(!value)}>
      <View style={styles.toggleCopy}>
        <Text>{label}</Text>
        <Text variant="caption" muted>
          {detail}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.colors.primarySoft, false: theme.colors.surfaceAlt }}
        thumbColor={value ? theme.colors.primary : theme.colors.faint}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  headerCopy: {
    flex: 1,
  },
  card: {
    gap: 14,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  deviceCopy: {
    flex: 1,
    gap: 3,
  },
  toggleRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleCopy: {
    flex: 1,
    gap: 3,
  },
  quietRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quietField: {
    flex: 1,
  },
});
