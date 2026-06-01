import { StyleSheet, View } from 'react-native';

import { PILLARS, PILLAR_ORDER } from '@/lib/constants';

export function MiniPillarBars({
  movement,
  fuel,
  mind,
  recovery,
}: {
  movement: number;
  fuel: number;
  mind: number;
  recovery: number;
}) {
  const values = { movement, fuel, mind, recovery };
  const max = Math.max(1, movement, fuel, mind, recovery);

  return (
    <View style={styles.wrap}>
      {PILLAR_ORDER.map((pillar) => (
        <View key={pillar} style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.max(8, (values[pillar] / max) * 100)}%`,
                backgroundColor: PILLARS[pillar].color,
                opacity: values[pillar] > 0 ? 1 : 0.18,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 3,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,20,20,0.08)',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
