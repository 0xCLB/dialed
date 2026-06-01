import { useAuthStore } from '@/features/auth/auth-store';

export function useAuth() {
  return {
    session: useAuthStore((state) => state.session),
    profile: useAuthStore((state) => state.profile),
    loading: useAuthStore((state) => state.loading),
    initialized: useAuthStore((state) => state.initialized),
    error: useAuthStore((state) => state.error),
    refreshProfile: useAuthStore((state) => state.refreshProfile),
    setSession: useAuthStore((state) => state.setSession),
    signOut: useAuthStore((state) => state.signOut),
  };
}
