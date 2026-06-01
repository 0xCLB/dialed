import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/useAuth';

export default function IndexRoute() {
  const { session, profile, initialized, loading } = useAuth();

  if (!initialized || loading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profile?.onboardingComplete) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
