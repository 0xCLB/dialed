import { StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function PointsBadge({ points, pending }: { points?: number | null; pending?: boolean }) {
  return (
    <View style={[styles.badge, pending && styles.pending]}>
      <Sparkles size={14} color={pending ? theme.colors.muted : theme.colors.primary} />
      <Text variant="caption" style={pending ? styles.pendingText : styles.text}>
        {pending ? 'Scoring...' : `${points ?? 0} DP`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 30,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primarySoft,
  },
  pending: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  text: {
    color: theme.colors.primary,
  },
  pendingText: {
    color: theme.colors.muted,
  },
});
