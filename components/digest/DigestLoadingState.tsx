import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function DigestLoadingState({ label = 'Building Daily Recap' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text muted>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});
