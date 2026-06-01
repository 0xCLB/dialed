import { ReactNode, useEffect } from 'react';
import { router } from 'expo-router';

import { LoadingState } from '@/components/ui/StateViews';
import { useAuth } from '@/features/auth/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading, initialized } = useAuth();

  useEffect(() => {
    if (initialized && !loading && !session) {
      router.replace('/(auth)/login');
      return;
    }

    if (initialized && !loading && session && (!profile || !profile.onboardingComplete)) {
      router.replace('/(auth)/onboarding');
    }
  }, [initialized, loading, profile, session]);

  if (!initialized || loading) {
    return <LoadingState label="Checking session" />;
  }

  if (!session || !profile?.onboardingComplete) {
    return null;
  }

  return <>{children}</>;
}
