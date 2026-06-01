import { Pressable, StyleSheet, View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { track } from '@/lib/analytics';
import type { ShareCardTemplate } from '@/features/sharing/types';

const TEMPLATES: Array<{ id: ShareCardTemplate; label: string; pro?: boolean }> = [
  { id: 'clean', label: 'Clean' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'dark', label: 'Dark athlete', pro: true },
  { id: 'athlete', label: 'Athlete', pro: true },
  { id: 'leaderboard', label: 'Flex', pro: true },
  { id: 'fully_dialed', label: 'Fully Dialed' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'hydration', label: 'Hydration' },
];

export function TemplatePicker({
  value,
  isPro,
  onChange,
  onLockedPress,
}: {
  value: ShareCardTemplate;
  isPro?: boolean;
  onChange: (template: ShareCardTemplate) => void;
  onLockedPress?: (template: ShareCardTemplate) => void;
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
              track('template_selected', { template: template.id, locked });
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
