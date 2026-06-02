import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Bell, Film, HeartPulse, Settings, Utensils, Watch } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EntryCard } from '@/components/entries/EntryCard';
import { MetricTile } from '@/components/ui/MetricTile';
import { ProBadge } from '@/components/monetization/ProBadge';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { MiniCalendarStrip } from '@/components/progress/MiniCalendarStrip';
import { PillarProgressCard } from '@/components/progress/PillarProgressCard';
import { StreakCard } from '@/components/progress/StreakCard';
import { ReelPreviewModal } from '@/components/reels/ReelPreviewModal';
import { ShareCTAButton } from '@/components/sharing/ShareCTAButton';
import { SharePreviewModal } from '@/components/sharing/SharePreviewModal';
import { useAuth } from '@/features/auth/useAuth';
import { listRecentEntries } from '@/features/entries/entryService';
import type { EntryWithScore } from '@/features/entries/types';
import { getConnectedProviders, getTodayHealthSummary } from '@/features/health/healthService';
import type { HealthProviderConnection, HealthTodaySummary } from '@/features/health/types';
import { usePro } from '@/features/monetization/usePro';
import {
  getRecentDailyScores,
  getUserStreak,
} from '@/features/progress/progressService';
import type { DailyScore, PillarProgress, Streak } from '@/features/progress/types';
import { buildDailyReelData } from '@/features/reels/reelDataService';
import type { ReelData } from '@/features/reels/types';
import { buildStreakShareData } from '@/features/sharing/shareDataService';
import type { ShareCardData } from '@/features/sharing/types';
import { track } from '@/lib/analytics';
import { PILLAR_ORDER } from '@/lib/constants';

