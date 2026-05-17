import { useEffect } from 'react';
import { router } from 'expo-router';

import { useAuthStore } from '@/features/auth/auth-store';

export function useRequireSession() {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (initialized && !loading && !session) {
      router.replace('/(auth)/login');
    }
  }, [initialized, loading, session]);

  return { session, loading: loading || !initialized };
}
