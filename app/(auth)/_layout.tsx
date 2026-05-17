import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/auth-store';

export default function AuthLayout() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);

  if (session && profile?.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
