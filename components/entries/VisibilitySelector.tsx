import { Pressable, StyleSheet, View } from 'react-native';
import { Lock, UserRoundCheck, UsersRound } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { EntryVisibility } from '@/features/entries/types';

const OPTIONS: Array<{
  value: EntryVisibility;
  label: string;
  Icon: typeof UsersRound;
}> = [
  { value: 'friends', label: 'Friends', Icon: UsersRound },
  { value: 'private', label: 'Private', Icon: Lock },
  { value: 'public', label: 'Public', Icon: UserRoundCheck },
];

export function VisibilitySelector({
  value,
  onChange,
}: {
  value: EntryVisibility;
  onChange: (value: EntryVisibility) => void;
}) {
  return (
    <View style={styles.wrap}>
      {OPTIONS.map(({ value: optionValue, label, Icon }) => {
        const selected = value === optionValue;
        return (
          <Pressable
            key={optionValue}
            accessibilityRole="button"
            onPress={() => onChange(optionValue)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}>
            <Icon size={15} color={selected ? theme.colors.white : theme.colors.muted} />
            <Text variant="caption" style={selected ? styles.selectedText : styles.optionText}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    padding: 4,
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceAlt,
  },
  option: {
    flex: 1,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  selected: {
    backgroundColor: theme.colors.primary,
  },
  pressed: {
    opacity: 0.75,
  },
  optionText: {
    color: theme.colors.muted,
  },
  selectedText: {
    color: theme.colors.white,
  },
});
