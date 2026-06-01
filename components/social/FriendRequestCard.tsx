import { StyleSheet, View } from 'react-native';
import { Check, X } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { FriendRequest } from '@/features/social/types';

export function FriendRequestCard({
  request,
  kind,
  onAccept,
  onDecline,
}: {
  request: FriendRequest;
  kind: 'incoming' | 'outgoing';
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const profile = request.otherProfile;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Avatar name={profile?.displayName} uri={profile?.avatarPath} />
        <View style={styles.copy}>
          <Text variant="subtitle" numberOfLines={1}>
            {profile?.displayName ?? 'Dialed athlete'}
          </Text>
          <Text variant="caption" muted>
            {kind === 'incoming' ? 'wants to compete' : 'request sent'}
          </Text>
        </View>
      </View>
      {kind === 'incoming' ? (
        <View style={styles.actions}>
          <Button onPress={onAccept} style={styles.actionButton}>
            <Check size={17} color={theme.colors.white} />
            Accept
          </Button>
          <Button variant="secondary" onPress={onDecline} style={styles.actionButton}>
            <X size={17} color={theme.colors.ink} />
            Decline
          </Button>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
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
