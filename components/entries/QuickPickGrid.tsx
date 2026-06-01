import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { PILLARS } from '@/lib/constants';
import type { WellnessPillar } from '@/features/entries/types';

export type QuickPick = {
  key: string;
  label: string;
  activityTag: string;
  pillar: WellnessPillar;
};

export function QuickPickGrid({
  picks,
  selectedKey,
  onSelect,
}: {
  picks: QuickPick[];
  selectedKey: string | null;
  onSelect: (pick: QuickPick) => void;
}) {
  return (
    <View style={styles.grid}>
      {picks.map((pick) => {
        const selected = pick.key === selectedKey;
        const pillar = PILLARS[pick.pillar];
        return (
          <Pressable
            key={pick.key}
            accessibilityRole="button"
            onPress={() => onSelect(pick)}
            style={({ pressed }) => [
              styles.pick,
              { borderColor: selected ? pillar.color : theme.colors.border },
              selected && { backgroundColor: pillar.softColor },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.dot, { backgroundColor: pillar.color }]} />
            <Text variant="caption" numberOfLines={1}>
              {pick.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pick: {
    minHeight: 42,
    width: '48%',
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.68,
  },
});
