import { StyleSheet, View } from 'react-native';
import { Clock3, ShieldCheck } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { TrustLevel } from '@/features/scoring/types';

const LABELS: Record<TrustLevel, string> = {
  verified_health: 'Highest trust',
  photo_ai: 'High trust',
  photo_location: 'Very high trust',
  location_only: 'Medium trust',
  manual_note: 'Low trust',
  pending: 'Pending',
};

const DETAILS: Record<TrustLevel, string> = {
  verified_health: 'Verified by Health',
  photo_ai: 'Photo classified',
  photo_location: 'Photo + location',
  location_only: 'Location only',
  manual_note: 'Manual note',
  pending: 'Scoring pending',
};

export function TrustBadge({
  trustLevel,
  confidence,
}: {
  trustLevel: TrustLevel;
  confidence?: number | null;
}) {
  const pending = trustLevel === 'pending';
  const low = trustLevel === 'manual_note';
  return (
    <View style={[styles.badge, pending && styles.pending, low && styles.low]}>
      {pending ? (
        <Clock3 size={15} color={theme.colors.muted} />
      ) : (
        <ShieldCheck size={15} color={low ? theme.colors.muted : theme.colors.success} />
      )}
      <View>
        <Text variant="caption" style={low || pending ? styles.mutedText : styles.text}>
          {LABELS[trustLevel]}
        </Text>
        <Text variant="caption" muted>
          {confidence === null || confidence === undefined
            ? DETAILS[trustLevel]
            : `${Math.round(confidence * 100)}% confidence`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderRadius: theme.radius.md,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.successSoft,
  },
  pending: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  low: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  text: {
    color: theme.colors.success,
  },
  mutedText: {
    color: theme.colors.muted,
  },
});
