import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Target } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { track } from '@/lib/analytics';
import { PILLARS } from '@/lib/constants';
import type { DailyDigest } from '@/features/digest/types';

export function DigestRecommendationCard({ digest }: { digest: DailyDigest }) {
  const pillar = digest.recommendation.pillar;
  const accent = pillar ? PILLARS[pillar].color : theme.colors.primary;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: accent }]}>
          <Target size={18} color={theme.colors.white} />
        </View>
        <View style={styles.copy}>
          <Text variant="subtitle">{digest.recommendation.title}</Text>
          <Text muted>{digest.recommendation.body}</Text>
        </View>
      </View>
      {digest.recommendation.route ? (
        <Button
          variant="secondary"
          onPress={() => {
            track('digest_recommendation_clicked', {
              date: digest.digestDate,
              pillar: pillar ?? 'none',
            });
            router.push(digest.recommendation.route as never);
          }}>
          {digest.recommendation.actionLabel}
          <ArrowRight size={18} color={theme.colors.ink} />
        </Button>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 5,
  },
});
