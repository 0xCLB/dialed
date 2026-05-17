import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function ShareCardPreview({
  title,
  score,
  subtitle,
}: {
  title: string;
  score: number;
  subtitle?: string;
}) {
  return (
    <LinearGradient colors={theme.gradients.story} style={styles.card}>
      <Text variant="caption" muted>
        Dialed Self
      </Text>
      <View style={styles.copy}>
        <Text variant="title">{title}</Text>
        {subtitle ? <Text muted>{subtitle}</Text> : null}
      </View>
      <Text variant="metric" style={styles.score}>
        {score}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 230,
    borderRadius: theme.radius.xxl,
    padding: 20,
    justifyContent: 'space-between',
  },
  copy: {
    gap: 8,
  },
  score: {
    color: theme.colors.primary,
  },
});
