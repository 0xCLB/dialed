import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  Brain,
  HeartPulse,
  Lock,
  Moon,
  RefreshCw,
  Shield,
  Watch,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LockedFeatureCard } from '@/components/monetization/LockedFeatureCard';
import { MetricTile } from '@/components/ui/MetricTile';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { getProviderAdapter } from '@/features/health/providerAdapter';
import {
  getConnectedProviders,
  getHealthPrivacySettings,
  getTodayHealthSummary,
  healthSampleDisplay,
  syncAppleHealthToday,
  updateHealthPrivacySettings,
} from '@/features/health/healthService';
import type {
  HealthPrivacySettings,
  HealthProviderConnection,
  HealthTodaySummary,
} from '@/features/health/types';
import { usePro } from '@/features/monetization/usePro';
import { track } from '@/lib/analytics';

export default function HealthSettingsScreen() {
  const { session } = useRequireSession();
  const pro = usePro();
  const [connections, setConnections] = useState<HealthProviderConnection[]>([]);
  const [privacy, setPrivacy] = useState<HealthPrivacySettings | null>(null);
  const [summary, setSummary] = useState<HealthTodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [nextConnections, nextPrivacy, nextSummary] = await Promise.all([
        getConnectedProviders(session.user.id),
        getHealthPrivacySettings(session.user.id),
        getTodayHealthSummary(session.user.id).catch(() => null),
      ]);
      setConnections(nextConnections);
      setPrivacy(nextPrivacy);
      setSummary(nextSummary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Health settings did not load.');
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    track('health_screen_opened');
    load();
  }, [load]);

  const appleConnection = useMemo(
    () => connections.find((connection) => connection.provider === 'apple_health') ?? null,
    [connections],
  );
  const wearableConnections = useMemo(
    () => connections.filter((connection) => connection.provider !== 'apple_health'),
    [connections],
  );

  async function handleAppleConnect() {
    setConnectingProvider('apple_health');
    setError(null);
    setNotice(null);
    try {
      const adapter = getProviderAdapter('apple_health');
      const status = await adapter?.connect();
      setNotice(status?.message ?? 'Apple Health permission flow finished.');
      await load();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Apple Health did not connect.');
    } finally {
      setConnectingProvider(null);
    }
  }

  async function handleSync() {
    if (!session?.user.id) return;

    setSyncing(true);
    setError(null);
    setNotice(null);
    try {
      const result = await syncAppleHealthToday(session.user.id);
      setSummary(result.summary);
      setNotice(
        result.samples.length > 0
          ? `${result.samples.length} health signals synced. ${result.entriesCreated} private entries refreshed.`
          : 'Apple Health synced, but there was no new point-worthy proof today.',
      );
      await load();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Health sync failed.');
    } finally {
      setSyncing(false);
    }
  }

  async function patchPrivacy(patch: Partial<Omit<HealthPrivacySettings, 'userId' | 'updatedAt'>>) {
    if (!session?.user.id || !privacy) return;
    const optimistic = { ...privacy, ...patch, updatedAt: new Date().toISOString() };
    setPrivacy(optimistic);
    try {
      setPrivacy(await updateHealthPrivacySettings(session.user.id, patch));
    } catch (privacyError) {
      setPrivacy(privacy);
      setError(privacyError instanceof Error ? privacyError.message : 'Health privacy did not save.');
    }
  }

  async function handleWearablePress(connection: HealthProviderConnection) {
    setConnectingProvider(connection.provider);
    setNotice(null);
    setError(null);
    try {
      const status = await getProviderAdapter(connection.provider)?.connect();
      setNotice(status?.message ?? `${connection.label} is not ready yet.`);
    } catch (providerError) {
      setError(providerError instanceof Error ? providerError.message : `${connection.label} is not ready yet.`);
    } finally {
      setConnectingProvider(null);
    }
  }

  return (
    <Screen refreshing={loading} onRefresh={load}>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <View style={styles.headerCopy}>
          <Text variant="title">Health Sources</Text>
          <Text variant="caption" muted>
            Private signals, optional points, no medical judgments.
          </Text>
        </View>
      </View>

      {loading ? <LoadingState label="Loading health sources" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading ? (
        <>
          <Card style={styles.card}>
            <View style={styles.sourceHeader}>
              <View style={styles.sourceIcon}>
                <HeartPulse size={22} color={theme.colors.white} />
              </View>
              <View style={styles.sourceCopy}>
                <Text variant="subtitle">Apple Health</Text>
                <Text muted>
                  {!appleConnection?.available
                    ? appleConnection?.message ?? 'Apple Health requires an iPhone development build.'
                    : appleConnection?.lastSyncedAt
                    ? `Last synced ${new Date(appleConnection.lastSyncedAt).toLocaleDateString()}`
                    : 'Connect steps, workouts, sleep, calories, and mindfulness.'}
                </Text>
              </View>
            </View>
            {!appleConnection?.available ? (
              <View style={styles.unavailableBox}>
                <Text variant="subtitle">Real device required</Text>
                <Text muted>
                  Apple Health sync needs an iPhone development build with HealthKit enabled. Simulator and Expo Go can preview this screen but cannot read your steps.
                </Text>
              </View>
            ) : null}
            <View style={styles.buttonRow}>
              <Button
                variant="secondary"
                loading={connectingProvider === 'apple_health'}
                style={styles.rowButton}
                disabled={!appleConnection?.available}
                onPress={handleAppleConnect}>
                <Shield size={17} color={theme.colors.primary} />
                Connect
              </Button>
              <Button
                loading={syncing}
                disabled={!appleConnection?.available}
                style={styles.rowButton}
                onPress={handleSync}>
                <RefreshCw size={17} color={theme.colors.white} />
                Sync today
              </Button>
            </View>
            {notice ? (
              <Text variant="caption" style={styles.notice}>
                {notice}
              </Text>
            ) : null}
          </Card>

          <View style={styles.metrics}>
            <MetricTile label="Health DP" value={summary?.totalPoints ?? 0} detail="local preview" />
            <MetricTile label="Signals" value={summary?.sampleCount ?? 0} detail="today" />
            <MetricTile
              label="Steps"
              value={
                summary?.samples.find((sample) => sample.metricType === 'steps')?.value
                  ? String(Math.round(summary.samples.find((sample) => sample.metricType === 'steps')?.value ?? 0))
                  : '0'
              }
              detail="today"
            />
          </View>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text variant="subtitle">Today&apos;s Health Mix</Text>
              <Text variant="caption" muted>
                private
              </Text>
            </View>
            <View style={styles.pillarRow}>
              <SignalPill icon={<Activity size={16} color={theme.colors.primary} />} label="Movement" value={summary?.movementPoints ?? 0} />
              <SignalPill icon={<Brain size={16} color={theme.colors.secondary} />} label="Mind" value={summary?.mindPoints ?? 0} />
              <SignalPill icon={<Moon size={16} color={theme.colors.warning} />} label="Recovery" value={summary?.recoveryPoints ?? 0} />
            </View>
            {summary?.samples.length ? (
              summary.samples.slice(0, 5).map((sample) => {
                const display = healthSampleDisplay(sample);
                return (
                  <View key={sample.id ?? `${sample.metricType}-${sample.startedAt}`} style={styles.sampleRow}>
                    <View style={styles.sampleCopy}>
                      <Text>{display.label}</Text>
                      <Text variant="caption" muted>
                        {display.value}
                      </Text>
                    </View>
                    <Text variant="caption" style={styles.pointsText}>
                      +{display.score.points} DP
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text muted>Sync Apple Health to see today&apos;s private health signals.</Text>
            )}
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text variant="subtitle">Wearables</Text>
              <Text variant="caption" muted>
                staged
              </Text>
            </View>
            {wearableConnections.map((connection) => (
              <Pressable
                key={connection.provider}
                style={styles.wearableRow}
                onPress={() => handleWearablePress(connection)}>
                <Watch size={19} color={theme.colors.ink} />
                <View style={styles.wearableCopy}>
                  <Text>{connection.label}</Text>
                  <Text variant="caption" muted>
                    {connection.supportedMetrics.join(', ')}
                  </Text>
                </View>
                <View style={styles.badges}>
                  {connection.pro ? (
                    <View style={styles.proBadge}>
                      <Text variant="caption" style={styles.proText}>
                        Pro
                      </Text>
                    </View>
                  ) : null}
                  <Text variant="caption" muted>
                    {connectingProvider === connection.provider ? '...' : 'Soon'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </Card>

          {privacy ? (
            <Card style={styles.card}>
              <View style={styles.sourceHeader}>
                <Lock size={20} color={theme.colors.primary} />
                <View style={styles.sourceCopy}>
                  <Text variant="subtitle">Health Privacy</Text>
                  <Text muted>Raw health data stays private by default.</Text>
                </View>
              </View>
              <ToggleRow
                label="Use health data for points"
                detail="Creates private pending-score entries from synced signals."
                value={privacy.useHealthDataForPoints}
                onValueChange={(value) => patchPrivacy({ useHealthDataForPoints: value })}
              />
              <ToggleRow
                label="Show achievements to friends"
                detail="Future social cards can show achievements, never raw metrics."
                value={privacy.showHealthAchievementsToFriends}
                onValueChange={(value) => patchPrivacy({ showHealthAchievementsToFriends: value })}
              />
              <ToggleRow
                label="Keep raw metrics private"
                detail="Recommended. Friends should see proof, not your raw health feed."
                value={privacy.rawHealthMetricsPrivate}
                onValueChange={(value) => patchPrivacy({ rawHealthMetricsPrivate: value })}
              />
            </Card>
          ) : null}

          {pro.isPro ? (
            <Card style={styles.card}>
              <Text variant="subtitle">Advanced Health Analytics</Text>
              <Text muted>
                HRV trends, sleep consistency, recovery coaching, and wearable comparisons are staged for the Pro analytics pass.
              </Text>
              <Button variant="secondary" disabled>
                Coming soon
              </Button>
            </Card>
          ) : (
            <LockedFeatureCard
              title="Advanced health analytics"
              body="Pro will add HRV trends, sleep consistency, recovery coaching, and wearable comparisons."
              onPress={() => pro.openPaywall('advanced_insights')}
            />
          )}
        </>
      ) : null}
    </Screen>
  );
}

function SignalPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.signalPill}>
      {icon}
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text variant="subtitle">{value}</Text>
    </View>
  );
}

function ToggleRow({
  label,
  detail,
  value,
  onValueChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text>{label}</Text>
        <Text variant="caption" muted>
          {detail}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.surfaceAlt, true: theme.colors.primarySoft }}
        thumbColor={value ? theme.colors.primary : theme.colors.faint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  card: {
    gap: 14,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  sourceCopy: {
    flex: 1,
    gap: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rowButton: {
    flex: 1,
  },
  notice: {
    color: theme.colors.primary,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  unavailableBox: {
    borderRadius: theme.radius.md,
    padding: 12,
    gap: 4,
    backgroundColor: theme.colors.warningSoft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pillarRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signalPill: {
    flex: 1,
    minHeight: 82,
    borderRadius: theme.radius.md,
    padding: 10,
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceAlt,
  },
  sampleRow: {
    minHeight: 54,
    borderRadius: theme.radius.md,
    padding: 12,
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sampleCopy: {
    flex: 1,
    gap: 2,
  },
  pointsText: {
    color: theme.colors.primary,
  },
  wearableRow: {
    minHeight: 62,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wearableCopy: {
    flex: 1,
    gap: 2,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  proBadge: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proText: {
    color: theme.colors.primary,
  },
  toggleRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleCopy: {
    flex: 1,
    gap: 3,
  },
});
