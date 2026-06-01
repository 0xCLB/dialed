import { StyleSheet, View } from 'react-native';
import { UserPlus } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { ProfileSummary } from '@/features/social/types';

export function FriendSearchResult({
  profile,
  onAdd,
  disabled,
}: {
  profile: ProfileSummary;
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Avatar name={profile.displayName} uri={profile.avatarPath} />
      <View style={styles.copy}>
        <Text variant="subtitle" numberOfLines={1}>
          {profile.displayName}
        </Text>
        <Text variant="caption" muted>
          @{profile.username ?? 'dialed'}
        </Text>
      </View>
      <Button variant="secondary" style={styles.iconButton} disabled={disabled} onPress={onAdd}>
        <UserPlus size={18} color={theme.colors.ink} />
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
});
