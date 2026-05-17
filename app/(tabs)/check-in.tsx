import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { createManualEntry } from '@/features/entries/entry-service';
import { syncTodayHealth } from '@/features/health/health-service';
import { useAuthStore } from '@/features/auth/auth-store';
import { ACTION_CATALOG, PILLAR_ORDER } from '@/lib/constants';
import type { HealthMetricSnapshot, WellnessPillar } from '@/types/domain';

export default function CheckInScreen() {
  const session = useAuthStore((state) => state.session);
  const [pillar, setPillar] = useState<WellnessPillar>('fuel');
  const [actionType, setActionType] = useState(ACTION_CATALOG.fuel[0].key);
  const [caption, setCaption] = useState('');
  const [snapshot, setSnapshot] = useState<HealthMetricSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = useMemo(
    () => ACTION_CATALOG[pillar].find((item) => item.key === actionType) ?? ACTION_CATALOG[pillar][0],
    [actionType, pillar],
  );

  async function handleHealthSync() {
    if (!session) {
      return;
    }
    setHealthLoading(true);
    setError(null);
    try {
      setSnapshot(await syncTodayHealth(session.user.id));
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Apple Health sync failed.');
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const entry = await createManualEntry({
        pillar,
        actionType: action.key,
        title: action.label,
        caption,
        healthSnapshot: snapshot,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/entry/${entry.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create check-in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text variant="title">Manual check-in</Text>
      <Text muted>Use this for proof that does not need a camera, or attach Apple Health context.</Text>

      <Card style={styles.card}>
        <SegmentedControl
          value={pillar}
          options={PILLAR_ORDER.map((item) => ({ value: item, label: item }))}
          onChange={(next) => {
            setPillar(next);
            setActionType(ACTION_CATALOG[next][0].key);
          }}
        />
        <View style={styles.actionGrid}>
          {ACTION_CATALOG[pillar].map((item) => {
            const active = item.key === actionType;
            return (
              <Pressable
                key={item.key}
                onPress={() => setActionType(item.key)}
                style={[styles.action, active && styles.actionActive]}>
                <Text variant="caption" style={active && styles.actionActiveText}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <TextInputField
        label="Context"
        value={caption}
        onChangeText={setCaption}
        placeholder="Minutes, grams, how it felt, or proof notes"
      />

      <Card style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <View style={styles.healthCopy}>
            <Text variant="subtitle">Health-backed score</Text>
            <Text muted>Attach today&apos;s steps, calories, exercise, sleep, and mindfulness.</Text>
          </View>
          <Button variant="secondary" loading={healthLoading} onPress={handleHealthSync}>
            Sync
          </Button>
        </View>
        {snapshot ? (
          <Text variant="caption" muted>
            Synced {snapshot.steps ?? 0} steps · {snapshot.activeEnergyKcal ?? 0} kcal ·{' '}
            {snapshot.exerciseMinutes ?? 0} exercise min
          </Text>
        ) : null}
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button loading={loading} onPress={handleCreate}>
        Score check-in
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  action: {
    minHeight: 38,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  actionActive: {
    backgroundColor: theme.colors.ink,
  },
  actionActiveText: {
    color: theme.colors.white,
  },
  healthCard: {
    gap: 12,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthCopy: {
    flex: 1,
  },
  error: {
    color: theme.colors.danger,
  },
});
