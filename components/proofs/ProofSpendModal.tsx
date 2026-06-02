import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Lock, Ticket, X } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { ProofWallet } from '@/features/proofs/types';

export function ProofSpendModal({
  visible,
  wallet,
  loading,
  onConfirm,
  onClose,
  onEarnMore,
  onUpgrade,
}: {
  visible: boolean;
  wallet: ProofWallet | null;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onEarnMore: () => void;
  onUpgrade: () => void;
}) {
  const remaining = wallet?.remainingProofs ?? 0;
  const out = Boolean(wallet?.setupRequired || remaining < 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <Card style={styles.sheet}>
          <View style={styles.topRow}>
            <View style={[styles.icon, out ? styles.lockIcon : null]}>
              {out ? (
                <Lock size={24} color={theme.colors.warning} />
              ) : (
                <Ticket size={24} color={theme.colors.primary} />
              )}
            </View>
            <Button variant="secondary" style={styles.closeButton} onPress={onClose}>
              <X size={18} color={theme.colors.ink} />
            </Button>
          </View>

          <View style={styles.copy}>
            <Text variant="title">
              {wallet?.setupRequired ? 'Proof setup needed' : out ? "You're out of Proofs" : 'Use a Proof'}
            </Text>
            <Text muted style={styles.body}>
              {wallet?.setupRequired
                ? 'Apply the Daily Proof migration in Supabase before this economy can enforce spending.'
                : out
                  ? 'Earn more tomorrow or unlock more with Pro. Sharing today can earn +1 when available.'
                  : `This verified score attempt will spend 1 of your ${remaining} remaining Daily Proofs.`}
            </Text>
          </View>

          {out ? (
            <View style={styles.actions}>
              <Button onPress={onEarnMore} style={styles.actionButton}>
                Earn +1
              </Button>
              <Button variant="secondary" onPress={onUpgrade} style={styles.actionButton}>
                Pro unlocks 20
              </Button>
            </View>
          ) : (
            <Button loading={loading} onPress={onConfirm}>
              Use a Proof
            </Button>
          )}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(20,20,20,0.34)',
  },
  sheet: {
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  lockIcon: {
    backgroundColor: theme.colors.warningSoft,
  },
  closeButton: {
    width: 42,
    minHeight: 42,
    paddingHorizontal: 0,
  },
  copy: {
    gap: 6,
  },
  body: {
    maxWidth: 310,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
