import { ReactNode, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    bootstrap().then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => cleanup?.();
  }, [bootstrap]);

  if (!initialized) {
    return (
      <LinearGradient colors={theme.gradients.primaryPastel} style={styles.loading}>
        <View style={styles.mark}>
          <Text variant="title" style={styles.markText}>
            DS
          </Text>
        </View>
        <Text variant="title">Dialed Self</Text>
        <Text muted>Loading your health stack</Text>
      </LinearGradient>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  markText: {
    color: theme.colors.white,
  },
});
