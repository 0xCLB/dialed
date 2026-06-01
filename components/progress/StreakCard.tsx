import { StyleSheet, View } from 'react-native';
import { Flame } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { Streak } from '@/features/progress/types';

export function StreakCard({ streak }: { streak: Streak | null }) {
  return (
    <Card style={styles.card}>
      <View style={styles.icon}>
        <Flame size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.metric}>
        <Text variant="metric">{streak?.currentStreak ?? 0}</Text>
        <Text variant="caption" muted>
          current streak
        </Text>
      </View>
      <View style={styles.metric}>
        <Text variant="metric">{streak?.longestStreak ?? 0}</Text>
        <Text variant="caption" muted>
          longest
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
});
