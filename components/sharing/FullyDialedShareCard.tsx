import { StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import {
  ShareCardFrame,
  ShareCardHeadline,
  ShareCardPoints,
} from '@/components/sharing/ShareCardFrame';
import { Text } from '@/components/ui/Text';
import { PILLARS, PILLAR_ORDER } from '@/lib/constants';
import type { ShareCardData } from '@/features/sharing/types';

export function FullyDialedShareCard({ data }: { data: ShareCardData }) {
  return (
    <ShareCardFrame data={data}>
      <View style={styles.spark}>
        <Sparkles size={36} color="#FFFFFF" />
      </View>
      <ShareCardHeadline data={data} />
      <View style={styles.pillars}>
        {PILLAR_ORDER.map((pillar) => (
          <View key={pillar} style={[styles.pillar, { backgroundColor: PILLARS[pillar].color }]}>
            <Text variant="caption" style={styles.pillarText}>
              {PILLARS[pillar].label}
            </Text>
          </View>
        ))}
      </View>
      <ShareCardPoints points={data.points} dark />
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  spark: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  pillars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillar: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  pillarText: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});
