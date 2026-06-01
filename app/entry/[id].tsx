import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { PillarChip } from '@/components/entries/PillarChip';
import { PointsBadge } from '@/components/entries/PointsBadge';
import { LockedFeatureCard } from '@/components/monetization/LockedFeatureCard';
import { ReactionBar } from '@/components/social/ReactionBar';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { getEntryWithScore } from '@/features/entries/entryService';
import { usePro } from '@/features/monetization/usePro';
import { reactToEntry, removeReaction } from '@/features/social/socialService';
import { buildEntryShareData } from '@/features/sharing/shareDataService';
import { SharePreviewModal } from '@/components/sharing/SharePreviewModal';
import type { EntryWithScore, WellnessPillar } from '@/features/entries/types';
import type { ReactionType } from '@/features/social/types';
import type { ShareCardData } from '@/features/sharing/types';

export default function EntryDetailScreen() {
  useRequireSession();
  const pro = usePro();
  const params = useLocalSearchParams<{ id?: string }>();
  const [entry, setEntry] = useState<EntryWithScore | null>(null);
  const [activeReactions, setActiveReactions] = useState<ReactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareCardData | null>(null);
  const [shareVisible, setShareVisible] = useState(false);

  async function load() {
    if (!params.id) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setEntry(await getEntryWithScore(params.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Entry failed to load.');
    } finally {
      setLoading(false);
    }
  }

  function entryPillar(value: EntryWithScore): WellnessPillar {
    return value.score?.wellnessPillar ?? value.wellnessPillar ?? 'mind';
  }

  function entryTitle(value: EntryWithScore) {
    return value.activityTag?.replace(/[_-]+/g, ' ') ?? 'Dialed proof';
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function handleReaction(reaction: ReactionType, selected: boolean) {
    if (!entry) {
      return;
    }
    setActiveReactions((current) =>
      selected ? current.filter((item) => item !== reaction) : [...current, reaction],
    );
    try {
      if (selected) {
        await removeReaction(entry.id, reaction);
      } else {
        await reactToEntry(entry.id, reaction);
      }
    } catch {
      setActiveReactions((current) =>
        selected ? [...current, reaction] : current.filter((item) => item !== reaction),
      );
    }
  }

  async function handleShare() {
    if (!entry) return;
    setShareData(await buildEntryShareData(entry.id));
    setShareVisible(true);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <Text variant="subtitle">Proof detail</Text>
        <Button
          variant="secondary"
          style={styles.iconButton}
          onPress={handleShare}>
          <Share2 size={18} color={theme.colors.ink} />
        </Button>
      </View>

      {loading ? <LoadingState label="Loading proof" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {entry ? (
        <>
          <Card style={styles.card}>
            <PillarChip pillar={entryPillar(entry)} />
            {entry.media[0]?.signedUrl ? (
              <Image source={{ uri: entry.media[0].signedUrl }} style={styles.image} />
            ) : null}
            <Text variant="title" style={styles.title}>{entryTitle(entry)}</Text>
            {entry.caption ? <Text muted>{entry.caption}</Text> : null}
            {entry.score?.aiSubtext ? <Text>{entry.score.aiSubtext}</Text> : null}
            <View style={styles.scoreRow}>
              <PointsBadge points={entry.score?.points} pending={!entry.score} />
              <View style={styles.scoreCopy}>
                <Text variant="caption" muted>
                  Dialed Points
                </Text>
                <Text variant="caption" muted>
                  {entry.score
                    ? `${Math.round(entry.score.confidence * 100)}% confidence`
                    : 'Scoring pending'} · {entry.status}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text variant="subtitle">Score breakdown</Text>
            <Text muted>
              {entry.score?.scoringExplanation ?? 'Scoring is pending. Your proof is saved.'}
            </Text>
          </Card>

          {pro.isPro ? (
            <Card style={styles.card}>
              <Text variant="subtitle">Advanced AI explanation</Text>
              <Text muted>
                Pro scoring detail is staged here: proof quality, context, streak effect, and comparable actions.
              </Text>
            </Card>
          ) : (
            <LockedFeatureCard
              title="Advanced AI explanation"
              body="Pro will unpack proof quality, context, streak effects, and why this earned what it earned."
              onPress={() => pro.openPaywall('advanced_insights')}
            />
          )}

          <ReactionBar active={activeReactions} onToggle={handleReaction} />
        </>
      ) : null}
      <SharePreviewModal
        visible={shareVisible}
        data={shareData}
        isPro={pro.isPro}
        onClose={() => setShareVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  card: {
    gap: 12,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  title: {
    textTransform: 'capitalize',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreCopy: {
    flex: 1,
  },
});
