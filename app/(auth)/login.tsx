import { useState } from 'react';
import { router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextInputField } from '@/components/ui/TextInputField';
import { sendOtp } from '@/features/auth/auth-service';
import { track } from '@/lib/analytics';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setLoading(true);
    setError(null);
    try {
      await sendOtp(phone);
      track('auth_otp_requested');
      router.push({ pathname: '/(auth)/verify', params: { phone } });
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send SMS code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text variant="hero">Dialed Self</Text>
      <Text muted>
        Prove daily health actions, earn Dialed Points, and compete across the four pillars.
      </Text>
      <Card>
        <TextInputField
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+14155552671"
          autoComplete="tel"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          helper="Use E.164 format, or enter a US number and Dialed will format it."
        />
      </Card>
      {error ? <Text style={{ color: '#C2410C' }}>{error}</Text> : null}
      <Button loading={loading} onPress={handleSend}>
        Send code
      </Button>
    </Screen>
  );
}