export default function ProfileScreen() {
  const { session, profile, signOut } = useAuth();
  const pro = usePro();
  const [signingOut, setSigningOut] = useState(false);
  const [entries, setEntries] = useState<EntryWithScore[]>([]);
  const [scores, setScores] = useState<DailyScore[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthTodaySummary | null>(null);
  const [healthConnections, setHealthConnections] = useState<HealthProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareCardData | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const [reelData, setReelData] = useState<ReelData | null>(null);
  const [reelVisible, setReelVisible] = useState(false);
  const [reelLoadingDate, setReelLoadingDate] = useState<string | null>(null);
  const [reelError, setReelError] = useState<string | null>(null);

  const loadProfileStats = useCallback(async () => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [recentEntries, recentScores, userStreak, todayHealthSummary, connectedProviders] = await Promise.all([
        listRecentEntries(session.user.id, 10),
        getRecentDailyScores(session.user.id, 30),
        getUserStreak(session.user.id),
        getTodayHealthSummary(session.user.id).catch(() => null),
        getConnectedProviders(session.user.id).catch(() => []),
      ]);
      setEntries(recentEntries);
      setScores(recentScores);
      setStreak(userStreak);
      setHealthSummary(todayHealthSummary);
      setHealthConnections(connectedProviders);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Profile progress did not load.');
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    loadProfileStats();
  }, [loadProfileStats]);

  const totalPoints = useMemo(
    () => scores.reduce((total, score) => total + score.totalPoints, 0),
    [scores],
  );
  const fullyDialedDays = useMemo(
    () => scores.filter((score) => score.completedPillars === 4 || score.allPillarsCompleted).length,
    [scores],
  );
  const pillarBalance: PillarProgress[] = useMemo(
    () =>
      PILLAR_ORDER.map((pillar) => {
        const points = scores.reduce((total, score) => {
          if (pillar === 'movement') return total + score.movementPoints;
          if (pillar === 'fuel') return total + score.fuelPoints;
          if (pillar === 'mind') return total + score.mindPoints;
          return total + score.recoveryPoints;
        }, 0);

        return {
          pillar,
          points,
          completed: points > 0,
          pendingCount: 0,
          entryCount: scores.filter((score) => {
            if (pillar === 'movement') return score.movementPoints > 0;
            if (pillar === 'fuel') return score.fuelPoints > 0;
            if (pillar === 'mind') return score.mindPoints > 0;
            return score.recoveryPoints > 0;
          }).length,
        };
      }),
    [scores],
  );
  const reelDays = useMemo(() => {
    const byDate = new Map<string, { date: string; points: number; entries: number }>();

    for (const score of scores) {
      byDate.set(score.scoreDate, {
        date: score.scoreDate,
        points: score.totalPoints,
        entries: score.totalPoints > 0 ? 1 : 0,
      });
    }

    for (const entry of entries) {
      const date = entry.occurredAt.slice(0, 10);
      const existing = byDate.get(date);
      byDate.set(date, {
        date,
        points: existing?.points ?? 0,
        entries: (existing?.entries ?? 0) + 1,
      });
    }

    return [...byDate.values()]
      .filter((day) => day.entries > 0 || day.points > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);
  }, [entries, scores]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  async function handleShareStreak() {
    setShareData(await buildStreakShareData());
    setShareVisible(true);
  }

  async function handleOpenReel(date: string) {
    setReelLoadingDate(date);
    setReelError(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = await buildDailyReelData(date);
      setReelData(data);
      setReelVisible(true);
    } catch (reelBuildError) {
      const message =
        reelBuildError instanceof Error ? reelBuildError.message : 'The reel could not be generated.';
      setReelError(message);
      track('reel_failed', { date, message });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setReelLoadingDate(null);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text variant="title" style={styles.avatarText}>
            {(profile?.displayName ?? profile?.username ?? 'D').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.identity}>
          <Text variant="title">{profile?.displayName ?? 'Dialed athlete'}</Text>
          <View style={styles.usernameRow}>
            <Text muted>@{profile?.username ?? 'username'}</Text>
            {pro.isPro || profile?.isPro ? <ProBadge compact /> : null}
          </View>
        </View>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.push('/notifications')}>
          <Bell size={18} color={theme.colors.ink} />
        </Button>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.push('/settings')}>
          <Settings size={18} color={theme.colors.ink} />
        </Button>
      </View>

      {loading ? <LoadingState label="Loading profile progress" /> : null}
      {error ? <ErrorState message={error} onRetry={loadProfileStats} /> : null}

      {!loading && !error ? (
        <>
          <StreakCard streak={streak} />
          <ShareCTAButton label="Share streak" onPress={handleShareStreak} />

          <View style={styles.metrics}>
            <MetricTile label="Total DP" value={String(totalPoints)} detail="recent scores" />
            <MetricTile label="Fully Dialed" value={String(fullyDialedDays)} detail="days" />
          </View>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.proStatusCopy}>
                <Text variant="subtitle">Dialed Pro</Text>
                <Text muted>
                  {pro.isPro || profile?.isPro
                    ? 'Active. Premium gates are open.'
                    : 'Unlock premium insights, templates, reels, and advanced competition tools.'}
                </Text>
              </View>
              {pro.isPro || profile?.isPro ? <ProBadge /> : null}
            </View>
            <View style={styles.proActions}>
              <Button style={styles.proButton} onPress={() => pro.openPaywall('profile')}>
                {pro.isPro || profile?.isPro ? 'Manage Pro' : 'Go Pro'}
              </Button>
              <Button
                variant="secondary"
                loading={pro.loading}
                style={styles.proButton}
                onPress={() => pro.restore()}>
                Restore
              </Button>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.healthRow}>
              <View style={styles.healthIcon}>
                <HeartPulse size={19} color={theme.colors.white} />
              </View>
              <View style={styles.healthCopy}>
                <Text variant="subtitle">Health Contribution</Text>
                <Text muted>
                  {healthSummary?.sampleCount
                    ? `${healthSummary.sampleCount} private signals today, ${healthSummary.totalPoints} preview DP.`
                    : 'Apple Health and wearables can feed private proof here.'}
                </Text>
              </View>
            </View>
            <Button variant="secondary" onPress={() => router.push('/settings/health')}>
              Manage health sources
            </Button>
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text variant="subtitle">Connected data sources</Text>
              <Text variant="caption" muted>
                verified inputs
              </Text>
            </View>
            <View style={styles.sourceRow}>
              <HeartPulse size={18} color={theme.colors.primary} />
              <View style={styles.sourceCopy}>
                <Text>Apple Health</Text>
                <Text variant="caption" muted>
                  {healthConnections.find((item) => item.provider === 'apple_health')?.available
                    ? healthSummary?.sampleCount
                      ? 'Synced today'
                      : 'Available'
                    : 'Needs iPhone development build'}
                </Text>
              </View>
            </View>
            <View style={styles.sourceRow}>
              <Utensils size={18} color={theme.colors.primary} />
              <View style={styles.sourceCopy}>
                <Text>Food Proof</Text>
                <Text variant="caption" muted>
                  Photo macro estimates via server analysis when deployed.
                </Text>
              </View>
            </View>
            <View style={styles.sourceRow}>
              <Watch size={18} color={theme.colors.primary} />
              <View style={styles.sourceCopy}>
                <Text>Wearables</Text>
                <Text variant="caption" muted>
                  Fitbit, Oura, Garmin, WHOOP, and Strava are coming soon.
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text variant="subtitle">Recent 7 Days</Text>
              <Text variant="caption" muted>
                tap a day
              </Text>
            </View>
            <MiniCalendarStrip
              scores={scores.slice(0, 7)}
              onSelectDate={(date) => router.push(`/timeline/${date}`)}
            />
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text variant="subtitle">Reels From My Day</Text>
              <Text variant="caption" muted>
                recent proofs
              </Text>
            </View>
            {reelDays.length === 0 ? (
              <Text muted>Your first proof day becomes a reel here.</Text>
            ) : (
              reelDays.map((day) => (
                <View key={day.date} style={styles.reelRow}>
                  <View style={styles.reelCopy}>
                    <Text variant="subtitle">{day.date}</Text>
                    <Text variant="caption" muted>
                      {day.points} DP - {day.entries} proof{day.entries === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <Button
                    variant="secondary"
                    loading={reelLoadingDate === day.date}
                    style={styles.reelButton}
                    onPress={() => handleOpenReel(day.date)}>
                    <Film size={17} color={theme.colors.primary} />
                    Reel
                  </Button>
                </View>
              ))
            )}
            <View style={styles.reelRow}>
              <View style={styles.reelCopy}>
                <Text variant="subtitle">Weekly reel</Text>
                <Text variant="caption" muted>
                  Seven days, one flex.
                </Text>
              </View>
              <Button variant="secondary" disabled style={styles.reelButton}>
                Soon
              </Button>
            </View>
            {reelError ? (
              <Text variant="caption" style={styles.reelError}>
                {reelError}
              </Text>
            ) : null}
          </Card>

          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Pillar Balance</Text>
            <Text variant="caption" muted>
              30-day view
            </Text>
          </View>
          <View style={styles.pillarGrid}>
            {pillarBalance.map((progress) => (
              <PillarProgressCard key={progress.pillar} progress={progress} />
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Recent Entries</Text>
            <Text variant="caption" muted>
              Latest 10
            </Text>
          </View>
          {entries.length === 0 ? (
            <Card style={styles.card}>
              <Text variant="subtitle">Build your first Dialed Day.</Text>
              <Text muted>Your first proof will land here and start the story.</Text>
              <Button onPress={() => router.push('/first-proof')}>
                Log first proof
              </Button>
            </Card>
          ) : (
            entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
          )}
        </>
      ) : null}

      <Card style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <Settings size={20} color={theme.colors.primary} />
          <View style={styles.settingsCopy}>
            <Text variant="subtitle">Account</Text>
            <Text muted>Privacy default: {profile?.privacyDefault ?? 'friends'}</Text>
          </View>
        </View>
        <Button variant="secondary" loading={signingOut} onPress={handleSignOut}>
          Sign out
        </Button>
      </Card>
      <SharePreviewModal
        visible={shareVisible}
        data={shareData}
        isPro={pro.isPro || profile?.isPro}
        onClose={() => setShareVisible(false)}
      />
      <ReelPreviewModal
        visible={reelVisible}
        data={reelData}
        isPro={pro.isPro || profile?.isPro}
        onClose={() => setReelVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.ink,
  },
  avatarText: {
    color: theme.colors.white,
  },
  identity: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 42,
    minHeight: 42,
    paddingHorizontal: 0,
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  proStatusCopy: {
    flex: 1,
    gap: 4,
  },
  proActions: {
    flexDirection: 'row',
    gap: 10,
  },
  proButton: {
    flex: 1,
  },
  pillarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  settingsCard: {
    gap: 14,
  },
  settingsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  settingsCopy: {
    flex: 1,
    gap: 4,
  },
  reelRow: {
    minHeight: 62,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceAlt,
  },
  reelCopy: {
    flex: 1,
    gap: 3,
  },
  reelButton: {
    minHeight: 42,
    paddingHorizontal: 12,
  },
  reelError: {
    color: theme.colors.danger,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  healthCopy: {
    flex: 1,
    gap: 3,
  },
  sourceRow: {
    minHeight: 56,
    borderRadius: theme.radius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.background,
  },
  sourceCopy: {
    flex: 1,
    gap: 2,
  },
});
