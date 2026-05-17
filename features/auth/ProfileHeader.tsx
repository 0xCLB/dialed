import { StyleSheet, View } from 'react-native';
import { UserRound } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import type { Profile } from '@/types/domain';

export function ProfileHeader({ profile }: { profile: Profile | null }) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <UserRound size={22} color={theme.colors.white} />
      </View>
      <View style={styles.copy}>
        <Text variant="caption" muted>
          Today
        </Text>
        <Text variant="subtitle" numberOfLines={1}>
          {profile?.displayName ?? profile?.username ?? 'Dialed athlete'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.ink,
  },
  copy: {
    flex: 1,
  },
});
