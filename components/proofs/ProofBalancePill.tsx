import { StyleSheet, View } from 'react-native';
import { Ticket } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { ProofWallet } from '@/features/proofs/types';

export function ProofBalancePill({
  wallet,
  loading,
}: {
  wallet: ProofWallet | null;
  loading?: boolean;
}) {
  const label = loading
    ? 'Daily Proofs'
    : wallet?.setupRequired
      ? 'Proof setup needed'
      : `${wallet?.remainingProofs ?? 0} Daily Proof${wallet?.remainingProofs === 1 ? '' : 's'} left`;

  return (
    <View style={[styles.pill, wallet?.remainingProofs === 0 && !loading ? styles.empty : null]}>
      <Ticket size={16} color={theme.colors.primary} />
      <Text variant="caption" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: theme.colors.primarySoft,
  },
  empty: {
    backgroundColor: theme.colors.warningSoft,
  },
  label: {
    color: theme.colors.primaryDark,
  },
});
