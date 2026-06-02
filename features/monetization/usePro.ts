import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

import {
  configureRevenueCat,
  getCustomerInfo,
  getOfferings,
  hasProEntitlement,
  purchasePackage,
  restorePurchases,
} from '@/lib/revenuecat';
import { useAuthStore } from '@/features/auth/auth-store';
import {
  fallbackSubscriptionState,
  getCustomerSubscriptionState,
} from '@/features/monetization/proService';
import type {
  CustomerSubscriptionState,
  PaywallPlacement,
  ProFeature,
} from '@/features/monetization/types';
import { track } from '@/lib/analytics';

export const PRO_FEATURES: ProFeature[] = [
  {
    id: 'advanced_ai_scoring',
    title: 'Premium Proof Analysis',
    description: 'More context behind why an action scored the way it did, including deeper food analysis.',
    placement: 'advanced_insights',
    available: true,
  },
  {
    id: 'advanced_food_analysis',
    title: 'Advanced food analysis',
    description: 'Deeper macro estimates, Fuel quality, and meal context when Food Proof matures.',
    placement: 'advanced_insights',
    available: false,
    placeholder: true,
  },
  {
    id: 'premium_share_templates',
    title: 'Premium story templates',
    description: 'Sharper story cards for leaderboards, streaks, and big proof days.',
    placement: 'share_template',
    available: true,
  },
  {
    id: 'reel_exports',
    title: 'Reels From My Day export',
    description: 'Turn your proof stack into a high-energy daily recap.',
    placement: 'reel_export',
    available: true,
  },
  {
    id: 'weekly_digest',
    title: 'Weekly Recap',
    description: 'A smarter weekly recap when daily proof turns into a pattern.',
    placement: 'weekly_digest',
    available: false,
    placeholder: true,
  },
  {
    id: 'friend_compare_insights',
    title: 'Friend comparison insights',
    description: 'See where you beat your friends by pillar without making it weird.',
    placement: 'advanced_insights',
    available: true,
  },
  {
    id: 'advanced_leaderboards',
    title: 'Advanced leaderboard filters',
    description: 'Filter by pillar, week, streak, and proof density.',
    placement: 'advanced_insights',
    available: false,
    placeholder: true,
  },
  {
    id: 'streak_freeze',
    title: 'Streak freeze',
    description: 'A mercy rule for travel days and life doing life things.',
    placement: 'advanced_insights',
    available: false,
    placeholder: true,
  },
  {
    id: 'private_challenges',
    title: 'Custom/private challenges',
    description: 'Create private competitions for your actual inner circle.',
    placement: 'private_challenge',
    available: false,
    placeholder: true,
  },
  {
    id: 'remove_watermark',
    title: 'Remove watermark',
    description: 'Export cleaner share assets when you want the proof to breathe.',
    placement: 'share_template',
    available: false,
    placeholder: true,
  },
  {
    id: 'advanced_health_analytics',
    title: 'Advanced health analytics',
    description: 'HRV, sleep consistency, recovery trends, and wearable comparisons.',
    placement: 'advanced_insights',
    available: false,
    placeholder: true,
  },
  {
    id: 'pro_badge',
    title: 'Pro badge',
    description: 'A subtle status marker for people who are taking consistency seriously.',
    placement: 'profile',
    available: true,
  },
];

export function usePro() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const userId = session?.user.id ?? null;
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<CustomerSubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPro = Boolean(subscriptionState?.isPro || profile?.isPro || hasProEntitlement(customerInfo));

  const packages = useMemo<PurchasesPackage[]>(
    () => offering?.availablePackages ?? [],
    [offering?.availablePackages],
  );

  const refreshProStatus = useCallback(async () => {
    if (!userId) {
      setCustomerInfo(null);
      setOffering(null);
      setSubscriptionState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await configureRevenueCat(userId);
      const [nextCustomerInfo, offerings] = await Promise.all([
        getCustomerInfo(userId).catch(() => null),
        getOfferings(userId).catch(() => null),
      ]);
      setCustomerInfo(nextCustomerInfo);
      setOffering(offerings?.current ?? null);
      setSubscriptionState(await getCustomerSubscriptionState(userId, nextCustomerInfo));
      track('entitlement_refreshed', {
        is_pro: Boolean(profile?.isPro || hasProEntitlement(nextCustomerInfo)),
      });
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Pro status did not load.');
      setSubscriptionState(fallbackSubscriptionState(userId));
    } finally {
      setLoading(false);
    }
  }, [profile?.isPro, userId]);

  useEffect(() => {
    refreshProStatus();
  }, [refreshProStatus]);

  const openPaywall = useCallback((placement: PaywallPlacement = 'settings') => {
    track('paywall_viewed', { placement, source: 'gate' });
    router.push({ pathname: '/paywall', params: { placement } });
  }, []);

  const requirePro = useCallback(
    (feature: ProFeature['id'], placement: PaywallPlacement) => {
      track('pro_feature_clicked', { feature, placement, locked: !isPro });
      if (isPro) return true;
      openPaywall(placement);
      return false;
    },
    [isPro, openPaywall],
  );

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      if (!userId) throw new Error('Sign in before purchasing Pro.');
      const result = await purchasePackage(pkg, userId);
      setCustomerInfo(result.customerInfo);
      setSubscriptionState(await getCustomerSubscriptionState(userId, result.customerInfo));
      refreshProfile().catch(() => undefined);
      return result.customerInfo;
    },
    [refreshProfile, userId],
  );

  const restore = useCallback(async () => {
    if (!userId) throw new Error('Sign in before restoring purchases.');
    const info = await restorePurchases(userId);
    setCustomerInfo(info);
    setSubscriptionState(await getCustomerSubscriptionState(userId, info));
    refreshProfile().catch(() => undefined);
    return info;
  }, [refreshProfile, userId]);

  return {
    isPro,
    loading,
    error,
    customerInfo,
    offering,
    packages,
    subscriptionState,
    refreshProStatus,
    requirePro,
    openPaywall,
    purchase,
    restore,
    features: PRO_FEATURES,
  };
}
