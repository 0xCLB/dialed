import { StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function ProProofUpgradeCard({ onPress }: { onPress: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Sparkles size={21} color={theme.colors.white} />
        </View>
        <View style={styles.copy}>
          <Text variant="subtitle">Pro unlocks 20 Daily Proofs</Text>
          <Text muted>
            More photo proofs, health auto-scoring, premium templates, and sharper filters.
          </Text>
        </View>
      </View>
      <Button onPress={onPress}>
        Preview Pro
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
});
