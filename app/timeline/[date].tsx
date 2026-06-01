import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Film, Share2, Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { EntryCard } from '@/components/entries/EntryCard';
import { DaySummaryCard } from '@/components/progress/DaySummaryCard';
import { FullyDialedBanner } from '@/components/progress/FullyDialedBanner';
import { ReelPreviewModal } from '@/components/reels/ReelPreviewModal';
import { SharePreviewModal } from '@/components/sharing/SharePreviewModal';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { getEntriesForDate } from '@/features/entries/entryService';
import type { EntryWithScore } from '@/features/entries/types';
import { usePro } from '@/features/monetization/usePro';
import { getDailyScore, recomputeLocalDaySummary } from '@/features/progress/progressService';
import type { DailyScore } from '@/features/progress/types';
import { buildDailyReelData } from '@/features/reels/reelDataService';
import type { ReelData } from '@/features/reels/types';
import { buildDailyScoreShareData, buildFullyDialedShareData } from '@/features/sharing/shareDataService';
import type { ShareCardData } from '@/features/sharing/types';
import { track } from '@/lib/analytics';

function readableDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function TimelineDateScreen() {
  const { session } = useRequireSession();
  const pro = usePro();
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const [entries, setEntries] = useState<EntryWithScore[]>([]);
  const [dailyScore, setDailyScore] = useState<DailyScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareCardData | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const [reelData, setReelData] = useState<ReelData | null>(null);
  const [reelVisible, setReelVisible] = useState(false);
  const [reelLoading, setReelLoading] = useState(false);
  const [reelError, setReelError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [dayEntries, dayScore] = await Promise.all([
        getEntriesForDate(session.user.id, date),
        getDailyScore(session.user.id, date),
      ]);
      setEntries(dayEntries);
      setDailyScore(dayScore);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Timeline failed to load.');
    } finally {
      setLoading(false);
    }
  }, [date, session?.user.id]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(
    () => recomputeLocalDaySummary(entries, undefined, date, dailyScore),
    [dailyScore, date, entries],
  );

  async function handleShareDay() {
    const data = summary.fullyDialed
      ? await buildFullyDialedShareData(date)
      : await buildDailyScoreShareData(date);
    setShareData(data);
    setShareVisible(true);
  }

  async function handleGenerateReel() {
    setReelLoading(true);
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
      setReelLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <View style={styles.title}>
          <Text variant="subtitle">Day Timeline</Text>
          <Text variant="caption" muted>
            {readableDate(date)}
          </Text>
        </View>
      </View>

      {loading ? <LoadingState label="Loading timeline" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <>
          <FullyDialedBanner visible={summary.fullyDialed} />
          <DaySummaryCard summary={summary} title={readableDate(date)} />

          <Card style={styles.shareCard}>
            <View style={styles.shareRow}>
              <Film size={20} color={theme.colors.primary} />
              <View style={styles.shareCopy}>
                <Text variant="subtitle">Day recap</Text>
                <Text muted>{summary.totalPoints} points, {summary.completedPillars.length}/4 pillars</Text>
              </View>
            </View>
            <View style={styles.shareActions}>
              <Button loading={reelLoading} onPress={handleGenerateReel} style={styles.shareAction}>
                <Film size={18} color={theme.colors.white} />
                Generate Reel
              </Button>
              <Button variant="secondary" onPress={handleShareDay} style={styles.shareAction}>
                <Share2 size={18} color={theme.colors.ink} />
                Story Card
              </Button>
            </View>
            <Button variant="secondary" onPress={() => router.push(`/digest/${date}`)}>
              <Sparkles size={18} color={theme.colors.primary} />
              Open TwainGPT Digest
            </Button>
            {reelError ? (
              <Text variant="caption" style={styles.reelError}>
                {reelError}
              </Text>
            ) : null}
          </Card>

          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Entries</Text>
            <Text variant="caption" muted>
              {summary.entryCount} total
            </Text>
          </View>

          {entries.length === 0 ? (
            <EmptyState title="Nothing logged" body="No proofs were found for this date." />
          ) : (
            entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
          )}
        </>
      ) : null}
      <SharePreviewModal
        visible={shareVisible}
        data={shareData}
        isPro={pro.isPro}
        onClose={() => setShareVisible(false)}
      />
      <ReelPreviewModal
        visible={reelVisible}
        data={reelData}
        isPro={pro.isPro || reelData?.profile?.isPro}
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
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  title: {
    flex: 1,
  },
  shareCard: {
    gap: 14,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shareCopy: {
    flex: 1,
    gap: 4,
  },
  shareActions: {
    flexDirection: 'row',
    gap: 10,
  },
  shareAction: {
    flex: 1,
  },
  reelError: {
    color: theme.colors.danger,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
