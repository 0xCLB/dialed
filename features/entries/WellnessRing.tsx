import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { PILLARS, PILLAR_ORDER } from '@/lib/constants';
import type { WellnessPillar } from '@/types/domain';

const SIZE = 172;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function WellnessRing({
  completed,
  score,
}: {
  completed: Set<WellnessPillar>;
  score: number;
}) {
  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        {PILLAR_ORDER.map((pillar, index) => {
          const progress = completed.has(pillar) ? 0.94 : 0.08;
          return (
            <Circle
              key={pillar}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS - index * 16}
              stroke={PILLARS[pillar].color}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`}
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
              opacity={completed.has(pillar) ? 1 : 0.18}
            />
          );
        })}
      </Svg>
      <View style={styles.center}>
        <Text variant="metric">{score}</Text>
        <Text variant="caption" muted>
          Dialed Points
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
