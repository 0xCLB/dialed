import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.accent} />
      <Text muted>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text variant="subtitle">{title}</Text>
      <Text muted style={styles.centerText}>
        {body}
      </Text>
      {action && onAction ? <Button onPress={onAction}>{action}</Button> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.empty}>
      <WifiOff size={28} color={theme.colors.danger} />
      <Text variant="subtitle">Something did not load</Text>
      <Text muted style={styles.centerText}>
        {message}
      </Text>
      {onRetry ? <Button variant="secondary" onPress={onRetry}>Try again</Button> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  empty: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  centerText: {
    textAlign: 'center',
  },
});
