import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { useProStatus } from '@/features/monetization/useProStatus';

const BENEFITS = [
  'Deep AI scoring explanations and weekly coaching.',
  'Advanced Apple Health analytics and trends.',
  'Premium share templates for cards and reels.',
  'Custom challenges and private groups.',
];

export default function PaywallScreen() {
  useRequireSession();
  const { offering, isPro, loading, error, purchase, restore } = useProStatus();

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
      </View>
      <Card style={styles.hero}>
        <Sparkles size={28} color={theme.colors.accent} />
        <Text variant="hero">Dialed Pro</Text>
        <Text muted>
          Built for users who want richer health intelligence, more competition formats, and better
          social exports.
        </Text>
      </Card>

      <Card style={styles.card}>
        {BENEFITS.map((benefit) => (
          <View key={benefit} style={styles.benefit}>
            <CheckCircle2 size={18} color={theme.colors.accent} />
            <Text style={styles.benefitCopy}>{benefit}</Text>
          </View>
        ))}
      </Card>

      {loading ? <LoadingState label="Loading plans" /> : null}
      {error ? (
        <Text style={styles.error}>
          {error} RevenueCat public SDK keys can be added in `.env`.
        </Text>
      ) : null}
      {isPro ? <Text variant="subtitle">Your Pro entitlement is active.</Text> : null}
      {offering?.availablePackages.map((pkg) => (
        <Button key={pkg.identifier} onPress={() => purchase(pkg.identifier)}>
          {pkg.product.title} · {pkg.product.priceString}
        </Button>
      ))}
      {!loading && !offering ? (
        <Card>
          <Text variant="subtitle">Sandbox-ready paywall</Text>
          <Text muted>
            Add RevenueCat SDK keys and offerings to activate purchases in development builds.
          </Text>
        </Card>
      ) : null}
      <Button variant="secondary" onPress={restore}>
        Restore purchases
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  hero: {
    gap: 12,
  },
  card: {
    gap: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitCopy: {
    flex: 1,
  },
  error: {
    color: theme.colors.danger,
  },
});
