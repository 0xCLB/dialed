import { StyleSheet, View } from 'react-native';

import {
  isDarkShareTemplate,
  ShareCardFrame,
  ShareCardHeadline,
  ShareCardPoints,
} from '@/components/sharing/ShareCardFrame';
import { Text } from '@/components/ui/Text';
import { PILLARS } from '@/lib/constants';
import type { ShareCardData } from '@/features/sharing/types';

export function DailyScoreShareCard({ data }: { data: ShareCardData }) {
  const dark = isDarkShareTemplate(data.template);
  return (
    <ShareCardFrame data={data}>
      <ShareCardHeadline data={data} />
      <View style={styles.pillars}>
        {(data.daySummary?.pillarProgress ?? []).map((pillar) => (
          <View key={pillar.pillar} style={styles.pillarRow}>
            <View style={[styles.bar, { backgroundColor: PILLARS[pillar.pillar].color }]} />
            <Text variant="caption" style={dark && styles.light}>
              {PILLARS[pillar.pillar].label} · {pillar.points}
            </Text>
          </View>
        ))}
      </View>
      <ShareCardPoints points={data.points} dark={dark} />
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  pillars: {
    gap: 8,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  bar: {
    width: 34,
    height: 6,
    borderRadius: 3,
  },
  light: {
    color: '#FFFFFF',
  },
});
