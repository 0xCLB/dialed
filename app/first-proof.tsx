import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Camera, HeartPulse, ListPlus, Trophy } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useRequireSession } from '@/features/auth/useRequireSession';

export default function FirstProofScreen() {
  useRequireSession();

  function go(path: '/(tabs)/check-in' | '/(tabs)/capture' | '/settings/health' | '/(tabs)/home') {
    Haptics.selectionAsync();
    router.replace(path);
  }

  return (
    <Screen>
      <View style={styles.heroMark}>
        <Trophy size={30} color={theme.colors.white} />
      </View>
      <View style={styles.header}>
        <Text variant="hero">Log your first proof.</Text>
        <Text muted>
          Prove your day. Get your Dialed Score. Beat your friends.
        </Text>
      </View>

      <Card style={styles.featuredCard}>
        <View style={styles.optionHeader}>
          <View style={styles.optionIcon}>
            <ListPlus size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.optionCopy}>
            <Text variant="subtitle">Quick Check-In</Text>
            <Text muted>Fastest path. Pick water, walk, protein, reading, stretch, or your own win.</Text>
          </View>
        </View>
        <Button onPress={() => go('/(tabs)/check-in')}>
          Log first proof
        </Button>
      </Card>

      <View style={styles.optionGrid}>
        <Card style={styles.optionCard}>
          <Camera size={24} color={theme.colors.primary} />
          <Text variant="subtitle">Take Photo Proof</Text>
          <Text variant="caption" muted>
            Stronger artifact. Better share card.
          </Text>
          <Button variant="secondary" onPress={() => go('/(tabs)/capture')}>
            Capture
          </Button>
        </Card>

        <Card style={styles.optionCard}>
          <HeartPulse size={24} color={theme.colors.primary} />
          <Text variant="subtitle">Sync Health Later</Text>
          <Text variant="caption" muted>
            Health auto-scoring belongs in Pro power.
          </Text>
          <Button variant="secondary" onPress={() => go('/settings/health')}>
            Later
          </Button>
        </Card>
      </View>

      <Card style={styles.noteCard}>
        <Text variant="subtitle">Proofs are finite.</Text>
        <Text muted>
          Free starts with 5 Daily Proofs. Use them wisely. Pro unlocks more ways to prove the day.
        </Text>
      </Card>

      <Button variant="ghost" onPress={() => go('/(tabs)/home')}>
        View Today first
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroMark: {
    width: 62,
    height: 62,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  header: {
    gap: 6,
  },
  featuredCard: {
    gap: 14,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  optionCard: {
    flex: 1,
    gap: 10,
  },
  noteCard: {
    gap: 8,
    backgroundColor: theme.colors.primarySoft,
  },
});
