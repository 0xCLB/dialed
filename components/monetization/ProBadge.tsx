import { StyleSheet, View } from 'react-native';
import { Crown } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function ProBadge({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.badge, compact && styles.compact]}>
      <Crown size={compact ? 12 : 14} color={theme.colors.white} />
      <Text variant="caption" style={styles.text}>
        Pro
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    color: theme.colors.white,
    fontWeight: '800',
  },
});
