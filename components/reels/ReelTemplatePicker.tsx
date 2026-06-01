import { Pressable, StyleSheet, View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { track } from '@/lib/analytics';
import type { ReelTemplate } from '@/features/reels/types';

const TEMPLATES: Array<{ id: ReelTemplate; label: string; pro?: boolean }> = [
  { id: 'clean', label: 'Clean' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'fully_dialed', label: 'Fully Dialed' },
  { id: 'dark', label: 'Dark', pro: true },
  { id: 'athlete', label: 'Athlete', pro: true },
  { id: 'leaderboard', label: 'Scoreboard', pro: true },
];

export function ReelTemplatePicker({
  value,
  isPro,
  onChange,
  onLockedPress,
}: {
  value: ReelTemplate;
  isPro?: boolean;
  onChange: (template: ReelTemplate) => void;
  onLockedPress?: (template: ReelTemplate) => void;
}) {
  return (
    <View style={styles.wrap}>
      {TEMPLATES.map((template) => {
        const locked = Boolean(template.pro && !isPro);
        const selected = template.id === value;

        return (
          <Pressable
            key={template.id}
            accessibilityRole="button"
            onPress={() => {
              track('reel_template_selected', { template: template.id, locked });
              if (locked) {
                onLockedPress?.(template.id);
                return;
              }
              onChange(template.id);
            }}
            style={({ pressed }) => [
              styles.option,
              selected && styles.selected,
              locked && styles.locked,
              pressed && styles.pressed,
            ]}>
            <Text variant="caption" style={selected ? styles.selectedText : styles.optionText}>
              {template.label}
            </Text>
            {locked ? <Lock size={13} color={theme.colors.faint} /> : null}
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
  option: {
    minHeight: 36,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceAlt,
  },
  selected: {
    backgroundColor: theme.colors.primary,
  },
  locked: {
    opacity: 0.58,
  },
  pressed: {
    opacity: 0.72,
  },
  optionText: {
    color: theme.colors.ink,
  },
  selectedText: {
    color: theme.colors.white,
  },
});
