import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { ReactionType } from '@/features/social/types';

const REACTIONS: Array<{ type: ReactionType; label: string }> = [
  { type: 'fire', label: 'Fire' },
  { type: 'dialed', label: 'Dialed' },
  { type: 'respect', label: 'Respect' },
  { type: 'water', label: 'Water' },
  { type: 'check', label: 'Check' },
  { type: 'slippin', label: 'Slippin' },
];

export function ReactionBar({
  counts = {},
  active = [],
  onToggle,
}: {
  counts?: Partial<Record<ReactionType, number>>;
  active?: ReactionType[];
  onToggle: (reaction: ReactionType, selected: boolean) => void;
}) {
  return (
    <View style={styles.wrap}>
      {REACTIONS.map((reaction) => {
        const selected = active.includes(reaction.type);
        const count = counts[reaction.type] ?? 0;
        return (
          <Pressable
            key={reaction.type}
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              onToggle(reaction.type, selected);
            }}
            style={({ pressed }) => [
              styles.reaction,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}>
            <Text variant="caption" style={selected ? styles.selectedText : styles.text}>
              {reaction.label}{count > 0 ? ` ${count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reaction: {
    minHeight: 34,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  selected: {
    backgroundColor: theme.colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    color: theme.colors.ink,
  },
  selectedText: {
    color: theme.colors.white,
  },
});
