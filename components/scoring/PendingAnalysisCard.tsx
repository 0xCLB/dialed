import { StyleSheet, View } from 'react-native';
import { Clock3 } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function PendingAnalysisCard({
  title = 'Scoring pending',
  body = 'Your proof is saved. Analysis can finish later without blocking the app.',
}: {
  title?: string;
  body?: string;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.icon}>
        <Clock3 size={20} color={theme.colors.warning} />
      </View>
      <View style={styles.copy}>
        <Text variant="subtitle">{title}</Text>
        <Text muted>{body}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: theme.colors.warningSoft,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});
