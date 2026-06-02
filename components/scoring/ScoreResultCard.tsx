import { StyleSheet, View } from 'react-native';
import { Gauge, Sparkles } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { ProofTypeBadge } from '@/components/scoring/ProofTypeBadge';
import { TrustBadge } from '@/components/scoring/TrustBadge';
import type { ScoreResult } from '@/features/scoring/types';

export function ScoreResultCard({ result }: { result: ScoreResult }) {
  const pending = result.status === 'pending';
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.pointsIcon, pending && styles.pendingIcon]}>
          {pending ? (
            <Gauge size={20} color={theme.colors.muted} />
          ) : (
            <Sparkles size={20} color={theme.colors.white} />
          )}
        </View>
        <View style={styles.copy}>
          <Text variant="subtitle">
            {pending ? 'Scoring pending' : `+${result.points} Dialed Points`}
          </Text>
          <Text variant="caption" muted>
            {result.status === 'fallback' ? 'Basic score' : result.source.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <ProofTypeBadge proofType={result.proofType} />
        <TrustBadge trustLevel={result.trustLevel} confidence={result.confidence} />
      </View>

      <View style={styles.grid}>
        <Metric label="Pillar" value={result.wellnessPillar} />
        <Metric label="Ranked" value={result.rankedEligible ? 'Yes' : 'No'} />
        <Metric label="Base" value={`${result.basePoints}`} />
        <Metric label="Bonus" value={`${result.bonusPoints}`} />
      </View>

      <Text muted>{result.explanation}</Text>
      {result.subtext ? <Text variant="caption" muted>{result.subtext}</Text> : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="subtitle" style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  pendingIcon: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 58,
    borderRadius: theme.radius.md,
    padding: 10,
    justifyContent: 'center',
    gap: 2,
    backgroundColor: theme.colors.surfaceAlt,
  },
  metricValue: {
    textTransform: 'capitalize',
  },
});
