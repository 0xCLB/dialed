import { Image, StyleSheet, View } from 'react-native';

import {
  isDarkShareTemplate,
  ShareCardFrame,
  ShareCardHeadline,
  ShareCardPoints,
} from '@/components/sharing/ShareCardFrame';
import { Text } from '@/components/ui/Text';
import type { ShareCardData } from '@/features/sharing/types';

export function EntryShareCard({ data }: { data: ShareCardData }) {
  const dark = isDarkShareTemplate(data.template);
  return (
    <ShareCardFrame data={data}>
      {data.mediaUrl ? <Image source={{ uri: data.mediaUrl }} style={styles.photo} /> : null}
      <ShareCardHeadline data={data}>
        <Text variant="caption" style={[styles.proof, dark && styles.light]}>
          Proof &gt; promises
        </Text>
      </ShareCardHeadline>
      <ShareCardPoints points={data.points} dark={dark} />
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    aspectRatio: 1.05,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  proof: {
    color: '#141414',
    textTransform: 'uppercase',
  },
  light: {
    color: '#FFFFFF',
  },
});
