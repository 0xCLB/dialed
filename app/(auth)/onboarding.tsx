import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Bell } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { completeOnboarding } from '@/features/auth/auth-service';
import { registerDeviceToken } from '@/lib/notifications';

const privacyOptions = [
  { value: 'friends', label: 'Friends' },
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
] as const;

export default function OnboardingScreen() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [timezone, setTimezone] = useState(
    profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [privacyDefault, setPrivacyDefault] =
    useState<(typeof privacyOptions)[number]['value']>(profile?.privacyDefault ?? 'friends');
  const [loading, setLoading] = useState(false);
  const [enableSmartAlerts, setEnableSmartAlerts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => Boolean(displayName.trim() && username.trim()),
    [displayName, username],
  );

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  async function handleComplete() {
    if (!session) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await completeOnboarding({
        userId: session.user.id,
        displayName,
        username,
        city,
        timezone,
        privacyDefault,
      });
      if (enableSmartAlerts) {
        await registerDeviceToken(session.user.id).catch(() => undefined);
      }
      await refreshProfile();
      router.replace('/(tabs)/home');
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text variant="title">Set your health stack</Text>
      <Text muted>Create the profile row that powers phone auth, privacy, points, and social competition.</Text>
      <Card style={styles.form}>
        <TextInputField label="Display name" value={displayName} onChangeText={setDisplayName} />
        <TextInputField
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="dialed"
        />
        <TextInputField label="City" value={city} onChangeText={setCity} placeholder="Los Angeles" />
        <TextInputField label="Timezone" value={timezone} onChangeText={setTimezone} />
      </Card>
      <View style={styles.privacyGrid}>
        {privacyOptions.map((option) => {
          const active = option.value === privacyDefault;
          return (
            <Button
              key={option.value}
              variant={active ? 'primary' : 'secondary'}
              style={styles.privacyButton}
              onPress={() => setPrivacyDefault(option.value)}>
              <Text variant="caption" style={active && styles.privacyActiveText}>
                {option.label}
              </Text>
            </Button>
          );
        })}
      </View>
      <Card style={styles.alertCard}>
        <View style={styles.alertRow}>
          <Bell size={20} color={theme.colors.primary} />
          <View style={styles.alertCopy}>
            <Text variant="subtitle">Enable smart friend alerts</Text>
            <Text muted>
              Dialed will nudge you for friend heat, streak saves, leaderboard moves, and digest drops.
            </Text>
          </View>
        </View>
        <Button
          variant={enableSmartAlerts ? 'primary' : 'secondary'}
          onPress={() => setEnableSmartAlerts((value) => !value)}>
          {enableSmartAlerts ? 'Smart alerts on' : 'Enable smart alerts'}
        </Button>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button disabled={!canSubmit} loading={loading} onPress={handleComplete}>
        Enter Dialed Self
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  privacyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  privacyButton: {
    flex: 1,
  },
  privacyActiveText: {
    color: theme.colors.white,
  },
  error: {
    color: theme.colors.danger,
  },
  alertCard: {
    gap: 14,
  },
  alertRow: {
    flexDirection: 'row',
    gap: 12,
  },
  alertCopy: {
    flex: 1,
    gap: 4,
  },
});
