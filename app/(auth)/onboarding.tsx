import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, Flame, ShieldCheck, Ticket } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { completeOnboarding } from '@/features/auth/auth-service';

const GOAL_OPTIONS = [
  'Move more',
  'Hydrate',
  'Eat cleaner',
  'Sleep better',
  'Focus',
  'Recover',
  'Build discipline',
];

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
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    if (step === 1) return goals.length === 3;
    if (step === 2) return Boolean(displayName.trim() && username.trim().length >= 3);
    return true;
  }, [displayName, goals.length, step, username]);

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  function toggleGoal(goal: string) {
    Haptics.selectionAsync();
    setGoals((current) => {
      if (current.includes(goal)) {
        return current.filter((item) => item !== goal);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, goal];
    });
  }

  function handleDisplayName(value: string) {
    setDisplayName(value);
    if (!username.trim()) {
      setUsername(usernameFromDisplayName(value));
    }
  }

  async function handleComplete() {
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
      router.replace('/first-proof');
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    if (step === 3) {
      handleComplete();
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
            Prove healthy actions. Earn points. Beat your friends.
          </Text>
          <Card style={styles.promiseCard}>
            <Text variant="subtitle">A daily status game for becoming your best self.</Text>
            <Text muted>Proof &gt; promises. Use your Daily Proofs wisely.</Text>
          </Card>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Text variant="title">Pick 3 goals</Text>
          <Text muted>We will make the first wins obvious. No homework pile.</Text>
          <View style={styles.goalGrid}>
            {GOAL_OPTIONS.map((goal) => {
              const selected = goals.includes(goal);
              return (
                <Button
                  key={goal}
                  variant={selected ? 'primary' : 'secondary'}
                  style={styles.goalButton}
                  onPress={() => toggleGoal(goal)}>
                  {selected ? <Check size={16} color={theme.colors.white} /> : null}
                  {goal}
                </Button>
              );
            })}
          </View>
          <Text variant="caption" muted>
            {goals.length}/3 selected
          </Text>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Text variant="title">Create your identity</Text>
          <Text muted>Your friends need a name to chase.</Text>
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
        </>
      ) : null}

      {step === 3 ? (
        <>
          <View style={styles.heroMark}>
            <Ticket size={30} color={theme.colors.white} />
          </View>
          <Text variant="title">Log your first proof</Text>
          <Text muted>
            Start with one easy check-in. One proof can move the day.
          </Text>
          <Card style={styles.promiseCard}>
            <View style={styles.promiseRow}>
              <ShieldCheck size={20} color={theme.colors.primary} />
              <Text muted style={styles.promiseCopy}>
                Free starts with 5 Daily Proofs. Pro adds more ways to prove the day, not a free win button.
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
        <Button disabled={!canContinue} loading={loading} onPress={nextStep} style={styles.nextButton}>
          {step === 3 ? 'Choose first proof' : 'Continue'}
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
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalButton: {
    minHeight: 48,
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
