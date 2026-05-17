import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { useAuthStore } from '@/features/auth/auth-store';
import { verifyOtp } from '@/features/auth/auth-service';
import { track } from '@/lib/analytics';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone ?? '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  async function handleVerify() {
    setLoading(true);
    setError(null);
    try {
      const result = await verifyOtp(phone, code);
      if (result.session) {
        await setSession(result.session);
      }
      const nextProfile = useAuthStore.getState().profile;
      track('auth_otp_verified');
      router.replace(nextProfile?.onboardingComplete ? '/(tabs)' : '/(auth)/onboarding');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Invalid code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text variant="title">Enter your code</Text>
      <Text muted>We sent a 6 digit verification code to {phone || 'your phone'}.</Text>
      <Card>
        <TextInputField
          label="Verification code"
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={6}
        />
      </Card>
      {error ? <Text style={{ color: '#C2410C' }}>{error}</Text> : null}
      <Button loading={loading} onPress={handleVerify}>
        Verify
      </Button>
      <Button variant="ghost" onPress={() => router.back()}>
        Use a different number
      </Button>
    </Screen>
  );
}
