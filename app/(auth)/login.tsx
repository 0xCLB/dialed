import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Mail, ShieldCheck } from 'lucide-react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { signInWithEmail } from '@/features/auth/auth-service';
import { track } from '@/lib/analytics';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const canSubmit = useMemo(() => Boolean(email.trim() && password.length >= 8), [email, password]);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmail(email, password);
      if (result.session) {
        await setSession(result.session);
      }
      const nextProfile = useAuthStore.getState().profile;
      track('auth_email_signed_in');
      router.replace(nextProfile?.onboardingComplete ? '/(tabs)/home' : '/(auth)/onboarding');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.heroMark}>
        <ShieldCheck size={28} color={theme.colors.white} />
      </View>
      <Text variant="hero">Dialed Self</Text>
      <Text muted>
        Prove your day. Get your Dialed Score. Beat your friends.
      </Text>

      <Card style={styles.form}>
        <TextInputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          autoCapitalize="none"
          autoComplete="password"
          secureTextEntry
          textContentType="password"
        />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button disabled={!canSubmit} loading={loading} onPress={handleLogin}>
        <Mail size={18} color={theme.colors.white} />
        Sign in
      </Button>
      <Button variant="secondary" onPress={() => router.push('/(auth)/sign-up')}>
        Create account
      </Button>
      <Button variant="ghost" onPress={() => router.push('/(auth)/verify')}>
        Phone OTP coming later
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroMark: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  form: {
    gap: 14,
  },
  error: {
    color: theme.colors.danger,
  },
});
