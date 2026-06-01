import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Brain,
  Film,
  HeartPulse,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { PackageCard } from '@/components/monetization/PackageCard';
import { PaywallBenefitRow } from '@/components/monetization/PaywallBenefitRow';
import { ProBadge } from '@/components/monetization/ProBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/StateViews';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useRequireSession } from '@/features/auth/useRequireSession';
import { usePro } from '@/features/monetization/usePro';
import type { PaywallPlacement } from '@/features/monetization/types';
import { track } from '@/lib/analytics';

const BENEFITS = [
  {
    title: 'Premium AI insights',
    body: 'Deeper scoring explanations without turning the app into homework.',
    icon: <Brain size={18} color={theme.colors.primary} />,
  },
  {
    title: 'Advanced scoring explanations',
    body: 'Understand why a proof earned what it earned.',
    icon: <ShieldCheck size={18} color={theme.colors.primary} />,
  },
  {
    title: 'Premium story templates',
    body: 'Sharper cards for streaks, leaderboards, and big days.',
    icon: <Sparkles size={18} color={theme.colors.primary} />,
  },
  {
    title: 'Reels exports',
    body: 'Turn My Day into a social-ready recap.',
    icon: <Film size={18} color={theme.colors.primary} />,
  },
  {
    title: 'Weekly TwainGPT digests',
    body: 'A smarter read on what your week was really saying.',
    icon: <RotateCcw size={18} color={theme.colors.primary} />,
  },
  {
    title: 'Private challenges',
    body: 'Custom competitions for the people who actually matter.',
    icon: <ShieldCheck size={18} color={theme.colors.primary} />,
  },
  {
    title: 'Advanced health analytics',
    body: 'A placeholder for HRV, recovery, sleep, and wearable trends.',
    icon: <HeartPulse size={18} color={theme.colors.primary} />,
  },
];

function placementValue(value: unknown): PaywallPlacement {
  if (
    value === 'share_template' ||
    value === 'reel_export' ||
    value === 'weekly_digest' ||
    value === 'advanced_insights' ||
    value === 'private_challenge' ||
    value === 'settings' ||
    value === 'profile'
  ) {
    return value;
  }
  return 'settings';
}

export default function PaywallScreen() {
  useRequireSession();
  const params = useLocalSearchParams();
  const placement = placementValue(params.placement);
  const {
    isPro,
    loading,
    error,
    packages,
    subscriptionState,
    purchase,
    restore,
    refreshProStatus,
  } = usePro();
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    track('paywall_viewed', { placement });
  }, [placement]);

  useEffect(() => {
    if (packages.length === 0) return;
    setSelectedPackage((current) => current ?? packages.find((pkg) => pkg.packageType === 'ANNUAL') ?? packages[0]);
  }, [packages]);

  const statusCopy = useMemo(() => {
    if (isPro) return 'Dialed Pro is active.';
    if (subscriptionState?.status === 'billing_issue') return 'Billing needs attention before Pro unlocks again.';
    if (subscriptionState?.status === 'cancelled') return 'Pro is active until the current period ends.';
    return 'Upgrade only when the extra edge is worth it.';
  }, [isPro, subscriptionState?.status]);

  async function handlePurchase() {
    if (!selectedPackage) {
      setLocalError('No RevenueCat package is available yet.');
      return;
    }

    setPurchasing(true);
    setLocalError(null);
    try {
      await purchase(selectedPackage);
      Alert.alert('Dialed Pro active', 'You are in. Consistency just got better dressed.');
      router.back();
    } catch (purchaseError) {
      setLocalError(purchaseError instanceof Error ? purchaseError.message : 'Purchase failed.');
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    setLocalError(null);
    try {
      const info = await restore();
      if (info) {
        Alert.alert('Purchases restored', 'RevenueCat checked your account and refreshed Pro status.');
      } else {
        Alert.alert('Restore unavailable', 'RevenueCat is not configured in this build yet.');
      }
    } catch (restoreError) {
      setLocalError(restoreError instanceof Error ? restoreError.message : 'Restore failed.');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button variant="secondary" style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.colors.ink} />
        </Button>
        <ProBadge />
      </View>

      <View style={styles.hero}>
        <Text variant="hero">Become dangerously consistent.</Text>
        <Text muted>
          Dialed Pro adds sharper intelligence and premium exports for people who want the app to keep up.
        </Text>
      </View>

      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Sparkles size={20} color={theme.colors.primary} />
          <View style={styles.statusCopy}>
            <Text variant="subtitle">{isPro ? 'Pro unlocked' : 'Dialed Pro'}</Text>
            <Text muted>{statusCopy}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        {BENEFITS.map((benefit) => (
          <PaywallBenefitRow
            key={benefit.title}
            title={benefit.title}
            body={benefit.body}
            icon={benefit.icon}
          />
        ))}
      </Card>

      {loading ? <LoadingState label="Loading Pro plans" /> : null}
      {error || localError ? (
        <Card style={styles.errorCard}>
          <Text variant="subtitle">Paywall setup note</Text>
          <Text muted>{localError ?? error}</Text>
        </Card>
      ) : null}

      {!loading && packages.length > 0 ? (
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text variant="subtitle">Choose a plan</Text>
            <Text variant="caption" muted>
              RevenueCat offering
            </Text>
          </View>
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.identifier}
              pkg={pkg}
              selected={selectedPackage?.identifier === pkg.identifier}
              onPress={() => setSelectedPackage(pkg)}
            />
          ))}
          <Button loading={purchasing} disabled={isPro} onPress={handlePurchase}>
            {isPro ? 'Pro active' : 'Start Dialed Pro'}
          </Button>
        </Card>
      ) : null}

      {!loading && packages.length === 0 ? (
        <Card style={styles.card}>
          <Text variant="subtitle">RevenueCat-ready fallback</Text>
          <Text muted>
            Add `EXPO_PUBLIC_REVENUECAT_API_KEY`, configure the `dialed_pro` entitlement, and attach monthly/annual packages in RevenueCat to activate purchase buttons.
          </Text>
          <Button variant="secondary" onPress={refreshProStatus}>
            Refresh Pro status
          </Button>
        </Card>
      ) : null}

      <Button variant="secondary" loading={restoring} onPress={handleRestore}>
        Restore purchases
      </Button>

      <View style={styles.legal}>
        <Text variant="caption" muted>
          Terms and Privacy links are placeholders until App Store metadata is final.
        </Text>
        {subscriptionState?.managementUrl ? (
          <Text variant="caption" muted>
            Manage subscription from the store account linked by RevenueCat.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
  },
  hero: {
    gap: 10,
  },
  statusCard: {
    gap: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusCopy: {
    flex: 1,
    gap: 4,
  },
  card: {
    gap: 12,
  },
  errorCard: {
    gap: 8,
    backgroundColor: theme.colors.warningSoft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  legal: {
    gap: 5,
    paddingHorizontal: 4,
  },
});
