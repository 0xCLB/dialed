import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { Friendship } from '@/features/social/types';

export function FriendListItem({
  friendship,
  onPress,
}: {
  friendship: Friendship;
  onPress: () => void;
}) {
  const profile = friendship.otherProfile;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <Avatar name={profile?.displayName} uri={profile?.avatarPath} />
        <View style={styles.copy}>
          <Text variant="subtitle" numberOfLines={1}>
            {profile?.displayName ?? 'Dialed athlete'}
          </Text>
          <Text variant="caption" muted>
            @{profile?.username ?? 'dialed'} · {friendship.status}
          </Text>
        </View>
        <ChevronRight size={18} color={theme.colors.faint} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
  },
});
