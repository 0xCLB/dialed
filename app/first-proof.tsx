import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Camera, FileText, HeartPulse, MapPin, Trophy, Utensils } from 'lucide-react-native';
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

  function goFoodProof() {
    Haptics.selectionAsync();
    router.replace({ pathname: '/(tabs)/capture', params: { mode: 'food' } });
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
            <Camera size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.optionCopy}>
            <Text variant="subtitle">Photo Proof</Text>
            <Text muted>Fast, visual, and strong enough to move your score.</Text>
          </View>
        </View>
        <Button onPress={() => go('/(tabs)/capture')}>
          Take Photo Proof
        </Button>
      </Card>

      <View style={styles.optionGrid}>
        <Card style={styles.optionCard}>
          <Utensils size={24} color={theme.colors.primary} />
          <Text variant="subtitle">Food Proof</Text>
          <Text variant="caption" muted>
            Estimate macros, Fuel quality, and points from a meal photo.
          </Text>
          <Button variant="secondary" onPress={goFoodProof}>
            Start
          </Button>
        </Card>

        <Card style={styles.optionCard}>
          <MapPin size={24} color={theme.colors.primary} />
          <Text variant="subtitle">Location Proof</Text>
          <Text variant="caption" muted>
            Verify a gym, trail, studio, park, or recovery spot.
          </Text>
          <Button variant="secondary" onPress={() => go('/(tabs)/check-in')}>
            Start
          </Button>
        </Card>

        <Card style={styles.optionCard}>
          <HeartPulse size={24} color={theme.colors.primary} />
          <Text variant="subtitle">Health Proof</Text>
          <Text variant="caption" muted>
            Sync private Apple Health signals later.
          </Text>
          <Button variant="secondary" onPress={() => go('/settings/health')}>
            Sync Later
          </Button>
        </Card>

        <Card style={styles.optionCard}>
          <FileText size={24} color={theme.colors.primary} />
          <Text variant="subtitle">Manual Note</Text>
          <Text variant="caption" muted>
            Timeline context. Verified proofs move ranked score.
          </Text>
          <Button variant="secondary" onPress={() => go('/(tabs)/check-in')}>
            Save Note
          </Button>
        </Card>
      </View>

      <Card style={styles.noteCard}>
        <Text variant="subtitle">Proofs are finite.</Text>
        <Text muted>
          Free starts with 5 Daily Proofs. Manual notes help your timeline. Verified proofs move your ranked score.
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
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: 10,
  },
  noteCard: {
    gap: 8,
    backgroundColor: theme.colors.primarySoft,
  },
});
