import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, RefreshCw, Share2, Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { DigestEmptyState } from '@/components/digest/DigestEmptyState';
import { DigestInsightRow } from '@/components/digest/DigestInsightRow';
import { DigestLoadingState } from '@/components/digest/DigestLoadingState';
import { DigestPillarSummary } from '@/components/digest/DigestPillarSummary';
import { DigestQuoteCard } from '@/components/digest/DigestQuoteCard';
import { DigestRecommendationCard } from '@/components/digest/DigestRecommendationCard';
import { LockedFeatureCard } from '@/components/monetization/LockedFeatureCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/StateViews';
import { MetricTile } from '@/components/ui/MetricTile';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { SharePreviewModal } from '@/components/sharing/SharePreviewModal';
import { useRequireSession } from '@/features/auth/useRequireSession';
import {
  generateDigestForDate,
  getDigestForDate,
} from '@/features/digest/digestService';
import type { DailyDigest } from '@/features/digest/types';
import { usePro } from '@/features/monetization/usePro';
import { buildDigestShareData } from '@/features/sharing/shareDataService';
import type { ShareCardData } from '@/features/sharing/types';
import { track } from '@/lib/analytics';

function readableDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function DigestDateScreen() {
  useRequireSession();
  const pro = usePro();
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareCardData | null>(null);
  const [shareVisible, setShareVisible] = useState(false);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const existing = await getDigestForDate(date);
      setDigest(existing);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Digest did not load.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useEffect(() => {
    track('digest_opened', { date });
    load();
  }, [date, load]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const generated = await generateDigestForDate(date);
      setDigest(generated);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (generateError) {
      const message =
        generateError instanceof Error ? generateError.message : 'Digest generation failed.';
      setError(message);
      track('digest_failed', { date, stage: 'screen', message });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGenerating(false);
    }
  }

  async function handleShare() {
    if (!digest) return;
    track('digest_shared', { date, source: digest.source });
    setShareData(await buildDigestShareData(date));
    setShareVisible(true);
  }

  const visibleInsights = digest?.insights.filter((insight) => insight.key !== 'share_quote') ?? [];

  return (
    <Screen refreshing={refreshing} onRefresh={() => load(true)}>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <View style={styles.title}>
          <Text variant="subtitle">Daily Digest</Text>
          <Text variant="caption" muted>
            {readableDate(date)}
          </Text>
        </View>
        <Button variant="secondary" style={styles.iconButton} onPress={() => load(true)}>
          <RefreshCw size={17} color={theme.colors.ink} />
        </Button>
      </View>

      {loading ? <DigestLoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={() => load()} /> : null}

      {!loading && !error && !digest ? (
        <DigestEmptyState loading={generating} onGenerate={handleGenerate} />
      ) : null}

      {!loading && !error && digest ? (
        <>
          <Card style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.sparkIcon}>
                <Sparkles size={20} color={theme.colors.white} />
              </View>
              <View style={styles.sourceBadge}>
                <Text variant="caption" style={styles.sourceText}>
                  {digest.source === 'edge' ? 'AI' : digest.source === 'stored' ? 'Saved' : 'Fallback'}
                </Text>
              </View>
            </View>
            <Text variant="hero">{digest.title}</Text>
            <Text muted>{digest.body}</Text>
            <View style={styles.metrics}>
              <MetricTile label="Dialed" value={`${digest.scoreSummary.scorePercent}%`} detail="today" />
              <MetricTile label="Points" value={digest.scoreSummary.totalPoints} detail="Dialed Points" />
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text variant="subtitle">Pillar analysis</Text>
              <Text variant="caption" muted>
                {digest.scoreSummary.completedPillars.length}/4 complete
              </Text>
            </View>
            <DigestPillarSummary summary={digest.scoreSummary} />
          </Card>

          <Card style={styles.card}>
            <Text variant="subtitle">Narrator notes</Text>
            {visibleInsights.slice(0, 6).map((insight) => (
              <DigestInsightRow key={insight.key} insight={insight} />
            ))}
          </Card>

          <DigestRecommendationCard digest={digest} />
          <DigestQuoteCard digest={digest} onShare={handleShare} />

          {pro.isPro ? (
            <Card style={styles.card}>
              <Text variant="subtitle">Weekly TwainGPT Digest</Text>
              <Text muted>
                Pro weekly recap generation is staged here. Daily digests stay free.
              </Text>
              <Button variant="secondary" disabled>
                Coming soon
              </Button>
            </Card>
          ) : (
            <LockedFeatureCard
              title="Weekly TwainGPT digest"
              body="Daily recap is free. The full weekly roast-and-coach report is Dialed Pro."
              onPress={() => pro.openPaywall('weekly_digest')}
            />
          )}

          <View style={styles.actions}>
            <Button loading={generating} variant="secondary" onPress={handleGenerate} style={styles.action}>
              <Sparkles size={18} color={theme.colors.ink} />
              Regenerate
            </Button>
            <Button onPress={handleShare} style={styles.action}>
              <Share2 size={18} color={theme.colors.white} />
              Share quote
            </Button>
          </View>
        </>
      ) : null}

      <SharePreviewModal
        visible={shareVisible}
        data={shareData}
        isPro={pro.isPro || digest?.scoreSummary.profile?.isPro}
        onClose={() => setShareVisible(false)}
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
  heroCard: {
    gap: 16,
    backgroundColor: theme.colors.surface,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sparkIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  sourceBadge: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  sourceText: {
    color: theme.colors.primaryDark,
    textTransform: 'uppercase',
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
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
  },
});
