import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { PILLARS } from '@/lib/constants';
import type { PillarProgress } from '@/features/progress/types';

export function PillarProgressCard({
  progress,
  suggestion,
}: {
  progress: PillarProgress;
  suggestion?: string;
}) {
  const config = PILLARS[progress.pillar];

  return (
    <View style={[styles.card, { backgroundColor: config.softColor }]}>
      <View style={styles.top}>
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        <Text variant="caption" style={{ color: config.color }}>
          {config.label}
        </Text>
      </View>
      <Text variant="title" style={{ color: config.color }}>
        {progress.points}
      </Text>
      <Text variant="caption" muted numberOfLines={2}>
        {progress.completed
          ? `${progress.entryCount} entr${progress.entryCount === 1 ? 'y' : 'ies'} logged`
          : suggestion ?? 'Open pillar'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47.8%',
    minHeight: 116,
    borderRadius: theme.radius.lg,
    padding: 12,
    justifyContent: 'space-between',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
