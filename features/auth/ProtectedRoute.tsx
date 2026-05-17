import { ReactNode, useEffect } from 'react';
import { router } from 'expo-router';

import { LoadingState } from '@/components/ui/StateViews';
import { useAuth } from '@/features/auth/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, initialized } = useAuth();

  useEffect(() => {
    if (initialized && !loading && !session) {
      router.replace('/(auth)/login');
    }
  }, [initialized, loading, session]);

  if (!initialized || loading) {
    return <LoadingState label="Checking session" />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
