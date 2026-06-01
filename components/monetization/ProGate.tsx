import { ReactNode } from 'react';

import { LockedFeatureCard } from '@/components/monetization/LockedFeatureCard';
import { usePro } from '@/features/monetization/usePro';
import type { PaywallPlacement, ProFeature } from '@/features/monetization/types';

export function ProGate({
  feature,
  placement,
  title,
  body,
  children,
  fallback,
}: {
  feature: ProFeature['id'];
  placement: PaywallPlacement;
  title: string;
  body: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isPro, openPaywall } = usePro();

  if (isPro) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  return (
    <LockedFeatureCard
      title={title}
      body={body}
      onPress={() => openPaywall(placement)}
    />
  );
}
