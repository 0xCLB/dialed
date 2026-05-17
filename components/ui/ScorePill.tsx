import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function ScorePill({ score }: { score: number }) {
  return (
    <View style={styles.pill}>
      <Text variant="caption" style={styles.label}>
        {score} DP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primary,
  },
  label: {
    color: theme.colors.white,
  },
});
