import { StyleSheet, View } from 'react-native';
import { BatteryMedium, Gift, Sparkles } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { ProofWallet } from '@/features/proofs/types';

export function DailyProofCard({
  wallet,
  loading,
  onEarnMore,
  onUpgrade,
}: {
  wallet: ProofWallet | null;
  loading?: boolean;
  onEarnMore?: () => void;
  onUpgrade?: () => void;
}) {
  const total = wallet ? wallet.baseProofs + wallet.bonusProofs : 5;
  const remaining = wallet?.remainingProofs ?? 0;
  const used = wallet?.usedProofs ?? 0;
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <BatteryMedium size={21} color={theme.colors.white} />
        </View>
        <View style={styles.copy}>
          <Text variant="subtitle">Daily Proofs</Text>
          <Text variant="caption" muted>
            {wallet?.tier === 'pro'
              ? 'Pro capacity active'
              : 'Verified proofs move your score. Spend them wisely'}
          </Text>
        </View>
        <Text variant="metric" style={styles.remaining}>
          {loading ? '-' : remaining}
        </Text>
      </View>

      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${ratio * 100}%` }]} />
      </View>

      <View style={styles.stats}>
        <Text variant="caption" muted>
          {used} used
        </Text>
        <Text variant="caption" muted>
          {wallet?.bonusProofs ?? 0} bonus
        </Text>
        <Text variant="caption" muted>
          {total} total
        </Text>
      </View>

      {wallet?.setupRequired ? (
        <Text variant="caption" style={styles.warning}>
          Apply the Daily Proof migration before Proofs can be spent.
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button variant="secondary" onPress={onEarnMore} style={styles.actionButton}>
          <Gift size={17} color={theme.colors.ink} />
          Earn
        </Button>
        {wallet?.tier !== 'pro' ? (
          <Button variant="secondary" onPress={onUpgrade} style={styles.actionButton}>
            <Sparkles size={17} color={theme.colors.ink} />
            Pro 20
          </Button>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  remaining: {
    color: theme.colors.primary,
  },
  meterTrack: {
    height: 10,
    overflow: 'hidden',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
  },
  meterFill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  warning: {
    color: theme.colors.warning,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
