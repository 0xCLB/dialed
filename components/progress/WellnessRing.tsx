import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { PILLARS, PILLAR_ORDER } from '@/lib/constants';
import type { PillarProgress, WellnessPillar } from '@/features/progress/types';

const SIZE = 190;
const STROKE = 13;
const RADIUS = (SIZE - STROKE) / 2;

export function WellnessRing({
  progress,
  totalPoints,
  label = 'Dialed Points',
}: {
  progress: PillarProgress[];
  totalPoints: number;
  label?: string;
}) {
  const progressByPillar = new Map(progress.map((item) => [item.pillar, item]));

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        {PILLAR_ORDER.map((pillar: WellnessPillar, index) => {
          const radius = RADIUS - index * 17;
          const circumference = 2 * Math.PI * radius;
          const item = progressByPillar.get(pillar);
          const active = Boolean(item?.completed);
          const completion = active ? 0.94 : 0.08;

          return (
            <Circle
              key={pillar}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={radius}
              stroke={PILLARS[pillar].color}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference * completion} ${circumference}`}
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
              opacity={active ? 1 : 0.17}
            />
          );
        })}
      </Svg>
      <View style={styles.center}>
        <Text variant="metric">{totalPoints}</Text>
        <Text variant="caption" muted style={styles.centerText}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
