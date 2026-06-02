import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Camera, HeartPulse, ListPlus, Trophy, UsersRound } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { DigestCard } from '@/components/digest/DigestCard';
import { EntryCard } from '@/components/entries/EntryCard';
import { DaySummaryCard } from '@/components/progress/DaySummaryCard';
import { FullyDialedBanner } from '@/components/progress/FullyDialedBanner';
import { PillarProgressCard } from '@/components/progress/PillarProgressCard';
import { StreakCard } from '@/components/progress/StreakCard';
import { DailyProofCard } from '@/components/proofs/DailyProofCard';
import { EarnMoreProofsCard } from '@/components/proofs/EarnMoreProofsCard';
import { ProofBalancePill } from '@/components/proofs/ProofBalancePill';
import { ProProofUpgradeCard } from '@/components/proofs/ProProofUpgradeCard';
import { FriendFeedCard } from '@/components/social/FriendFeedCard';
import { ShareCTAButton } from '@/components/sharing/ShareCTAButton';
import { SharePreviewModal } from '@/components/sharing/SharePreviewModal';
import { ProfileHeader } from '@/features/auth/ProfileHeader';
import { useAuth } from '@/features/auth/useAuth';
import { generateDigestForDate, getDigestForDate } from '@/features/digest/digestService';
import type { DailyDigest } from '@/features/digest/types';
import { getTodayEntries } from '@/features/entries/entryService';
import type { EntryWithScore } from '@/features/entries/types';
import { getTodayHealthSummary } from '@/features/health/healthService';
import type { HealthTodaySummary } from '@/features/health/types';
import { usePro } from '@/features/monetization/usePro';
import {
  getTodayScore,
  getUserStreak,
  recomputeLocalDaySummary,
} from '@/features/progress/progressService';
import type { DailyScore, DaySummary, Streak, WellnessPillar } from '@/features/progress/types';
import {
  earnBonusProof,
  getTodayProofWallet,
  nextDateKey,
} from '@/features/proofs/proofService';
import type { ProofWallet } from '@/features/proofs/types';
import {
  getFriendFeed,
  reactToEntry,
  removeReaction,
} from '@/features/social/socialService';
import type { FriendFeedItem, ReactionType } from '@/features/social/types';
import {
  buildDailyScoreShareData,
  buildDigestShareData,
  buildFullyDialedShareData,
} from '@/features/sharing/shareDataService';
import type { ShareCardData } from '@/features/sharing/types';
import { track } from '@/lib/analytics';

const SUGGESTIONS: Record<WellnessPillar, string> = {
  movement: 'Movement is quiet. A 10-minute walk counts.',
  fuel: 'Fuel is untouched. Water counts.',
  mind: 'Mind is untouched. Read for 10 minutes.',
  recovery: 'Your Recovery pillar is ghosting. Stretch for 8 points.',
};

