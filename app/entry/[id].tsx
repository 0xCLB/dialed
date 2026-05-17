import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PillarBadge } from '@/components/ui/PillarBadge';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { getEntry } from '@/features/entries/entry-service';
import { reactToEntry } from '@/features/social/social-service';
import { ShareCard } from '@/features/sharing/ShareCard';
import { captureShareCard, shareUri, uploadShareAsset } from '@/features/sharing/share-service';
import type { Entry, ReactionType } from '@/types/domain';

const REACTIONS: Array<{ type: ReactionType; label: string }> = [
  { type: 'fire', label: 'Fire' },
  { type: 'strong', label: 'Strong' },
  { type: 'clean', label: 'Clean' },
  { type: 'locked', label: 'Locked' },
];

export default function EntryDetailScreen() {
  const { session } = useRequireSession();
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = useAuthStore((state) => state.session?.user.id);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<View>(null);

  async function load() {
    if (!params.id) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setEntry(await getEntry(params.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Entry failed to load.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function handleReaction(reaction: ReactionType) {
    if (!userId || !entry) {
      return;
    }
    await reactToEntry(entry.id, userId, reaction);
  }

  async function handleShare() {
    if (!entry || !session) {
      return;
    }
    setSharing(true);
    try {
      const uri = await captureShareCard(shareRef);
      await uploadShareAsset(session.user.id, uri, 'proof');
      await shareUri(uri);
    } finally {
      setSharing(false);
    }
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
          loading={sharing}
          onPress={handleShare}>
          <Share2 size={18} color={theme.colors.ink} />
        </Button>
      </View>

      {loading ? <LoadingState label="Loading proof" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {entry ? (
        <>
          <Card style={styles.card}>
            <PillarBadge pillar={entry.pillar} />
            {entry.proofUrl ? <Image source={{ uri: entry.proofUrl }} style={styles.image} /> : null}
            <Text variant="title">{entry.title}</Text>
            {entry.caption ? <Text muted>{entry.caption}</Text> : null}
            {entry.aiSummary ? <Text>{entry.aiSummary}</Text> : null}
            <View style={styles.scoreRow}>
              <Text variant="metric">{entry.score}</Text>
              <View style={styles.scoreCopy}>
                <Text variant="caption" muted>
                  Dialed Points
                </Text>
                <Text variant="caption" muted>
                  {Math.round(entry.confidence * 100)}% confidence · {entry.status}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text variant="subtitle">Score breakdown</Text>
            {(entry.scoreBreakdown?.reasons ?? ['Server-scored proof.']).map((reason) => (
              <Text key={reason} muted>
                {reason}
              </Text>
            ))}
          </Card>

          <View style={styles.reactions}>
            {REACTIONS.map((reaction) => (
              <Pressable
                key={reaction.type}
                onPress={() => handleReaction(reaction.type)}
                style={styles.reaction}>
                <Text variant="caption">{reaction.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sharePreview}>
            <ShareCard ref={shareRef} entry={entry} />
          </View>
        </>
      ) : null}
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
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreCopy: {
    flex: 1,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reaction: {
    minHeight: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  sharePreview: {
    alignItems: 'center',
  },
});
