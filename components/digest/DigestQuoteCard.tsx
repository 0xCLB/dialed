import { StyleSheet, View } from 'react-native';
import { Share2 } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { DailyDigest } from '@/features/digest/types';

export function DigestQuoteCard({
  digest,
  onShare,
}: {
  digest: DailyDigest;
  onShare?: () => void;
}) {
  return (
    <Card style={styles.card}>
      <Text variant="caption" muted>
        Shareable quote
      </Text>
      <View style={styles.quote}>
        <Text variant="title" style={styles.quoteText}>
          "{digest.shareQuote}"
        </Text>
      </View>
      {onShare ? (
        <Button variant="secondary" onPress={onShare}>
          <Share2 size={18} color={theme.colors.ink} />
          Share quote
        </Button>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  quote: {
    borderRadius: theme.radius.lg,
    padding: 16,
    backgroundColor: theme.colors.primarySoft,
  },
  quoteText: {
    color: theme.colors.primaryDark,
  },
});
