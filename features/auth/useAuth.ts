import { useAuthStore } from '@/features/auth/auth-store';

export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading: useAuthStore((state) => state.loading),
    initialized: useAuthStore((state) => state.initialized),
    error: useAuthStore((state) => state.error),
    isAuthenticated: Boolean(session),
    isOnboarded: Boolean(profile?.onboardingComplete),
    refreshProfile: useAuthStore((state) => state.refreshProfile),
    setSession: useAuthStore((state) => state.setSession),
    signOut: useAuthStore((state) => state.signOut),
  };
}
