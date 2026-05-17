import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { completeOnboarding } from '@/features/auth/auth-service';
import { GOALS } from '@/lib/constants';
import type { GoalKey } from '@/types/domain';

export default function OnboardingScreen() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [selectedGoals, setSelectedGoals] = useState<GoalKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => Boolean(displayName.trim() && username.trim() && selectedGoals.length > 0),
    [displayName, selectedGoals.length, username],
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
        goals: selectedGoals,
      });
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  }

  function toggleGoal(goal: GoalKey) {
    setSelectedGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal],
    );
  }

  return (
    <Screen>
      <Text variant="title">Set your health stack</Text>
      <Text muted>Pick the goals that should shape your daily scoring and Pro insights.</Text>
      <Card style={styles.form}>
        <TextInputField label="Display name" value={displayName} onChangeText={setDisplayName} />
        <TextInputField
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="dialed"
        />
      </Card>
      <View style={styles.goals}>
        {GOALS.map((goal) => {
          const active = selectedGoals.includes(goal.key);
          return (
            <Pressable
              key={goal.key}
              onPress={() => toggleGoal(goal.key)}
              style={[styles.goal, active && styles.goalActive]}>
              <Text variant="caption" style={active && styles.goalActiveText}>
                {goal.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  goals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goal: {
    minHeight: 42,
    borderRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalActive: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  goalActiveText: {
    color: theme.colors.white,
  },
  error: {
    color: theme.colors.danger,
  },
});
