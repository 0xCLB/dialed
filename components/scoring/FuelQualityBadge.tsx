import { StyleSheet, View } from 'react-native';
import { Leaf } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { HealthinessLabel } from '@/features/scoring/types';

const LABELS: Record<HealthinessLabel, string> = {
  poor: 'Needs work',
  okay: 'Okay',
  solid: 'Solid',
  dialed: 'Dialed',
};

export function FuelQualityBadge({ label }: { label?: HealthinessLabel | null }) {
  return (
    <View style={styles.badge}>
      <Leaf size={14} color={theme.colors.success} />
      <Text variant="caption" style={styles.text}>
        Fuel quality: {label ? LABELS[label] : 'Pending'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 30,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.successSoft,
  },
  text: {
    color: theme.colors.success,
  },
});
