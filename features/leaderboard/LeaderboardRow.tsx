import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { LeaderboardRow as LeaderboardRowType } from '@/types/domain';

export function LeaderboardRow({ row }: { row: LeaderboardRowType }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rank, row.rank <= 3 && styles.podium]}>
        <Text variant="caption" style={row.rank <= 3 && styles.podiumText}>
          #{row.rank}
        </Text>
      </View>
      <View style={styles.name}>
        <Text variant="body" numberOfLines={1}>
          {row.profile.displayName ?? row.profile.username ?? 'Private athlete'}
        </Text>
        <Text variant="caption" muted>
          {row.entries} proofs
        </Text>
      </View>
      <Text variant="subtitle">{row.score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rank: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  podium: {
    backgroundColor: theme.colors.ink,
  },
  podiumText: {
    color: theme.colors.white,
  },
  name: {
    flex: 1,
  },
});
