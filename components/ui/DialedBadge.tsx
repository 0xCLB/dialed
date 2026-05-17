import { StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function DialedBadge({ label = 'Dialed' }: { label?: string }) {
  return (
    <View style={styles.badge}>
      <Sparkles size={14} color={theme.colors.primary} />
      <Text variant="caption" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 30,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.primarySoft,
  },
  label: {
    color: theme.colors.primary,
  },
});
