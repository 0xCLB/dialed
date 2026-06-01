import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { PILLARS } from '@/lib/constants';
import type { WellnessPillar } from '@/features/entries/types';

type PillarChipProps = {
  pillar: WellnessPillar;
  selected?: boolean;
  onPress?: () => void;
};

export function PillarChip({ pillar, selected, onPress }: PillarChipProps) {
  const config = PILLARS[pillar];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? config.color : config.softColor },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.dot, { backgroundColor: selected ? theme.colors.white : config.color }]} />
      <Text variant="caption" style={{ color: selected ? theme.colors.white : config.color }}>
        {config.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
