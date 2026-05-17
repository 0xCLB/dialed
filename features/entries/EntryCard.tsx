import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Trophy } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { PillarBadge } from '@/components/ui/PillarBadge';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { Entry } from '@/types/domain';

export function EntryCard({ entry }: { entry: Entry }) {
  return (
    <Pressable onPress={() => router.push(`/entry/${entry.id}`)}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <PillarBadge pillar={entry.pillar} />
          <Text variant="caption" muted>
            {formatDistanceToNow(new Date(entry.occurredAt), { addSuffix: true })}
          </Text>
        </View>
        {entry.proofUrl ? <Image source={{ uri: entry.proofUrl }} style={styles.image} /> : null}
        <View style={styles.copy}>
          <Text variant="subtitle">{entry.title}</Text>
          {entry.caption ? (
            <Text muted numberOfLines={2}>
              {entry.caption}
            </Text>
          ) : null}
          {entry.aiSummary ? (
            <Text muted numberOfLines={2}>
              {entry.aiSummary}
            </Text>
          ) : null}
        </View>
        <View style={styles.footer}>
          <View style={styles.points}>
            <Trophy size={16} color={theme.colors.accent} />
            <Text variant="caption">{entry.score} DP</Text>
          </View>
          <View style={styles.points}>
            <MessageCircle size={16} color={theme.colors.muted} />
            <Text variant="caption" muted>
              React
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
    gap: 10,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 1.45,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  copy: {
    gap: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  points: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
