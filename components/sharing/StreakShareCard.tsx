import { StyleSheet, View } from 'react-native';
import { Flame } from 'lucide-react-native';

import {
  isDarkShareTemplate,
  ShareCardFrame,
  ShareCardHeadline,
  ShareCardPoints,
} from '@/components/sharing/ShareCardFrame';
import type { ShareCardData } from '@/features/sharing/types';

export function StreakShareCard({ data }: { data: ShareCardData }) {
  const dark = isDarkShareTemplate(data.template);
  return (
    <ShareCardFrame data={data}>
      <View style={styles.flame}>
        <Flame size={44} color="#FFFFFF" />
      </View>
      <ShareCardHeadline data={data} />
      <ShareCardPoints points={data.streak?.longestStreak ?? data.points} label="Longest" dark={dark} />
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  flame: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
  },
});
