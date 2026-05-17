import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { PILLARS } from '@/lib/constants';
import type { WellnessPillar } from '@/types/domain';

export function PillarBadge({ pillar }: { pillar: WellnessPillar }) {
  const config = PILLARS[pillar];
  return (
    <View style={[styles.badge, { backgroundColor: config.softColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text variant="caption" style={{ color: config.color }}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 30,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
