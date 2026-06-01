import { StyleSheet, View } from 'react-native';

import { ShareCardFrame, ShareCardHeadline } from '@/components/sharing/ShareCardFrame';
import { Text } from '@/components/ui/Text';
import type { ShareCardData } from '@/features/sharing/types';

export function DigestQuoteCard({ data }: { data: ShareCardData }) {
  return (
    <ShareCardFrame data={data}>
      <ShareCardHeadline data={data} />
      <View style={styles.quote}>
        <Text variant="title" style={styles.quoteText}>
          “{data.digestQuote ?? data.subtitle}”
        </Text>
      </View>
    </ShareCardFrame>
  );
}

const styles = StyleSheet.create({
  quote: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  quoteText: {
    color: '#FFFFFF',
  },
});
