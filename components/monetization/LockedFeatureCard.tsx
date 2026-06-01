import { StyleSheet, View } from 'react-native';
import { LockKeyhole, Sparkles } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function LockedFeatureCard({
  title,
  body,
  cta = 'Unlock Pro',
  onPress,
}: {
  title: string;
  body: string;
  cta?: string;
  onPress: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <LockKeyhole size={18} color={theme.colors.white} />
        </View>
        <View style={styles.copy}>
          <Text variant="subtitle">{title}</Text>
          <Text muted>{body}</Text>
        </View>
      </View>
      <Button onPress={onPress}>
        <Sparkles size={17} color={theme.colors.white} />
        {cta}
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
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.ink,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});
