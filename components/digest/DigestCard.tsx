import { StyleSheet, View } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { DigestPillarSummary } from '@/components/digest/DigestPillarSummary';
import type { DailyDigest } from '@/features/digest/types';

export function DigestCard({
  digest,
  loading,
  onOpen,
  onGenerate,
}: {
  digest: DailyDigest | null;
  loading?: boolean;
  onOpen?: () => void;
  onGenerate?: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Sparkles size={18} color={theme.colors.white} />
        </View>
        <View style={styles.title}>
          <Text variant="subtitle">Daily Recap</Text>
          <Text variant="caption" muted>
            witty day review
          </Text>
        </View>
      </View>

      {digest ? (
        <>
          <View style={styles.scoreRow}>
            <Text variant="metric">{digest.scoreSummary.scorePercent}%</Text>
            <Text muted>{digest.scoreSummary.totalPoints} Dialed Points</Text>
          </View>
          <Text variant="subtitle">{digest.title}</Text>
          <Text muted>{digest.body}</Text>
          <DigestPillarSummary summary={digest.scoreSummary} />
          {onOpen ? (
            <Button variant="secondary" onPress={onOpen}>
              Open Recap
              <ArrowRight size={18} color={theme.colors.ink} />
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <Text muted>
            Generate the day&apos;s recap once proof starts stacking.
          </Text>
          {onGenerate ? (
            <Button loading={loading} onPress={onGenerate}>
              Generate Recap
            </Button>
          ) : null}
        </>
      )}
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
    alignItems: 'center',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  title: {
    flex: 1,
    gap: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
});
