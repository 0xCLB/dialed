import { Link, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Lock, Settings, ShieldCheck, Sparkles } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricTile } from '@/components/ui/MetricTile';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { buildDailyDigest } from '@/features/digest/digest-service';
import { summarizeEntries } from '@/features/entries/entry-service';
import { useEntries } from '@/features/entries/useEntries';
import { useProStatus } from '@/features/monetization/useProStatus';

export default function ProfileScreen() {
  const profile = useAuthStore((state) => state.profile);
  const { entries } = useEntries(30);
  const { isPro } = useProStatus();
  const summary = summarizeEntries(entries);
  const digest = buildDailyDigest(entries);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text variant="title" style={styles.avatarText}>
            {(profile?.displayName ?? profile?.username ?? 'D').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.identity}>
          <Text variant="title">{profile?.displayName ?? 'Dialed athlete'}</Text>
          <Text muted>@{profile?.username ?? 'username'}</Text>
        </View>
        <Link href="/settings" asChild>
          <Button variant="secondary" style={styles.iconButton}>
            <Settings size={18} color={theme.colors.ink} />
          </Button>
        </Link>
      </View>

      <View style={styles.metrics}>
        <MetricTile label="Today" value={summary.score} detail="Dialed Points" />
        <MetricTile label="Pillars" value={summary.completedPillars.size} detail="of 4 done" />
      </View>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Sparkles size={22} color={theme.colors.accent} />
          <View style={styles.copy}>
            <Text variant="subtitle">{isPro ? 'Dialed Pro active' : 'Unlock Dialed Pro'}</Text>
            <Text muted>
              AI insights, advanced HealthKit analytics, premium templates, private groups, and
              custom challenges.
            </Text>
          </View>
        </View>
        {!isPro ? <Button onPress={() => router.push('/paywall')}>View Pro</Button> : null}
      </Card>

      <Card style={styles.card}>
        <Text variant="subtitle">Daily digest</Text>
        <Text muted>{digest.summary}</Text>
        <Text variant="caption" muted>
          {digest.completedPillars.length}/4 pillars · {digest.entries} proofs · {digest.score} DP
        </Text>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <ShieldCheck size={22} color={theme.colors.accent} />
          <View style={styles.copy}>
            <Text variant="subtitle">Privacy controls</Text>
            <Text muted>Private profile mode and friend-only entries are enforced by RLS.</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Lock size={22} color={theme.colors.muted} />
          <View style={styles.copy}>
            <Text variant="subtitle">Server-side scoring</Text>
            <Text muted>Client metadata is suggestive only; official scores come from Supabase.</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.ink,
  },
  avatarText: {
    color: theme.colors.white,
  },
  identity: {
    flex: 1,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});
