import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Activity, Moon, RefreshCw, Zap } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { syncTodayHealth } from '@/features/health/health-service';
import type { HealthMetricSnapshot } from '@/types/domain';

export function HealthSyncCard({
  userId,
  snapshot,
  onSynced,
}: {
  userId: string;
  snapshot: HealthMetricSnapshot | null;
  onSynced: (snapshot: HealthMetricSnapshot) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setError(null);
    try {
      onSynced(await syncTodayHealth(userId));
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Health sync failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text variant="subtitle">Apple Health</Text>
          <Text muted>Steps, calories, exercise, sleep, and mindfulness.</Text>
        </View>
        <RefreshCw size={20} color={theme.colors.accent} />
      </View>
      <View style={styles.metrics}>
        <HealthMetric icon={<Activity size={16} color={theme.colors.accent} />} label="Steps" value={snapshot?.steps ?? 0} />
        <HealthMetric icon={<Zap size={16} color={theme.colors.accent} />} label="Kcal" value={snapshot?.activeEnergyKcal ?? 0} />
        <HealthMetric icon={<Moon size={16} color={theme.colors.accent} />} label="Sleep" value={`${Math.round((snapshot?.sleepMinutes ?? 0) / 60)}h`} />
      </View>
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button loading={loading} onPress={handleSync}>
        Sync Health
      </Button>
    </Card>
  );
}

function HealthMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.metric}>
      {icon}
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="subtitle">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flex: 1,
    minHeight: 74,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
    padding: 10,
    justifyContent: 'space-between',
  },
  error: {
    color: theme.colors.danger,
  },
});
