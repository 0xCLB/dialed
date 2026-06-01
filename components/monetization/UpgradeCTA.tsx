import { StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function UpgradeCTA({
  title = 'Unlock Dialed Pro',
  body = 'Premium intelligence, better exports, and fewer limits on the parts that make consistency addictive.',
  cta = 'Go Pro',
  onPress,
}: {
  title?: string;
  body?: string;
  cta?: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Sparkles size={18} color={theme.colors.white} />
      </View>
      <View style={styles.copy}>
        <Text variant="subtitle">{title}</Text>
        <Text variant="caption" muted>
          {body}
        </Text>
      </View>
      <Button style={styles.button} onPress={onPress}>
        {cta}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primarySoft,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  button: {
    minHeight: 42,
    paddingHorizontal: 12,
  },
});
