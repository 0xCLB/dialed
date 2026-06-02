import { StyleSheet, View } from 'react-native';
import { Clock3, Sparkles } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function PointsBadge({
  points,
  pending,
  basic,
}: {
  points?: number | null;
  pending?: boolean;
  basic?: boolean;
}) {
  const hasBasicScore = Boolean(pending && basic && points !== null && points !== undefined);
  const label = hasBasicScore ? `Basic +${points} DP` : pending ? 'Scoring...' : `${points ?? 0} DP`;
  const iconColor = pending ? theme.colors.muted : theme.colors.primary;

  return (
    <View style={[styles.badge, pending && styles.pending, hasBasicScore && styles.basic]}>
      {pending ? <Clock3 size={14} color={iconColor} /> : <Sparkles size={14} color={iconColor} />}
      <Text variant="caption" style={pending ? styles.pendingText : styles.text}>
        {label}
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
  basic: {
    backgroundColor: theme.colors.warningSoft,
  },
  text: {
    color: theme.colors.primary,
  },
  pendingText: {
    color: theme.colors.muted,
  },
});
