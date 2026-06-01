import { StyleSheet, View } from 'react-native';

import {
  ShareCardFrame,
  ShareCardHeadline,
  ShareCardPoints,
} from '@/components/sharing/ShareCardFrame';
import { Text } from '@/components/ui/Text';
import type { ShareCardData } from '@/features/sharing/types';

export function LeaderboardShareCard({ data }: { data: ShareCardData }) {
  return (
    <ShareCardFrame data={data}>
      <ShareCardHeadline data={data} />
      <View style={styles.rows}>
        {(data.leaderboard?.rows ?? []).slice(0, 3).map((row) => (
          <View key={row.userId} style={styles.row}>
            <Text variant="caption" style={styles.rank}>
              #{row.rank}
            </Text>
            <Text variant="caption" style={styles.name} numberOfLines={1}>
              {row.isCurrentUser ? 'You' : row.profile?.displayName ?? 'Dialed athlete'}
            </Text>
            <Text variant="caption" style={styles.points}>
              {row.points}
            </Text>
          </View>
        ))}
      </View>
      <ShareCardPoints points={data.points} dark />
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: 8,
  },
  row: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  rank: {
    width: 32,
    color: '#FFFFFF',
  },
  name: {
    flex: 1,
    color: '#FFFFFF',
  },
  points: {
    color: '#FFFFFF',
  },
});
