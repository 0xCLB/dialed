import { ReactNode, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const initialized = useAuthStore((state) => state.initialized);
  const loading = useAuthStore((state) => state.loading);
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const segments = useSegments();
  const routeGroup = segments[0];
  const routePath = segments.join('/');

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    bootstrap().then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => cleanup?.();
  }, [bootstrap]);

  useEffect(() => {
    if (!initialized || loading) {
      return;
    }

    const isAuthRoute = routeGroup === '(auth)';
    const isOnboardingRoute = routePath === '(auth)/onboarding';
    const isReadyForApp = Boolean(session && profile?.onboardingComplete);

    if (!session) {
      if (!isAuthRoute) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (!profile?.onboardingComplete) {
      if (!isOnboardingRoute) {
        router.replace('/(auth)/onboarding');
      }
      return;
    }

    if (isReadyForApp && isAuthRoute) {
      router.replace('/(tabs)/home');
    }
  }, [initialized, loading, profile?.onboardingComplete, routeGroup, routePath, session]);

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
