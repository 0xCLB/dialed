import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MailPlus, UserRoundPlus } from 'lucide-react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { theme } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { signUpWithEmail } from '@/features/auth/auth-service';
import { track } from '@/lib/analytics';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const canSubmit = useMemo(
    () => Boolean(email.trim() && password.length >= 8 && confirmPassword.length >= 8),
    [confirmPassword, email, password],
  );

  async function handleSignUp() {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const result = await signUpWithEmail(email, password);
      track('auth_email_signed_up');

      if (result.session) {
        await setSession(result.session);
        router.replace('/(auth)/onboarding');
        return;
      }

      setNotice('Account created. Confirm your email if Supabase requires it, then sign in.');
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : 'Could not create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.heroMark}>
        <UserRoundPlus size={28} color={theme.colors.white} />
      </View>
      <Text variant="title">Create your Dialed account</Text>
      <Text muted>Email/password is the active dev auth path so you can test the full product loop now.</Text>

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
          autoComplete="new-password"
          secureTextEntry
          textContentType="newPassword"
        />
        <TextInputField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat password"
          autoCapitalize="none"
          autoComplete="new-password"
          secureTextEntry
          textContentType="newPassword"
        />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Button disabled={!canSubmit} loading={loading} onPress={handleSignUp}>
        <MailPlus size={18} color={theme.colors.white} />
        Create account
      </Button>
      <Button variant="secondary" onPress={() => router.replace('/(auth)/login')}>
        Back to login
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
  notice: {
    color: theme.colors.success,
  },
});
