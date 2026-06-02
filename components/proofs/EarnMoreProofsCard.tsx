import { StyleSheet, View } from 'react-native';
import { Clock3, Gift, Share2, UserPlus } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function EarnMoreProofsCard({
  onShare,
  onInvite,
}: {
  onShare?: () => void;
  onInvite?: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Gift size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text variant="subtitle">Earn more Proofs</Text>
          <Text variant="caption" muted>
            Bonus Proofs cap at +3/day on Free.
          </Text>
        </View>
      </View>

      <View style={styles.rule}>
        <Share2 size={17} color={theme.colors.primary} />
        <Text muted style={styles.ruleText}>
          Earn +1 today by sharing today&apos;s score.
        </Text>
      </View>
      <View style={styles.rule}>
        <Gift size={17} color={theme.colors.primary} />
        <Text muted style={styles.ruleText}>
          Earn +1 tomorrow for a Fully Dialed Day or a 3-day streak.
        </Text>
      </View>
      <View style={styles.rule}>
        <Clock3 size={17} color={theme.colors.primary} />
        <Text muted style={styles.ruleText}>
          Come back tomorrow for a fresh Proof stack.
        </Text>
      </View>
      <View style={styles.rule}>
        <UserPlus size={17} color={theme.colors.primary} />
        <Text muted style={styles.ruleText}>
          Invites can earn +1 once referrals are live.
        </Text>
      </View>

      <View style={styles.actions}>
        {onShare ? (
          <Button variant="secondary" onPress={onShare} style={styles.actionButton}>
            <Share2 size={17} color={theme.colors.ink} />
            Share
          </Button>
        ) : null}
        {onInvite ? (
          <Button variant="secondary" onPress={onInvite} style={styles.actionButton}>
            <UserPlus size={17} color={theme.colors.ink} />
            Invite
          </Button>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  ruleText: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
