import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { Camera, CheckCircle2 } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { PillarChip } from '@/components/entries/PillarChip';
import { PointsBadge } from '@/components/entries/PointsBadge';
import type { EntryWithScore, WellnessPillar } from '@/features/entries/types';

function fallbackPillar(entry: EntryWithScore): WellnessPillar {
  return entry.score?.wellnessPillar ?? entry.wellnessPillar ?? 'mind';
}

function entryTitle(entry: EntryWithScore) {
  return entry.activityTag
    ? entry.activityTag.replace(/[_-]+/g, ' ')
    : entry.entryType === 'photo'
      ? 'Photo proof'
      : 'Manual check-in';
}

export function EntryCard({ entry }: { entry: EntryWithScore }) {
  const photo = entry.media.find((item) => item.mediaKind === 'proof')?.signedUrl;
  const scored = Boolean(entry.score);

  return (
    <Pressable onPress={() => router.push(`/entry/${entry.id}`)}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <PillarChip pillar={fallbackPillar(entry)} />
          <Text variant="caption" muted>
            {formatDistanceToNow(new Date(entry.occurredAt), { addSuffix: true })}
          </Text>
        </View>

        {photo ? (
          <Image source={{ uri: photo }} style={styles.image} />
        ) : entry.entryType === 'photo' ? (
          <View style={styles.pendingImage}>
            <Camera size={24} color={theme.colors.primary} />
            <Text variant="caption" muted>
              Photo processing
            </Text>
          </View>
        ) : null}

        <View style={styles.copy}>
          <Text variant="subtitle" style={styles.title}>
            {entryTitle(entry)}
          </Text>
          {entry.caption ? (
            <Text muted numberOfLines={2}>
              {entry.caption}
            </Text>
          ) : null}
          {entry.score?.aiSubtext ? (
            <Text muted numberOfLines={2}>
              {entry.score.aiSubtext}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <PointsBadge points={entry.score?.points} pending={!scored} />
          <View style={styles.status}>
            <CheckCircle2
              size={15}
              color={scored ? theme.colors.success : theme.colors.warning}
            />
            <Text variant="caption" muted>
              {scored ? 'Scored' : 'Pending'}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  image: {
    width: '100%',
    aspectRatio: 1.35,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  pendingImage: {
    minHeight: 132,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primarySoft,
  },
  copy: {
    gap: 6,
  },
  title: {
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  status: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
