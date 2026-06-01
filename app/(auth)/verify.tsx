import { StyleSheet, View } from 'react-native';
import { MessageCircleOff } from 'lucide-react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';

export default function VerifyScreen() {
  return (
    <Screen>
      <View style={styles.heroMark}>
        <MessageCircleOff size={28} color={theme.colors.white} />
      </View>
      <Text variant="title">Phone OTP coming later</Text>
      <Text muted>
        SMS auth requires Twilio, so it is disabled for development and staging. Use email/password
        to test Dialed Self end to end.
      </Text>
      <Card style={styles.card}>
        <Text variant="subtitle">Active dev auth</Text>
        <Text muted>Email/password is live. Phone OTP and Apple Sign-In stay planned for launch hardening.</Text>
      </Card>
      <Button onPress={() => router.replace('/(auth)/login')}>Back to email login</Button>
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
  card: {
    gap: 8,
  },
});
