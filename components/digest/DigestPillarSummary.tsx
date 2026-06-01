import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { PILLARS, PILLAR_ORDER } from '@/lib/constants';
import type { DigestInputSummary } from '@/features/digest/types';

export function DigestPillarSummary({ summary }: { summary: DigestInputSummary }) {
  const progressByPillar = new Map(summary.pillarProgress.map((item) => [item.pillar, item]));
  const maxPoints = Math.max(1, ...summary.pillarProgress.map((item) => item.points));

  return (
    <View style={styles.wrap}>
      {PILLAR_ORDER.map((pillar) => {
        const progress = progressByPillar.get(pillar);
        const points = progress?.points ?? 0;
        const width = `${Math.max(8, (points / maxPoints) * 100)}%` as const;

        return (
          <View key={pillar} style={styles.row}>
            <View style={styles.labelRow}>
              <Text variant="caption">{PILLARS[pillar].label}</Text>
              <Text variant="caption" muted>
                {points} DP
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.bar, { width, backgroundColor: PILLARS[pillar].color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 11,
  },
  row: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  track: {
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,20,20,0.08)',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
});
