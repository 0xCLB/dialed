import { StyleSheet, View } from 'react-native';
import { Clock3, Trophy } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { WellnessRing } from '@/components/progress/WellnessRing';
import type { DaySummary } from '@/features/progress/types';

export function DaySummaryCard({
  summary,
  title = 'Today',
}: {
  summary: DaySummary;
  title?: string;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text variant="title">{title}</Text>
          <Text muted>
            {summary.fullyDialed
              ? 'All four pillars are alive.'
              : `${summary.completedPillars.length}/4 pillars complete`}
          </Text>
        </View>
        <View style={styles.points}>
          <Trophy size={16} color={theme.colors.primary} />
          <Text variant="caption">{summary.totalPoints} DP</Text>
        </View>
      </View>
      <WellnessRing progress={summary.pillarProgress} totalPoints={summary.totalPoints} />
      {summary.pendingEntries > 0 ? (
        <View style={styles.pending}>
          <Clock3 size={15} color={theme.colors.warning} />
          <Text variant="caption" muted>
            {summary.pendingEntries} basic score{summary.pendingEntries === 1 ? '' : 's'} active; analysis pending
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  points: {
    minHeight: 32,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primarySoft,
  },
  pending: {
    alignSelf: 'center',
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
