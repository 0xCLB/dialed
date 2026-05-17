import { useCallback, useEffect, useState } from 'react';

import {
  getCurrentOffering,
  getCustomerInfo,
  hasProEntitlement,
  purchaseRevenueCatPackage,
  restorePurchases,
} from '@/lib/revenuecat';

export function useProStatus() {
  const [isPro, setIsPro] = useState(false);
  const [offering, setOffering] = useState<Awaited<ReturnType<typeof getCurrentOffering>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [info, currentOffering] = await Promise.all([getCustomerInfo(), getCurrentOffering()]);
      setIsPro(hasProEntitlement(info));
      setOffering(currentOffering);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Subscription data failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    isPro,
    offering,
    loading,
    error,
    refresh,
    purchase: async (identifier: string) => {
      const pkg = offering?.availablePackages.find((item) => item.identifier === identifier);
      if (!pkg) {
        throw new Error('Package is no longer available.');
      }
      const { customerInfo } = await purchaseRevenueCatPackage(pkg);
      setIsPro(hasProEntitlement(customerInfo));
    },
    restore: async () => {
      const info = await restorePurchases();
      setIsPro(hasProEntitlement(info));
    },
  };
}
