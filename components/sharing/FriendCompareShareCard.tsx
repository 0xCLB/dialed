import { StyleSheet, View } from 'react-native';

import {
  ShareCardFrame,
  ShareCardHeadline,
  ShareCardPoints,
} from '@/components/sharing/ShareCardFrame';
import { Text } from '@/components/ui/Text';
import { PILLARS, PILLAR_ORDER } from '@/lib/constants';
import type { ShareCardData } from '@/features/sharing/types';

export function FriendCompareShareCard({ data }: { data: ShareCardData }) {
  return (
    <ShareCardFrame data={data}>
      <ShareCardHeadline data={data} />
      <View style={styles.scoreboard}>
        <View style={styles.score}>
          <Text variant="metric" style={styles.white}>{data.friendCompare?.myPoints ?? 0}</Text>
          <Text variant="caption" style={styles.muted}>You</Text>
        </View>
        <View style={styles.score}>
          <Text variant="metric" style={styles.white}>{data.friendCompare?.friendPoints ?? 0}</Text>
          <Text variant="caption" style={styles.muted}>{data.friendCompare?.friend?.displayName ?? 'Friend'}</Text>
        </View>
      </View>
      <View style={styles.winners}>
        {PILLAR_ORDER.map((pillar) => (
          <Text key={pillar} variant="caption" style={styles.white}>
            {PILLARS[pillar].label}: {data.friendCompare?.winners[pillar] ?? 'nobody'}
          </Text>
        ))}
      </View>
      <ShareCardPoints points={Math.abs((data.friendCompare?.myPoints ?? 0) - (data.friendCompare?.friendPoints ?? 0))} label="Point gap" dark />
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  scoreboard: {
    flexDirection: 'row',
    gap: 12,
  },
  score: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  winners: {
    gap: 7,
  },
  white: {
    color: '#FFFFFF',
  },
  muted: {
    color: '#F7F4EE',
  },
});
