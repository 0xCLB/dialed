import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { MiniPillarBars } from '@/components/leaderboard/MiniPillarBars';
import { RankBadge } from '@/components/leaderboard/RankBadge';
import type { LeaderboardRow as LeaderboardRowType } from '@/features/leaderboard/types';

export function LeaderboardRow({
  row,
  onPress,
}: {
  row: LeaderboardRowType;
  onPress?: () => void;
}) {
  const name = row.profile?.displayName ?? row.profile?.username ?? 'Dialed athlete';

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        row.isCurrentUser && styles.current,
        pressed && styles.pressed,
      ]}>
      <RankBadge rank={row.rank} />
      <Avatar name={name} uri={row.profile?.avatarPath} size={42} />
      <View style={styles.identity}>
        <Text variant="subtitle" numberOfLines={1}>
          {row.isCurrentUser ? 'You' : name}
        </Text>
        <MiniPillarBars
          movement={row.movement}
          fuel={row.fuel}
          mind={row.mind}
          recovery={row.recovery}
        />
      </View>
      <View style={styles.score}>
        <Text variant="subtitle">{row.points}</Text>
        <Text variant="caption" muted>
          DP
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 74,
    borderRadius: theme.radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  current: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  pressed: {
    opacity: 0.72,
  },
  identity: {
    flex: 1,
    gap: 7,
  },
  score: {
    alignItems: 'flex-end',
  },
});
