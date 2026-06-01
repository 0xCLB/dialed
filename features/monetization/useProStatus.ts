import { useCallback } from 'react';

import { usePro } from '@/features/monetization/usePro';

export function useProStatus() {
  const pro = usePro();

  const purchase = useCallback(
    async (identifier: string) => {
      const pkg = pro.packages.find((item) => item.identifier === identifier);
      if (!pkg) {
        throw new Error('Package is no longer available.');
      }
      await pro.purchase(pkg);
    },
    [pro],
  );

  return {
    isPro: pro.isPro,
    offering: pro.offering,
    loading: pro.loading,
    error: pro.error,
    refresh: pro.refreshProStatus,
    purchase,
    restore: pro.restore,
  };
}
