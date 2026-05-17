import { useEffect, useMemo, useState } from 'react';
import { Link, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Bell, CalendarDays, Flame, Users } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { MetricTile } from '@/components/ui/MetricTile';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { ProfileHeader } from '@/features/auth/ProfileHeader';
import { useAuthStore } from '@/features/auth/auth-store';
import { EntryCard } from '@/features/entries/EntryCard';
import { WellnessRing } from '@/features/entries/WellnessRing';
import { summarizeEntries } from '@/features/entries/entry-service';
import { useEntries } from '@/features/entries/useEntries';
import { HealthSyncCard } from '@/features/health/HealthSyncCard';
import { getLatestHealthSnapshot } from '@/features/health/health-service';
import type { HealthMetricSnapshot } from '@/types/domain';

export default function TodayScreen() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const { entries, loading, refreshing, error, refresh, reload } = useEntries(20);
  const [snapshot, setSnapshot] = useState<HealthMetricSnapshot | null>(null);
  const summary = useMemo(() => summarizeEntries(entries), [entries]);
  const latestEntries = entries.slice(0, 5);

  useEffect(() => {
    if (!session) {
      return;
    }
    getLatestHealthSnapshot(session.user.id).then(setSnapshot).catch(() => undefined);
  }, [session]);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.topRow}>
        <ProfileHeader profile={profile} />
        <View style={styles.iconRow}>
          <Link href="/friends" asChild>
            <Button variant="secondary" style={styles.iconButton}>
              <Users size={18} color={theme.colors.ink} />
            </Button>
          </Link>
          <Link href="/notifications" asChild>
            <Button variant="secondary" style={styles.iconButton}>
              <Bell size={18} color={theme.colors.ink} />
            </Button>
          </Link>
        </View>
      </View>

      <Card style={styles.hero}>
        <WellnessRing completed={summary.completedPillars} score={summary.score} />
        <View style={styles.heroCopy}>
          <Text variant="title">Complete the four pillars</Text>
          <Text muted>
            Movement, Fuel, Mind, and Recovery proofs fill your ring and drive leaderboard rank.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button onPress={() => router.push('/(tabs)/capture')} style={styles.actionButton}>
            Capture proof
          </Button>
          <Button
            variant="secondary"
            onPress={() => router.push('/(tabs)/check-in')}
            style={styles.actionButton}>
            Manual check-in
          </Button>
        </View>
      </Card>

      <View style={styles.metrics}>
        <MetricTile label="Proofs" value={summary.entries} detail="logged today" />
        <MetricTile label="Scored" value={summary.scoredEntries} detail="validated" />
      </View>

      {session ? (
        <HealthSyncCard userId={session.user.id} snapshot={snapshot} onSynced={setSnapshot} />
      ) : null}

      <View style={styles.sectionHeader}>
        <Text variant="subtitle">Today feed</Text>
        <Link href={`/timeline/${new Date().toISOString().slice(0, 10)}`} asChild>
          <Button variant="ghost" style={styles.smallButton}>
            <CalendarDays size={18} color={theme.colors.ink} />
          </Button>
        </Link>
      </View>

      {loading ? <LoadingState label="Loading proofs" /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && latestEntries.length === 0 ? (
        <EmptyState
          title="No proofs yet"
          body="Capture a real-world wellness action to start your ring."
          action="Capture proof"
          onAction={() => router.push('/(tabs)/capture')}
        />
      ) : null}
      {latestEntries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}

      <Card style={styles.streak}>
        <Flame size={22} color={theme.colors.danger} />
        <View style={styles.streakCopy}>
          <Text variant="subtitle">Streak protection</Text>
          <Text muted>Log at least one scored proof before midnight to keep today alive.</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  hero: {
    gap: 16,
  },
  heroCopy: {
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakCopy: {
    flex: 1,
  },
});