export default function HomeScreen() {
  const { session, profile } = useAuth();
  const pro = usePro();
  const [entries, setEntries] = useState<EntryWithScore[]>([]);
  const [friendFeed, setFriendFeed] = useState<FriendFeedItem[]>([]);
  const [dailyScore, setDailyScore] = useState<DailyScore | null>(null);
  const [proofWallet, setProofWallet] = useState<ProofWallet | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthTodaySummary | null>(null);
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);
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
      const [todayEntries, todayScore, userStreak, todayHealthSummary, wallet] = await Promise.all([
        getTodayEntries(session.user.id),
        getTodayScore(session.user.id),
        getUserStreak(session.user.id),
        getTodayHealthSummary(session.user.id).catch(() => null),
        getTodayProofWallet(session.user.id, {
          isPro: Boolean(pro.isPro || profile?.isPro),
        }).catch(() => null),
      ]);
      setEntries(todayEntries);
      setDailyScore(todayScore);
      setProofWallet(wallet);
      setStreak(userStreak);
      setHealthSummary(todayHealthSummary);
      setDigestError(null);
      if (todayEntries.length > 0) {
        getDigestForDate(new Date()).then(setDigest).catch(() => setDigest(null));
      } else {
        setDigest(null);
      }
      getFriendFeed().then((items) => setFriendFeed(items.slice(0, 3))).catch(() => setFriendFeed([]));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'My Day could not load.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.isPro, pro.isPro, session?.user.id]);

  useEffect(() => {
    load();
  }, [load]);

  const summary: DaySummary = useMemo(
    () => recomputeLocalDaySummary(entries, undefined, undefined, dailyScore),
    [dailyScore, entries],
  );
  const missingPillars = summary.pillarProgress.filter((pillar) => !pillar.completed);
  const nextBestAction =
    missingPillars.length > 0
      ? SUGGESTIONS[missingPillars[0].pillar]
      : 'Fully Dialed Day still possible tomorrow. Protect the streak.';
  const competitionCopy =
    friendFeed.length > 0
      ? `${friendFeed[0].profile.displayName} is already on the board.`
      : 'One proof can move you up.';

  useEffect(() => {
    if (!session?.user.id || loading) {
      return;
    }

    const tomorrow = nextDateKey();
    if (summary.fullyDialed) {
      earnBonusProof('fully_dialed_tomorrow', {
        proofDate: tomorrow,
        metadata: { source: 'home', completed_pillars: 4 },
      }).catch(() => null);
    }
    if ((streak?.currentStreak ?? 0) >= 3) {
      earnBonusProof('three_day_streak_tomorrow', {
        proofDate: tomorrow,
        metadata: { source: 'home', current_streak: streak?.currentStreak ?? 0 },
      }).catch(() => null);
    }
  }, [loading, session?.user.id, streak?.currentStreak, summary.fullyDialed]);

  async function refreshProofWallet() {
    if (!session?.user.id) return;
    const wallet = await getTodayProofWallet(session.user.id, {
      isPro: Boolean(pro.isPro || profile?.isPro),
    }).catch(() => null);
    setProofWallet(wallet);
  }

  async function handleFriendReaction(entryId: string, reaction: ReactionType, selected: boolean) {
    setFriendFeed((items) =>
      items.map((item) => {
        if (item.entry.id !== entryId) return item;
        const myReactions = selected
          ? item.myReactions.filter((value) => value !== reaction)
          : [...item.myReactions, reaction];
        return { ...item, myReactions };
      }),
    );

    try {
      if (selected) {
        await removeReaction(entryId, reaction);
      } else {
        await reactToEntry(entryId, reaction);
      }
    } catch {
      setFriendFeed((items) =>
        items.map((item) => {
          if (item.entry.id !== entryId) return item;
          const myReactions = selected
            ? [...item.myReactions, reaction]
            : item.myReactions.filter((value) => value !== reaction);
          return { ...item, myReactions };
        }),
      );
    }
  }

  async function handleShareDay() {
    const data = summary.fullyDialed
      ? await buildFullyDialedShareData(new Date())
      : await buildDailyScoreShareData(new Date());
    setShareData(data);
    setShareVisible(true);
  }

  async function handleShareDigest() {
    track('digest_shared', { date: new Date().toISOString().slice(0, 10), source: digest?.source ?? 'unknown' });
    setShareData(await buildDigestShareData(new Date()));
    setShareVisible(true);
  }

  async function handleGenerateDigest() {
    setDigestLoading(true);
    setDigestError(null);
    try {
      const generated = await generateDigestForDate(new Date());
      setDigest(generated);
      router.push(`/digest/${generated.digestDate}`);
    } catch (generateError) {
      const message =
        generateError instanceof Error ? generateError.message : 'Digest generation failed.';
      setDigestError(message);
    } finally {
      setDigestLoading(false);
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={() => load(true)}>
      <ProfileHeader profile={profile} onNotifications={() => router.push('/notifications')} />

      <View style={styles.header}>
        <View>
          <Text variant="hero">Today</Text>
          <Text muted>
            {summary.fullyDialed ? 'Fully Dialed. Beautiful.' : 'Stack proof across four pillars.'}
          </Text>
        </View>
        <ProofBalancePill wallet={proofWallet} loading={loading} />
      </View>

      {loading ? <LoadingState label="Loading progress" /> : null}
      {error ? <ErrorState message={error} onRetry={() => load()} /> : null}

      {!loading && !error ? (
        <>
          <FullyDialedBanner visible={summary.fullyDialed} />
          <DaySummaryCard summary={summary} title="Today's Dialed Score" />
          <DailyProofCard
            wallet={proofWallet}
            loading={loading}
            onEarnMore={handleShareDay}
            onUpgrade={() => pro.openPaywall('settings')}
          />
          {proofWallet?.remainingProofs === 0 || proofWallet?.setupRequired ? (
            <>
              <EarnMoreProofsCard onShare={handleShareDay} onInvite={() => router.push('/friends')} />
              {!pro.isPro && !profile?.isPro ? (
                <ProProofUpgradeCard onPress={() => pro.openPaywall('settings')} />
              ) : null}
            </>
          ) : null}
          <Card style={styles.nextActionCard}>
            <View style={styles.nextActionRow}>
              <View style={styles.nextActionCopy}>
                <Text variant="subtitle">Next best action</Text>
                <Text muted>{nextBestAction}</Text>
              </View>
              <Text variant="caption" style={styles.nextActionBadge}>
                Proof &gt; promises
              </Text>
            </View>
            <Text variant="caption" muted>
              {competitionCopy} Use your Proofs wisely.
            </Text>
          </Card>
          <ShareCTAButton
            label={summary.fullyDialed ? 'Share Fully Dialed Day' : 'Share today'}
            onPress={handleShareDay}
          />
          <StreakCard streak={streak} />

          {healthSummary?.sampleCount ? (
            <Card style={styles.healthCard}>
              <View style={styles.healthHeader}>
                <View style={styles.healthIcon}>
                  <HeartPulse size={20} color={theme.colors.white} />
                </View>
                <View style={styles.healthCopy}>
                  <Text variant="subtitle">Verified Health</Text>
                  <Text variant="caption" muted>
                    {healthSummary.sampleCount} private signal{healthSummary.sampleCount === 1 ? '' : 's'} synced today
                  </Text>
                </View>
                <Text variant="subtitle" style={styles.healthPoints}>
                  +{healthSummary.totalPoints} DP
                </Text>
              </View>
              <View style={styles.healthBreakdown}>
                <Text variant="caption" muted>
                  Movement {healthSummary.movementPoints}
                </Text>
                <Text variant="caption" muted>
                  Mind {healthSummary.mindPoints}
                </Text>
                <Text variant="caption" muted>
                  Recovery {healthSummary.recoveryPoints}
                </Text>
              </View>
              <Button variant="secondary" onPress={() => router.push('/settings/health')}>
                Manage Health
              </Button>
            </Card>
          ) : null}

          {entries.length > 0 ? (
            <>
              <DigestCard
                digest={digest}
                loading={digestLoading}
                onGenerate={handleGenerateDigest}
                onOpen={() => router.push(`/digest/${digest?.digestDate ?? new Date().toISOString().slice(0, 10)}`)}
              />
              {digestError ? (
                <Text variant="caption" style={styles.digestError}>
                  {digestError}
                </Text>
              ) : null}
            </>
          ) : null}

          <View style={styles.pillarGrid}>
            {summary.pillarProgress.map((progress) => (
              <PillarProgressCard
                key={progress.pillar}
                progress={progress}
                suggestion={SUGGESTIONS[progress.pillar]}
              />
            ))}
          </View>

          {missingPillars.length > 0 ? (
            <Card style={styles.suggestions}>
              <Text variant="subtitle">Next easy win</Text>
              {missingPillars.slice(0, 2).map((progress) => (
                <Text key={progress.pillar} muted>
                  {SUGGESTIONS[progress.pillar]}
                </Text>
              ))}
            </Card>
          ) : null}

          <Card style={styles.actions}>
            <Button onPress={() => router.push('/(tabs)/capture')}>
              <Camera size={18} color={theme.colors.white} />
              Capture proof
            </Button>
            <Button variant="secondary" onPress={() => router.push('/(tabs)/check-in')}>
              <ListPlus size={18} color={theme.colors.ink} />
              Manual check-in
            </Button>
            <ShareCTAButton label="Share digest quote" onPress={handleShareDigest} />
          </Card>

          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Friends Getting Dialed</Text>
            <View style={styles.socialActions}>
              <Button variant="secondary" style={styles.iconButton} onPress={() => router.push('/friends')}>
                <UsersRound size={17} color={theme.colors.ink} />
              </Button>
              <Button
                variant="secondary"
                style={styles.iconButton}
                onPress={() => router.push('/(tabs)/leaderboard')}>
                <Trophy size={17} color={theme.colors.ink} />
              </Button>
            </View>
          </View>

          {friendFeed.length === 0 ? (
            <Card style={styles.suggestions}>
              <Text variant="subtitle">No friend proof yet</Text>
              <Text muted>Add friends to see what they are stacking today.</Text>
            </Card>
          ) : (
            friendFeed.map((item) => (
              <FriendFeedCard key={item.id} item={item} onReaction={handleFriendReaction} />
            ))
          )}

          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Today&apos;s Entries</Text>
            <Text variant="caption" muted>
              {summary.source === 'daily_score' ? 'Synced' : 'Derived'}
            </Text>
          </View>

          {entries.length === 0 ? (
            <Card style={styles.empty}>
              <Text variant="subtitle">Your score is waiting.</Text>
              <Text muted style={styles.emptyText}>
                Log one proof and light up your first pillar. Fully Dialed Day is still possible.
              </Text>
              <View style={styles.emptyActions}>
                <Button onPress={() => router.push('/first-proof')} style={styles.emptyButton}>
                  <ListPlus size={18} color={theme.colors.white} />
                  Log First Proof
                </Button>
                <Button
                  variant="secondary"
                  onPress={() => router.push('/(tabs)/capture')}
                  style={styles.emptyButton}>
                  <Camera size={18} color={theme.colors.ink} />
                  Photo
                </Button>
              </View>
            </Card>
          ) : (
            entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
          )}
        </>
      ) : null}
      <SharePreviewModal
        visible={shareVisible}
        data={shareData}
        isPro={pro.isPro || profile?.isPro}
        onClose={() => {
          setShareVisible(false);
          refreshProofWallet();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  socialActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 42,
    minHeight: 42,
    paddingHorizontal: 0,
  },
  pillarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestions: {
    gap: 8,
  },
  actions: {
    gap: 10,
  },
  nextActionCard: {
    gap: 10,
  },
  nextActionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  nextActionCopy: {
    flex: 1,
    gap: 4,
  },
  nextActionBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: 9,
    paddingVertical: 6,
    overflow: 'hidden',
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primarySoft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
  },
  emptyActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  emptyButton: {
    flex: 1,
  },
  digestError: {
    color: theme.colors.danger,
  },
  healthCard: {
    gap: 12,
  },
  healthHeader: {
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
    gap: 2,
  },
  healthPoints: {
    color: theme.colors.primary,
  },
  healthBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
