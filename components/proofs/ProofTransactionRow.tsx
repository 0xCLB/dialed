import { StyleSheet, View } from 'react-native';
import { ArrowDownCircle, ArrowUpCircle, RotateCcw } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { ProofTransaction } from '@/features/proofs/types';

function titleForReason(reason: string) {
  return reason
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function ProofTransactionRow({ transaction }: { transaction: ProofTransaction }) {
  const positive = transaction.transactionType === 'earn' || transaction.transactionType === 'refund';
  const Icon =
    transaction.transactionType === 'reset'
      ? RotateCcw
      : positive
        ? ArrowUpCircle
        : ArrowDownCircle;

  return (
    <View style={styles.row}>
      <View style={[styles.icon, positive ? styles.positive : styles.spend]}>
        <Icon size={18} color={positive ? theme.colors.success : theme.colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text variant="body">{titleForReason(transaction.reason)}</Text>
        <Text variant="caption" muted>
          {transaction.transactionType}
        </Text>
      </View>
      <Text variant="subtitle" style={positive ? styles.plus : styles.minus}>
        {positive ? '+' : '-'}
        {transaction.amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positive: {
    backgroundColor: theme.colors.successSoft,
  },
  spend: {
    backgroundColor: theme.colors.primarySoft,
  },
  copy: {
    flex: 1,
  },
  plus: {
    color: theme.colors.success,
  },
  minus: {
    color: theme.colors.primary,
  },
});
