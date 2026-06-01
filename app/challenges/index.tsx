import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { addDays } from 'date-fns';
import { ArrowLeft, Plus } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LockedFeatureCard } from '@/components/monetization/LockedFeatureCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { usePro } from '@/features/monetization/usePro';
import { createChallenge, listChallenges } from '@/features/social/challenge-service';
import type { Challenge, WellnessPillar } from '@/types/domain';

type ChallengePillar = WellnessPillar | 'all';

export default function ChallengesScreen() {
  useRequireSession();
  const pro = usePro();
  const userId = useAuthStore((state) => state.session?.user.id);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [title, setTitle] = useState('');
  const [pillar, setPillar] = useState<ChallengePillar>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setChallenges(await listChallenges());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Challenges failed to load.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!userId || !title.trim()) {
      return;
    }
    setSaving(true);
    try {
      await createChallenge({
        ownerId: userId,
        title,
        pillar,
        entryGoal: 12,
        startsAt: new Date().toISOString(),
        endsAt: addDays(new Date(), 7).toISOString(),
      });
      setTitle('');
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Challenge failed to create.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <Text variant="title">Challenges</Text>
      </View>

      <Card style={styles.card}>
        <Text variant="subtitle">Create a 7 day challenge</Text>
        <TextInputField label="Challenge name" value={title} onChangeText={setTitle} />
        <SegmentedControl
          value={pillar}
          options={[
            { value: 'all', label: 'All' },
            { value: 'movement', label: 'Move' },
            { value: 'fuel', label: 'Fuel' },
            { value: 'mind', label: 'Mind' },
            { value: 'recovery', label: 'Recover' },
          ]}
          onChange={setPillar}
        />
        <Button loading={saving} disabled={!title.trim()} onPress={handleCreate}>
          <Plus size={18} color={theme.colors.white} /> Create
        </Button>
      </Card>

      {pro.isPro ? (
        <Card style={styles.card}>
          <Text variant="subtitle">Private challenge builder</Text>
          <Text muted>
            Pro private challenges are staged here. Next pass adds invites, rules, and custom scoring.
          </Text>
          <Button variant="secondary" disabled>
            Coming soon
          </Button>
        </Card>
      ) : (
        <LockedFeatureCard
          title="Custom/private challenges"
          body="Create tighter competitions for your crew. Public/basic challenges stay free."
          onPress={() => pro.openPaywall('private_challenge')}
        />
      )}

      {loading ? <LoadingState label="Loading challenges" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && challenges.length === 0 ? (
        <EmptyState title="No challenges yet" body="Create a private or public competition." />
      ) : null}
      {challenges.map((challenge) => (
        <Pressable key={challenge.id}>
          <Card style={styles.card}>
            <Text variant="subtitle">{challenge.title}</Text>
            <Text muted>{challenge.description ?? `${challenge.entryGoal} proofs by reset.`}</Text>
            <Text variant="caption" muted>
              {challenge.pillar} · {challenge.isPrivate ? 'private' : 'public'}
            </Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
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
  card: {
    gap: 12,
  },
});
