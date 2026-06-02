import { StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function DigestEmptyState({
  loading,
  onGenerate,
}: {
  loading?: boolean;
  onGenerate: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Sparkles size={24} color={theme.colors.primary} />
      </View>
      <Text variant="subtitle">No recap yet</Text>
      <Text muted style={styles.copy}>
        Not enough proof to judge the empire yet. Generate a recap now, or log a few more wins.
      </Text>
      <Button loading={loading} onPress={onGenerate}>
        Generate Recap
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  copy: {
    textAlign: 'center',
  },
});
