import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function RankBadge({ rank }: { rank: number }) {
  const podium = rank <= 3;
  return (
    <View style={[styles.badge, podium && styles.podium]}>
      <Text variant="caption" style={podium ? styles.podiumText : styles.text}>
        #{rank}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 42,
    height: 32,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  podium: {
    backgroundColor: theme.colors.primary,
  },
  text: {
    color: theme.colors.ink,
  },
  podiumText: {
    color: theme.colors.white,
  },
});
