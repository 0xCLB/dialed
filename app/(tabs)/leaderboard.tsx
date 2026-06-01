import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { UsersRound } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { LockedFeatureCard } from '@/components/monetization/LockedFeatureCard';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { LeaderboardTabs } from '@/components/leaderboard/LeaderboardTabs';
import { ShareCTAButton } from '@/components/sharing/ShareCTAButton';
import { SharePreviewModal } from '@/components/sharing/SharePreviewModal';
import {
  getAllTimeFriendsLeaderboard,
  getDailyFriendsLeaderboard,
  getWeeklyFriendsLeaderboard,
} from '@/features/leaderboard/leaderboardService';
import type {
  LeaderboardRange,
  LeaderboardRow as LeaderboardRowType,
} from '@/features/leaderboard/types';
import { useAuth } from '@/features/auth/useAuth';
import { usePro } from '@/features/monetization/usePro';
import { buildLeaderboardShareData } from '@/features/sharing/shareDataService';
import type { ShareCardData } from '@/features/sharing/types';

export default function LeaderboardScreen() {
  const { session } = useAuth();
  const pro = usePro();
  const [range, setRange] = useState<LeaderboardRange>('daily');
  const [rows, setRows] = useState<LeaderboardRowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareCardData | null>(null);
  const [shareVisible, setShareVisible] = useState(false);

  const load = useCallback(async (asRefresh = false) => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }

    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const nextRows =
        range === 'daily'
          ? await getDailyFriendsLeaderboard(session.user.id)
          : range === 'weekly'
            ? await getWeeklyFriendsLeaderboard(session.user.id)
            : await getAllTimeFriendsLeaderboard(session.user.id);
      setRows(nextRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Leaderboard did not load.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range, session?.user.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleShareLeaderboard() {
    setShareData(await buildLeaderboardShareData(range));
    setShareVisible(true);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={() => load(true)}>
      <View style={styles.header}>
        <View>
          <Text variant="title">Leaderboard</Text>
          <Text muted>Friends first. Bragging rights optional, but encouraged.</Text>
        </View>
      </View>

      <LeaderboardTabs value={range} onChange={setRange} />

      {pro.isPro ? (
        <Card style={styles.scopeCard}>
          <Text variant="subtitle">Advanced filters</Text>
          <Text muted>Pillar, proof density, streak, and challenge filters are staged for Pro.</Text>
        </Card>
      ) : (
        <LockedFeatureCard
          title="Advanced leaderboard filters"
          body="Pro filters will let you slice the board by pillar, streak, and proof quality."
          onPress={() => pro.openPaywall('advanced_insights')}
        />
      )}

      <Card style={styles.scopeCard}>
        <View style={styles.scopeRow}>
          <View style={styles.scopeIcon}>
            <UsersRound size={21} color={theme.colors.primary} />
          </View>
          <View style={styles.scopeCopy}>
            <Text variant="subtitle">Friends</Text>
            <Text muted>
              {range === 'daily'
                ? 'Today’s race'
                : range === 'weekly'
                  ? 'This week, derived from daily scores'
                  : 'Recent all-time placeholder'}
            </Text>
          </View>
        </View>
      </Card>
      <ShareCTAButton label="Share rank" onPress={handleShareLeaderboard} />

      {loading ? <LoadingState label="Loading leaderboard" /> : null}
      {error ? <ErrorState message={error} onRetry={() => load()} /> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          title="Add friends to compete"
          body="Your friend leaderboard lights up after accepted friends score daily points."
          action="Find friends"
          onAction={() => router.push('/friends')}
        />
      ) : null}
      {!loading && !error
        ? rows.map((row) => (
            <LeaderboardRow
              key={row.userId}
              row={row}
              onPress={() => {
                if (!row.isCurrentUser) {
                  router.push(`/friends/${row.userId}`);
                }
              }}
            />
          ))
        : null}

      <Button variant="secondary" onPress={() => router.push('/friends')}>
        <UsersRound size={18} color={theme.colors.ink} />
        Friends screen
      </Button>
      <SharePreviewModal
        visible={shareVisible}
        data={shareData}
        onClose={() => setShareVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  scopeCard: {
    gap: 12,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scopeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  scopeCopy: {
    flex: 1,
    gap: 3,
  },
});
