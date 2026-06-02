import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Camera, Flame, ShieldCheck, Sparkles, Trophy } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { completeOnboarding } from '@/features/auth/auth-service';

function usernameFromDisplayName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

export default function OnboardingScreen() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const emailHandle = session?.user.email?.split('@')[0] ?? '';
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? emailHandle);
  const [username, setUsername] = useState(profile?.username ?? usernameFromDisplayName(emailHandle));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    if (step === 3) return Boolean(displayName.trim() && username.trim().length >= 3);
    return true;
  }, [displayName, step, username]);

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  function handleDisplayName(value: string) {
    setDisplayName(value);
    if (!username.trim()) {
      setUsername(usernameFromDisplayName(value));
    }
  }

  async function handleComplete(destination: 'first-proof' | 'pro' = 'first-proof') {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      await completeOnboarding({
        userId: session.user.id,
        displayName,
        username,
        city: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        privacyDefault: 'friends',
      });
      await refreshProfile();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (destination === 'pro') {
        router.replace('/paywall?placement=profile');
      } else {
        router.replace('/first-proof');
      }
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    if (step === 3) {
      handleComplete('first-proof');
      return;
    }
    Haptics.selectionAsync();
    setStep((value) => Math.min(value + 1, 3));
  }

  return (
    <Screen>
      <View style={styles.progressRow}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={[styles.progressDot, item <= step && styles.progressDotActive]} />
        ))}
      </View>

      {step === 0 ? (
        <>
          <View style={styles.heroMark}>
            <Flame size={30} color={theme.colors.white} />
          </View>
          <Text variant="hero">How Dialed are you today?</Text>
          <Text muted>
            Prove your day. Get your Dialed Score. Beat your friends.
          </Text>
          <Card style={styles.promiseCard}>
            <Text variant="subtitle">A daily status game for becoming your best self.</Text>
            <Text muted>Proof &gt; promises. Use your Daily Proofs wisely.</Text>
          </Card>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <View style={styles.heroMark}>
            <Camera size={30} color={theme.colors.white} />
          </View>
          <Text variant="title">Use Daily Proofs to prove healthy actions.</Text>
          <Text muted>Photos, places, and health data beat promises. Manual Notes are context, not ranked proof.</Text>
          <Card style={styles.promiseCard}>
            <Text variant="subtitle">Photo. Location. Health. Hybrid.</Text>
            <Text muted>Verified inputs move your score and friend leaderboard.</Text>
          </Card>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <View style={styles.heroMark}>
            <Trophy size={30} color={theme.colors.white} />
          </View>
          <Text variant="title">Complete Movement, Fuel, Mind, Recovery.</Text>
          <Text muted>Earn Dialed Points, light up pillars, and spend Daily Proofs wisely.</Text>
          <Card style={styles.promiseCard}>
            <Text variant="subtitle">Four pillars. One daily score.</Text>
            <Text muted>Fully Dialed Days become share-worthy status moments.</Text>
          </Card>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <View style={styles.heroMark}>
            <Sparkles size={30} color={theme.colors.white} />
          </View>
          <Text variant="title">Beat friends and share proof.</Text>
          <Text muted>
            Build your best self where your friends can see it.
          </Text>
          <Card style={styles.form}>
            <TextInputField
              label="Display name"
              value={displayName}
              onChangeText={handleDisplayName}
              placeholder="David"
              autoCapitalize="words"
            />
            <TextInputField
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="dialed"
            />
          </Card>
          <Card style={styles.promiseCard}>
            <View style={styles.promiseRow}>
              <ShieldCheck size={20} color={theme.colors.primary} />
              <Text muted style={styles.promiseCopy}>
                Optional: Pro unlocks more Daily Proofs, advanced food analysis, Health insights, premium shares, and deeper recaps.
              </Text>
            </View>
          </Card>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <Button variant="secondary" disabled={loading} onPress={() => setStep((value) => value - 1)}>
            Back
          </Button>
        ) : null}
        {step === 3 ? (
          <Button
            variant="secondary"
            disabled={!canContinue || loading}
            onPress={() => handleComplete('pro')}>
            See Pro
          </Button>
        ) : null}
        <Button disabled={!canContinue} loading={loading} onPress={nextStep} style={styles.nextButton}>
          {step === 3 ? 'Start Free' : 'Continue'}
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  heroMark: {
    width: 62,
    height: 62,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  promiseCard: {
    gap: 10,
  },
  promiseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  promiseCopy: {
    flex: 1,
  },
  form: {
    gap: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  nextButton: {
    flex: 1,
  },
  error: {
    color: theme.colors.danger,
  },
});
